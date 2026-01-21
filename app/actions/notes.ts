'use server';

import { revalidatePath } from 'next/cache';
import { createClient, requireUser } from '@/lib/supabase/server';
import type { SessionNote, BookmarkNote, CreateBookmarkNoteInput } from '@/types';

// ============================================
// SESSION NOTE ACTIONS
// ============================================

/**
 * Server Action: Get the session note for a session
 * Returns null if no note exists yet
 * Enforces ownership: user must own the session
 */
export async function getSessionNote(sessionId: string): Promise<{
  note: SessionNote | null;
  error: string | null;
}> {
  const user = await requireUser();
  const supabase = await createClient();

  // Verify the user owns the session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single();

  if (sessionError || !session) {
    return { note: null, error: 'Session not found or access denied' };
  }

  // Fetch the session note
  const { data, error } = await supabase
    .from('session_note')
    .select('id, user_id, session_id, content, created_at, updated_at')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .single();

  // No note exists yet - that's fine, return null
  if (error?.code === 'PGRST116') {
    return { note: null, error: null };
  }

  if (error) {
    return { note: null, error: error.message };
  }

  return { note: data as SessionNote, error: null };
}

/**
 * Server Action: Save (create or update) the session note
 * Uses upsert to handle both create and update cases
 * Enforces ownership: user must own the session
 */
export async function saveSessionNote(
  sessionId: string,
  content: string
): Promise<{ note: SessionNote | null; error: string | null }> {
  const user = await requireUser();
  const supabase = await createClient();

  // Verify the user owns the session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single();

  if (sessionError || !session) {
    return { note: null, error: 'Session not found or you do not have permission to save notes' };
  }

  // Upsert the session note (insert or update based on unique constraint)
  const { data, error } = await supabase
    .from('session_note')
    .upsert(
      {
        user_id: user.id,
        session_id: sessionId,
        content: content,
      },
      {
        onConflict: 'user_id,session_id',
      }
    )
    .select('id, user_id, session_id, content, created_at, updated_at')
    .single();

  if (error) {
    return { note: null, error: error.message };
  }

  revalidatePath(`/sessions/${sessionId}`);
  return { note: data as SessionNote, error: null };
}

// ============================================
// BOOKMARK NOTE ACTIONS
// ============================================

/**
 * Server Action: Get all notes for a bookmark
 * Returns notes in chronological order (oldest first)
 * Enforces ownership: user must own the bookmark
 */
export async function getBookmarkNotes(bookmarkId: string): Promise<{
  notes: BookmarkNote[];
  error: string | null;
}> {
  const user = await requireUser();
  const supabase = await createClient();

  // Verify the user owns this bookmark
  const { data: bookmark, error: bookmarkError } = await supabase
    .from('bookmarks')
    .select('id, session_id')
    .eq('id', bookmarkId)
    .eq('user_id', user.id)
    .single();

  if (bookmarkError || !bookmark) {
    return { notes: [], error: 'Bookmark not found or access denied' };
  }

  // Fetch notes for this bookmark
  const { data, error } = await supabase
    .from('bookmark_notes')
    .select('id, user_id, bookmark_id, content, created_at')
    .eq('bookmark_id', bookmarkId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    return { notes: [], error: error.message };
  }

  return { notes: data as BookmarkNote[], error: null };
}

/**
 * Server Action: Create a note for a bookmark
 * Enforces ownership: user must own the bookmark
 */
export async function createBookmarkNote(
  input: CreateBookmarkNoteInput
): Promise<{ note: BookmarkNote | null; error: string | null }> {
  const user = await requireUser();
  const supabase = await createClient();

  // Verify the user owns the bookmark
  const { data: bookmark, error: bookmarkError } = await supabase
    .from('bookmarks')
    .select('id, session_id')
    .eq('id', input.bookmark_id)
    .eq('user_id', user.id)
    .single();

  if (bookmarkError || !bookmark) {
    return { note: null, error: 'Bookmark not found or you do not have permission to add notes' };
  }

  // Validate content
  if (!input.content || input.content.trim() === '') {
    return { note: null, error: 'Note content is required' };
  }

  // Create the note
  const { data, error } = await supabase
    .from('bookmark_notes')
    .insert({
      user_id: user.id,
      bookmark_id: input.bookmark_id,
      content: input.content.trim(),
    })
    .select('id, user_id, bookmark_id, content, created_at')
    .single();

  if (error) {
    return { note: null, error: error.message };
  }

  revalidatePath(`/sessions/${bookmark.session_id}`);
  return { note: data as BookmarkNote, error: null };
}

/**
 * Server Action: Delete a bookmark note
 * Enforces ownership: user must own the note
 */
export async function deleteBookmarkNote(
  noteId: string
): Promise<{ success: boolean; error: string | null }> {
  const user = await requireUser();
  const supabase = await createClient();

  // Get the note to verify ownership and get bookmark info for revalidation
  const { data: note, error: fetchError } = await supabase
    .from('bookmark_notes')
    .select('id, bookmark_id, user_id')
    .eq('id', noteId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !note) {
    return { success: false, error: 'Note not found or you do not have permission to delete it' };
  }

  // Get the session_id for revalidation
  const { data: bookmark } = await supabase
    .from('bookmarks')
    .select('session_id')
    .eq('id', note.bookmark_id)
    .single();

  // Delete the note
  const { error } = await supabase
    .from('bookmark_notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  if (bookmark) {
    revalidatePath(`/sessions/${bookmark.session_id}`);
  }
  return { success: true, error: null };
}
