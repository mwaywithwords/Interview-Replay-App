'use client';

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import type { SharedTranscript } from '@/types';
import { Input } from '@/components/ui/input';
import { SecondaryButton } from '@/components/ui/button';
import {
  Search,
  ChevronUp,
  ChevronDown,
  X,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SharedTranscriptViewerProps {
  transcript: SharedTranscript | null;
}

/**
 * SharedTranscriptViewer - Read-only transcript display for shared sessions
 * No editing functionality - search and view only
 */
export function SharedTranscriptViewer({ transcript }: SharedTranscriptViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const matchRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const content = transcript?.content || '';

  // Find all matches
  const matches = useMemo(() => {
    if (!searchQuery.trim() || !content) {
      return [];
    }

    const query = searchQuery.toLowerCase();
    const text = content.toLowerCase();
    const result: { start: number; end: number }[] = [];
    let pos = 0;

    while (pos < text.length) {
      const index = text.indexOf(query, pos);
      if (index === -1) break;
      result.push({ start: index, end: index + query.length });
      pos = index + 1;
    }

    return result;
  }, [searchQuery, content]);

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
    setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
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
    if (!searchQuery.trim() || matches.length === 0) {
      return (
        <p className="whitespace-pre-wrap text-foreground leading-relaxed">
          {content}
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
            {content.slice(lastIndex, match.start)}
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
              : 'bg-yellow-300 dark:bg-yellow-600 text-foreground dark:text-foreground'
          )}
        >
          {content.slice(match.start, match.end)}
        </span>
      );

      lastIndex = match.end;
    });

    // Add remaining text after last match
    if (lastIndex < content.length) {
      elements.push(
        <span key="text-end">{content.slice(lastIndex)}</span>
      );
    }

    return (
      <p className="whitespace-pre-wrap text-foreground leading-relaxed">
        {elements}
      </p>
    );
  };

  // Empty state
  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-foreground font-medium">No transcript</p>
        <p className="mt-1 text-sm text-muted-foreground">
          This session does not have a transcript
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search transcript..."
            className="pl-9 pr-20"
          />
          {searchQuery && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {matches.length > 0
                  ? `${currentMatchIndex + 1}/${matches.length}`
                  : '0 results'}
              </span>
              <button
                onClick={clearSearch}
                className="p-0.5 hover:bg-muted rounded"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
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
      <div className="max-h-[400px] overflow-y-auto rounded-lg border border-border bg-muted/30 p-4">
        {renderHighlightedContent()}
      </div>
    </div>
  );
}
