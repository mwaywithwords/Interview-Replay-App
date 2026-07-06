'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getJobPrepProject,
  retryResumeJobAnalysis,
  runResumeJobAnalysis,
} from '@/app/actions/job-prep';
import { parseResumeJobAnalysisSummary } from '@/lib/job-prep/analysis';
import { JobPrepAnalysisResults } from '@/components/job-prep/JobPrepAnalysisResults';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import type { JobPrepProjectWithDetails } from '@/types';
import { toast } from 'sonner';

interface JobPrepAnalysisPanelProps {
  projectId: string;
  initialProject: JobPrepProjectWithDetails;
  showResults?: boolean;
  onProjectChange?: (project: JobPrepProjectWithDetails) => void;
}

export function JobPrepAnalysisPanel({
  projectId,
  initialProject,
  showResults = true,
  onProjectChange,
}: JobPrepAnalysisPanelProps) {
  const [project, setProject] = useState(initialProject);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const analysis = project.analysis;
  const parsedSummary = useMemo(
    () => parseResumeJobAnalysisSummary(analysis?.summary ?? null),
    [analysis?.summary]
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
      if (!current.analysis) {
        return current;
      }

      const nextProject: JobPrepProjectWithDetails = {
        ...current,
        status: 'analyzing',
        analysis: {
          ...current.analysis,
          status: 'processing',
          error_message: null,
          summary: null,
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
    if (analysis?.status !== 'processing') {
      return;
    }

    const interval = setInterval(() => {
      void refreshProject();
    }, 2000);

    return () => clearInterval(interval);
  }, [analysis?.status, refreshProject]);

  async function handleRunAnalysis() {
    setIsStarting(true);
    setError(null);
    toast.success('Analyzing resume fit');

    setOptimisticProcessingState();

    try {
      const result = await runResumeJobAnalysis(projectId);

      if (result.error || !result.success) {
        setError(result.error || 'Failed to run analysis');
        toast.error('Analysis failed', {
          description: result.error || 'Unknown error',
        });
        await refreshProject();
        return;
      }

      await refreshProject();
      if (result.status === 'completed') {
        toast.success('Resume fit analysis is ready');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      toast.error('Failed to analyze resume fit');
      await refreshProject();
    } finally {
      setIsStarting(false);
    }
  }

  async function handleRetryAnalysis() {
    setIsRetrying(true);
    setError(null);
    toast.success('Retrying analysis');

    setOptimisticProcessingState();

    try {
      const result = await retryResumeJobAnalysis(projectId);

      if (result.error || !result.success) {
        setError(result.error || 'Failed to retry analysis');
        toast.error('Retry failed', {
          description: result.error || 'Unknown error',
        });
        await refreshProject();
        return;
      }

      await refreshProject();
      if (result.status === 'completed') {
        toast.success('Resume fit analysis is ready');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      toast.error('Failed to retry analysis');
      await refreshProject();
    } finally {
      setIsRetrying(false);
    }
  }

  const isProcessing =
    analysis?.status === 'processing' || isStarting || isRetrying;
  const isCompleted =
    analysis?.status === 'completed' && parsedSummary !== null && !isProcessing;
  const isFailed = analysis?.status === 'failed' && !isProcessing;
  const isPending = analysis?.status === 'pending';

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
              <Sparkles className="h-5 w-5 text-primary" />
              <h4 className="text-base font-semibold tracking-[-0.02em] text-foreground">
                ReplayAI Resume Fit
              </h4>
            </div>
            <p className="text-sm font-medium leading-6 text-muted-foreground">
              Compare your résumé against the job description to surface match
              score, keyword gaps, and targeted improvement suggestions.
            </p>
          </div>
          <PrimaryButton
            onClick={handleRunAnalysis}
            disabled={isProcessing}
            className="w-full rounded-full"
          >
            <Sparkles className="h-4 w-4" />
            Analyze Resume Fit
          </PrimaryButton>
        </div>
      )}

      {isProcessing && (
        <div className="space-y-4 rounded-3xl border border-border/70 bg-background/55 p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h4 className="text-base font-semibold tracking-[-0.02em] text-foreground">
                  Analyzing Resume Fit...
                </h4>
              </div>
              <p className="mt-1 text-sm font-medium leading-6 text-muted-foreground">
                ReplayAI is comparing your résumé against the job description.
              </p>
            </div>
            <Badge variant="info" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Running
            </Badge>
          </div>

          <div className="space-y-3">
            <Skeleton className="h-28 rounded-3xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
            </div>
          </div>
        </div>
      )}

      {isFailed && (
        <div className="space-y-4 rounded-3xl border border-destructive/25 bg-destructive/[0.04] p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1">
              <h4 className="text-base font-semibold tracking-[-0.02em] text-foreground">
                Analysis failed
              </h4>
              <p className="mt-1 text-sm font-medium leading-6 text-muted-foreground">
                {analysis?.error_message ||
                  'ReplayAI could not complete the resume fit analysis.'}
              </p>
            </div>
          </div>
          <SecondaryButton
            onClick={handleRetryAnalysis}
            disabled={isRetrying}
            variant="outline"
            className="rounded-full"
          >
            {isRetrying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Retry analysis
          </SecondaryButton>
        </div>
      )}

      {(isCompleted && parsedSummary) && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/55 px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm font-semibold text-foreground">
                Analysis complete
              </span>
            </div>
            <SecondaryButton
              onClick={handleRetryAnalysis}
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
              Re-run analysis
            </SecondaryButton>
          </div>
          {showResults && <JobPrepAnalysisResults analysis={parsedSummary} />}
        </div>
      )}

      {showResults &&
        analysis?.status === 'completed' &&
        !parsedSummary &&
        !isProcessing && (
        <div className="rounded-3xl border border-dashed border-border/80 bg-muted/30 px-6 py-10 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <h4 className="text-base font-semibold text-foreground">
            Analysis data unavailable
          </h4>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            The saved analysis could not be parsed. Try running the analysis again.
          </p>
          <SecondaryButton
            onClick={handleRetryAnalysis}
            disabled={isRetrying}
            variant="outline"
            className="mt-5 rounded-full"
          >
            {isRetrying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Retry analysis
          </SecondaryButton>
        </div>
      )}

      {!analysis && (
        <div className="rounded-3xl border border-dashed border-border/80 bg-muted/30 px-6 py-10 text-center">
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <h4 className="text-base font-semibold text-foreground">
            No analysis record
          </h4>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            This project does not have an analysis record yet.
          </p>
        </div>
      )}
    </div>
  );
}
