'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ensureNextAnalysisPipelineJob,
  getSessionAIJobs,
  runAIJob,
  getSessionAIOutputs,
  retryAnalysisPipelineFromFailedStep,
} from '@/app/actions/ai-jobs';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  AlertCircle,
  FileText,
  FileSearch,
  Star,
  Bookmark,
  CheckCircle2,
  XCircle,
  Sparkles,
  RefreshCw,
  ListChecks,
  Circle,
} from 'lucide-react';
import type { AIJob, AIJobType, AIOutput } from '@/types';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton loader for AI Actions Panel
 */
export function AIActionsPanelSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-16" />
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

interface AIActionsPanelProps {
  sessionId: string;
  initialJobs?: AIJob[];
  // Notified whenever this panel's own output fetch/poll cycle refreshes AI
  // outputs, so parent components (e.g. the AI Insights section on the
  // session page) can stay in sync without running a second fetch loop.
  onOutputsChange?: (outputs: Record<string, AIOutput>) => void;
}

const JOB_TYPE_CONFIG: Record<
  AIJobType,
  {
    label: string;
    icon: React.ElementType;
    description: string;
    loadingLabel: string;
  }
> = {
  transcript: {
    label: 'Transcript',
    icon: FileText,
    description: 'Transcribe audio to text',
    loadingLabel: 'Transcribing...',
  },
  summary: {
    label: 'Summary',
    icon: FileSearch,
    description: 'Create a summary of the session',
    loadingLabel: 'Generating summary...',
  },
  score: {
    label: 'Overall Score',
    icon: Star,
    description: 'Get performance feedback',
    loadingLabel: 'Scoring session...',
  },
  suggest_bookmarks: {
    label: 'Suggested Bookmarks',
    icon: Bookmark,
    description: 'Auto-detect key moments',
    loadingLabel: 'Finding key moments...',
  },
  action_items: {
    label: 'Action Items',
    icon: ListChecks,
    description: 'Generate follow-up action items',
    loadingLabel: 'Generating action items...',
  },
};

const PRIORITY_BADGE_VARIANT: Record<
  'high' | 'medium' | 'low',
  'destructive' | 'warning' | 'secondary'
> = {
  high: 'destructive',
  medium: 'warning',
  low: 'secondary',
};

const REPORT_JOB_TYPES: AIJobType[] = ['summary', 'score', 'action_items'];
const ANALYSIS_PIPELINE_JOB_TYPES: AIJobType[] = [
  'transcript',
  'summary',
  'score',
  'action_items',
];
const PLACEHOLDER_TRANSCRIPT_PROVIDER = 'placeholder';
const PLACEHOLDER_TRANSCRIPT_MODEL = 'mock-v1';

type AnalysisStepStatus = 'completed' | 'processing' | 'failed' | 'waiting';

function isCompletedAnalysisStep(job: AIJob, jobType: AIJobType): boolean {
  if (job.job_type !== jobType || job.status !== 'completed') {
    return false;
  }

  if (jobType !== 'transcript') {
    return true;
  }

  return (
    job.provider !== PLACEHOLDER_TRANSCRIPT_PROVIDER &&
    job.model !== PLACEHOLDER_TRANSCRIPT_MODEL
  );
}

