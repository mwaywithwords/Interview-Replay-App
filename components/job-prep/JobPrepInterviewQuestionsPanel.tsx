'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getJobPrepProject,
  retryInterviewQuestionGeneration,
  runInterviewQuestionGeneration,
} from '@/app/actions/job-prep';
import { JobPrepInterviewQuestionsResults } from '@/components/job-prep/JobPrepInterviewQuestionsResults';
import {
  describeInterviewQuestionGeneration,
  describeInterviewQuestionGenerationProgress,
  describeInterviewQuestionTopics,
} from '@/lib/job-prep/interview-questions';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageCircleQuestion,
  RefreshCw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import type { JobPrepProjectWithDetails } from '@/types';
import { toast } from 'sonner';

interface JobPrepInterviewQuestionsPanelProps {
  projectId: string;
  initialProject: JobPrepProjectWithDetails;
  showResults?: boolean;
  onProjectChange?: (project: JobPrepProjectWithDetails) => void;
  fitAnalysisComplete?: boolean;
}

export function JobPrepInterviewQuestionsPanel({
  projectId,
  initialProject,
  showResults = true,
  onProjectChange,
  fitAnalysisComplete = false,
}: JobPrepInterviewQuestionsPanelProps) {
  const [project, setProject] = useState(initialProject);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const generation = project.interview_question_generation;
  const questions = useMemo(
    () => project.interview_questions ?? [],
    [project.interview_questions]
  );

  const refreshProject = useCallback(async () => {
    const { project: refreshedProject, error: fetchError } =
      await getJobPrepProject(projectId);

    if (fetchError) {
      setError(fetchError);
      return;
    }

    if (refreshedProject) {
      setProject(refreshedProject);
      onProjectChange?.(refreshedProject);
    }
  }, [projectId, onProjectChange]);

  const setOptimisticProcessingState = useCallback(() => {
    setProject((current) => {
      const baseGeneration = current.interview_question_generation ?? {
        id: 'optimistic',
        user_id: current.user_id,
        project_id: current.id,
        analysis_id: current.analysis?.id ?? '',
        resume_id: current.resume?.id ?? '',
        job_description_id: current.job_description?.id ?? '',
        status: 'processing' as const,
        error_message: null,
        provider: null,
        model: null,
        created_at: current.created_at,
        updated_at: current.updated_at,
      };

      const nextProject: JobPrepProjectWithDetails = {
        ...current,
        interview_question_generation: {
          ...baseGeneration,
          status: 'processing',
          error_message: null,
        },
        interview_questions: [],
      };

      onProjectChange?.(nextProject);
      return nextProject;
    });
  }, [onProjectChange]);

  useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

  useEffect(() => {
    if (generation?.status !== 'processing') {
      return;
    }

    const interval = setInterval(() => {
      void refreshProject();
    }, 2000);

    return () => clearInterval(interval);
  }, [generation?.status, refreshProject]);

  async function handleGenerate() {
    setIsStarting(true);
    setError(null);
    toast.success('Generating interview questions');

    setOptimisticProcessingState();

    try {
      const result = await runInterviewQuestionGeneration(projectId);

      if (result.error || !result.success) {
        setError(result.error || 'Failed to generate interview questions');
        toast.error('Generation failed', {
          description: result.error || 'Unknown error',
        });
        await refreshProject();
        return;
      }

      await refreshProject();
      if (result.status === 'completed') {
        toast.success('Interview questions are ready');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      toast.error('Failed to generate interview questions');
      await refreshProject();
    } finally {
      setIsStarting(false);
    }
  }

  async function handleRetry() {
    setIsRetrying(true);
    setError(null);
    toast.success('Retrying interview question generation');

    setOptimisticProcessingState();

    try {
      const result = await retryInterviewQuestionGeneration(projectId);

      if (result.error || !result.success) {
        setError(result.error || 'Failed to retry generation');
        toast.error('Retry failed', {
          description: result.error || 'Unknown error',
        });
        await refreshProject();
        return;
      }

      await refreshProject();
      if (result.status === 'completed') {
        toast.success('Interview questions are ready');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      toast.error('Failed to retry generation');
      await refreshProject();
    } finally {
      setIsRetrying(false);
    }
  }

  const isProcessing =
    generation?.status === 'processing' || isStarting || isRetrying;
  const isCompleted =
    generation?.status === 'completed' && questions.length > 0 && !isProcessing;
  const isFailed = generation?.status === 'failed' && !isProcessing;
  const isPending = !generation || generation.status === 'pending';

  return (
    <div className="space-y-5">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isPending && !isStarting && (
        <div className="space-y-4 rounded-3xl border border-border/70 bg-background/55 p-5 shadow-[var(--shadow-soft)]">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageCircleQuestion className="h-5 w-5 text-primary" />
              <h4 className="text-base font-semibold tracking-[-0.02em] text-foreground">
                Interview Questions
              </h4>
            </div>
            <p className="text-sm font-medium leading-6 text-muted-foreground">
              {describeInterviewQuestionGeneration()}
            </p>
            <p className="text-xs font-medium text-muted-foreground">
              {describeInterviewQuestionTopics()}
            </p>
            {!fitAnalysisComplete && (
              <p className="text-xs font-medium text-muted-foreground">
                Run fit analysis first — it is required for question generation.
              </p>
            )}
          </div>
          <PrimaryButton
            onClick={handleGenerate}
            disabled={isProcessing || !fitAnalysisComplete}
            className="w-full rounded-full"
          >
            <Sparkles className="h-4 w-4" />
            Generate Personalized Questions
          </PrimaryButton>
        </div>
      )}

      {isProcessing && (
        <div className="space-y-4 rounded-3xl border border-border/70 bg-background/55 p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <MessageCircleQuestion className="h-5 w-5 text-primary" />
                <h4 className="text-base font-semibold tracking-[-0.02em] text-foreground">
                  Generating questions...
                </h4>
              </div>
              <p className="mt-1 text-sm font-medium leading-6 text-muted-foreground">
                {describeInterviewQuestionGenerationProgress()}
              </p>
            </div>
            <Badge variant="info" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Running
            </Badge>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
        </div>
      )}

      {isFailed && (
        <div className="space-y-4 rounded-3xl border border-destructive/25 bg-destructive/[0.04] p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1">
              <h4 className="text-base font-semibold tracking-[-0.02em] text-foreground">
                Generation failed
              </h4>
              <p className="mt-1 text-sm font-medium leading-6 text-muted-foreground">
                {generation?.error_message ||
                  'ReplayAI could not generate interview questions.'}
              </p>
            </div>
          </div>
          <SecondaryButton
            onClick={handleRetry}
            disabled={isRetrying}
            variant="outline"
            className="rounded-full"
          >
            {isRetrying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Retry generation
          </SecondaryButton>
        </div>
      )}

      {isCompleted && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/55 px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm font-semibold text-foreground">
                {questions.length} interview questions ready
              </span>
            </div>
            <SecondaryButton
              onClick={handleRetry}
              disabled={isRetrying || isProcessing}
              size="sm"
              variant="outline"
              className="rounded-full"
            >
              {isRetrying ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Regenerate
            </SecondaryButton>
          </div>
          {showResults && <JobPrepInterviewQuestionsResults questions={questions} />}
        </div>
      )}

      {showResults &&
        generation?.status === 'completed' &&
        questions.length === 0 &&
        !isProcessing && (
          <div className="rounded-3xl border border-dashed border-border/80 bg-muted/30 px-6 py-10 text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <h4 className="text-base font-semibold text-foreground">
              Interview questions unavailable
            </h4>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              Generation completed but no questions were saved. Try generating again.
            </p>
            <SecondaryButton
              onClick={handleRetry}
              disabled={isRetrying}
              variant="outline"
              className="mt-5 rounded-full"
            >
              {isRetrying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Retry generation
            </SecondaryButton>
          </div>
        )}
    </div>
  );
}
