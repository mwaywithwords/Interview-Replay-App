'use server';

import { revalidatePath } from 'next/cache';
import { createClient, requireUser } from '@/lib/supabase/server';
import type { AIJob, AIJobType, AIOutput } from '@/types';

const VALID_JOB_TYPES: AIJobType[] = [
  'transcript',
  'summary',
  'score',
  'suggest_bookmarks',
  'action_items',
];
const ANALYSIS_PIPELINE_JOB_TYPES: AIJobType[] = [
  'transcript',
  'summary',
  'score',
  'action_items',
];
const ACTIVE_JOB_STATUSES = ['queued', 'processing'];
const REAL_TRANSCRIPT_PROVIDERS = ['openai', 'manual'];
const PLACEHOLDER_PROVIDER = 'placeholder';
const PLACEHOLDER_MODEL = 'mock-v1';

type EnsureAIJobResult = {
  job: AIJob | null;
  error: string | null;
  shouldRun: boolean;
  blocked: boolean;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type AnalysisPipelineResult = {
  job: AIJob | null;
  error: string | null;
  shouldRun: boolean;
  blocked: boolean;
  completed: boolean;
  nextJobType: AIJobType | null;
  blockedJob: AIJob | null;
};

function isPlaceholderTranscriptJob(job: AIJob): boolean {
  return (
    job.provider === PLACEHOLDER_PROVIDER || job.model === PLACEHOLDER_MODEL
  );
}

async function hasMeaningfulTranscript(
  supabase: SupabaseServerClient,
  sessionId: string,
  userId: string
): Promise<{ available: boolean; error: string | null }> {
  const { data, error } = await supabase
    .from('transcripts_manual')
    .select('content')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .in('provider', REAL_TRANSCRIPT_PROVIDERS);

  if (error) {
    return { available: false, error: error.message };
  }

  return {
    available: Boolean(data?.some((row) => row.content?.trim())),
    error: null,
  };
}

async function hasOpenAITranscriptOutput(
  supabase: SupabaseServerClient,
  sessionId: string,
  userId: string
): Promise<{ available: boolean; error: string | null }> {
  const { data: openAIJobs, error: jobsError } = await supabase
    .from('ai_jobs')
    .select('id')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .eq('job_type', 'transcript')
    .eq('provider', 'openai')
    .eq('status', 'completed');

  if (jobsError) {
    return { available: false, error: jobsError.message };
  }

  const openAIJobIds = (openAIJobs || []).map((job) => job.id);
  if (openAIJobIds.length === 0) {
    return { available: false, error: null };
  }

  const { data: outputs, error: outputsError } = await supabase
    .from('ai_outputs')
    .select('content')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .eq('output_type', 'transcript')
    .in('job_id', openAIJobIds);

  if (outputsError) {
    return { available: false, error: outputsError.message };
  }

  return {
    available: Boolean(
      outputs?.some((output) => {
        const content = output.content as { transcript?: unknown } | null;
        return (
          typeof content?.transcript === 'string' && content.transcript.trim()
        );
      })
    ),
    error: null,
  };
}

async function hasRealTranscriptAvailable(
  supabase: SupabaseServerClient,
  sessionId: string,
  userId: string
): Promise<{ available: boolean; error: string | null }> {
  const transcript = await hasMeaningfulTranscript(supabase, sessionId, userId);
  if (transcript.error || transcript.available) {
    return transcript;
  }

  return hasOpenAITranscriptOutput(supabase, sessionId, userId);
}

async function getReusableJobForCreate(
  supabase: SupabaseServerClient,
  sessionId: string,
  userId: string,
  jobType: AIJobType
): Promise<{ job: AIJob | null; error: string | null }> {
  // TODO(#3): Make duplicate prevention race-safe with a DB constraint or
  // transactional RPC. This read-then-insert guard can still race.
  const { data: existingJobs, error } = await supabase
    .from('ai_jobs')
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .eq('job_type', jobType)
    .in('status', [...ACTIVE_JOB_STATUSES, 'completed'])
    .order('created_at', { ascending: false });

  if (error) {
    return { job: null, error: error.message };
  }

  const jobs = (existingJobs || []) as AIJob[];
  const activeJob = jobs.find(
    (job) => job.status === 'queued' || job.status === 'processing'
  );
  if (activeJob) {
    return { job: activeJob, error: null };
  }

  const completedJob = jobs.find((job) => job.status === 'completed');
  if (!completedJob) {
    return { job: null, error: null };
  }

  if (jobType !== 'transcript') {
    return { job: completedJob, error: null };
  }

  const realTranscript = await hasRealTranscriptAvailable(
    supabase,
    sessionId,
    userId
  );
  if (realTranscript.error) {
    return { job: null, error: realTranscript.error };
  }

  if (!realTranscript.available) {
    return { job: null, error: null };
  }

  const realCompletedJob = jobs.find(
    (job) => job.status === 'completed' && !isPlaceholderTranscriptJob(job)
  );

  return { job: realCompletedJob || completedJob, error: null };
}

async function getAnalysisPipelineJobs(
  supabase: SupabaseServerClient,
  sessionId: string,
  userId: string
): Promise<{ jobs: AIJob[]; error: string | null }> {
  const { data, error } = await supabase
    .from('ai_jobs')
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .in('job_type', ANALYSIS_PIPELINE_JOB_TYPES)
    .order('created_at', { ascending: false });

  if (error) {
    return { jobs: [], error: error.message };
  }

  return { jobs: (data as AIJob[]) || [], error: null };
}

function getJobsForType(jobs: AIJob[], jobType: AIJobType): AIJob[] {
  return jobs.filter((job) => job.job_type === jobType);
}

function getActivePipelineJob(jobs: AIJob[]): AIJob | null {
  // If duplicate active jobs already exist, prefer the in-flight processing job
  // so the caller does not run another queued job for the same step.
  return (
    jobs.find((job) => job.status === 'processing') ||
    jobs.find((job) => job.status === 'queued') ||
    null
  );
}

function getCompletedPipelineJob(
  jobs: AIJob[],
  jobType: AIJobType
): AIJob | null {
  const completedJob = jobs.find((job) => job.status === 'completed');
  if (!completedJob) {
    return null;
  }

  if (jobType !== 'transcript') {
    return completedJob;
  }

  return (
    jobs.find(
      (job) => job.status === 'completed' && !isPlaceholderTranscriptJob(job)
    ) || null
  );
}

function getBlockedPipelineJob(
  jobs: AIJob[],
  jobType: AIJobType
): AIJob | null {
  return (
    jobs.find(
      (job) =>
        (job.status === 'failed' || job.status === 'cancelled') &&
        (jobType !== 'transcript' || !isPlaceholderTranscriptJob(job))
    ) || null
  );
}

async function createQueuedAIJobIfNoActiveJob(
  supabase: SupabaseServerClient,
  sessionId: string,
  userId: string,
  jobType: AIJobType
): Promise<{ job: AIJob | null; error: string | null; shouldRun: boolean }> {
  const { data: activeJobs, error: activeJobsError } = await supabase
    .from('ai_jobs')
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .eq('job_type', jobType)
    .in('status', ACTIVE_JOB_STATUSES)
    .order('created_at', { ascending: false });

  if (activeJobsError) {
    return { job: null, error: activeJobsError.message, shouldRun: false };
  }

  const activeJob = getActivePipelineJob((activeJobs || []) as AIJob[]);
  if (activeJob) {
    return {
      job: activeJob,
      error: null,
      shouldRun: activeJob.status === 'queued',
    };
  }

  const { data, error } = await supabase
    .from('ai_jobs')
    .insert({
      user_id: userId,
      session_id: sessionId,
      job_type: jobType,
      status: 'queued',
    })
    .select()
    .single();

  if (error) {
    return { job: null, error: error.message, shouldRun: false };
  }

  revalidatePath(`/sessions/${sessionId}`);
  return { job: data as AIJob, error: null, shouldRun: true };
}

/**
 * Server Action: Ensure the next Replay AI analysis pipeline job exists.
 *
 * Pipeline order for the first coach experience:
 * transcript -> summary -> score -> action_items
 *
 * Returns a queued/processing job for the next incomplete step. Completed
 * steps are reused, failed/cancelled steps pause the pipeline, and
 * suggest_bookmarks is intentionally excluded while it is placeholder-backed.
 */
export async function ensureNextAnalysisPipelineJob(
  sessionId: string
): Promise<AnalysisPipelineResult> {
  const user = await requireUser();
  const supabase = await createClient();

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
      shouldRun: false,
      blocked: true,
      completed: false,
      nextJobType: null,
      blockedJob: null,
    };
  }

  const { jobs, error: jobsError } = await getAnalysisPipelineJobs(
    supabase,
    sessionId,
    user.id
  );

  if (jobsError) {
    return {
      job: null,
      error: jobsError,
      shouldRun: false,
      blocked: true,
      completed: false,
      nextJobType: null,
      blockedJob: null,
    };
  }

  const realTranscript = await hasRealTranscriptAvailable(
    supabase,
    sessionId,
    user.id
  );

  if (realTranscript.error) {
    return {
      job: null,
      error: realTranscript.error,
      shouldRun: false,
      blocked: true,
      completed: false,
      nextJobType: null,
      blockedJob: null,
    };
  }

  for (const jobType of ANALYSIS_PIPELINE_JOB_TYPES) {
    const jobsForType = getJobsForType(jobs, jobType);
    const activeJob = getActivePipelineJob(jobsForType);

    if (activeJob) {
      return {
        job: activeJob,
        error: null,
        shouldRun: activeJob.status === 'queued',
        blocked: false,
        completed: false,
        nextJobType: jobType,
        blockedJob: null,
      };
    }

    const completedJob = getCompletedPipelineJob(jobsForType, jobType);
    const stepIsComplete =
      Boolean(completedJob) ||
      (jobType === 'transcript' && realTranscript.available);

    if (stepIsComplete) {
      continue;
    }

    const blockedJob = getBlockedPipelineJob(jobsForType, jobType);
    if (blockedJob) {
      return {
        job: blockedJob,
        error: null,
        shouldRun: false,
        blocked: true,
        completed: false,
        nextJobType: jobType,
        blockedJob,
      };
    }

    const {
      job,
      error: createError,
      shouldRun,
    } = await createQueuedAIJobIfNoActiveJob(
      supabase,
      sessionId,
      user.id,
      jobType
    );

    if (createError || !job) {
      return {
        job: null,
        error: createError || 'Failed to create analysis job.',
        shouldRun: false,
        blocked: true,
        completed: false,
        nextJobType: jobType,
        blockedJob: null,
      };
    }

    return {
      job,
      error: null,
      shouldRun,
      blocked: false,
      completed: false,
      nextJobType: jobType,
      blockedJob: null,
    };
  }

  return {
    job: null,
    error: null,
    shouldRun: false,
    blocked: false,
    completed: true,
    nextJobType: null,
    blockedJob: null,
  };
}

