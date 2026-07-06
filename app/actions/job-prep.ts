'use server';

import { revalidatePath } from 'next/cache';
import { createClient, requireUser } from '@/lib/supabase/server';
import type {
  CreateJobPrepProjectInput,
  JobPrepProject,
  JobPrepProjectWithDetails,
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
