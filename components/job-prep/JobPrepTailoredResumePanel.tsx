'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getJobPrepProject,
  retryTailoredResumeGeneration,
  runTailoredResumeGeneration,
} from '@/app/actions/job-prep';
import { parseTailoredResumeResult } from '@/lib/job-prep/tailored-resume';
import { JobPrepTailoredResumeResults } from '@/components/job-prep/JobPrepTailoredResumeResults';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import type { JobPrepProjectWithDetails } from '@/types';
import { toast } from 'sonner';

interface JobPrepTailoredResumePanelProps {
  projectId: string;
  initialProject: JobPrepProjectWithDetails;
  showResults?: boolean;
  onProjectChange?: (project: JobPrepProjectWithDetails) => void;
  fitAnalysisComplete?: boolean;
}

export function JobPrepTailoredResumePanel({
  projectId,
  initialProject,
  showResults = true,
  onProjectChange,
  fitAnalysisComplete = false,
}: JobPrepTailoredResumePanelProps) {
  const [project, setProject] = useState(initialProject);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const inFlightRef = useRef(false);

  const generation = project.tailored_resume;
  const parsedResult = useMemo(
    () => parseTailoredResumeResult(generation?.result ?? null),
    [generation?.result]
  );

  const refreshProject = useCallback(async (): Promise<JobPrepProjectWithDetails | null> => {
    const { project: refreshedProject, error: fetchError } =
      await getJobPrepProject(projectId);

    if (fetchError) {
      setError(fetchError);
      return null;
    }

    if (refreshedProject) {
      setProject(refreshedProject);
      onProjectChange?.(refreshedProject);
      return refreshedProject;
    }

    return null;
  }, [projectId, onProjectChange]);

  const setOptimisticProcessingState = useCallback(() => {
    setProject((current) => {
      const baseGeneration = current.tailored_resume ?? {
        id: 'optimistic',
        user_id: current.user_id,
        project_id: current.id,
        resume_id: current.resume?.id ?? '',
        job_description_id: current.job_description?.id ?? '',
        status: 'processing' as const,
        result: null,
        error_message: null,
        provider: null,
        model: null,
        created_at: current.created_at,
        updated_at: current.updated_at,
      };

      const nextProject: JobPrepProjectWithDetails = {
        ...current,
        tailored_resume: {
          ...baseGeneration,
          status: 'processing',
          error_message: null,
          result: null,
        },
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

  async function handleGenerationFailure(errorMessage: string, toastTitle: string) {
    // The database is the source of truth. A failed server action (e.g. a
    // timed-out invoke) can still correspond to a job that is running or has
    // already completed, so re-read status before surfacing a failure.
    const refreshed = await refreshProject();
    const refreshedStatus = refreshed?.tailored_resume?.status;

    if (refreshedStatus === 'completed') {
      setError(null);
      toast.success('Tailored résumé is ready');
      return;
    }

    if (refreshedStatus === 'processing') {
      // Polling (keyed on the processing status) will continue and surface the
      // result when it lands. Do not show a false failure.
      setError(null);
      return;
    }

    setError(errorMessage);
    toast.error(toastTitle, {
      description: errorMessage,
    });
  }

  async function handleGenerate() {
    if (inFlightRef.current) {
      return;
    }
    inFlightRef.current = true;
    setIsStarting(true);
    setError(null);
    toast.success('Generating tailored résumé');

    setOptimisticProcessingState();

    try {
      const result = await runTailoredResumeGeneration(projectId);

      if (result.error || !result.success) {
        await handleGenerationFailure(
          result.error || 'Failed to generate tailored résumé',
          'Generation failed'
        );
        return;
      }

      await refreshProject();
      if (result.status === 'completed') {
        toast.success('Tailored résumé is ready');
      }
    } catch {
      await handleGenerationFailure(
        'An unexpected error occurred. Please try again.',
        'Failed to generate tailored résumé'
      );
    } finally {
      inFlightRef.current = false;
      setIsStarting(false);
    }
  }

  async function handleRetry() {
    if (inFlightRef.current) {
      return;
    }
    inFlightRef.current = true;
    setIsRetrying(true);
    setError(null);
    toast.success('Retrying tailored résumé generation');

    setOptimisticProcessingState();

    try {
      const result = await retryTailoredResumeGeneration(projectId);

      if (result.error || !result.success) {
        await handleGenerationFailure(
          result.error || 'Failed to retry generation',
          'Retry failed'
        );
        return;
      }

      await refreshProject();
      if (result.status === 'completed') {
        toast.success('Tailored résumé is ready');
      }
    } catch {
      await handleGenerationFailure(
        'An unexpected error occurred. Please try again.',
        'Failed to retry generation'
      );
    } finally {
      inFlightRef.current = false;
      setIsRetrying(false);
    }
  }

  const isProcessing =
    generation?.status === 'processing' || isStarting || isRetrying;
  const isCompleted = generation?.status === 'completed' && parsedResult !== null;
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
              <FileText className="h-5 w-5 text-primary" />
              <h4 className="text-base font-semibold tracking-[-0.02em] text-foreground">
                Tailored Résumé
              </h4>
            </div>
            <p className="text-sm font-medium leading-6 text-muted-foreground">
              Reword and prioritize your existing experience for this role using only your
              source résumé and saved profile. Nothing will be invented.
            </p>
            {!fitAnalysisComplete && (
              <p className="text-xs font-medium text-muted-foreground">
                Tip: run fit analysis first for better prioritization.
              </p>
            )}
          </div>
          <PrimaryButton
            onClick={handleGenerate}
            disabled={isProcessing}
            className="w-full rounded-full"
          >
            <Sparkles className="h-4 w-4" />
            Generate Tailored Résumé
          </PrimaryButton>
        </div>
      )}

      {isProcessing && (
        <div className="space-y-4 rounded-3xl border border-border/70 bg-background/55 p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h4 className="text-base font-semibold tracking-[-0.02em] text-foreground">
                  Tailoring résumé...
                </h4>
              </div>
              <p className="mt-1 text-sm font-medium leading-6 text-muted-foreground">
                ReplayAI is rewriting your résumé without adding new facts.
              </p>
            </div>
            <Badge variant="info" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Running
            </Badge>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
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
                  'ReplayAI could not generate a tailored résumé.'}
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

      {isCompleted && parsedResult && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/55 px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm font-semibold text-foreground">
                Tailored résumé ready
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
          {showResults && (
            <JobPrepTailoredResumeResults
              result={parsedResult}
              companyName={project.job_description?.company_name}
              roleTitle={project.job_description?.role_title}
            />
          )}
        </div>
      )}

      {showResults &&
        generation?.status === 'completed' &&
        !parsedResult &&
        !isProcessing && (
          <div className="rounded-3xl border border-dashed border-border/80 bg-muted/30 px-6 py-10 text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <h4 className="text-base font-semibold text-foreground">
              Tailored résumé unavailable
            </h4>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              The saved result could not be parsed. Try generating again.
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
