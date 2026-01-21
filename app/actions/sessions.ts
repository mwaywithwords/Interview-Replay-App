'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, requireUser } from '@/lib/supabase/server';
import type {
  InterviewSession,
  CreateSessionInput,
  UpdateSessionInput,
  SessionMetadata,
} from '@/types';

/**
 * Server Action: Get all sessions for the current user
 */
export async function getSessions(): Promise<{
  sessions: InterviewSession[];
  error: string | null;
}> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return { sessions: [], error: error.message };
  }

  return { sessions: data as InterviewSession[], error: null };
}

/**
 * Server Action: Get a single session by ID
 */
export async function getSession(
  id: string
): Promise<{ session: InterviewSession | null; error: string | null }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    return { session: null, error: error.message };
  }

  return { session: data as InterviewSession, error: null };
}

/**
 * Server Action: Create a new session
 */
export async function createSession(
  input: CreateSessionInput
): Promise<{ session: InterviewSession | null; error: string | null }> {
  const user = await requireUser();
  const supabase = await createClient();

  const metadata: SessionMetadata = {
    session_type: input.session_type,
    prompt: input.prompt,
  };

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      title: input.title,
      status: 'draft',
      metadata,
    })
    .select()
    .single();

  if (error) {
    return { session: null, error: error.message };
  }

  revalidatePath('/dashboard');
  return { session: data as InterviewSession, error: null };
}

/**
 * Server Action: Update a session
 */
export async function updateSession(
  id: string,
  input: UpdateSessionInput
): Promise<{ session: InterviewSession | null; error: string | null }> {
  const user = await requireUser();
  const supabase = await createClient();

  // First get the current session to merge metadata
  const { data: currentSession, error: fetchError } = await supabase
    .from('sessions')
    .select('metadata')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (fetchError) {
    return { session: null, error: fetchError.message };
  }

  const currentMetadata = (currentSession?.metadata as SessionMetadata) || {};
  const updatedMetadata: SessionMetadata = {
    ...currentMetadata,
    ...(input.session_type !== undefined && { session_type: input.session_type }),
    ...(input.prompt !== undefined && { prompt: input.prompt }),
  };

  const updateData: Record<string, unknown> = {
    metadata: updatedMetadata,
  };

  if (input.title !== undefined) {
    updateData.title = input.title;
  }

  if (input.status !== undefined) {
    updateData.status = input.status;
  }

  const { data, error } = await supabase
    .from('sessions')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return { session: null, error: error.message };
  }

  revalidatePath('/dashboard');
  revalidatePath(`/sessions/${id}`);
  return { session: data as InterviewSession, error: null };
}

/**
 * Server Action: Delete a session
 */
export async function deleteSession(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard');
  redirect('/dashboard');
}