/**
 * Server Action: Retry the first failed/cancelled Replay AI analysis step.
 *
 * The retry resumes from the failed pipeline step and leaves earlier completed
 * steps untouched. If there is no failed step, this behaves like
 * ensureNextAnalysisPipelineJob.
 */
export async function retryAnalysisPipelineFromFailedStep(
  sessionId: string
): Promise<AnalysisPipelineResult> {
  const user = await requireUser();
  const supabase = await createClient();

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
      shouldRun: false,
      blocked: true,
      completed: false,
      nextJobType: null,
      blockedJob: null,
    };
  }

  const { jobs, error: jobsError } = await getAnalysisPipelineJobs(
    supabase,
    sessionId,
    user.id
  );

  if (jobsError) {
    return {
      job: null,
      error: jobsError,
      shouldRun: false,
      blocked: true,
      completed: false,
      nextJobType: null,
      blockedJob: null,
    };
  }

  const realTranscript = await hasRealTranscriptAvailable(
    supabase,
    sessionId,
    user.id
  );

  if (realTranscript.error) {
    return {
      job: null,
      error: realTranscript.error,
      shouldRun: false,
      blocked: true,
      completed: false,
      nextJobType: null,
      blockedJob: null,
    };
  }

  for (const jobType of ANALYSIS_PIPELINE_JOB_TYPES) {
    const jobsForType = getJobsForType(jobs, jobType);
    const activeJob = getActivePipelineJob(jobsForType);

    if (activeJob) {
      return {
        job: activeJob,
        error: null,
        shouldRun: activeJob.status === 'queued',
        blocked: false,
        completed: false,
        nextJobType: jobType,
        blockedJob: null,
      };
    }

    const completedJob = getCompletedPipelineJob(jobsForType, jobType);
    const stepIsComplete =
      Boolean(completedJob) ||
      (jobType === 'transcript' && realTranscript.available);

    if (stepIsComplete) {
      continue;
    }

    const blockedJob = getBlockedPipelineJob(jobsForType, jobType);
    if (!blockedJob) {
      break;
    }

    const {
      job,
      error: createError,
      shouldRun,
    } = await createQueuedAIJobIfNoActiveJob(
      supabase,
      sessionId,
      user.id,
      jobType
    );

    if (createError || !job) {
      return {
        job: blockedJob,
        error: createError || 'Failed to retry analysis job.',
        shouldRun: false,
        blocked: true,
        completed: false,
        nextJobType: jobType,
        blockedJob,
      };
    }

    return {
      job,
      error: null,
      shouldRun,
      blocked: false,
      completed: false,
      nextJobType: jobType,
      blockedJob: null,
    };
  }

  return ensureNextAnalysisPipelineJob(sessionId);
}

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
  if (!VALID_JOB_TYPES.includes(jobType)) {
    return {
      job: null,
      error: `Invalid job type. Must be one of: ${VALID_JOB_TYPES.join(', ')}`,
    };
  }

  const { job: existingReusableJob, error: existingReusableJobError } =
    await getReusableJobForCreate(supabase, sessionId, user.id, jobType);

  if (existingReusableJobError) {
    return { job: null, error: existingReusableJobError };
  }

  if (existingReusableJob) {
    return {
      job: existingReusableJob,
      error: null,
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
 * Server Action: Ensure an automatic AI job exists without creating duplicates.
 *
 * Automatic orchestration is conservative:
 * - queued jobs are returned and should be run
 * - processing/completed jobs are reused and not duplicated
 * - failed/cancelled jobs block automation so the user can retry manually
 */
export async function ensureAutomaticAIJob(
  sessionId: string,
  jobType: AIJobType
): Promise<EnsureAIJobResult> {
  const user = await requireUser();
  const supabase = await createClient();

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
      shouldRun: false,
      blocked: true,
    };
  }

  if (!VALID_JOB_TYPES.includes(jobType)) {
    return {
      job: null,
      error: `Invalid job type. Must be one of: ${VALID_JOB_TYPES.join(', ')}`,
      shouldRun: false,
      blocked: true,
    };
  }

  const { data: existingJobs, error: existingJobsError } = await supabase
    .from('ai_jobs')
    .select('*')
    .eq('session_id', sessionId)
    .eq('user_id', user.id)
    .eq('job_type', jobType)
    .order('created_at', { ascending: false });

  if (existingJobsError) {
    return {
      job: null,
      error: existingJobsError.message,
      shouldRun: false,
      blocked: true,
    };
  }

  const jobs = (existingJobs || []) as AIJob[];
  const queuedJob = jobs.find((job) => job.status === 'queued');
  if (queuedJob) {
    return { job: queuedJob, error: null, shouldRun: true, blocked: false };
  }

  const processingJob = jobs.find((job) => job.status === 'processing');
  if (processingJob) {
    return {
      job: processingJob,
      error: null,
      shouldRun: false,
      blocked: false,
    };
  }

  const completedJob = jobs.find((job) => job.status === 'completed');
  if (completedJob) {
    if (jobType !== 'transcript') {
      return {
        job: completedJob,
        error: null,
        shouldRun: false,
        blocked: false,
      };
    }

    const realTranscript = await hasRealTranscriptAvailable(
      supabase,
      sessionId,
      user.id
    );
    if (realTranscript.error) {
      return {
        job: null,
        error: realTranscript.error,
        shouldRun: false,
        blocked: true,
      };
    }

    if (realTranscript.available) {
      const realCompletedJob =
        jobs.find(
          (job) =>
            job.status === 'completed' && !isPlaceholderTranscriptJob(job)
        ) || completedJob;
      return {
        job: realCompletedJob,
        error: null,
        shouldRun: false,
        blocked: false,
      };
    }
  }

  const failedOrCancelledJob = jobs.find(
    (job) =>
      (job.status === 'failed' || job.status === 'cancelled') &&
      (jobType !== 'transcript' || !isPlaceholderTranscriptJob(job))
  );
  if (failedOrCancelledJob) {
    return {
      job: failedOrCancelledJob,
      error: null,
      shouldRun: false,
      blocked: true,
    };
  }

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
    return {
      job: null,
      error: error.message,
      shouldRun: false,
      blocked: true,
    };
  }

  revalidatePath(`/sessions/${sessionId}`);
  return { job: data as AIJob, error: null, shouldRun: true, blocked: false };
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

  const { job: reusableJob, error: reusableJobError } =
    await getReusableJobForCreate(
      supabase,
      originalJob.session_id,
      user.id,
      originalJob.job_type
    );

  if (reusableJobError) {
    return { job: null, error: reusableJobError };
  }

  if (reusableJob) {
    return { job: reusableJob, error: null };
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
