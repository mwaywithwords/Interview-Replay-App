'use server';

import { revalidatePath } from 'next/cache';
import { createClient, requireUser } from '@/lib/supabase/server';
import { createSession } from '@/app/actions/sessions';
import { createCompany } from '@/app/actions/companies';
import type {
  InterviewAnswerAttempt,
  InterviewAnswerAttemptWithDetails,
  InterviewQuestion,
  InterviewSession,
  RecordingType,
} from '@/types';

function buildPracticePrompt(question: InterviewQuestion): string {
  return [
    `Interview question: ${question.question_text}`,
    '',
    `Question type: ${question.question_type.replace(/_/g, ' ')}`,
    `Difficulty: ${question.difficulty}`,
    '',
    'What a strong answer should include:',
    question.what_good_answer_should_include,
    '',
    `Related résumé section: ${question.related_resume_section}`,
    `Related job requirement: ${question.related_job_requirement}`,
  ].join('\n');
}

function truncateTitle(text: string, maxLength = 80): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 1)}…`;
}

async function resolveCompanyId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  companyName: string | null | undefined
): Promise<{ companyId: string | null; error: string | null }> {
  const name = companyName?.trim() || 'Interview Practice';

  const { data: existing, error: existingError } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', userId)
    .ilike('name', name)
    .maybeSingle();

  if (existingError) {
    return { companyId: null, error: existingError.message };
  }

  if (existing?.id) {
    return { companyId: existing.id, error: null };
  }

  const { company, error } = await createCompany({ name });
  if (error || !company) {
    return { companyId: null, error: error ?? 'Failed to create company for practice session.' };
  }

  return { companyId: company.id, error: null };
}

async function findReusablePracticeSession(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  questionId: string,
  recordingType: RecordingType
): Promise<{ attempt: InterviewAnswerAttempt | null; session: InterviewSession | null }> {
  const { data, error } = await supabase
    .from('interview_answer_attempts')
    .select(`
      *,
      session:sessions(*)
    `)
    .eq('question_id', questionId)
    .eq('user_id', userId)
    .not('session_id', 'is', null)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return { attempt: null, session: null };
  }

  for (const row of data) {
    const session = Array.isArray(row.session) ? row.session[0] : row.session;
    if (!session) {
      continue;
    }

    const hasRecording = Boolean(session.audio_storage_path || session.video_storage_path);
    const isDraft = session.status === 'draft';
    const matchesRecordingType = session.recording_type === recordingType;

    if (!hasRecording && isDraft && matchesRecordingType) {
      return {
        attempt: row as InterviewAnswerAttempt,
        session: session as InterviewSession,
      };
    }
  }

  return { attempt: null, session: null };
}

export async function startInterviewAnswerPractice(
  questionId: string,
  recordingType: RecordingType = 'audio'
): Promise<{
  sessionId: string | null;
  attemptId: string | null;
  reused: boolean;
  error: string | null;
}> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: question, error: questionError } = await supabase
    .from('interview_questions')
    .select('*')
    .eq('id', questionId)
    .eq('user_id', user.id)
    .single();

  if (questionError || !question) {
    return {
      sessionId: null,
      attemptId: null,
      reused: false,
      error: 'Interview question not found.',
    };
  }

  const typedQuestion = question as InterviewQuestion;

  const reusable = await findReusablePracticeSession(
    supabase,
    user.id,
    questionId,
    recordingType
  );

  if (reusable.attempt?.session_id && reusable.session) {
    return {
      sessionId: reusable.session.id,
      attemptId: reusable.attempt.id,
      reused: true,
      error: null,
    };
  }

  const { data: project, error: projectError } = await supabase
    .from('job_prep_projects')
    .select(`
      id,
      title,
      job_description:job_descriptions(company_name, role_title)
    `)
    .eq('id', typedQuestion.project_id)
    .eq('user_id', user.id)
    .single();

  if (projectError || !project) {
    return {
      sessionId: null,
      attemptId: null,
      reused: false,
      error: 'Job prep project not found.',
    };
  }

  const jobDescription = Array.isArray(project.job_description)
    ? project.job_description[0]
    : project.job_description;

  const { companyId, error: companyError } = await resolveCompanyId(
    supabase,
    user.id,
    jobDescription?.company_name
  );

  if (companyError || !companyId) {
    return {
      sessionId: null,
      attemptId: null,
      reused: false,
      error: companyError ?? 'Failed to resolve company for practice session.',
    };
  }

  const roleTitle = jobDescription?.role_title?.trim();
  const sessionTitle = roleTitle
    ? `Practice: ${truncateTitle(typedQuestion.question_text)} (${roleTitle})`
    : `Practice: ${truncateTitle(typedQuestion.question_text)}`;

  const { session, error: sessionError } = await createSession({
    title: sessionTitle,
    session_type: 'interview',
    recording_type: recordingType,
    prompt: buildPracticePrompt(typedQuestion),
    company_id: companyId,
    job_prep: {
      project_id: typedQuestion.project_id,
      question_id: typedQuestion.id,
    },
  });

  if (sessionError || !session) {
    return {
      sessionId: null,
      attemptId: null,
      reused: false,
      error: sessionError ?? 'Failed to create practice session.',
    };
  }

  const { data: attempt, error: attemptError } = await supabase
    .from('interview_answer_attempts')
    .insert({
      user_id: user.id,
      project_id: typedQuestion.project_id,
      question_id: typedQuestion.id,
      session_id: session.id,
    })
    .select('id')
    .single();

  if (attemptError || !attempt) {
    await supabase.from('sessions').delete().eq('id', session.id).eq('user_id', user.id);
    return {
      sessionId: null,
      attemptId: null,
      reused: false,
      error: attemptError?.message ?? 'Failed to create answer attempt record.',
    };
  }

  const answerReviewPath = `/job-prep/${typedQuestion.project_id}/answers/${attempt.id}`;
  const { error: metadataError } = await supabase
    .from('sessions')
    .update({
      metadata: {
        ...session.metadata,
        interview_answer_attempt_id: attempt.id,
        answer_review_path: answerReviewPath,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.id)
    .eq('user_id', user.id);

  if (metadataError) {
    return {
      sessionId: null,
      attemptId: null,
      reused: false,
      error: metadataError.message,
    };
  }

  revalidatePath(`/job-prep/${typedQuestion.project_id}`);
  revalidatePath('/sessions');

  return {
    sessionId: session.id,
    attemptId: attempt.id,
    reused: false,
    error: null,
  };
}

export async function syncInterviewAnswerAttemptFromSession(
  sessionId: string
): Promise<{ error: string | null }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single();

  if (sessionError || !session) {
    return { error: sessionError?.message ?? 'Session not found.' };
  }

  const metadata = session.metadata as Record<string, unknown> | null;
  const attemptId =
    typeof metadata?.interview_answer_attempt_id === 'string'
      ? metadata.interview_answer_attempt_id
      : null;

  if (!attemptId) {
    return { error: null };
  }

  const durationSeconds =
    session.recording_type === 'video'
      ? session.video_duration_seconds
      : session.audio_duration_seconds;

  const { error: updateError } = await supabase
    .from('interview_answer_attempts')
    .update({
      duration_seconds: durationSeconds,
      updated_at: new Date().toISOString(),
    })
    .eq('id', attemptId)
    .eq('user_id', user.id)
    .eq('session_id', sessionId);

  if (updateError) {
    return { error: updateError.message };
  }

  const projectId =
    typeof metadata?.job_prep_project_id === 'string' ? metadata.job_prep_project_id : null;

  if (projectId) {
    revalidatePath(`/job-prep/${projectId}`);
    revalidatePath(`/job-prep/${projectId}/answers/${attemptId}`);
  }

  return { error: null };
}

export async function getInterviewAnswerAttempt(
  attemptId: string
): Promise<{ attempt: InterviewAnswerAttemptWithDetails | null; error: string | null }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('interview_answer_attempts')
    .select(`
      *,
      question:interview_questions(*),
      session:sessions(*)
    `)
    .eq('id', attemptId)
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return { attempt: null, error: error?.message ?? 'Answer attempt not found.' };
  }

  const question = Array.isArray(data.question) ? data.question[0] : data.question;
  const session = Array.isArray(data.session) ? data.session[0] : data.session;

  return {
    attempt: {
      ...(data as InterviewAnswerAttempt),
      question: question ?? null,
      session: session ?? null,
    },
    error: null,
  };
}

export async function getLatestAnswerAttemptForQuestion(
  questionId: string
): Promise<{ attempt: InterviewAnswerAttempt | null; error: string | null }> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('interview_answer_attempts')
    .select('*')
    .eq('question_id', questionId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { attempt: null, error: error.message };
  }

  return { attempt: (data as InterviewAnswerAttempt) ?? null, error: null };
}
