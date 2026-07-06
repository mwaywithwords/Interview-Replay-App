'use server';

import { revalidatePath } from 'next/cache';
import { createClient, requireUser } from '@/lib/supabase/server';
import type {
  CreateJobPrepProjectInput,
  JobPrepProject,
  JobPrepProjectWithDetails,
  ResumeJobAnalysisStatus,
} from '@/types';

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
    .select(`
      *,
      job_description:job_descriptions(*),
      resume:resumes(*),
      analysis:resume_job_analyses(*)
    `)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) {
    return { projects: [], error: error.message };
  }

  const projects = (data ?? []).map((row) => {
    const jobDescription = Array.isArray(row.job_description)
      ? row.job_description[0] ?? null
      : row.job_description;
    const resume = Array.isArray(row.resume) ? row.resume[0] ?? null : row.resume;
    const analysis = Array.isArray(row.analysis) ? row.analysis[0] ?? null : row.analysis;

    return {
      ...row,
      job_description: jobDescription,
      resume,
      analysis,
    } as JobPrepProjectWithDetails;
  });

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
    .select(`
      *,
      job_description:job_descriptions(*),
      resume:resumes(*),
      analysis:resume_job_analyses(*)
    `)
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { project: null, error: 'Project not found' };
    }
    return { project: null, error: error.message };
  }

  const jobDescription = Array.isArray(data.job_description)
    ? data.job_description[0] ?? null
    : data.job_description;
  const resume = Array.isArray(data.resume) ? data.resume[0] ?? null : data.resume;
  const analysis = Array.isArray(data.analysis) ? data.analysis[0] ?? null : data.analysis;

  return {
    project: {
      ...data,
      job_description: jobDescription,
      resume,
      analysis,
    } as JobPrepProjectWithDetails,
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
