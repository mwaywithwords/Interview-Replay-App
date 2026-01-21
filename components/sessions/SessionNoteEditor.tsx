'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSessionNote, saveSessionNote } from '@/app/actions/notes';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Check, Loader2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SessionNoteEditorProps {
  sessionId: string;
  initialContent?: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

/**
 * SessionNoteEditor - A single editable textarea for session notes with autosave.
 * 
 * Features:
 * - Autosave with debounce (1000ms after typing stops)
 * - Visual saving/saved indicators
 * - Creates note on first save if it doesn't exist
 * - Error handling with retry
 */
export function SessionNoteEditor({ sessionId, initialContent = '' }: SessionNoteEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Refs for debounce timer and tracking changes
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedContentRef = useRef(initialContent);
  const savedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load existing note on mount
  useEffect(() => {
    async function loadNote() {
      const { note, error: loadError } = await getSessionNote(sessionId);
      
      if (loadError) {
        setError(loadError);
      } else if (note) {
        setContent(note.content);
        lastSavedContentRef.current = note.content;
      }
      setIsLoaded(true);
    }
    
    loadNote();
  }, [sessionId]);

  // Save function
  const saveNote = useCallback(async (newContent: string) => {
    // Don't save if content hasn't changed
    if (newContent === lastSavedContentRef.current) {
      return;
    }

    setSaveStatus('saving');
    setError(null);

    const { note, error: saveError } = await saveSessionNote(sessionId, newContent);

    if (saveError) {
      setSaveStatus('error');
      setError(saveError);
      toast.error('Failed to save notes', { description: saveError });
      return;
    }

    if (note) {
      lastSavedContentRef.current = note.content;
      setSaveStatus('saved');
      
      // Clear any existing "saved" timeout
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
      
      // Reset to idle after showing "saved" for 2 seconds
      savedTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    }
  }, [sessionId]);

  // Handle content change with debounced autosave
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer (1000ms)
    debounceTimerRef.current = setTimeout(() => {
      saveNote(newContent);
    }, 1000);
  }, [saveNote]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
    };
  }, []);

  // Save on blur (in case user clicks away before debounce fires)
  const handleBlur = useCallback(() => {
    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    // Save immediately if there are unsaved changes
    if (content !== lastSavedContentRef.current) {
      saveNote(content);
    }
  }, [content, saveNote]);

  if (!isLoaded) {
    return (
      <div className="space-y-4">
        <Skeleton className="min-h-[200px] w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="relative">
        <Textarea
          value={content}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Write your notes about this session here..."
          className="min-h-[200px] resize-y"
        />
        
        {/* Save status indicator */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md">
              <Check className="h-3 w-3" />
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1.5 text-xs text-destructive bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md">
              <AlertCircle className="h-3 w-3" />
              Error saving
            </span>
          )}
        </div>
      </div>
      
      {/* Empty state hint */}
      {isLoaded && !content && saveStatus === 'idle' && (
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <FileText className="h-3.5 w-3.5" />
          Your notes are automatically saved as you type.
        </p>
      )}
    </div>
  );
}
