import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/supabase/server';
import { getInterviewAnswerAttempt } from '@/app/actions/job-prep-answers';
import { getSessionAIJobs, getSessionAIOutputs } from '@/app/actions/ai-jobs';
import { getTranscript } from '@/app/actions/transcripts';
import { AppShell } from '@/components/layout/AppShell';
import { JobPrepAnswerReview } from '@/components/job-prep/JobPrepAnswerReview';
import { SecondaryButton } from '@/components/ui/button';
import type { Metadata } from 'next';

interface JobPrepAnswerReviewPageProps {
  params: Promise<{ id: string; attemptId: string }>;
}

export async function generateMetadata({
  params,
}: JobPrepAnswerReviewPageProps): Promise<Metadata> {
  const { attemptId } = await params;
  const { attempt } = await getInterviewAnswerAttempt(attemptId);
  return {
    title: attempt?.question
      ? `Answer review · ${attempt.question.question_text.slice(0, 48)}`
      : 'Answer review',
  };
}

export default async function JobPrepAnswerReviewPage({
  params,
}: JobPrepAnswerReviewPageProps) {
  const user = await requireUser();
  const { id: projectId, attemptId } = await params;
  const { attempt, error } = await getInterviewAnswerAttempt(attemptId);

  if (error || !attempt || attempt.project_id !== projectId) {
    notFound();
  }

  const sessionId = attempt.session_id;
  const [aiJobsResult, aiOutputsResult, transcriptResult] = sessionId
    ? await Promise.all([
        getSessionAIJobs(sessionId),
        getSessionAIOutputs(sessionId),
        getTranscript(sessionId),
      ])
    : [{ jobs: [] }, { outputs: [] }, { transcript: null, error: null }];

  return (
    <AppShell
      variant="app"
      headerActions={
        <div className="flex items-center gap-3">
          <div className="hidden flex-col items-end md:flex">
            <span className="text-sm font-semibold tracking-[-0.02em] text-foreground">
              {user.email?.split('@')[0]}
            </span>
            <span className="max-w-[220px] truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
          <form action="/auth/signout" method="post">
            <SecondaryButton
              type="submit"
              size="sm"
              variant="outline"
              className="rounded-full border-border/70 bg-background/70 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              Sign Out
            </SecondaryButton>
          </form>
        </div>
      }
    >
      <JobPrepAnswerReview
        attempt={attempt}
        initialAIJobs={aiJobsResult.jobs}
        initialAIOutputs={aiOutputsResult.outputs}
        initialHasTranscript={Boolean(transcriptResult.transcript?.content?.trim())}
      />
    </AppShell>
  );
}
