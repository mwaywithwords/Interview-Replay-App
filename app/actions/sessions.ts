'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, requireUser } from '@/lib/supabase/server';
import type {
  InterviewSession,
  CreateSessionInput,
  UpdateSessionInput,
  SessionMetadata,
  AudioUploadMetadata,
  VideoUploadMetadata,
  InterviewSessionWithGroupings,
  Company,
  Symbol,
} from '@/types';

/**
 * Server Action: Get all sessions for the current user with optional filtering
 */
export async function getSessions(filters?: {
  session_type?: 'interview' | 'trading';
  company_id?: string;
  symbol_id?: string;
}): Promise<{
  sessions: InterviewSessionWithGroupings[];
  error: string | null;
}> {
  const user = await requireUser();
  const supabase = await createClient();

  // Build the base query
  let query = supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id);

  // Apply session_type filter
  if (filters?.session_type) {
    query = query.eq('metadata->>session_type', filters.session_type);
  }

  // Apply company filter
  if (filters?.company_id) {
    const { data: sessionIds } = await supabase
      .from('session_companies')
      .select('session_id')
      .eq('company_id', filters.company_id)
      .eq('user_id', user.id);

    if (sessionIds && sessionIds.length > 0) {
      const ids = sessionIds.map((sc) => sc.session_id);
      query = query.in('id', ids);
    } else {
      // No sessions found for this company
      return { sessions: [], error: null };
    }
  }

  // Apply symbol filter
  if (filters?.symbol_id) {
    const { data: sessionIds } = await supabase
      .from('session_symbols')
      .select('session_id')
      .eq('symbol_id', filters.symbol_id)
      .eq('user_id', user.id);

    if (sessionIds && sessionIds.length > 0) {
      const ids = sessionIds.map((ss) => ss.session_id);
      query = query.in('id', ids);
    } else {
      // No sessions found for this symbol
      return { sessions: [], error: null };
    }
  }

  query = query.order('created_at', { ascending: false });

  const { data: sessionsData, error } = await query;

  if (error) {
    return { sessions: [], error: error.message };
  }

  if (!sessionsData || sessionsData.length === 0) {
    return { sessions: [], error: null };
  }

  // Fetch companies and symbols for all sessions
  const sessionIds = sessionsData.map((s) => s.id);

  // Fetch session-company associations
  const { data: sessionCompaniesData } = await supabase
    .from('session_companies')
    .select('session_id, company_id')
    .in('session_id', sessionIds)
    .eq('user_id', user.id);

  // Fetch session-symbol associations
  const { data: sessionSymbolsData } = await supabase
    .from('session_symbols')
    .select('session_id, symbol_id')
    .in('session_id', sessionIds)
    .eq('user_id', user.id);

  // Get unique company and symbol IDs
  const companyIds = [
    ...new Set(sessionCompaniesData?.map((sc) => sc.company_id) || []),
  ];
  const symbolIds = [
    ...new Set(sessionSymbolsData?.map((ss) => ss.symbol_id) || []),
  ];

  // Fetch companies
  const { data: companiesData } =
    companyIds.length > 0
      ? await supabase
          .from('companies')
          .select('*')
          .in('id', companyIds)
          .eq('user_id', user.id)
      : { data: [] };

  // Fetch symbols
  const { data: symbolsData } =
    symbolIds.length > 0
      ? await supabase
          .from('symbols')
          .select('*')
          .in('id', symbolIds)
          .eq('user_id', user.id)
      : { data: [] };

  // Create maps for quick lookup
  const companiesMap = new Map(
    (companiesData || []).map((c: Company) => [c.id, c])
  );
  const symbolsMap = new Map(
    (symbolsData || []).map((s: Symbol) => [s.id, s])
  );

  // Group companies and symbols by session_id
  const companiesBySession = new Map<string, Company[]>();
  const symbolsBySession = new Map<string, Symbol[]>();

  sessionCompaniesData?.forEach((sc) => {
    const company = companiesMap.get(sc.company_id);
    if (company) {
      const existing = companiesBySession.get(sc.session_id) || [];
      companiesBySession.set(sc.session_id, [...existing, company]);
    }
  });

  sessionSymbolsData?.forEach((ss) => {
    const symbol = symbolsMap.get(ss.symbol_id);
    if (symbol) {
      const existing = symbolsBySession.get(ss.session_id) || [];
      symbolsBySession.set(ss.session_id, [...existing, symbol]);
    }
  });

  // Combine sessions with their companies and symbols
  const sessions: InterviewSessionWithGroupings[] = sessionsData.map(
    (session) => {
      const companies = companiesBySession.get(session.id);
      const symbols = symbolsBySession.get(session.id);

      return {
        ...session,
        companies: companies && companies.length > 0 ? companies : undefined,
        symbols: symbols && symbols.length > 0 ? symbols : undefined,
      } as InterviewSessionWithGroupings;
    }
  );

  return { sessions, error: null };
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

  // Validate required fields based on session type
  if (input.session_type === 'interview' && !input.company_id) {
    return { session: null, error: 'Company is required for interview sessions' };
  }
  if (input.session_type === 'trading' && !input.symbol_id) {
    return { session: null, error: 'Symbol is required for trading sessions' };
  }
  if (!input.recording_type) {
    return { session: null, error: 'Recording type is required' };
  }

  const metadata: SessionMetadata = {
    session_type: input.session_type,
    prompt: input.prompt,
  };

  // Create the session
  const { data: sessionData, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      user_id: user.id,
      title: input.title,
      status: 'draft',
      recording_type: input.recording_type,
      metadata,
    })
    .select()
    .single();

  if (sessionError) {
    return { session: null, error: sessionError.message };
  }

  const session = sessionData as InterviewSession;

  // Create associations based on session type
  if (input.session_type === 'interview' && input.company_id) {
    const { error: companyError } = await supabase
      .from('session_companies')
      .insert({
        user_id: user.id,
        session_id: session.id,
        company_id: input.company_id,
      });

    if (companyError) {
      // Clean up the session if association fails
      await supabase.from('sessions').delete().eq('id', session.id);
      return { session: null, error: `Failed to link company: ${companyError.message}` };
    }
  }

  if (input.session_type === 'trading' && input.symbol_id) {
    const { error: symbolError } = await supabase
      .from('session_symbols')
      .insert({
        user_id: user.id,
        session_id: session.id,
        symbol_id: input.symbol_id,
      });

    if (symbolError) {
      // Clean up the session if association fails
      await supabase.from('sessions').delete().eq('id', session.id);
      return { session: null, error: `Failed to link symbol: ${symbolError.message}` };
    }
  }

  revalidatePath('/dashboard');
  return { session, error: null };
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

