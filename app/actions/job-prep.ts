'use server';

import { revalidatePath } from 'next/cache';
import { parseEdgeFunctionError } from '@/lib/supabase/parse-edge-function-error';
import { createClient, requireUser } from '@/lib/supabase/server';
import type {
  CreateJobPrepProjectInput,
  InterviewQuestionGenerationStatus,
  JobPrepProject,
  JobPrepProjectWithDetails,
  ResumeJobAnalysisStatus,
  TailoredResumeGenerationStatus,
} from '@/types';

const JOB_PREP_PROJECT_SELECT = `
  *,
  job_description:job_descriptions(*),
  resume:resumes(*),
  analysis:resume_job_analyses(*),
  tailored_resume:tailored_resume_generations(*),
  interview_question_generation:interview_question_generations(*),
  interview_questions:interview_questions(*)
`;

function normalizeJobPrepProject(row: Record<string, unknown>): JobPrepProjectWithDetails {
  const jobDescription = Array.isArray(row.job_description)
    ? row.job_description[0] ?? null
    : row.job_description;
  const resume = Array.isArray(row.resume) ? row.resume[0] ?? null : row.resume;
  const analysis = Array.isArray(row.analysis) ? row.analysis[0] ?? null : row.analysis;
  const tailoredResume = Array.isArray(row.tailored_resume)
    ? row.tailored_resume[0] ?? null
    : row.tailored_resume;
  const interviewQuestionGeneration = Array.isArray(row.interview_question_generation)
    ? row.interview_question_generation[0] ?? null
    : row.interview_question_generation;
  const interviewQuestions = Array.isArray(row.interview_questions)
    ? [...row.interview_questions].sort(
        (a, b) => (a.sort_order as number) - (b.sort_order as number)
      )
    : [];

  return {
    ...row,
    job_description: jobDescription,
    resume,
    analysis,
    tailored_resume: tailoredResume,
    interview_question_generation: interviewQuestionGeneration,
    interview_questions: interviewQuestions,
  } as JobPrepProjectWithDetails;
}

function deriveProjectTitle(input: CreateJobPrepProjectInput): string {
  const trimmedTitle = input.title.trim();
  if (trimmedTitle) {
    return trimmedTitle;
  }

  const company = input.jobDescription.companyName?.trim();
  const role = input.jobDescription.roleTitle?.trim();

  if (company && role) {
    return `${role} at ${company}`;
  }

  if (company) {
    return `${company} prep`;
  }

  if (role) {
    return `${role} prep`;
  }

  return 'Untitled job prep';
}

export async function getJobPrepProjects(): Promise<{
  projects: JobPrepProjectWithDetails[];
  error: string | null;
}> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('job_prep_projects')
    .select(JOB_PREP_PROJECT_SELECT)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    return { projects: [], error: error.message };
  }

  const projects = (data ?? []).map((row) =>
    normalizeJobPrepProject(row as Record<string, unknown>)
  );

  return { projects, error: null };
}

