'use client';

import type { SharedSessionNote } from '@/types';
import { FileText } from 'lucide-react';

interface SharedNoteViewerProps {
  note: SharedSessionNote | null;
}

/**
 * SharedNoteViewer - Read-only notes display for shared sessions
 * No editing functionality - view only
 */
export function SharedNoteViewer({ note }: SharedNoteViewerProps) {
  // Empty state
  if (!note?.content) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-foreground font-medium">No notes</p>
        <p className="mt-1 text-sm text-muted-foreground">
          This session does not have any notes
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <p className="whitespace-pre-wrap text-foreground leading-relaxed">
        {note.content}
      </p>
    </div>
  );
}
