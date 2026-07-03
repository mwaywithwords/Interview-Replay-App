'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  createAIJob,
  getSessionAIJobs,
  runAIJob,
  getSessionAIOutputs,
  cancelAiJob,
  retryAiJob,
} from '@/app/actions/ai-jobs';
import { SecondaryButton } from '@/components/ui/button';
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
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw,
  Ban,
  Eye,
  History,
  ListChecks,
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
  { label: string; icon: React.ElementType; description: string; loadingLabel: string }
> = {
  transcript: {
    label: 'Generate Transcript',
    icon: FileText,
    description: 'Transcribe audio to text',
    loadingLabel: 'Transcribing...',
  },
  summary: {
    label: 'Generate Summary',
    icon: FileSearch,
    description: 'Create a summary of the session',
    loadingLabel: 'Generating summary...',
  },
  score: {
    label: 'Score My Session',
    icon: Star,
    description: 'Get performance feedback',
    loadingLabel: 'Scoring session...',
  },
  suggest_bookmarks: {
    label: 'Suggest Bookmarks',
    icon: Bookmark,
    description: 'Auto-detect key moments',
    loadingLabel: 'Finding key moments...',
  },
  action_items: {
    label: 'Suggest Action Items',
    icon: ListChecks,
    description: 'Generate follow-up action items',
    loadingLabel: 'Generating action items...',
  },
};

const PRIORITY_BADGE_VARIANT: Record<'high' | 'medium' | 'low', 'destructive' | 'warning' | 'secondary'> = {
  high: 'destructive',
  medium: 'warning',
  low: 'secondary',
};

// Job types shown in the always-visible "AI Results" section, in display order.
// Excludes 'transcript' and 'suggest_bookmarks', which remain status/history only.
const RESULT_JOB_TYPES: AIJobType[] = ['summary', 'score', 'action_items'];

function JobStatusBadge({ status }: { status: AIJob['status'] }) {
  const config: Record<
    AIJob['status'],
    { variant: 'info' | 'warning' | 'success' | 'destructive' | 'secondary'; icon: React.ElementType; label: string }
  > = {
    queued: { variant: 'info', icon: Loader2, label: 'Starting' },
    processing: { variant: 'warning', icon: Loader2, label: 'Processing' },
    completed: { variant: 'success', icon: CheckCircle2, label: 'Completed' },
    failed: { variant: 'destructive', icon: XCircle, label: 'Failed' },
    cancelled: { variant: 'secondary', icon: Ban, label: 'Cancelled' },
  };

  const { variant, icon: Icon, label } = config[status];
  const isSpinning = status === 'queued' || status === 'processing';

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className={`h-3 w-3 ${isSpinning ? 'animate-spin' : ''}`} />
      {label}
    </Badge>
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
// inline job-history toggle (AIOutputDisplayWithId) and the always-visible
// AIResultCard, so both stay in sync with a single source of truth.
function renderJobOutputContent(jobType: AIJobType, content: Record<string, unknown>) {
  switch (jobType) {
    case 'summary':
      return (
        <div className="space-y-3">
          <p className="text-sm text-foreground">{content.summary as string}</p>
          {content.bullets && Array.isArray(content.bullets) ? (
            <ul className="list-disc list-inside space-y-1">
              {(content.bullets as string[]).map((bullet, i) => (
                <li key={i} className="text-sm text-muted-foreground">
                  {bullet}
                </li>
              ))}
            </ul>
          ) : null}
          {content.confidence !== undefined ? (
            <p className="text-xs text-muted-foreground">
              Confidence: {Math.round((content.confidence as number) * 100)}%
            </p>
          ) : null}
        </div>
      );

    case 'transcript':
      return (
        <div className="text-sm text-foreground whitespace-pre-wrap font-mono bg-muted/30 p-3 rounded-lg max-h-[200px] overflow-y-auto">
          {content.transcript as string}
        </div>
      );

    case 'score':
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-primary">{content.score as number}</span>
            <span className="text-sm text-muted-foreground">/ 100</span>
          </div>
          {content.rubric && Array.isArray(content.rubric) ? (
            <div className="space-y-2">
              {(content.rubric as Array<{ name: string; score: number; maxScore?: number; feedback?: string }>).map(
                (item, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="font-medium">
                      {item.score}/{item.maxScore || 10}
                    </span>
                  </div>
                )
              )}
            </div>
          ) : null}
          {content.overallFeedback ? (
            <p className="text-sm text-muted-foreground italic">
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
              {(content.bookmarks as Array<{ timestamp_ms: number; label: string; category?: string }>).map(
                (bm, i) => {
                  const seconds = Math.floor(bm.timestamp_ms / 1000);
                  const mins = Math.floor(seconds / 60);
                  const secs = seconds % 60;
                  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                    >
                      <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">
                        {timeStr}
                      </span>
                      <span className="text-sm text-foreground flex-1">{bm.label}</span>
                      {bm.category ? (
                        <Badge variant="secondary" className="text-[10px]">
                          {bm.category}
                        </Badge>
                      ) : null}
                    </div>
                  );
                }
              )}
            </>
          ) : null}
        </div>
      );

    case 'action_items':
      return (
        <div className="space-y-2">
          {content.items && Array.isArray(content.items) ? (
            <>
              {(content.items as Array<{ title: string; description: string; priority?: 'high' | 'medium' | 'low' }>).map(
                (item, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-muted/30 border border-border space-y-1"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-foreground">{item.title}</span>
                      {item.priority ? (
                        <Badge
                          variant={PRIORITY_BADGE_VARIANT[item.priority] || 'secondary'}
                          className="text-[10px] capitalize shrink-0"
                        >
                          {item.priority}
                        </Badge>
                      ) : null}
                    </div>
                    {item.description ? (
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    ) : null}
                  </div>
                )
              )}
            </>
          ) : null}
        </div>
      );

    default:
      return (
        <pre className="text-xs text-muted-foreground overflow-auto">
          {JSON.stringify(content, null, 2)}
        </pre>
      );
  }
}

