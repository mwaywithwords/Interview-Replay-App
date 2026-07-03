'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getTranscript, saveTranscript } from '@/app/actions/transcripts';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle,
  Check,
  Loader2,
  Search,
  ChevronUp,
  ChevronDown,
  X,
  Save,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TranscriptEditorProps {
  sessionId: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * TranscriptEditor - Manual transcript input with search and highlighting
 *
 * Features:
 * - Large textarea for pasting transcript text
 * - Save button to persist transcript
 * - Search input with highlighting
 * - Match count display
 * - Next/Prev navigation that scrolls within the transcript panel
 * - Works in dark mode
 */
export function TranscriptEditor({ sessionId }: TranscriptEditorProps) {
  // Content state
  const [content, setContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [transcriptProvider, setTranscriptProvider] = useState('manual');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Refs
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const matchRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load existing transcript on mount
  useEffect(() => {
    async function loadTranscript() {
      setIsLoading(true);
      const { transcript, error: loadError } = await getTranscript(sessionId);

      if (loadError) {
        setError(loadError);
      } else if (transcript) {
        setContent(transcript.content);
        setSavedContent(transcript.content);
        setTranscriptProvider(transcript.provider);
      }
      setIsLoading(false);
    }

    loadTranscript();
  }, [sessionId]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = content !== savedContent;

  // Save function
  const handleSave = async () => {
    setSaveStatus('saving');
    setError(null);

    const { transcript, error: saveError } = await saveTranscript(
      sessionId,
      content,
      transcriptProvider
    );

    if (saveError) {
      setSaveStatus('error');
      setError(saveError);
      toast.error('Failed to save transcript', { description: saveError });
      return;
    }

    if (transcript) {
      setSavedContent(transcript.content);
      setTranscriptProvider(transcript.provider);
      setSaveStatus('saved');
      toast.success('Transcript saved');

      // Clear any existing "saved" timeout
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }

      // Reset to idle after showing "saved" for 2 seconds
      savedTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
    };
  }, []);

  // Find all matches
  const matches = useMemo(() => {
    if (!searchQuery.trim() || !savedContent) {
      return [];
    }

    const query = searchQuery.toLowerCase();
    const text = savedContent.toLowerCase();
    const result: { start: number; end: number }[] = [];
    let pos = 0;

    while (pos < text.length) {
      const index = text.indexOf(query, pos);
      if (index === -1) break;
      result.push({ start: index, end: index + query.length });
      pos = index + 1;
    }

    return result;
  }, [searchQuery, savedContent]);

  // Reset current match index when matches change
  useEffect(() => {
    if (matches.length > 0) {
      setCurrentMatchIndex(0);
    }
  }, [matches.length, searchQuery]);

  // Scroll to current match
  useEffect(() => {
    if (matches.length > 0 && matchRefs.current[currentMatchIndex]) {
      matchRefs.current[currentMatchIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentMatchIndex, matches.length]);

  // Navigate to next match
  const goToNextMatch = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
  }, [matches.length]);

  // Navigate to previous match
  const goToPrevMatch = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex(
      (prev) => (prev - 1 + matches.length) % matches.length
    );
  }, [matches.length]);

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setCurrentMatchIndex(0);
  };

  // Handle keyboard shortcuts in search input
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        goToPrevMatch();
      } else {
        goToNextMatch();
      }
    } else if (e.key === 'Escape') {
      clearSearch();
    }
  };

  // Render transcript content with highlighted matches
  const renderHighlightedContent = () => {
    if (!savedContent) {
      return (
        <p className="text-muted-foreground italic">
          No transcript saved yet. Paste your transcript above and click Save.
        </p>
      );
    }

    if (!searchQuery.trim() || matches.length === 0) {
      return (
        <p className="text-foreground leading-relaxed whitespace-pre-wrap">
          {savedContent}
        </p>
      );
    }

    // Reset refs array
    matchRefs.current = [];

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    matches.forEach((match, idx) => {
      // Add text before the match
      if (match.start > lastIndex) {
        elements.push(
          <span key={`text-${idx}`}>
            {savedContent.slice(lastIndex, match.start)}
          </span>
        );
      }

      // Add the highlighted match
      const isCurrentMatch = idx === currentMatchIndex;
      elements.push(
        <span
          key={`match-${idx}`}
          ref={(el) => {
            matchRefs.current[idx] = el;
          }}
          className={cn(
            'rounded px-0.5',
            isCurrentMatch
              ? 'bg-primary text-primary-foreground'
              : 'text-foreground dark:text-foreground bg-yellow-300 dark:bg-yellow-600'
          )}
        >
          {savedContent.slice(match.start, match.end)}
        </span>
      );

      lastIndex = match.end;
    });

    // Add remaining text after last match
    if (lastIndex < savedContent.length) {
      elements.push(
        <span key="text-end">{savedContent.slice(lastIndex)}</span>
      );
    }

    return (
      <p className="text-foreground leading-relaxed whitespace-pre-wrap">
        {elements}
      </p>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <Skeleton className="h-[200px] w-full rounded-lg" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Input Section */}
      <div className="space-y-3">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your transcript text here..."
          className="min-h-[200px] resize-y font-mono text-sm"
        />

        <div className="flex items-center justify-between gap-4">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <Check className="h-3.5 w-3.5" />
                Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                Error saving
              </span>
            )}
            {saveStatus === 'idle' && hasUnsavedChanges && (
              <span className="text-amber-600 dark:text-amber-400">
                Unsaved changes
              </span>
            )}
          </div>

          <PrimaryButton
            onClick={handleSave}
            disabled={saveStatus === 'saving' || !hasUnsavedChanges}
            size="sm"
          >
            {saveStatus === 'saving' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Transcript
          </PrimaryButton>
        </div>
      </div>

      {/* Search and Display Section */}
      {savedContent && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search transcript..."
                className="pr-20 pl-9"
              />
              {searchQuery && (
                <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2">
                  <span className="text-muted-foreground text-xs whitespace-nowrap">
                    {matches.length > 0
                      ? `${currentMatchIndex + 1}/${matches.length}`
                      : '0 results'}
                  </span>
                  <button
                    onClick={clearSearch}
                    className="hover:bg-muted rounded p-0.5"
                    aria-label="Clear search"
                  >
                    <X className="text-muted-foreground h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            {matches.length > 0 && (
              <div className="flex items-center gap-1">
                <SecondaryButton
                  size="sm"
                  onClick={goToPrevMatch}
                  aria-label="Previous match"
                  className="px-2"
                >
                  <ChevronUp className="h-4 w-4" />
                </SecondaryButton>
                <SecondaryButton
                  size="sm"
                  onClick={goToNextMatch}
                  aria-label="Next match"
                  className="px-2"
                >
                  <ChevronDown className="h-4 w-4" />
                </SecondaryButton>
              </div>
            )}
          </div>

          {/* Transcript Display */}
          <div
            ref={transcriptContainerRef}
            className="border-border bg-muted/30 max-h-[400px] overflow-y-auto rounded-lg border p-4"
          >
            {renderHighlightedContent()}
          </div>
        </div>
      )}
    </div>
  );
}