/**
 * Server Action: Update session with audio metadata after successful upload
 * Called after client-side upload to Storage completes
 */
export async function updateSessionAudioMetadata(
  sessionId: string,
  metadata: AudioUploadMetadata
): Promise<{ session: InterviewSession | null; error: string | null }> {
  const user = await requireUser();
  const supabase = await createClient();

  // Validate that the session belongs to the current user
  const { data: existingSession, error: fetchError } = await supabase
    .from('sessions')
    .select('id, user_id, status')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !existingSession) {
    return {
      session: null,
      error: 'Session not found or you do not have permission to update it.',
    };
  }

  // Only update status to 'recorded' if not already recorded
  const newStatus = existingSession.status === 'recorded' ? 'recorded' : 'recorded';

  // Update the session with audio metadata and set status to 'recorded'
  // Clear video fields to ensure only one recording type exists
  const { data, error } = await supabase
    .from('sessions')
    .update({
      recording_type: 'audio',
      audio_storage_path: metadata.audio_storage_path,
      audio_duration_seconds: metadata.audio_duration_seconds,
      audio_mime_type: metadata.audio_mime_type,
      audio_file_size_bytes: metadata.audio_file_size_bytes,
      // Clear video fields to enforce single recording type
      video_storage_path: null,
      video_duration_seconds: null,
      video_mime_type: null,
      video_file_size_bytes: null,
      status: newStatus,
      recorded_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return { session: null, error: error.message };
  }

  revalidatePath('/dashboard');
  revalidatePath(`/sessions/${sessionId}`);
  return { session: data as InterviewSession, error: null };
}

/**
 * Server Action: Update session with video metadata after successful upload
 * Called after client-side video upload to Storage completes
 */
export async function updateSessionVideoMetadata(
  sessionId: string,
  metadata: VideoUploadMetadata
): Promise<{ session: InterviewSession | null; error: string | null }> {
  const user = await requireUser();
  const supabase = await createClient();

  // Validate that the session belongs to the current user
  const { data: existingSession, error: fetchError } = await supabase
    .from('sessions')
    .select('id, user_id, status')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !existingSession) {
    return {
      session: null,
      error: 'Session not found or you do not have permission to update it.',
    };
  }

  // Only update status to 'recorded' if not already recorded
  const newStatus = existingSession.status === 'recorded' ? 'recorded' : 'recorded';

  // Update the session with video metadata
  // Clear audio fields to ensure only one recording type exists
  const { data, error } = await supabase
    .from('sessions')
    .update({
      recording_type: 'video',
      video_storage_path: metadata.video_storage_path,
      video_duration_seconds: metadata.video_duration_seconds,
      video_mime_type: metadata.video_mime_type,
      video_file_size_bytes: metadata.video_file_size_bytes,
      // Clear audio fields to enforce single recording type
      audio_storage_path: null,
      audio_duration_seconds: null,
      audio_mime_type: null,
      audio_file_size_bytes: null,
      status: newStatus,
      recorded_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return { session: null, error: error.message };
  }

  revalidatePath('/dashboard');
  revalidatePath(`/sessions/${sessionId}`);
  return { session: data as InterviewSession, error: null };
}