// Inline, collapsed-by-default output display used within a job's row in the
// status/history list. Kept collapsed there since that list can contain many
// historical runs - the always-visible summary lives in AIResultCard instead.
function AIOutputDisplayWithId({
  output,
  jobType,
  jobId,
}: {
  output: AIOutput;
  jobType: AIJobType;
  jobId: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const content = output.content as Record<string, unknown>;

  return (
    <div className="mt-2 pt-2 border-t border-border">
      <button
        id={`output-toggle-${jobId}`}
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors w-full"
      >
        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {isExpanded ? 'Hide output' : 'View output'}
      </button>
      {isExpanded && <div className="mt-3">{renderJobOutputContent(jobType, content)}</div>}
    </div>
  );
}

// Always-visible result card for the "AI Results" section - no click required
// to see the content, unlike the collapsed history list above.
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
    <div className="p-4 rounded-xl bg-card border border-border space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 border border-border">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{config.label}</p>
          <p className="text-[11px] text-muted-foreground">{formatRelativeTime(updatedAt)}</p>
        </div>
      </div>
      {renderJobOutputContent(jobType, content)}
    </div>
  );
}

export function AIActionsPanel({ sessionId, initialJobs = [], onOutputsChange }: AIActionsPanelProps) {
  const [jobs, setJobs] = useState<AIJob[]>(initialJobs);
  const [outputs, setOutputs] = useState<Record<string, AIOutput>>({});
  const [loadingJobType, setLoadingJobType] = useState<AIJobType | null>(null);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [cancellingJobId, setCancellingJobId] = useState<string | null>(null);
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Forward every output refresh to the parent, if it wants to mirror them
  // (e.g. to render a live "AI Insights" section elsewhere on the page).
  useEffect(() => {
    onOutputsChange?.(outputs);
  }, [outputs, onOutputsChange]);

  // Load jobs on mount if no initial jobs provided
  useEffect(() => {
    if (initialJobs.length === 0) {
      loadJobs();
    } else {
      // Load outputs for completed jobs
      loadOutputs();
    }
  }, [sessionId, initialJobs.length]);

  // Poll for job updates when there's a job processing
  useEffect(() => {
    const processingJobs = jobs.filter((j) => j.status === 'processing');
    if (processingJobs.length === 0) return;

    const interval = setInterval(async () => {
      await loadJobs();
      await loadOutputs();
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [jobs, sessionId]);

  async function loadJobs() {
    setIsLoadingJobs(true);
    const { jobs: fetchedJobs, error: fetchError } = await getSessionAIJobs(sessionId);
    if (!fetchError) {
      setJobs(fetchedJobs);
    }
    setIsLoadingJobs(false);
  }

  const loadOutputs = useCallback(async () => {
    const { outputs: fetchedOutputs, error: fetchError } = await getSessionAIOutputs(sessionId);
    if (!fetchError && fetchedOutputs.length > 0) {
      // Index outputs by job_id for easy lookup
      const outputMap: Record<string, AIOutput> = {};
      fetchedOutputs.forEach((output) => {
        outputMap[output.job_id] = output;
      });
      setOutputs(outputMap);
    }
  }, [sessionId]);

  async function handleCreateJob(jobType: AIJobType) {
    setError(null);
    setLoadingJobType(jobType);

    try {
      const { job, error: createError } = await createAIJob(sessionId, jobType);

      if (createError) {
        setError(createError);
        toast.error('Failed to create AI job', { description: createError });
        return;
      }

      if (job) {
        // Add the new job to the top of the list
        setJobs((prev) => [job, ...prev]);
        toast.success('AI job started', { description: `${JOB_TYPE_CONFIG[jobType].label} is now running` });
        // Immediately run the job so the user doesn't have to click "Run".
        // Not awaited: the create button's loading state shouldn't block on the
        // full run duration - the job card's own status reflects progress instead.
        runJob(job.id);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      toast.error('Failed to create AI job');
    } finally {
      setLoadingJobType(null);
    }
  }

  // Invokes the edge function for a job and syncs local state with the server
  // afterward. Used both to auto-run a job immediately after it's created (or
  // retried) and as the manual "Run" fallback for any job still queued.
  async function runJob(jobId: string) {
    setError(null);
    setRunningJobId(jobId);

    // Optimistically show the job as processing right away
    setJobs((prev) =>
      prev.map((job) => (job.id === jobId ? { ...job, status: 'processing' as const } : job))
    );

    try {
      const { success, error: runError } = await runAIJob(jobId);

      if (runError || !success) {
        // Refresh from the server so the UI reflects the real status/error the
        // edge function recorded (e.g. 'failed' with error_message) instead of
        // guessing a status locally.
        await loadJobs();
        setError(runError || 'Failed to run job');
        toast.error('Failed to run AI job', { description: runError || 'Unknown error' });
        return;
      }

      // Refresh jobs and outputs after successful run
      await loadJobs();
      await loadOutputs();
      toast.success('AI job completed');
    } catch (err) {
      await loadJobs();
      setError('An unexpected error occurred. Please try again.');
      toast.error('Failed to run AI job');
    } finally {
      setRunningJobId(null);
    }
  }

  async function handleCancelJob(jobId: string) {
    setError(null);
    setCancellingJobId(jobId);

    try {
      const { success, error: cancelError } = await cancelAiJob(jobId);

      if (cancelError || !success) {
        setError(cancelError || 'Failed to cancel job');
        toast.error('Failed to cancel job', { description: cancelError || 'Unknown error' });
        return;
      }

      // Refresh jobs list
      await loadJobs();
      toast.success('Job cancelled');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      toast.error('Failed to cancel job');
    } finally {
      setCancellingJobId(null);
    }
  }

  async function handleRetryJob(jobId: string) {
    setError(null);
    setRetryingJobId(jobId);

    try {
      const { job: newJob, error: retryError } = await retryAiJob(jobId);

      if (retryError || !newJob) {
        setError(retryError || 'Failed to retry job');
        toast.error('Failed to retry job', { description: retryError || 'Unknown error' });
        return;
      }

      // Refresh jobs list to show the new job, then run it immediately -
      // retries shouldn't require a manual "Run" click either.
      await loadJobs();
      toast.success('Retrying job', {
        description: `${JOB_TYPE_CONFIG[newJob.job_type]?.label || newJob.job_type} is now running`,
      });
      runJob(newJob.id);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      toast.error('Failed to retry job');
    } finally {
      setRetryingJobId(null);
    }
  }

  const jobTypes: AIJobType[] = ['transcript', 'summary', 'score', 'suggest_bookmarks', 'action_items'];

  // Filter jobs based on showHistory toggle
  // Active jobs: queued, processing
  // History jobs: completed, failed, cancelled
  const activeJobs = jobs.filter((j) => j.status === 'queued' || j.status === 'processing');
  const historyJobs = jobs.filter(
    (j) => j.status === 'completed' || j.status === 'failed' || j.status === 'cancelled'
  );
  const displayedJobs = showHistory ? jobs : activeJobs;

  // The latest completed result for each "insight" job type, in a fixed
  // display order so the results section stays predictable. `jobs` is kept
  // newest-first, so the first completed match per type is the latest one.
  const completedResults = RESULT_JOB_TYPES.map((jobType) => {
    const job = jobs.find((j) => j.job_type === jobType && j.status === 'completed');
    const output = job ? outputs[job.id] : undefined;
    return job && output ? { jobType, job, output } : null;
  }).filter((result): result is { jobType: AIJobType; job: AIJob; output: AIOutput } => result !== null);

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {jobTypes.map((jobType) => {
          const config = JOB_TYPE_CONFIG[jobType];
          const Icon = config.icon;
          const isCreating = loadingJobType === jobType;
          // A job of this type is already queued/processing - the button
          // reflects that instead of allowing another one to be started.
          const activeJobForType = activeJobs.find((j) => j.job_type === jobType);
          const isActive = isCreating || !!activeJobForType;
          const label = isActive
            ? activeJobForType?.status === 'processing'
              ? config.loadingLabel
              : 'Starting...'
            : config.label;

          return (
            <SecondaryButton
              key={jobType}
              onClick={() => handleCreateJob(jobType)}
              disabled={isActive}
              className="flex items-center justify-start gap-2 h-auto py-3 px-4 text-left"
            >
              {isActive ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0 text-muted-foreground" />
              ) : (
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="text-sm font-medium truncate">{label}</span>
            </SecondaryButton>
          );
        })}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Jobs List */}
      {(jobs.length > 0 || isLoadingJobs) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                AI Job Status
              </h4>
              {activeJobs.length > 0 && (
                <Badge variant="info" className="text-[10px] h-5">
                  {activeJobs.length} active
                </Badge>
              )}
            </div>
            {historyJobs.length > 0 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <History className="h-3 w-3" />
                {showHistory ? 'Hide history' : `Show history (${historyJobs.length})`}
              </button>
            )}
          </div>

          {isLoadingJobs ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : displayedJobs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {showHistory ? 'No jobs yet' : 'No active jobs'}
            </p>
          ) : (
            <div className="space-y-2">
              {displayedJobs.map((job) => {
                const config = JOB_TYPE_CONFIG[job.job_type];
                const Icon = config?.icon || FileText;
                const isRunning = runningJobId === job.id || job.status === 'processing';
                const isCancelling = cancellingJobId === job.id;
                const isRetrying = retryingJobId === job.id;
                const canCancel = job.status === 'queued' || job.status === 'processing';
                const canRetry = job.status === 'failed' || job.status === 'cancelled';
                const output = outputs[job.id];

                return (
                  <div
                    key={job.id}
                    className="p-3 rounded-xl bg-muted/30 border border-border"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 border border-border">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {getJobTypeLabel(job.job_type)}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatRelativeTime(job.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Cancel button for queued/processing jobs */}
                        {canCancel && (
                          <SecondaryButton
                            size="sm"
                            onClick={() => handleCancelJob(job.id)}
                            disabled={isCancelling || isRunning}
                            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                          >
                            {isCancelling ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                          </SecondaryButton>
                        )}

                        {/* Retry button for failed/cancelled jobs */}
                        {canRetry && (
                          <SecondaryButton
                            size="sm"
                            onClick={() => handleRetryJob(job.id)}
                            disabled={isRetrying}
                            className="h-7 px-3 text-xs"
                          >
                            {isRetrying ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Retry
                              </>
                            )}
                          </SecondaryButton>
                        )}

                        {/* View Output button for completed jobs with output */}
                        {job.status === 'completed' && output && (
                          <SecondaryButton
                            size="sm"
                            onClick={() => {
                              // Toggle expand in the output display
                              const el = document.getElementById(`output-toggle-${job.id}`);
                              if (el) el.click();
                            }}
                            className="h-7 px-3 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </SecondaryButton>
                        )}

                        <JobStatusBadge status={job.status} />
                      </div>
                    </div>

                    {/* Show output for completed jobs */}
                    {job.status === 'completed' && output && (
                      <AIOutputDisplayWithId output={output} jobType={job.job_type} jobId={job.id} />
                    )}

                    {/* Show error for failed jobs */}
                    {job.status === 'failed' && job.error_message && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-xs text-destructive">{job.error_message}</p>
                      </div>
                    )}

                    {/* Show cancellation message for cancelled jobs */}
                    {job.status === 'cancelled' && job.error_message && (
                      <div className="mt-2 pt-2 border-t border-border">
                        <p className="text-xs text-muted-foreground">{job.error_message}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* AI Results - always-visible, no "View output" click required */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
            AI Results
          </h4>
        </div>

        {completedResults.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Generate an AI action to see results here.
          </p>
        ) : (
          <div className="space-y-3">
            {completedResults.map(({ jobType, job, output }) => (
              <AIResultCard key={job.id} jobType={jobType} output={output} updatedAt={job.updated_at} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
