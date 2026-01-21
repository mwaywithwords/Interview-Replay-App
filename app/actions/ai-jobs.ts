'use server';

import { revalidatePath } from 'next/cache';
import { createClient, requireUser } from '@/lib/supabase/server';
import type { AIJob, AIJobType, AIOutput } from '@/types';

/**
 * Server Action: Create a new AI job for a session
 * Validates that the session belongs to the authenticated user.
 * Creates a queued job row and returns it.
 * Does NOT call any external AI services.
 */
export async function createAIJob(
  sessionId: string,
  jobType: AIJobType
): Promise<{ job: AIJob | null; error: string | null }> {
  const user = await requireUser();
  const supabase = await createClient();

  // Validate that the session exists and belongs to the user
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, user_id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single();

  if (sessionError || !session) {
    return {
      job: null,
      error: 'Session not found or you do not have permission to access it.',
    };
  }

  // Validate job_type
  const validJobTypes: AIJobType[] = ['transcript', 'summary', 'score', 'suggest_bookmarks'];
  if (!validJobTypes.includes(jobType)) {
    return {
      job: null,
      error: `Invalid job type. Must be one of: ${validJobTypes.join(', ')}`,
    };
  }

  // Create the AI job with status 'queued'
  const { data, error } = await supabase
    .from('ai_jobs')
    .insert({
      user_id: user.id,
      session_id: sessionId,
      job_type: jobType,
      status: 'queued',
    })
    .select()
    .single();

  if (error) {
    return { job: null, error: error.message };
  }

  revalidatePath(`/sessions/${sessionId}`);
  return { job: data as AIJob, error: null };
}

/**
 * Server Action: Get all AI jobs for a session
 * Returns jobs ordered by created_at descending (newest first)
 */
export async function getSessionAIJobs(
  sessionId: string
): Promise<{ jobs: AIJob[]; error: string | null }> {
  const user = await requireUser();
  const supabase = await createClient();

  // Validate that the session exists and belongs to the user
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, user_id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single();

  if (sessionError || !session) {
    return {
      jobs: [],
      error: 'Session not found or you do not have permission to access it.',
    };
  }

  // Fetch all AI jobs for this session
  const { data, error } = await supabase
    .from('ai_jobs')
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return { jobs: [], error: error.message };
  }

  return { jobs: (data as AIJob[]) || [], error: null };
}

/**
 * Server Action: Get a single AI job by ID
 */
export async function getAIJob(
  jobId: string
): Promise<{ job: AIJob | null; error: string | null }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ai_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    return { job: null, error: error.message };
  }

  return { job: data as AIJob, error: null };
}

/**
 * Server Action: Run an AI job by invoking the Supabase Edge Function
 * Forwards the user's auth token to the edge function for authentication.
 * The edge function handles updating job status and creating outputs.
 */
export async function runAIJob(
  jobId: string
): Promise<{ success: boolean; status?: string; error: string | null }> {
  const user = await requireUser();
  const supabase = await createClient();

  // First verify the job exists and belongs to the user
  const { data: job, error: jobError } = await supabase
    .from('ai_jobs')
    .select('id, user_id, session_id, status')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single();

  if (jobError || !job) {
    return {
      success: false,
      error: 'Job not found or you do not have permission to run it.',
    };
  }

  if (job.status !== 'queued') {
    return {
      success: false,
      error: `Job cannot be run. Current status: ${job.status}`,
    };
  }

  try {
    // Invoke the edge function with the job_id
    // The auth header is automatically included by the Supabase client
    const { data, error } = await supabase.functions.invoke('ai_run_job', {
      body: { job_id: jobId },
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'Failed to run AI job',
      };
    }

    // Revalidate the session page to show updated data
    revalidatePath(`/sessions/${job.session_id}`);

    return {
      success: true,
      status: data?.status || 'completed',
      error: null,
    };
  } catch (err) {
    console.error('Error invoking edge function:', err);
    return {
      success: false,
      error: 'Failed to connect to AI service. Please try again.',
    };
  }
}

