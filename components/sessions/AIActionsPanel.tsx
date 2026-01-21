'use client';

import { useState, useEffect } from 'react';
import { createAIJob, getSessionAIJobs } from '@/app/actions/ai-jobs';
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
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';
import type { AIJob, AIJobType } from '@/types';

interface AIActionsPanelProps {
  sessionId: string;
  initialJobs?: AIJob[];
}

const JOB_TYPE_CONFIG: Record<AIJobType, { label: string; icon: React.ElementType; description: string }> = {
  transcript: {
    label: 'Generate Transcript',
    icon: FileText,
    description: 'Transcribe audio to text',
  },
  summary: {
    label: 'Generate Summary',
    icon: FileSearch,
    description: 'Create a summary of the session',
  },
  score: {
    label: 'Score My Session',
    icon: Star,
    description: 'Get performance feedback',
  },
  suggest_bookmarks: {
    label: 'Suggest Bookmarks',
    icon: Bookmark,
    description: 'Auto-detect key moments',
  },
};

function JobStatusBadge({ status }: { status: AIJob['status'] }) {
  const config: Record<AIJob['status'], { variant: 'info' | 'warning' | 'success' | 'destructive'; icon: React.ElementType }> = {
    queued: { variant: 'info', icon: Clock },
    processing: { variant: 'warning', icon: Loader2 },
    completed: { variant: 'success', icon: CheckCircle2 },
    failed: { variant: 'destructive', icon: XCircle },
  };

  const { variant, icon: Icon } = config[status];

  return (
    <Badge variant={variant} className="gap-1 capitalize">
      <Icon className={`h-3 w-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
      {status}
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

export function AIActionsPanel({ sessionId, initialJobs = [] }: AIActionsPanelProps) {
  const [jobs, setJobs] = useState<AIJob[]>(initialJobs);
  const [loadingJobType, setLoadingJobType] = useState<AIJobType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);

  // Load jobs on mount if no initial jobs provided
  useEffect(() => {
    if (initialJobs.length === 0) {
      loadJobs();
    }
  }, [sessionId, initialJobs.length]);

  async function loadJobs() {
    setIsLoadingJobs(true);
    const { jobs: fetchedJobs, error: fetchError } = await getSessionAIJobs(sessionId);
    if (!fetchError) {
      setJobs(fetchedJobs);
    }
    setIsLoadingJobs(false);
  }

  async function handleCreateJob(jobType: AIJobType) {
    setError(null);
    setLoadingJobType(jobType);

    try {
      const { job, error: createError } = await createAIJob(sessionId, jobType);

      if (createError) {
        setError(createError);
        return;
      }

      if (job) {
        // Add the new job to the top of the list
        setJobs((prev) => [job, ...prev]);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoadingJobType(null);
    }
  }

  const jobTypes: AIJobType[] = ['transcript', 'summary', 'score', 'suggest_bookmarks'];

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {jobTypes.map((jobType) => {
          const config = JOB_TYPE_CONFIG[jobType];
          const Icon = config.icon;
          const isLoading = loadingJobType === jobType;
          const isAnyLoading = loadingJobType !== null;

          return (
            <SecondaryButton
              key={jobType}
              onClick={() => handleCreateJob(jobType)}
              disabled={isAnyLoading}
              className="flex items-center justify-start gap-2 h-auto py-3 px-4 text-left"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              ) : (
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="text-sm font-medium truncate">{config.label}</span>
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
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              AI Jobs
            </h4>
          </div>

          {isLoadingJobs ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-2">
              {jobs.map((job) => {
                const config = JOB_TYPE_CONFIG[job.job_type];
                const Icon = config?.icon || FileText;

                return (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border"
                  >
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
                    <JobStatusBadge status={job.status} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
