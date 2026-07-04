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
  refreshKey?: string | null;
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
export function TranscriptEditor({
  sessionId,
  refreshKey = null,
}: TranscriptEditorProps) {
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
  const hasUnsavedChangesRef = useRef(false);

  useEffect(() => {
    hasUnsavedChangesRef.current = content !== savedContent;
  }, [content, savedContent]);

  // Load existing transcript on mount and after AI transcript generation completes.
  useEffect(() => {
    async function loadTranscript() {
      // Do not overwrite user edits that have not been saved yet.
      // TODO(#4): Surface that a generated transcript is available and reload
      // after save/discard instead of silently skipping this refresh.
      if (hasUnsavedChangesRef.current) {
        return;
      }

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
  }, [sessionId, refreshKey]);

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
              ? 'bg-primary text-primary-foreground ring-1 ring-primary/30'
              : 'bg-warning/25 text-foreground ring-1 ring-warning/20'
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
          <Skeleton className="h-[240px] w-full rounded-3xl" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-32 rounded-full" />
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
      <div className="rounded-3xl border border-border/70 bg-background/45 p-4 shadow-inner">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste your transcript text here..."
          className="min-h-[220px] resize-y border-border/70 bg-card/70 font-mono text-sm leading-7"
        />

        <div className="mt-3 flex items-center justify-between gap-4">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            {saveStatus === 'saving' && (
              <span className="flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-2 py-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1.5 rounded-full border border-success/20 bg-success/10 px-2 py-1 text-success">
                <Check className="h-3.5 w-3.5" />
                Saved
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-destructive flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/10 px-2 py-1">
                <AlertCircle className="h-3.5 w-3.5" />
                Error saving
              </span>
            )}
            {saveStatus === 'idle' && hasUnsavedChanges && (
              <span className="rounded-full border border-warning/20 bg-warning/10 px-2 py-1 text-warning">
                Unsaved changes
              </span>
            )}
          </div>

          <PrimaryButton
            onClick={handleSave}
            disabled={saveStatus === 'saving' || !hasUnsavedChanges}
            size="sm"
            className="rounded-full"
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search transcript..."
                className="rounded-full bg-background/70 pr-20 pl-9"
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
                  className="rounded-full px-2"
                >
                  <ChevronUp className="h-4 w-4" />
                </SecondaryButton>
                <SecondaryButton
                  size="sm"
                  onClick={goToNextMatch}
                  aria-label="Next match"
                  className="rounded-full px-2"
                >
                  <ChevronDown className="h-4 w-4" />
                </SecondaryButton>
              </div>
            )}
          </div>

          {/* Transcript Display */}
          <div
            ref={transcriptContainerRef}
            className="max-h-[480px] overflow-y-auto rounded-3xl border border-border/70 bg-background/55 p-5 shadow-inner"
          >
            {renderHighlightedContent()}
          </div>
        </div>
      )}
    </div>
  );
}
