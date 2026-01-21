'use server';

import { revalidatePath } from 'next/cache';
import { createClient, requireUser } from '@/lib/supabase/server';
import type { Transcript } from '@/types';

/**
 * Server Action: Get the transcript for a session
 * Returns null if no transcript exists yet
 * Enforces ownership: user must own the session
 */
export async function getTranscript(
  sessionId: string,
  provider: string = 'manual'
): Promise<{
  transcript: Transcript | null;
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
    return { transcript: null, error: 'Session not found or access denied' };
  }

  // Fetch the transcript
  const { data, error } = await supabase
    .from('transcripts_manual')
    .select('id, user_id, session_id, provider, content, created_at, updated_at')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .eq('provider', provider)
    .single();

  // No transcript exists yet - that's fine, return null
  if (error?.code === 'PGRST116') {
    return { transcript: null, error: null };
  }

  if (error) {
    return { transcript: null, error: error.message };
  }

  return { transcript: data as Transcript, error: null };
}

/**
 * Server Action: Save (create or update) the transcript
 * Uses upsert to handle both create and update cases
 * Enforces ownership: user must own the session
 */
export async function saveTranscript(
  sessionId: string,
  content: string,
  provider: string = 'manual'
): Promise<{ transcript: Transcript | null; error: string | null }> {
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
    return {
      transcript: null,
      error: 'Session not found or you do not have permission to save transcripts',
    };
  }

  // Upsert the transcript (insert or update based on unique constraint)
  const { data, error } = await supabase
    .from('transcripts_manual')
    .upsert(
      {
        user_id: user.id,
        session_id: sessionId,
        provider: provider,
        content: content,
      },
      {
        onConflict: 'session_id,provider',
      }
    )
    .select('id, user_id, session_id, provider, content, created_at, updated_at')
    .single();

  if (error) {
    return { transcript: null, error: error.message };
  }

  revalidatePath(`/sessions/${sessionId}`);
  return { transcript: data as Transcript, error: null };
}
