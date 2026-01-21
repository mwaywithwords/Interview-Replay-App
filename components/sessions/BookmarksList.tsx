'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBookmarks,
  createBookmark,
  updateBookmark,
  deleteBookmark,
} from '@/app/actions/bookmarks';
import {
  getBookmarkNotes,
  createBookmarkNote,
  deleteBookmarkNote,
} from '@/app/actions/notes';
import type { Bookmark, CreateBookmarkInput, BookmarkNote } from '@/types';
import type { MediaPlayerRef } from '@/components/AudioPlayer';
import { Button, PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bookmark as BookmarkIcon,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  Clock,
  AlertCircle,
  Play,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BookmarksListProps {
  sessionId: string;
  initialBookmarks: Bookmark[];
  mediaPlayerRef: React.RefObject<MediaPlayerRef | null>;
}

/**
 * Skeleton loader for bookmarks list
 */
export function BookmarksListSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-11 w-full rounded-xl" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-4 rounded-xl border border-border">
            <div className="flex items-start gap-4">
              <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-20 mt-2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Format milliseconds into MM:SS.mmm display format.
 */
function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  const milliseconds = ms % 1000;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0').slice(0, 1)}`;
}

/**
 * Format milliseconds into a shorter MM:SS display format (for display).
 */
function formatTimestampShort(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

interface BookmarkItemProps {
  bookmark: Bookmark;
  onUpdate: (id: string, label: string, category: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSeek: (timestampMs: number) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

function BookmarkItem({
  bookmark,
  onUpdate,
  onDelete,
  onSeek,
  isUpdating,
  isDeleting,
}: BookmarkItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(bookmark.label);
  const [editCategory, setEditCategory] = useState(bookmark.category || '');
  
  // Notes state
  const [notes, setNotes] = useState<BookmarkNote[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Load notes when expanded
  useEffect(() => {
    if (showNotes && notes.length === 0 && !isLoadingNotes) {
      loadNotes();
    }
  }, [showNotes]);

  const loadNotes = async () => {
    setIsLoadingNotes(true);
    setNoteError(null);
    const { notes: fetchedNotes, error } = await getBookmarkNotes(bookmark.id);
    if (error) {
      setNoteError(error);
    } else {
      setNotes(fetchedNotes);
    }
    setIsLoadingNotes(false);
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;
    
    setIsSavingNote(true);
    setNoteError(null);
    
    const { note, error } = await createBookmarkNote({
      bookmark_id: bookmark.id,
      content: newNoteContent.trim(),
    });
    
    if (error) {
      setNoteError(error);
      toast.error('Failed to add note', { description: error });
    } else if (note) {
      setNotes((prev) => [...prev, note]);
      setNewNoteContent('');
      setIsAddingNote(false);
      toast.success('Note added');
    }
    setIsSavingNote(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    setDeletingNoteId(noteId);
    setNoteError(null);
    
    const { success, error } = await deleteBookmarkNote(noteId);
    
    if (error) {
      setNoteError(error);
      toast.error('Failed to delete note', { description: error });
    } else if (success) {
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast.success('Note deleted');
    }
    setDeletingNoteId(null);
  };

  const handleSave = async () => {
    await onUpdate(bookmark.id, editLabel, editCategory);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditLabel(bookmark.label);
    setEditCategory(bookmark.category || '');
    setIsEditing(false);
  };

  const handleSeek = () => {
    onSeek(bookmark.timestamp_ms);
  };

  const toggleNotes = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNotes(!showNotes);
  };

  if (isEditing) {
    return (
      <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold">
          <Clock className="w-3 h-3" />
          {formatTimestampShort(bookmark.timestamp_ms)}
        </div>
        <div className="space-y-2">
          <Input
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            placeholder="Bookmark label"
            className="h-9 text-sm"
            autoFocus
          />
          <Input
            value={editCategory}
            onChange={(e) => setEditCategory(e.target.value)}
            placeholder="Category (optional)"
            className="h-9 text-sm"
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            disabled={isUpdating}
            className="h-8 px-3"
          >
            <X className="w-3.5 h-3.5 mr-1.5" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isUpdating || !editLabel.trim()}
            className="h-8 px-3"
          >
            {isUpdating ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5 mr-1.5" />
            )}
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-transparent hover:border-border transition-all">
      {/* Main bookmark row */}
      <div
        className={cn(
          'group relative flex items-start gap-4 p-4 cursor-pointer',
          'hover:bg-muted/50 transition-all',
          showNotes && 'bg-muted/30'
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
          
          {/* Notes toggle button */}
          <button
            onClick={toggleNotes}
            className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageSquare className="w-3 h-3" />
            {notes.length > 0 ? `${notes.length} note${notes.length === 1 ? '' : 's'}` : 'Add note'}
            {showNotes ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        </div>

        {/* Actions - show on hover */}
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setIsEditing(true)}
            disabled={isDeleting}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(bookmark.id)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>

      {/* Notes section (expandable) */}
      {showNotes && (
        <div className="px-4 pb-4 pt-0 border-t border-border/50 bg-muted/20">
          {noteError && (
            <Alert variant="destructive" className="mt-3 mb-2">
              <AlertCircle className="h-3 w-3" />
              <AlertDescription className="text-xs">{noteError}</AlertDescription>
            </Alert>
          )}
          
          {/* Loading state */}
          {isLoadingNotes && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Notes list */}
          {!isLoadingNotes && notes.length > 0 && (
            <div className="space-y-2 mt-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="group/note flex items-start gap-2 p-2 rounded-lg bg-background border border-border/50"
                >
                  <p className="flex-1 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                    {note.content}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover/note:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => handleDeleteNote(note.id)}
                    disabled={deletingNoteId === note.id}
                  >
                    {deletingNoteId === note.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add note form */}
          {isAddingNote ? (
            <div className="mt-3 space-y-2">
              <Textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Write your note..."
                className="min-h-[60px] text-xs"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsAddingNote(false);
                    setNewNoteContent('');
                    setNoteError(null);
                  }}
                  disabled={isSavingNote}
                  className="h-7 px-2 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={isSavingNote || !newNoteContent.trim()}
                  className="h-7 px-2 text-xs"
                >
                  {isSavingNote ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3 mr-1" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingNote(true)}
              className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add a note
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Sort bookmarks by timestamp to maintain stable ordering
 */
function sortBookmarks(bookmarks: Bookmark[]): Bookmark[] {
  return [...bookmarks].sort((a, b) => a.timestamp_ms - b.timestamp_ms);
}

export function BookmarksList({
  sessionId,
  initialBookmarks,
  mediaPlayerRef,
}: BookmarksListProps) {
  const queryClient = useQueryClient();
  const queryKey = ['bookmarks', sessionId];

  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Use React Query for bookmarks with initial data
  const { data: bookmarks = initialBookmarks } = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await getBookmarks(sessionId);
      return result.bookmarks;
    },
    initialData: initialBookmarks,
    staleTime: 30000,
  });

  // Create bookmark mutation with optimistic update
  const createMutation = useMutation({
    mutationFn: async (input: CreateBookmarkInput) => {
      const result = await createBookmark(input);
      if (result.error) throw new Error(result.error);
      return result.bookmark!;
    },
    onMutate: async (newBookmarkInput) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousBookmarks = queryClient.getQueryData<Bookmark[]>(queryKey);

      // Optimistically add the new bookmark with temporary ID
      const optimisticBookmark: Bookmark = {
        id: `temp-${Date.now()}`,
        session_id: newBookmarkInput.session_id,
        user_id: '',
        timestamp_ms: newBookmarkInput.timestamp_ms,
        label: newBookmarkInput.label,
        category: newBookmarkInput.category || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<Bookmark[]>(queryKey, (old = []) => 
        sortBookmarks([...old, optimisticBookmark])
      );

      return { previousBookmarks };
    },
    onError: (err, _, context) => {
      // Rollback on error
      if (context?.previousBookmarks) {
        queryClient.setQueryData(queryKey, context.previousBookmarks);
      }
      toast.error('Failed to create bookmark', { description: err.message });
      setError(err.message);
    },
    onSuccess: (newBookmark) => {
      // Replace optimistic bookmark with real one
      queryClient.setQueryData<Bookmark[]>(queryKey, (old = []) => {
        const filtered = old.filter(b => !b.id.startsWith('temp-'));
        return sortBookmarks([...filtered, newBookmark]);
      });
      toast.success('Bookmark created');
      setNewLabel('');
      setNewCategory('');
      setIsAdding(false);
    },
  });

  // Update bookmark mutation with optimistic update
  const updateMutation = useMutation({
    mutationFn: async ({ id, label, category }: { id: string; label: string; category: string }) => {
      const result = await updateBookmark(id, { label, category: category || undefined });
      if (result.error) throw new Error(result.error);
      return result.bookmark!;
    },
    onMutate: async ({ id, label, category }) => {
      await queryClient.cancelQueries({ queryKey });

      const previousBookmarks = queryClient.getQueryData<Bookmark[]>(queryKey);

      // Optimistically update the bookmark
      queryClient.setQueryData<Bookmark[]>(queryKey, (old = []) =>
        old.map(b => b.id === id ? { ...b, label, category: category || null, updated_at: new Date().toISOString() } : b)
      );

      return { previousBookmarks };
    },
    onError: (err, _, context) => {
      if (context?.previousBookmarks) {
        queryClient.setQueryData(queryKey, context.previousBookmarks);
      }
      toast.error('Failed to update bookmark', { description: err.message });
      setError(err.message);
    },
    onSuccess: (updatedBookmark) => {
      queryClient.setQueryData<Bookmark[]>(queryKey, (old = []) =>
        old.map(b => b.id === updatedBookmark.id ? updatedBookmark : b)
      );
      toast.success('Bookmark updated');
    },
  });

  // Delete bookmark mutation with optimistic update
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteBookmark(id);
      if (result.error) throw new Error(result.error);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });

      const previousBookmarks = queryClient.getQueryData<Bookmark[]>(queryKey);

      // Optimistically remove the bookmark
      queryClient.setQueryData<Bookmark[]>(queryKey, (old = []) =>
        old.filter(b => b.id !== id)
      );

      return { previousBookmarks };
    },
    onError: (err, _, context) => {
      if (context?.previousBookmarks) {
        queryClient.setQueryData(queryKey, context.previousBookmarks);
      }
      toast.error('Failed to delete bookmark', { description: err.message });
      setError(err.message);
    },
    onSuccess: () => {
      toast.success('Bookmark deleted');
    },
  });

  const handleAddBookmark = () => {
    setError(null);

    // Get current time from media player
    const currentTimeMs = mediaPlayerRef.current?.getCurrentTimeMs() ?? 0;

    if (!newLabel.trim()) {
      setError('Please enter a label for the bookmark');
      return;
    }

    const input: CreateBookmarkInput = {
      session_id: sessionId,
      timestamp_ms: currentTimeMs,
      label: newLabel.trim(),
      category: newCategory.trim() || undefined,
    };

    createMutation.mutate(input);
  };

  const handleUpdateBookmark = async (id: string, label: string, category: string) => {
    setError(null);
    updateMutation.mutate({ id, label, category });
  };

  const handleDeleteBookmark = async (id: string) => {
    setError(null);
    deleteMutation.mutate(id);
  };

  const handleSeek = (timestampMs: number) => {
    mediaPlayerRef.current?.seekToMs(timestampMs);
  };

  const isPending = createMutation.isPending;
  const updatingId = updateMutation.isPending ? (updateMutation.variables as { id: string } | undefined)?.id : null;
  const deletingId = deleteMutation.isPending ? deleteMutation.variables as string : null;

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Add Bookmark Section */}
      {isAdding ? (
        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-bold">
            <BookmarkIcon className="w-3 h-3" />
            New bookmark at current position
          </div>
          <div className="space-y-2">
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Bookmark label (e.g., 'Great answer about leadership')"
              className="h-9 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newLabel.trim()) {
                  handleAddBookmark();
                }
              }}
            />
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Category (optional, e.g., 'highlight', 'question')"
              className="h-9 text-sm"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAdding(false);
                setNewLabel('');
                setNewCategory('');
                setError(null);
              }}
              disabled={isPending}
              className="h-8 px-3"
            >
              <X className="w-3.5 h-3.5 mr-1.5" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddBookmark}
              disabled={isPending || !newLabel.trim()}
              className="h-8 px-3"
            >
              {isPending ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5 mr-1.5" />
              )}
              Add Bookmark
            </Button>
          </div>
        </div>
      ) : (
        <SecondaryButton
          size="sm"
          onClick={() => setIsAdding(true)}
          className="w-full rounded-xl h-11 border-dashed hover:border-solid hover:border-primary/50 hover:bg-primary/5"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Bookmark at Current Position
        </SecondaryButton>
      )}

      {/* Bookmarks List */}
      {bookmarks.length > 0 ? (
        <div className="space-y-2">
          {bookmarks.map((bookmark) => (
            <BookmarkItem
              key={bookmark.id}
              bookmark={bookmark}
              onUpdate={handleUpdateBookmark}
              onDelete={handleDeleteBookmark}
              onSeek={handleSeek}
              isUpdating={updatingId === bookmark.id}
              isDeleting={deletingId === bookmark.id}
            />
          ))}
        </div>
      ) : (
        !isAdding && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <BookmarkIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-foreground font-medium">No bookmarks yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Bookmark important parts of the recording to review them later
            </p>
          </div>
        )
      )}
    </div>
  );
}
