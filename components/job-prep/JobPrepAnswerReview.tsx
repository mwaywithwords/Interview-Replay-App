'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AudioPlayer } from '@/components/AudioPlayer';
import { VideoPlayer, type MediaPlayerRef } from '@/components/VideoPlayer';
import { TranscriptEditor } from '@/components/sessions/TranscriptEditor';
import { AIActionsPanel } from '@/components/sessions/AIActionsPanel';
import { PracticeAnswerButton } from '@/components/job-prep/PracticeAnswerButton';
import { Badge } from '@/components/ui/badge';
import { SecondaryButton } from '@/components/ui/button';
import { SectionCard } from '@/components/layout/SectionCard';
import {
  INTERVIEW_QUESTION_DIFFICULTY_LABELS,
  INTERVIEW_QUESTION_TYPE_LABELS,
} from '@/lib/job-prep/interview-questions';
import type { AIJob, AIOutput, InterviewAnswerAttemptWithDetails } from '@/types';
import {
  ArrowLeft,
  Briefcase,
  FileText,
  Lightbulb,
  MessageCircleQuestion,
  Mic,
  Sparkles,
  Video,
} from 'lucide-react';

interface JobPrepAnswerReviewProps {
  attempt: InterviewAnswerAttemptWithDetails;
  initialAIJobs: AIJob[];
  initialAIOutputs: AIOutput[];
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
      {children}
    </p>
  );
}

export function JobPrepAnswerReview({
  attempt,
  initialAIJobs,
  initialAIOutputs,
}: JobPrepAnswerReviewProps) {
  const mediaPlayerRef = useRef<MediaPlayerRef>(null);
  const [aiOutputs, setAiOutputs] = useState<AIOutput[]>(initialAIOutputs);

  const question = attempt.question;
  const session = attempt.session;
  const projectId = attempt.project_id;
  const jobPrepPath = `/job-prep/${projectId}`;

  const handleAIOutputsChange = useCallback((outputsMap: Record<string, AIOutput>) => {
    setAiOutputs(Object.values(outputsMap));
  }, []);

  const latestTranscriptOutput = useMemo(
    () =>
      aiOutputs
        .filter((output) => output.output_type === 'transcript')
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0] ?? null,
    [aiOutputs]
  );

  if (!question) {
    return (
      <div className="rounded-3xl border border-dashed border-border/80 bg-muted/30 px-6 py-10 text-center">
        <MessageCircleQuestion className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Question unavailable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The linked interview question could not be loaded.
        </p>
        <SecondaryButton asChild className="mt-5 rounded-full" variant="outline">
          <Link href={jobPrepPath}>Back to Job Prep</Link>
        </SecondaryButton>
      </div>
    );
  }

  const isAudioSession = session?.recording_type === 'audio';
  const isVideoSession = session?.recording_type === 'video';
  const hasAudioRecording = Boolean(session?.audio_storage_path);
  const hasVideoRecording = Boolean(session?.video_storage_path);
  const hasRecording = hasAudioRecording || hasVideoRecording;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6">
        <Link
          href={jobPrepPath}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Job Prep
        </Link>
      </div>

      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="rounded-full capitalize">
            {INTERVIEW_QUESTION_TYPE_LABELS[question.question_type]}
          </Badge>
          <Badge variant="secondary" className="rounded-full capitalize">
            {INTERVIEW_QUESTION_DIFFICULTY_LABELS[question.difficulty]}
          </Badge>
          {attempt.duration_seconds ? (
            <Badge variant="outline" className="rounded-full">
              {Math.max(1, Math.round(attempt.duration_seconds / 60))} min recorded
            </Badge>
          ) : null}
        </div>
        <h1 className="text-3xl font-semibold tracking-[-0.045em] text-foreground md:text-4xl">
          Answer review
        </h1>
        <p className="max-w-3xl text-base font-medium leading-7 text-foreground">
          {question.question_text}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,34%)] xl:items-start">
        <div className="space-y-6">
          <SectionCard title="Your recording">
            {!session || !hasRecording ? (
              <div className="space-y-4 rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6">
                <p className="text-sm font-medium leading-6 text-muted-foreground">
                  No recording is linked to this answer yet. Start a practice session to
                  record your response with the existing ReplayAI recorder.
                </p>
                <PracticeAnswerButton question={question} />
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border/45 bg-background/55">
                {isAudioSession && hasAudioRecording && (
                  <AudioPlayer ref={mediaPlayerRef} sessionId={session.id} hasAudio={true} />
                )}
                {isVideoSession && hasVideoRecording && (
                  <VideoPlayer
                    ref={mediaPlayerRef}
                    sessionId={session.id}
                    hasVideo={true}
                    mediaAssetKey={session.video_storage_path}
                    compact
                  />
                )}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Transcript">
            {session ? (
              <TranscriptEditor
                sessionId={session.id}
                refreshKey={latestTranscriptOutput?.id ?? null}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Record an answer to generate or edit a transcript.
              </p>
            )}
          </SectionCard>

          <SectionCard title="Answer guidance">
            <div className="space-y-4">
              <div className="rounded-xl border border-border/40 bg-muted/20 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <SectionLabel>What a strong answer should include</SectionLabel>
                </div>
                <p className="text-sm font-medium leading-6 text-muted-foreground">
                  {question.what_good_answer_should_include}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border/35 bg-background/45 p-3">
                  <div className="mb-1.5 flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <SectionLabel>Related résumé section</SectionLabel>
                  </div>
                  <p className="text-sm font-medium leading-6 text-foreground">
                    {question.related_resume_section}
                  </p>
                </div>
                <div className="rounded-xl border border-border/35 bg-background/45 p-3">
                  <div className="mb-1.5 flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                    <SectionLabel>Related job requirement</SectionLabel>
                  </div>
                  <p className="text-sm font-medium leading-6 text-foreground">
                    {question.related_job_requirement}
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6">
          <section className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.14] via-card/80 to-card/60 p-4 shadow-[var(--shadow-card)] ring-1 ring-primary/10 backdrop-blur-xl sm:p-5">
            <div className="relative mb-4 flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/80">
                  Companion
                </p>
                <h2 className="text-base font-semibold tracking-[-0.03em] text-foreground">
                  AI feedback
                </h2>
                <p className="text-xs font-medium text-muted-foreground/85">
                  Transcript, score, and coaching from your recording.
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 shadow-[0_0_20px_-6px_var(--primary)]">
                <Sparkles className="h-4 w-4 shrink-0 text-primary" />
              </div>
            </div>

            {session ? (
              <AIActionsPanel
                sessionId={session.id}
                initialJobs={initialAIJobs}
                onOutputsChange={handleAIOutputsChange}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Record an answer to unlock AI feedback.
              </p>
            )}
          </section>

          <div className="rounded-2xl border border-border/70 bg-background/55 p-4">
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              Want another take on this question?
            </p>
            <div className="flex flex-col gap-2">
              <PracticeAnswerButton question={question} />
              {session && (
                <SecondaryButton asChild variant="outline" className="rounded-full">
                  <Link href={`/sessions/${session.id}`}>
                    {isVideoSession ? (
                      <Video className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                    Open full session
                  </Link>
                </SecondaryButton>
              )}
              <SecondaryButton asChild variant="outline" className="rounded-full">
                <Link href={jobPrepPath}>Return to Job Prep</Link>
              </SecondaryButton>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