/**
 * Server Action: Get all AI outputs for a session
 * Returns outputs ordered by created_at descending (newest first)
 */
export async function getSessionAIOutputs(
  sessionId: string
): Promise<{ outputs: AIOutput[]; error: string | null }> {
  const user = await requireUser();
  const supabase = await createClient();

  // Validate that the session exists and belongs to the user
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, user_id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single();

  if (sessionError || !session) {
    return {
      outputs: [],
      error: 'Session not found or you do not have permission to access it.',
    };
  }

  // Fetch all AI outputs for this session
  const { data, error } = await supabase
    .from('ai_outputs')
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return { outputs: [], error: error.message };
  }

  return { outputs: (data as AIOutput[]) || [], error: null };
}

/**
 * Server Action: Get a single AI output by job ID
 */
export async function getAIOutputByJobId(
  jobId: string
): Promise<{ output: AIOutput | null; error: string | null }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ai_outputs')
    .select('*')
    .eq('job_id', jobId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    // No output found is not necessarily an error (job might not have completed)
    if (error.code === 'PGRST116') {
      return { output: null, error: null };
    }
    return { output: null, error: error.message };
  }

  return { output: data as AIOutput, error: null };
}

/**
 * Server Action: Cancel an AI job
 * Only allows cancelling jobs with status 'queued' or 'processing'.
 * Sets status to 'cancelled' and error_message to "Cancelled by user".
 */
export async function cancelAiJob(
  jobId: string
): Promise<{ success: boolean; error: string | null }> {
  const user = await requireUser();
  const supabase = await createClient();

  // First verify the job exists and belongs to the user
  const { data: job, error: jobError } = await supabase
    .from('ai_jobs')
    .select('id, user_id, session_id, status')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single();

  if (jobError || !job) {
    return {
      success: false,
      error: 'Job not found or you do not have permission to cancel it.',
    };
  }

  // Only allow cancelling queued or processing jobs
  if (job.status !== 'queued' && job.status !== 'processing') {
    return {
      success: false,
      error: `Cannot cancel job with status '${job.status}'. Only queued or processing jobs can be cancelled.`,
    };
  }

  // Update the job status to cancelled
  const { error: updateError } = await supabase
    .from('ai_jobs')
    .update({
      status: 'cancelled',
      error_message: 'Cancelled by user',
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .eq('user_id', user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath(`/sessions/${job.session_id}`);
  return { success: true, error: null };
}

/**
 * Server Action: Retry a failed or cancelled AI job
 * Creates a new job with the same session_id and job_type.
 * Does NOT delete the old job.
 */
export async function retryAiJob(
  jobId: string
): Promise<{ job: AIJob | null; error: string | null }> {
  const user = await requireUser();
  const supabase = await createClient();

  // First verify the original job exists and belongs to the user
  const { data: originalJob, error: jobError } = await supabase
    .from('ai_jobs')
    .select('id, user_id, session_id, job_type, status')
    .eq('id', jobId)
    .eq('user_id', user.id)
    .single();

  if (jobError || !originalJob) {
    return {
      job: null,
      error: 'Job not found or you do not have permission to retry it.',
    };
  }

  // Only allow retrying failed or cancelled jobs
  if (originalJob.status !== 'failed' && originalJob.status !== 'cancelled') {
    return {
      job: null,
      error: `Cannot retry job with status '${originalJob.status}'. Only failed or cancelled jobs can be retried.`,
    };
  }

  // Create a new job with the same session_id and job_type
  const { data: newJob, error: createError } = await supabase
    .from('ai_jobs')
    .insert({
      user_id: user.id,
      session_id: originalJob.session_id,
      job_type: originalJob.job_type,
      status: 'queued',
    })
    .select()
    .single();

  if (createError) {
    return { job: null, error: createError.message };
  }

  revalidatePath(`/sessions/${originalJob.session_id}`);
  return { job: newJob as AIJob, error: null };
}