export async function createJobPrepProject(
  input: CreateJobPrepProjectInput
): Promise<{ project: JobPrepProject | null; error: string | null }> {
  const user = await requireUser();
  const supabase = await createClient();

  const jobDescriptionContent = input.jobDescription.content.trim();
  const resumeContent = input.resume.content.trim();

  if (!jobDescriptionContent) {
    return { project: null, error: 'Job description is required' };
  }

  if (!resumeContent) {
    return { project: null, error: 'Resume text is required' };
  }

  const title = deriveProjectTitle(input);

  const { data: project, error: projectError } = await supabase
    .from('job_prep_projects')
    .insert({
      user_id: user.id,
      title,
      status: 'draft',
    })
    .select()
    .single();

  if (projectError || !project) {
    return { project: null, error: projectError?.message ?? 'Failed to create project' };
  }

  const { data: resume, error: resumeError } = await supabase
    .from('resumes')
    .insert({
      user_id: user.id,
      project_id: project.id,
      content: resumeContent,
      source: input.resume.source ?? 'paste',
      file_name: input.resume.fileName?.trim() || null,
    })
    .select()
    .single();

  if (resumeError || !resume) {
    await supabase.from('job_prep_projects').delete().eq('id', project.id);
    return { project: null, error: resumeError?.message ?? 'Failed to save resume' };
  }

  const { data: jobDescription, error: jobDescriptionError } = await supabase
    .from('job_descriptions')
    .insert({
      user_id: user.id,
      project_id: project.id,
      content: jobDescriptionContent,
      company_name: input.jobDescription.companyName?.trim() || null,
      role_title: input.jobDescription.roleTitle?.trim() || null,
    })
    .select()
    .single();

  if (jobDescriptionError || !jobDescription) {
    await supabase.from('job_prep_projects').delete().eq('id', project.id);
    return {
      project: null,
      error: jobDescriptionError?.message ?? 'Failed to save job description',
    };
  }

  const { error: analysisError } = await supabase.from('resume_job_analyses').insert({
    user_id: user.id,
    project_id: project.id,
    resume_id: resume.id,
    job_description_id: jobDescription.id,
    status: 'pending',
  });

  if (analysisError) {
    await supabase.from('job_prep_projects').delete().eq('id', project.id);
    return { project: null, error: analysisError.message };
  }

  const { error: tailoredResumeError } = await supabase
    .from('tailored_resume_generations')
    .insert({
      user_id: user.id,
      project_id: project.id,
      resume_id: resume.id,
      job_description_id: jobDescription.id,
      status: 'pending',
    });

  if (tailoredResumeError) {
    await supabase.from('job_prep_projects').delete().eq('id', project.id);
    return { project: null, error: tailoredResumeError.message };
  }

  revalidatePath('/job-prep');

  return { project: project as JobPrepProject, error: null };
}

export async function getJobPrepProject(
  projectId: string
): Promise<{ project: JobPrepProjectWithDetails | null; error: string | null }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('job_prep_projects')
    .select(JOB_PREP_PROJECT_SELECT)
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { project: null, error: 'Project not found' };
    }
    return { project: null, error: error.message };
  }

  return {
    project: normalizeJobPrepProject(data as Record<string, unknown>),
    error: null,
  };
}

