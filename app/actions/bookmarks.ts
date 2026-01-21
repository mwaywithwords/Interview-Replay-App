'use server';

import { revalidatePath } from 'next/cache';
import { createClient, requireUser } from '@/lib/supabase/server';
import type { Bookmark, CreateBookmarkInput, UpdateBookmarkInput } from '@/types';

/**
 * Server Action: Get all bookmarks for a session
 * Only returns bookmarks for sessions owned by the current user
 */
export async function getBookmarks(sessionId: string): Promise<{
  bookmarks: Bookmark[];
  error: string | null;
}> {
  const user = await requireUser();
  const supabase = await createClient();

  // First verify the user owns this session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single();

  if (sessionError || !session) {
    return { bookmarks: [], error: 'Session not found or access denied' };
  }

  // Fetch bookmarks sorted by timestamp (ascending)
  const { data, error } = await supabase
    .from('bookmarks')
    .select('id, session_id, user_id, timestamp_ms, label, category, created_at, updated_at')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .order('timestamp_ms', { ascending: true });

  if (error) {
    return { bookmarks: [], error: error.message };
  }

  return { bookmarks: data as Bookmark[], error: null };
}

/**
 * Server Action: Create a new bookmark
 * Enforces ownership: user must own the session to create a bookmark
 */
export async function createBookmark(
  input: CreateBookmarkInput
): Promise<{ bookmark: Bookmark | null; error: string | null }> {
  const user = await requireUser();
  const supabase = await createClient();

  // Verify the user owns the session
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id')
    .eq('id', input.session_id)
    .eq('user_id', user.id)
    .single();

  if (sessionError || !session) {
    return { bookmark: null, error: 'Session not found or you do not have permission to add bookmarks' };
  }

  // Validate input
  if (!input.label || input.label.trim() === '') {
    return { bookmark: null, error: 'Bookmark label is required' };
  }

  if (input.timestamp_ms < 0) {
    return { bookmark: null, error: 'Timestamp cannot be negative' };
  }

  // Create the bookmark
  // Note: timestamp_seconds is included for backwards compatibility with the original schema
  // until the migration to drop it is run
  const timestampSeconds = Math.floor(input.timestamp_ms / 1000);
  
  const { data, error } = await supabase
    .from('bookmarks')
    .insert({
      session_id: input.session_id,
      user_id: user.id,
      timestamp_ms: input.timestamp_ms,
      timestamp_seconds: timestampSeconds,
      label: input.label.trim(),
      category: input.category?.trim() || null,
    })
    .select('id, session_id, user_id, timestamp_ms, label, category, created_at, updated_at')
    .single();

  if (error) {
    return { bookmark: null, error: error.message };
  }

  revalidatePath(`/sessions/${input.session_id}`);
  return { bookmark: data as Bookmark, error: null };
}

/**
 * Server Action: Update a bookmark
 * Enforces ownership: user must own the bookmark to update it
 */
export async function updateBookmark(
  bookmarkId: string,
  input: UpdateBookmarkInput
): Promise<{ bookmark: Bookmark | null; error: string | null }> {
  const user = await requireUser();
  const supabase = await createClient();

  // Verify the user owns this bookmark
  const { data: existingBookmark, error: fetchError } = await supabase
    .from('bookmarks')
    .select('id, session_id, user_id')
    .eq('id', bookmarkId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !existingBookmark) {
    return { bookmark: null, error: 'Bookmark not found or you do not have permission to update it' };
  }

  // Build update object
  const updateData: Record<string, unknown> = {};

  if (input.label !== undefined) {
    if (input.label.trim() === '') {
      return { bookmark: null, error: 'Bookmark label cannot be empty' };
    }
    updateData.label = input.label.trim();
  }

  if (input.category !== undefined) {
    updateData.category = input.category.trim() || null;
  }

  // Nothing to update
  if (Object.keys(updateData).length === 0) {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('id, session_id, user_id, timestamp_ms, label, category, created_at, updated_at')
      .eq('id', bookmarkId)
      .single();

    if (error) {
      return { bookmark: null, error: error.message };
    }
    return { bookmark: data as Bookmark, error: null };
  }

  // Perform the update
  const { data, error } = await supabase
    .from('bookmarks')
    .update(updateData)
    .eq('id', bookmarkId)
    .eq('user_id', user.id)
    .select('id, session_id, user_id, timestamp_ms, label, category, created_at, updated_at')
    .single();

  if (error) {
    return { bookmark: null, error: error.message };
  }

  revalidatePath(`/sessions/${existingBookmark.session_id}`);
  return { bookmark: data as Bookmark, error: null };
}

/**
 * Server Action: Delete a bookmark
 * Enforces ownership: user must own the bookmark to delete it
 */
export async function deleteBookmark(
  bookmarkId: string
): Promise<{ success: boolean; error: string | null }> {
  const user = await requireUser();
  const supabase = await createClient();

  // Get the bookmark to verify ownership and get session_id for revalidation
  const { data: bookmark, error: fetchError } = await supabase
    .from('bookmarks')
    .select('id, session_id, user_id')
    .eq('id', bookmarkId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !bookmark) {
    return { success: false, error: 'Bookmark not found or you do not have permission to delete it' };
  }

  // Delete the bookmark
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', bookmarkId)
    .eq('user_id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/sessions/${bookmark.session_id}`);
  return { success: true, error: null };
}