function getJobTypeLabel(jobType: AIJobType): string {
  return JOB_TYPE_CONFIG[jobType]?.label || jobType;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

// Renders the actual content of an AI output, per job type. Shared by the
// interview report cards so result formatting stays centralized.
function renderJobOutputContent(
  jobType: AIJobType,
  content: Record<string, unknown>
) {
  switch (jobType) {
    case 'summary':
      return (
        <div className="space-y-3">
          <p className="text-foreground text-sm">{content.summary as string}</p>
          {content.bullets && Array.isArray(content.bullets) ? (
            <ul className="list-inside list-disc space-y-1">
              {(content.bullets as string[]).map((bullet, i) => (
                <li key={i} className="text-muted-foreground text-sm">
                  {bullet}
                </li>
              ))}
            </ul>
          ) : null}
          {content.confidence !== undefined ? (
            <p className="text-muted-foreground text-xs">
              Confidence: {Math.round((content.confidence as number) * 100)}%
            </p>
          ) : null}
        </div>
      );

    case 'transcript':
      return (
        <div className="text-foreground bg-muted/30 max-h-[200px] overflow-y-auto rounded-lg p-3 font-mono text-sm whitespace-pre-wrap">
          {content.transcript as string}
        </div>
      );

    case 'score':
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-primary text-3xl font-bold">
              {content.score as number}
            </span>
            <span className="text-muted-foreground text-sm">/ 100</span>
          </div>
          {content.rubric && Array.isArray(content.rubric) ? (
            <div className="space-y-2">
              {(
                content.rubric as Array<{
                  name: string;
                  score: number;
                  maxScore?: number;
                  feedback?: string;
                }>
              ).map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">{item.name}</span>
                  <span className="font-medium">
                    {item.score}/{item.maxScore || 10}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          {content.overallFeedback ? (
            <p className="text-muted-foreground text-sm italic">
              {content.overallFeedback as string}
            </p>
          ) : null}
        </div>
      );

    case 'suggest_bookmarks':
      return (
        <div className="space-y-2">
          {content.bookmarks && Array.isArray(content.bookmarks) ? (
            <>
              {(
                content.bookmarks as Array<{
                  timestamp_ms: number;
                  label: string;
                  category?: string;
                }>
              ).map((bm, i) => {
                const seconds = Math.floor(bm.timestamp_ms / 1000);
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
                return (
                  <div
                    key={i}
                    className="bg-muted/30 flex items-center gap-3 rounded-lg p-2"
                  >
                    <span className="text-primary bg-primary/10 rounded px-2 py-1 font-mono text-xs">
                      {timeStr}
                    </span>
                    <span className="text-foreground flex-1 text-sm">
                      {bm.label}
                    </span>
                    {bm.category ? (
                      <Badge variant="secondary" className="text-[10px]">
                        {bm.category}
                      </Badge>
                    ) : null}
                  </div>
                );
              })}
            </>
          ) : null}
        </div>
      );

    case 'action_items':
      return (
        <div className="space-y-2">
          {content.items && Array.isArray(content.items) ? (
            <>
              {(
                content.items as Array<{
                  title: string;
                  description: string;
                  priority?: 'high' | 'medium' | 'low';
                }>
              ).map((item, i) => (
                <div
                  key={i}
                  className="bg-muted/30 border-border space-y-1 rounded-lg border p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-foreground text-sm font-medium">
                      {item.title}
                    </span>
                    {item.priority ? (
                      <Badge
                        variant={
                          PRIORITY_BADGE_VARIANT[item.priority] || 'secondary'
                        }
                        className="shrink-0 text-[10px] capitalize"
                      >
                        {item.priority}
                      </Badge>
                    ) : null}
                  </div>
                  {item.description ? (
                    <p className="text-muted-foreground text-xs">
                      {item.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </>
          ) : null}
        </div>
      );

    default:
      return (
        <pre className="text-muted-foreground overflow-auto text-xs">
          {JSON.stringify(content, null, 2)}
        </pre>
      );
  }
}

// Always-visible report card for completed coach analysis outputs.
function AIResultCard({
  jobType,
  output,
  updatedAt,
}: {
  jobType: AIJobType;
  output: AIOutput;
  updatedAt: string;
}) {
  const config = JOB_TYPE_CONFIG[jobType];
  const Icon = config.icon;
  const content = output.content as Record<string, unknown>;

  return (
    <div className="bg-card border-border space-y-3 rounded-xl border p-4">
      <div className="flex items-center gap-3">
        <div className="bg-background border-border flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border">
          <Icon className="text-primary h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-foreground truncate text-sm font-bold">
            {config.label}
          </p>
          <p className="text-muted-foreground text-[11px]">
            {formatRelativeTime(updatedAt)}
          </p>
        </div>
      </div>
      {renderJobOutputContent(jobType, content)}
    </div>
  );
}

export function AIActionsPanel({
  sessionId,
  initialJobs = [],
  onOutputsChange,
}: AIActionsPanelProps) {
  const [jobs, setJobs] = useState<AIJob[]>(initialJobs);
  const [outputs, setOutputs] = useState<Record<string, AIOutput>>({});
  const [isStartingAnalysis, setIsStartingAnalysis] = useState(false);
  const [isRetryingAnalysis, setIsRetryingAnalysis] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const pipelineAdvanceInFlightRef = useRef(false);

  // Forward every output refresh to the parent, if it wants to mirror them
  // (e.g. to render a live "AI Insights" section elsewhere on the page).
  useEffect(() => {
    onOutputsChange?.(outputs);
  }, [outputs, onOutputsChange]);

  // Keep local job state in sync when the session page refreshes after an
  // external event, such as an automatic transcript job created by an upload.
  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  // Load jobs on mount if no initial jobs provided
  useEffect(() => {
    if (initialJobs.length === 0) {
      loadJobs();
    } else {
      // Load outputs for completed jobs
      loadOutputs();
    }
  }, [sessionId, initialJobs.length]);

  // Poll while pipeline jobs are active. The job lifecycle still lives in
  // ai_jobs; this panel only translates it into a coach-facing progress view.
  useEffect(() => {
    const activeJobs = jobs.filter(
      (j) =>
        ANALYSIS_PIPELINE_JOB_TYPES.includes(j.job_type) &&
        (j.status === 'queued' || j.status === 'processing')
    );
    if (activeJobs.length === 0) return;

    const interval = setInterval(async () => {
      await loadJobs();
      await loadOutputs();
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [jobs, sessionId]);

  async function loadJobs() {
    setIsLoadingJobs(true);
    const { jobs: fetchedJobs, error: fetchError } =
      await getSessionAIJobs(sessionId);
    if (!fetchError) {
      setJobs(fetchedJobs);
    }
    setIsLoadingJobs(false);
  }

  const loadOutputs = useCallback(async () => {
    const { outputs: fetchedOutputs, error: fetchError } =
      await getSessionAIOutputs(sessionId);
    if (!fetchError) {
      const outputMap: Record<string, AIOutput> = {};
      fetchedOutputs.forEach((output) => {
        outputMap[output.job_id] = output;
      });
      setOutputs(outputMap);
    }
  }, [sessionId]);

  function mergeJob(job: AIJob) {
    setJobs((prev) =>
      prev.some((existingJob) => existingJob.id === job.id)
        ? prev.map((existingJob) =>
            existingJob.id === job.id ? job : existingJob
          )
        : [job, ...prev]
    );
  }

  async function runPipelineJob(jobId: string): Promise<boolean> {
    setError(null);

    // Optimistically show the job as processing right away
    setJobs((prev) =>
      prev.map((job) =>
        job.id === jobId ? { ...job, status: 'processing' as const } : job
      )
    );

    try {
      const { success, error: runError } = await runAIJob(jobId);

      if (runError || !success) {
        // Refresh from the server so the UI reflects the real status/error the
        // edge function recorded (e.g. 'failed' with error_message) instead of
        // guessing a status locally.
        await loadJobs();
        setError(runError || 'Failed to run job');
        toast.error('Failed to run AI job', {
          description: runError || 'Unknown error',
        });
        return false;
      }

      await loadJobs();
      await loadOutputs();
      return true;
    } catch {
      await loadJobs();
      setError('An unexpected error occurred. Please try again.');
      toast.error('Failed to run AI job');
      return false;
    }
  }

  async function advanceAnalysisPipeline(options: { retry?: boolean } = {}) {
    if (pipelineAdvanceInFlightRef.current) return;

    pipelineAdvanceInFlightRef.current = true;
    setError(null);

    try {
      let shouldRetry = Boolean(options.retry);

      for (let i = 0; i <= ANALYSIS_PIPELINE_JOB_TYPES.length; i += 1) {
        const result = shouldRetry
          ? await retryAnalysisPipelineFromFailedStep(sessionId)
          : await ensureNextAnalysisPipelineJob(sessionId);
        shouldRetry = false;

        if (result.error) {
          setError(result.error);
          toast.error('Analysis could not continue', {
            description: result.error,
          });
          await loadJobs();
          await loadOutputs();
          return;
        }

        if (result.job) {
          mergeJob(result.job);
        }

        if (result.completed) {
          await loadJobs();
          await loadOutputs();
          toast.success('Interview analysis is ready');
          return;
        }

        if (result.blocked) {
          await loadJobs();
          await loadOutputs();
          return;
        }

        if (!result.job) {
          await loadJobs();
          await loadOutputs();
          return;
        }

        if (!result.shouldRun) {
          await loadJobs();
          await loadOutputs();
          return;
        }

        const didRun = await runPipelineJob(result.job.id);
        if (!didRun) {
          return;
        }
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
      toast.error('Failed to analyze interview');
    } finally {
      pipelineAdvanceInFlightRef.current = false;
    }
  }

  async function handleAnalyzeInterview() {
    setIsStartingAnalysis(true);
    toast.success('Analyzing interview');
    try {
      await advanceAnalysisPipeline();
    } finally {
      setIsStartingAnalysis(false);
    }
  }

  async function handleRetryAnalysis() {
    setIsRetryingAnalysis(true);
    toast.success('Retrying analysis');
    try {
      await advanceAnalysisPipeline({ retry: true });
    } finally {
      setIsRetryingAnalysis(false);
    }
  }

  const pipelineJobs = useMemo(
    () =>
      jobs.filter((job) => ANALYSIS_PIPELINE_JOB_TYPES.includes(job.job_type)),
    [jobs]
  );
  const activePipelineJobs = pipelineJobs.filter(
    (job) => job.status === 'queued' || job.status === 'processing'
  );

  const completedResults = REPORT_JOB_TYPES.map((jobType) => {
    const job = jobs.find(
      (j) => j.job_type === jobType && j.status === 'completed'
    );
    const output = job ? outputs[job.id] : undefined;
    return job && output ? { jobType, job, output } : null;
  }).filter(
    (result): result is { jobType: AIJobType; job: AIJob; output: AIOutput } =>
      result !== null
  );
  const reportComplete = REPORT_JOB_TYPES.every((jobType) =>
    completedResults.some((result) => result.jobType === jobType)
  );
  const latestAnalysisTimestamp = completedResults
    .map((result) => result.job.updated_at)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

  const stepStates = ANALYSIS_PIPELINE_JOB_TYPES.map((jobType, index) => {
    const jobsForType = jobs.filter((job) => job.job_type === jobType);
    const activeJob =
      jobsForType.find((job) => job.status === 'processing') ||
      jobsForType.find((job) => job.status === 'queued') ||
      null;
    const laterStepStarted = ANALYSIS_PIPELINE_JOB_TYPES.slice(index + 1).some(
      (laterJobType) => jobs.some((job) => job.job_type === laterJobType)
    );
    const completedJob =
      jobsForType.find((job) => isCompletedAnalysisStep(job, jobType)) || null;
    const failedJob =
      jobsForType.find(
        (job) =>
          (job.status === 'failed' || job.status === 'cancelled') &&
          (jobType !== 'transcript' ||
            (job.provider !== PLACEHOLDER_TRANSCRIPT_PROVIDER &&
              job.model !== PLACEHOLDER_TRANSCRIPT_MODEL))
      ) || null;

    let status: AnalysisStepStatus = 'waiting';
    if (activeJob) {
      status = 'processing';
    } else if (completedJob || laterStepStarted) {
      status = 'completed';
    } else if (failedJob) {
      status = 'failed';
    }

    return {
      jobType,
      status,
      job: activeJob || completedJob || failedJob,
    };
  });
  const failedStep = stepStates.find((step) => step.status === 'failed');
  const pipelineStarted = pipelineJobs.length > 0;
  const analysisInProgress =
    activePipelineJobs.length > 0 || isStartingAnalysis || isRetryingAnalysis;
  const shouldShowProgress =
    pipelineStarted && (!reportComplete || analysisInProgress || failedStep);

  useEffect(() => {
    if (
      !pipelineStarted ||
      reportComplete ||
      failedStep ||
      activePipelineJobs.length > 0 ||
      pipelineAdvanceInFlightRef.current
    ) {
      return;
    }

    void advanceAnalysisPipeline();
  }, [
    activePipelineJobs.length,
    failedStep,
    pipelineStarted,
    reportComplete,
    sessionId,
  ]);

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!pipelineStarted && !reportComplete && (
        <div className="bg-card border-border space-y-4 rounded-xl border p-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="text-primary h-5 w-5" />
              <h4 className="text-foreground text-base font-bold">
                Replay AI Interview Coach
              </h4>
            </div>
            <p className="text-muted-foreground text-sm">
              Analyze your interview to generate a transcript, summary, score,
              and action items.
            </p>
          </div>
          <PrimaryButton
            onClick={handleAnalyzeInterview}
            disabled={isStartingAnalysis || isLoadingJobs}
            className="w-full"
          >
            {isStartingAnalysis ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Analyze Interview
          </PrimaryButton>
        </div>
      )}

      {shouldShowProgress && (
        <div className="bg-card border-border space-y-4 rounded-xl border p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="text-primary h-5 w-5" />
                <h4 className="text-foreground text-base font-bold">
                  {failedStep ? 'Analysis Paused' : 'Analyzing Interview...'}
                </h4>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                {failedStep
                  ? `${getJobTypeLabel(failedStep.jobType)} needs attention before the coach can continue.`
                  : 'Replay AI is working through your interview analysis.'}
              </p>
            </div>
            {analysisInProgress && (
              <Badge variant="info" className="gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Running
              </Badge>
            )}
          </div>

          <div className="space-y-3">
            {stepStates.map((step) => {
              const config = JOB_TYPE_CONFIG[step.jobType];
              const Icon = config.icon;
              const statusConfig: Record<
                AnalysisStepStatus,
                {
                  label: string;
                  icon: React.ElementType;
                  className: string;
                }
              > = {
                completed: {
                  label: 'Completed',
                  icon: CheckCircle2,
                  className: 'text-emerald-500',
                },
                processing: {
                  label:
                    step.job?.status === 'queued'
                      ? 'Starting...'
                      : config.loadingLabel,
                  icon: Loader2,
                  className: 'text-primary',
                },
                failed: {
                  label: 'Failed',
                  icon: XCircle,
                  className: 'text-destructive',
                },
                waiting: {
                  label: 'Waiting...',
                  icon: Circle,
                  className: 'text-muted-foreground',
                },
              };
              const StatusIcon = statusConfig[step.status].icon;
              const isSpinning = step.status === 'processing';

              return (
                <div
                  key={step.jobType}
                  className="bg-muted/30 border-border rounded-xl border p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="bg-background border-border flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border">
                        <Icon className="text-muted-foreground h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-foreground truncate text-sm font-medium">
                          {getJobTypeLabel(step.jobType)}
                        </p>
                        {step.job?.error_message && step.status === 'failed' ? (
                          <p className="text-destructive mt-1 text-xs">
                            {step.job.error_message}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div
                      className={`flex shrink-0 items-center gap-1.5 text-xs font-medium ${statusConfig[step.status].className}`}
                    >
                      <StatusIcon
                        className={`h-4 w-4 ${isSpinning ? 'animate-spin' : ''}`}
                      />
                      {statusConfig[step.status].label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {failedStep && (
            <SecondaryButton
              onClick={handleRetryAnalysis}
              disabled={isRetryingAnalysis}
              className="w-full"
            >
              {isRetryingAnalysis ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Retry from {getJobTypeLabel(failedStep.jobType)}
            </SecondaryButton>
          )}
        </div>
      )}

      {reportComplete && !shouldShowProgress && (
        <div className="space-y-4">
          <div className="bg-card border-border space-y-4 rounded-xl border p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="text-primary h-5 w-5" />
                  <h4 className="text-foreground text-base font-bold">
                    Interview Report
                  </h4>
                </div>
                {latestAnalysisTimestamp && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    Last analyzed: {formatRelativeTime(latestAnalysisTimestamp)}
                  </p>
                )}
              </div>
              <SecondaryButton
                size="sm"
                onClick={handleAnalyzeInterview}
                disabled={isStartingAnalysis}
              >
                {isStartingAnalysis ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                Reanalyze Interview
              </SecondaryButton>
            </div>

            <div className="space-y-3">
              {completedResults.map(({ jobType, job, output }) => (
                <AIResultCard
                  key={job.id}
                  jobType={jobType}
                  output={output}
                  updatedAt={job.updated_at}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