export async function runResumeJobAnalysis(
  projectId: string
): Promise<{
  success: boolean;
  status?: ResumeJobAnalysisStatus;
  error: string | null;
}> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: project, error: projectError } = await supabase
    .from('job_prep_projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (projectError || !project) {
    return {
      success: false,
      error: 'Project not found or you do not have permission to access it.',
    };
  }

  const { data: analysis, error: analysisError } = await supabase
    .from('resume_job_analyses')
    .select('id, status')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single();

  if (analysisError || !analysis) {
    return { success: false, error: 'Analysis record not found for this project.' };
  }

  if (analysis.status === 'processing') {
    return { success: true, status: 'processing', error: null };
  }

  if (analysis.status === 'completed') {
    return { success: true, status: 'completed', error: null };
  }

  if (analysis.status === 'failed') {
    const { error: resetError } = await supabase
      .from('resume_job_analyses')
      .update({
        status: 'pending',
        error_message: null,
        summary: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysis.id)
      .eq('user_id', user.id);

    if (resetError) {
      return { success: false, error: resetError.message };
    }

    await supabase
      .from('job_prep_projects')
      .update({
        status: 'draft',
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .eq('user_id', user.id);
  }

  if (analysis.status !== 'pending' && analysis.status !== 'failed') {
    return {
      success: false,
      error: `Analysis cannot be run. Current status: ${analysis.status}`,
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke(
      'ai_run_job_prep_analysis',
      {
        body: { analysis_id: analysis.id },
      }
    );

    if (error) {
      return {
        success: false,
        error: error.message || 'Failed to run resume fit analysis',
      };
    }

    revalidatePath(`/job-prep/${projectId}`);
    revalidatePath('/job-prep');

    return {
      success: true,
      status: (data?.status as ResumeJobAnalysisStatus) || 'completed',
      error: null,
    };
  } catch {
    return {
      success: false,
      error: 'Failed to connect to AI service. Please try again.',
    };
  }
}

export async function retryResumeJobAnalysis(
  projectId: string
): Promise<{
  success: boolean;
  status?: ResumeJobAnalysisStatus;
  error: string | null;
}> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: analysis, error: analysisError } = await supabase
    .from('resume_job_analyses')
    .select('id, status')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single();

  if (analysisError || !analysis) {
    return { success: false, error: 'Analysis record not found for this project.' };
  }

  if (analysis.status === 'processing') {
    return { success: true, status: 'processing', error: null };
  }

  if (analysis.status === 'completed' || analysis.status === 'failed') {
    const { error: resetError } = await supabase
      .from('resume_job_analyses')
      .update({
        status: 'pending',
        error_message: null,
        summary: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysis.id)
      .eq('user_id', user.id);

    if (resetError) {
      return { success: false, error: resetError.message };
    }

    await supabase
      .from('job_prep_projects')
      .update({
        status: 'draft',
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .eq('user_id', user.id);
  }

  return runResumeJobAnalysis(projectId);
}

async function ensureTailoredResumeGeneration(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  projectId: string
): Promise<{ generationId: string | null; error: string | null }> {
  const { data: existing, error: existingError } = await supabase
    .from('tailored_resume_generations')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingError) {
    return { generationId: null, error: existingError.message };
  }

  if (existing) {
    return { generationId: existing.id, error: null };
  }

  const { data: project, error: projectError } = await supabase
    .from('job_prep_projects')
    .select(`
      id,
      resume:resumes(id),
      job_description:job_descriptions(id)
    `)
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (projectError || !project) {
    return { generationId: null, error: 'Project not found for tailored résumé generation.' };
  }

  const resume = Array.isArray(project.resume) ? project.resume[0] : project.resume;
  const jobDescription = Array.isArray(project.job_description)
    ? project.job_description[0]
    : project.job_description;

  if (!resume?.id || !jobDescription?.id) {
    return {
      generationId: null,
      error: 'Résumé and job description are required before generating a tailored résumé.',
    };
  }

  const { data: created, error: createError } = await supabase
    .from('tailored_resume_generations')
    .insert({
      user_id: userId,
      project_id: projectId,
      resume_id: resume.id,
      job_description_id: jobDescription.id,
      status: 'pending',
    })
    .select('id')
    .single();

  if (createError || !created) {
    return { generationId: null, error: createError?.message ?? 'Failed to create generation record.' };
  }

  return { generationId: created.id, error: null };
}

/**
 * Re-reads the persisted generation status. The edge function writes
 * status/result to the database before it returns, so a failed or timed-out
 * invoke does not necessarily mean the job failed. Treat the database as the
 * source of truth when the transport layer reports an error.
 */
async function reconcileTailoredResumeStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  generationId: string,
  userId: string
): Promise<TailoredResumeGenerationStatus | null> {
  const { data, error } = await supabase
    .from('tailored_resume_generations')
    .select('status')
    .eq('id', generationId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data.status as TailoredResumeGenerationStatus;
}

export async function runTailoredResumeGeneration(
  projectId: string
): Promise<{
  success: boolean;
  status?: TailoredResumeGenerationStatus;
  error: string | null;
}> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: project, error: projectError } = await supabase
    .from('job_prep_projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (projectError || !project) {
    return {
      success: false,
      error: 'Project not found or you do not have permission to access it.',
    };
  }

  const { generationId, error: ensureError } = await ensureTailoredResumeGeneration(
    supabase,
    user.id,
    projectId
  );

  if (ensureError || !generationId) {
    return { success: false, error: ensureError ?? 'Failed to prepare tailored résumé generation.' };
  }

  const { data: generation, error: generationError } = await supabase
    .from('tailored_resume_generations')
    .select('id, status')
    .eq('id', generationId)
    .eq('user_id', user.id)
    .single();

  if (generationError || !generation) {
    return { success: false, error: 'Tailored résumé generation record not found.' };
  }

  if (generation.status === 'processing') {
    return { success: true, status: 'processing', error: null };
  }

  if (generation.status === 'completed') {
    return { success: true, status: 'completed', error: null };
  }

  if (generation.status === 'failed') {
    const { error: resetError } = await supabase
      .from('tailored_resume_generations')
      .update({
        status: 'pending',
        error_message: null,
        result: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', generation.id)
      .eq('user_id', user.id);

    if (resetError) {
      return { success: false, error: resetError.message };
    }
  }

  if (generation.status !== 'pending' && generation.status !== 'failed') {
    return {
      success: false,
      error: `Generation cannot be run. Current status: ${generation.status}`,
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke(
      'ai_run_job_prep_tailored_resume',
      {
        body: { generation_id: generation.id },
      }
    );

    if (error) {
      const reconciledStatus = await reconcileTailoredResumeStatus(
        supabase,
        generation.id,
        user.id
      );

      if (reconciledStatus === 'completed' || reconciledStatus === 'processing') {
        console.info('[tailored-resume] invoke error reconciled from database', {
          generationId: generation.id,
          projectId,
          reconciledStatus,
          invokeError: error.message,
        });
        revalidatePath(`/job-prep/${projectId}`);
        revalidatePath('/job-prep');
        return { success: true, status: reconciledStatus, error: null };
      }

      console.error('[tailored-resume] invoke error, no persisted result', {
        generationId: generation.id,
        projectId,
        reconciledStatus,
        invokeError: error.message,
      });
      return {
        success: false,
        error: error.message || 'Failed to generate tailored résumé',
      };
    }

    revalidatePath(`/job-prep/${projectId}`);
    revalidatePath('/job-prep');

    return {
      success: true,
      status: (data?.status as TailoredResumeGenerationStatus) || 'completed',
      error: null,
    };
  } catch (invokeError) {
    const reconciledStatus = await reconcileTailoredResumeStatus(
      supabase,
      generation.id,
      user.id
    );

    if (reconciledStatus === 'completed' || reconciledStatus === 'processing') {
      console.info('[tailored-resume] invoke threw, reconciled from database', {
        generationId: generation.id,
        projectId,
        reconciledStatus,
        invokeError:
          invokeError instanceof Error ? invokeError.message : String(invokeError),
      });
      revalidatePath(`/job-prep/${projectId}`);
      revalidatePath('/job-prep');
      return { success: true, status: reconciledStatus, error: null };
    }

    console.error('[tailored-resume] invoke threw, no persisted result', {
      generationId: generation.id,
      projectId,
      reconciledStatus,
      invokeError:
        invokeError instanceof Error ? invokeError.message : String(invokeError),
    });
    return {
      success: false,
      error: 'Failed to connect to AI service. Please try again.',
    };
  }
}

export async function retryTailoredResumeGeneration(
  projectId: string
): Promise<{
  success: boolean;
  status?: TailoredResumeGenerationStatus;
  error: string | null;
}> {
  const user = await requireUser();
  const supabase = await createClient();

  const { generationId, error: ensureError } = await ensureTailoredResumeGeneration(
    supabase,
    user.id,
    projectId
  );

  if (ensureError || !generationId) {
    return { success: false, error: ensureError ?? 'Failed to prepare tailored résumé generation.' };
  }

  const { data: generation, error: generationError } = await supabase
    .from('tailored_resume_generations')
    .select('id, status')
    .eq('id', generationId)
    .eq('user_id', user.id)
    .single();

  if (generationError || !generation) {
    return { success: false, error: 'Tailored résumé generation record not found.' };
  }

  if (generation.status === 'processing') {
    return { success: true, status: 'processing', error: null };
  }

  if (generation.status === 'completed' || generation.status === 'failed') {
    const { error: resetError } = await supabase
      .from('tailored_resume_generations')
      .update({
        status: 'pending',
        error_message: null,
        result: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', generation.id)
      .eq('user_id', user.id);

    if (resetError) {
      return { success: false, error: resetError.message };
    }
  }

  return runTailoredResumeGeneration(projectId);
}

async function ensureInterviewQuestionGeneration(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  projectId: string
): Promise<{ generationId: string | null; error: string | null }> {
  const { data: existing, error: existingError } = await supabase
    .from('interview_question_generations')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingError) {
    return { generationId: null, error: existingError.message };
  }

  if (existing) {
    return { generationId: existing.id, error: null };
  }

  const { data: project, error: projectError } = await supabase
    .from('job_prep_projects')
    .select(`
      id,
      resume:resumes(id),
      job_description:job_descriptions(id),
      analysis:resume_job_analyses(id, status)
    `)
    .eq('id', projectId)
    .eq('user_id', userId)
    .single();

  if (projectError || !project) {
    return { generationId: null, error: 'Project not found for interview question generation.' };
  }

  const resume = Array.isArray(project.resume) ? project.resume[0] : project.resume;
  const jobDescription = Array.isArray(project.job_description)
    ? project.job_description[0]
    : project.job_description;
  const analysis = Array.isArray(project.analysis) ? project.analysis[0] : project.analysis;

  if (!resume?.id || !jobDescription?.id) {
    return {
      generationId: null,
      error: 'Résumé and job description are required before generating interview questions.',
    };
  }

  if (!analysis?.id || analysis.status !== 'completed') {
    return {
      generationId: null,
      error: 'Complete fit analysis before generating interview questions.',
    };
  }

  const { data: created, error: createError } = await supabase
    .from('interview_question_generations')
    .insert({
      user_id: userId,
      project_id: projectId,
      analysis_id: analysis.id,
      resume_id: resume.id,
      job_description_id: jobDescription.id,
      status: 'pending',
    })
    .select('id')
    .single();

  if (createError || !created) {
    return {
      generationId: null,
      error: createError?.message ?? 'Failed to create interview question generation record.',
    };
  }

  return { generationId: created.id, error: null };
}

export async function runInterviewQuestionGeneration(
  projectId: string
): Promise<{
  success: boolean;
  status?: InterviewQuestionGenerationStatus;
  error: string | null;
}> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: project, error: projectError } = await supabase
    .from('job_prep_projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (projectError || !project) {
    return {
      success: false,
      error: 'Project not found or you do not have permission to access it.',
    };
  }

  const { generationId, error: ensureError } = await ensureInterviewQuestionGeneration(
    supabase,
    user.id,
    projectId
  );

  if (ensureError || !generationId) {
    return {
      success: false,
      error: ensureError ?? 'Failed to prepare interview question generation.',
    };
  }

  const { data: generation, error: generationError } = await supabase
    .from('interview_question_generations')
    .select('id, status')
    .eq('id', generationId)
    .eq('user_id', user.id)
    .single();

  if (generationError || !generation) {
    return { success: false, error: 'Interview question generation record not found.' };
  }

  if (generation.status === 'completed') {
    return { success: true, status: 'completed', error: null };
  }

  if (generation.status === 'processing' || generation.status === 'failed') {
    const { error: resetError } = await supabase
      .from('interview_question_generations')
      .update({
        status: 'pending',
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', generation.id)
      .eq('user_id', user.id);

    if (resetError) {
      return { success: false, error: resetError.message };
    }
  }

  if (generation.status !== 'pending' && generation.status !== 'failed' && generation.status !== 'processing') {
    return {
      success: false,
      error: `Generation cannot be run. Current status: ${generation.status}`,
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke(
      'ai_run_job_prep_interview_questions',
      {
        body: { generation_id: generation.id },
      }
    );

    if (error) {
      return {
        success: false,
        error: await parseEdgeFunctionError(
          error,
          data,
          'Failed to generate interview questions'
        ),
      };
    }

    revalidatePath(`/job-prep/${projectId}`);
    revalidatePath('/job-prep');

    return {
      success: true,
      status: (data?.status as InterviewQuestionGenerationStatus) || 'completed',
      error: null,
    };
  } catch (invokeError) {
    return {
      success: false,
      error: await parseEdgeFunctionError(
        invokeError,
        null,
        'Failed to connect to AI service. Please try again.'
      ),
    };
  }
}

export async function retryInterviewQuestionGeneration(
  projectId: string
): Promise<{
  success: boolean;
  status?: InterviewQuestionGenerationStatus;
  error: string | null;
}> {
  const user = await requireUser();
  const supabase = await createClient();

  const { generationId, error: ensureError } = await ensureInterviewQuestionGeneration(
    supabase,
    user.id,
    projectId
  );

  if (ensureError || !generationId) {
    return {
      success: false,
      error: ensureError ?? 'Failed to prepare interview question generation.',
    };
  }

  const { data: generation, error: generationError } = await supabase
    .from('interview_question_generations')
    .select('id, status')
    .eq('id', generationId)
    .eq('user_id', user.id)
    .single();

  if (generationError || !generation) {
    return { success: false, error: 'Interview question generation record not found.' };
  }

  if (generation.status === 'processing' || generation.status === 'completed' || generation.status === 'failed') {
    const { error: resetError } = await supabase
      .from('interview_question_generations')
      .update({
        status: 'pending',
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', generation.id)
      .eq('user_id', user.id);

    if (resetError) {
      return { success: false, error: resetError.message };
    }
  }

  return runInterviewQuestionGeneration(projectId);
}
