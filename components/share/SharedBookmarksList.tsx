'use client';

import type { SharedBookmark } from '@/types';
import type { MediaPlayerRef } from './SharedMediaPlayer';
import { Bookmark as BookmarkIcon, Play, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SharedBookmarksListProps {
  bookmarks: SharedBookmark[];
  mediaPlayerRef: React.RefObject<MediaPlayerRef | null>;
}

/**
 * Format milliseconds into MM:SS display format.
 */
function formatTimestampShort(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function SharedBookmarkItem({
  bookmark,
  onSeek,
}: {
  bookmark: SharedBookmark;
  onSeek: (timestampMs: number) => void;
}) {
  const handleSeek = () => {
    onSeek(bookmark.timestamp_ms);
  };

  return (
    <div
      className={cn(
        'group relative flex items-start gap-4 p-4 cursor-pointer rounded-xl',
        'border border-transparent hover:border-border hover:bg-muted/50 transition-all'
      )}
      onClick={handleSeek}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSeek();
        }
      }}
    >
      {/* Timestamp indicator */}
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
        <Play className="w-4 h-4 text-primary fill-primary" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {formatTimestampShort(bookmark.timestamp_ms)}
          </span>
          {bookmark.category && (
            <span className="text-[10px] font-bold text-primary/70 uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10">
              {bookmark.category}
            </span>
          )}
        </div>
        <p className="text-sm font-bold text-foreground truncate">{bookmark.label}</p>
      </div>
    </div>
  );
}

/**
 * SharedBookmarksList - Read-only bookmarks display for shared sessions
 * No edit/delete/add functionality - view and seek only
 */
export function SharedBookmarksList({
  bookmarks,
  mediaPlayerRef,
}: SharedBookmarksListProps) {
  const handleSeek = (timestampMs: number) => {
    mediaPlayerRef.current?.seekToMs(timestampMs);
  };

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <BookmarkIcon className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-foreground font-medium">No bookmarks</p>
        <p className="mt-1 text-sm text-muted-foreground">
          This session has no saved bookmarks
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {bookmarks.map((bookmark) => (
        <SharedBookmarkItem
          key={bookmark.id}
          bookmark={bookmark}
          onSeek={handleSeek}
        />
      ))}
    </div>
  );
}
