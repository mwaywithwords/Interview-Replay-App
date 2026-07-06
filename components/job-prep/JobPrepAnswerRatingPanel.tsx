'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getInterviewAnswerAttempt,
  retryInterviewAnswerRating,
  runInterviewAnswerRating,
} from '@/app/actions/job-prep-answers';
import { JobPrepAnswerRatingResults } from '@/components/job-prep/JobPrepAnswerRatingResults';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { parseInterviewAnswerRatingResult } from '@/lib/job-prep/answer-rating';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import type { InterviewAnswerAttemptWithDetails } from '@/types';
import { toast } from 'sonner';

interface JobPrepAnswerRatingPanelProps {
  attemptId: string;
  initialAttempt: InterviewAnswerAttemptWithDetails;
  hasRecording: boolean;
  hasTranscript: boolean;
  showResults?: boolean;
  onAttemptChange?: (attempt: InterviewAnswerAttemptWithDetails) => void;
}

export function JobPrepAnswerRatingPanel({
  attemptId,
  initialAttempt,
  hasRecording,
  hasTranscript,
  showResults = true,
  onAttemptChange,
}: JobPrepAnswerRatingPanelProps) {
  const [attempt, setAttempt] = useState(initialAttempt);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const parsedRating = useMemo(
    () => parseInterviewAnswerRatingResult(attempt.rating_result),
    [attempt.rating_result]
  );

  const refreshAttempt = useCallback(async () => {
    const { attempt: refreshedAttempt, error: fetchError } =
      await getInterviewAnswerAttempt(attemptId);

    if (fetchError) {
      setError(fetchError);
      return;
    }

    if (refreshedAttempt) {
      setAttempt(refreshedAttempt);
      onAttemptChange?.(refreshedAttempt);
    }
  }, [attemptId, onAttemptChange]);

  const setOptimisticProcessingState = useCallback(() => {
    setAttempt((current) => {
      const nextAttempt: InterviewAnswerAttemptWithDetails = {
        ...current,
        rating_status: 'processing',
        rating_error_message: null,
        rating_result: null,
      };
      onAttemptChange?.(nextAttempt);
      return nextAttempt;
    });
  }, [onAttemptChange]);

  useEffect(() => {
    setAttempt(initialAttempt);
  }, [initialAttempt]);

  useEffect(() => {
    if (attempt.rating_status !== 'processing') {
      return;
    }

    const interval = setInterval(() => {
      void refreshAttempt();
    }, 2000);

    return () => clearInterval(interval);
  }, [attempt.rating_status, refreshAttempt]);

  async function handleRate() {
    setIsStarting(true);
    setError(null);
    toast.success('Rating your answer');

    setOptimisticProcessingState();

    try {
      const result = await runInterviewAnswerRating(attemptId);

      if (result.error || !result.success) {
        setError(result.error || 'Failed to rate answer');
        toast.error('Rating failed', {
          description: result.error || 'Unknown error',
        });
        await refreshAttempt();
        return;
      }

      await refreshAttempt();
      if (result.status === 'completed') {
        toast.success('Answer rating is ready');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      toast.error('Failed to rate answer');
      await refreshAttempt();
    } finally {
      setIsStarting(false);
    }
  }

  async function handleRetry() {
    setIsRetrying(true);
    setError(null);
    toast.success('Retrying answer rating');

    setOptimisticProcessingState();

    try {
      const result = await retryInterviewAnswerRating(attemptId);

      if (result.error || !result.success) {
        setError(result.error || 'Failed to retry rating');
        toast.error('Retry failed', {
          description: result.error || 'Unknown error',
        });
        await refreshAttempt();
        return;
      }

      await refreshAttempt();
      if (result.status === 'completed') {
        toast.success('Answer rating is ready');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      toast.error('Failed to retry rating');
      await refreshAttempt();
    } finally {
      setIsRetrying(false);
    }
  }

  const isProcessing =
    attempt.rating_status === 'processing' || isStarting || isRetrying;
  const isCompleted = attempt.rating_status === 'completed' && parsedRating !== null;
  const isFailed = attempt.rating_status === 'failed' && !isProcessing;
  const isPending = !attempt.rating_status || attempt.rating_status === 'pending';
  const canRate = hasRecording && hasTranscript;

  return (
    <div className="space-y-5">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!canRate && (
        <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4">
          <p className="text-sm font-medium leading-6 text-muted-foreground">
            {!hasRecording
              ? 'Record an answer to unlock AI rating.'
              : 'Add or wait for a transcript before rating your answer.'}
          </p>
        </div>
      )}

      {canRate && isPending && !isStarting && (
        <div className="space-y-4 rounded-3xl border border-border/70 bg-background/55 p-5 shadow-[var(--shadow-soft)]">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h4 className="text-base font-semibold tracking-[-0.02em] text-foreground">
                Rate this answer
              </h4>
            </div>
            <p className="text-sm font-medium leading-6 text-muted-foreground">
              Score your recorded answer against the question, job description, and résumé
              across relevance, structure, clarity, and more.
            </p>
          </div>
          <PrimaryButton
            onClick={handleRate}
            disabled={isProcessing}
            className="w-full rounded-full"
          >
            <Sparkles className="h-4 w-4" />
            Rate My Answer
          </PrimaryButton>
        </div>
      )}

      {canRate && isProcessing && (
        <div className="space-y-4 rounded-3xl border border-border/70 bg-background/55 p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h4 className="text-base font-semibold tracking-[-0.02em] text-foreground">
                  Rating answer...
                </h4>
              </div>
              <p className="mt-1 text-sm font-medium leading-6 text-muted-foreground">
                ReplayAI is scoring your answer against the role and question rubric.
              </p>
            </div>
            <Badge variant="info" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Running
            </Badge>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        </div>
      )}

      {canRate && isFailed && (
        <div className="space-y-4 rounded-3xl border border-destructive/25 bg-destructive/[0.04] p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1">
              <h4 className="text-base font-semibold tracking-[-0.02em] text-foreground">
                Rating failed
              </h4>
              <p className="mt-1 text-sm font-medium leading-6 text-muted-foreground">
                {attempt.rating_error_message ||
                  'ReplayAI could not rate this answer.'}
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
            Retry rating
          </SecondaryButton>
        </div>
      )}

      {canRate && isCompleted && parsedRating && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/55 px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm font-semibold text-foreground">
                Answer rated · {parsedRating.overall_score}/100
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
              Re-rate
            </SecondaryButton>
          </div>
          {showResults && <JobPrepAnswerRatingResults rating={parsedRating} />}
        </div>
      )}

      {showResults &&
        attempt.rating_status === 'completed' &&
        !parsedRating &&
        !isProcessing && (
          <div className="rounded-3xl border border-dashed border-border/80 bg-muted/30 px-6 py-10 text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <h4 className="text-base font-semibold text-foreground">
              Rating unavailable
            </h4>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              The saved rating could not be parsed. Try rating again.
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
              Retry rating
            </SecondaryButton>
          </div>
        )}
    </div>
  );
}
