'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { updateSession, deleteSession } from '@/app/actions/sessions';
import {
  generateSessionShareToken,
  revokeSessionShare,
  getSessionShares,
} from '@/app/actions/shares';
import { PrimaryButton, SecondaryButton, Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Trash2,
  Save,
  Clock,
  Calendar,
  FileText,
  MessageSquare,
  Bookmark,
  Lightbulb,
  Video,
  Mic,
  Settings2,
  Share2,
  Copy,
  Check,
  Link as LinkIcon,
  Trash,
  ListChecks,
  Sparkles,
} from 'lucide-react';
import type { SessionShare, AIJob, AIOutput } from '@/types';
import type {
  InterviewSession,
  SessionType,
  SessionMetadata,
  Bookmark as BookmarkType,
} from '@/types';
import { VideoPlayer, type MediaPlayerRef } from '@/components/VideoPlayer';
import { AudioPlayer } from '@/components/AudioPlayer';
import { VideoRecorder } from '@/components/VideoRecorder';
import { AudioRecorder } from '@/components/AudioRecorder';
import { SectionCard } from '@/components/layout/SectionCard';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/layout/EmptyState';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BookmarksList } from '@/components/sessions/BookmarksList';
import { SessionNoteEditor } from '@/components/sessions/SessionNoteEditor';
import { TranscriptEditor } from '@/components/sessions/TranscriptEditor';
import { AIActionsPanel } from '@/components/sessions/AIActionsPanel';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SessionDetailProps {
  session: InterviewSession;
  initialBookmarks: BookmarkType[];
  initialAIJobs?: AIJob[];
  initialAIOutputs?: AIOutput[];
}

const PRIORITY_PILL_CLASS: Record<'high' | 'medium' | 'low', string> = {
  high: 'border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400',
  medium: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  low: 'border-border/60 bg-muted/50 text-muted-foreground',
};

interface ActionItem {
  title: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
}

// Picks the most recently completed output of a given type from a list of AI
// outputs. `outputs` is not guaranteed to be sorted here (it may have been
// rebuilt from a Record by the AI Actions panel), so we sort defensively.
function getLatestOutputByType(
  outputs: AIOutput[],
  outputType: string
): AIOutput | null {
  const matches = outputs
    .filter((o) => o.output_type === outputType)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  return matches[0] ?? null;
}

function getSummaryInsights(output: AIOutput | null): {
  summary: string | null;
  bullets: string[];
} {
  if (!output) return { summary: null, bullets: [] };
  const content = output.content as Record<string, unknown>;
  const summary = typeof content.summary === 'string' ? content.summary : null;
  const bullets = Array.isArray(content.bullets)
    ? (content.bullets as string[])
    : [];
  return { summary, bullets };
}

function getActionItems(output: AIOutput | null): ActionItem[] {
  if (!output) return [];
  const content = output.content as Record<string, unknown>;
  return Array.isArray(content.items) ? (content.items as ActionItem[]) : [];
}

function getScoreInsights(output: AIOutput | null): {
  score: number | null;
  feedback: string | null;
  rubric: Array<{
    name: string;
    score: number;
    maxScore?: number;
    feedback?: string;
  }>;
} {
  if (!output) return { score: null, feedback: null, rubric: [] };
  const content = output.content as Record<string, unknown>;
  const score = typeof content.score === 'number' ? content.score : null;
  const feedback =
    typeof content.overallFeedback === 'string'
      ? content.overallFeedback
      : null;
  const rubric = Array.isArray(content.rubric)
    ? (content.rubric as Array<{
        name: string;
        score: number;
        maxScore?: number;
        feedback?: string;
      }>)
    : [];

  return { score, feedback, rubric };
}

function getSessionTypeLabel(type: string | undefined): string {
  const labels: Record<string, string> = {
    interview: 'Interview',
    trading: 'Trading',
  };
  return labels[type || ''] || 'Unknown';
}

function formatDuration(seconds: number | null | undefined): string | null {
  if (!seconds || seconds <= 0) return null;
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<
    string,
    'success' | 'warning' | 'info' | 'destructive' | 'secondary'
  > = {
    draft: 'secondary',
    recording: 'destructive',
    processing: 'warning',
    ready: 'success',
    archived: 'secondary',
  };

  return (
    <Badge
      variant={variants[status] || 'secondary'}
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase shadow-sm"
    >
      {status}
    </Badge>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
      {children}
    </p>
  );
}

function CircularScoreGauge({
  value,
  label,
  helper,
}: {
  value: number;
  label: string;
  helper: string;
}) {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-card/95 via-card/75 to-primary/[0.05] p-5 shadow-[var(--shadow-card)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--primary),transparent_55%)] opacity-[0.08]" />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <SectionLabel>{label}</SectionLabel>
          <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground/90">
            {helper}
          </p>
        </div>
        <div className="relative grid h-28 w-28 shrink-0 place-items-center">
          <div
            className="absolute inset-0 rounded-full opacity-90 blur-sm"
            style={{
              background: `conic-gradient(from 220deg, var(--primary) ${clampedValue * 3.6}deg, transparent 0deg)`,
            }}
          />
          <div className="absolute inset-0 rounded-full bg-muted/40" />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from 220deg, var(--primary) ${clampedValue * 3.6}deg, var(--muted) 0deg)`,
            }}
          />
          <div className="absolute inset-[7px] rounded-full bg-card shadow-inner" />
          <div className="relative text-center">
            <div className="text-3xl font-semibold tracking-[-0.05em] text-foreground">
              {clampedValue}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              score
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressRing({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-border/40 bg-gradient-to-r from-background/70 to-background/40 p-3 transition-colors hover:border-primary/20 hover:bg-background/80">
      <div className="relative grid h-12 w-12 shrink-0 place-items-center">
        <div
          className="absolute inset-0 rounded-full opacity-60 blur-[2px]"
          style={{
            background: `conic-gradient(var(--primary) ${clampedValue * 3.6}deg, transparent 0deg)`,
          }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(var(--primary) ${clampedValue * 3.6}deg, var(--muted) 0deg)`,
          }}
        />
        <div className="absolute inset-1.5 rounded-full bg-card shadow-inner" />
        <span className="relative text-xs font-semibold tabular-nums text-foreground">
          {clampedValue}
        </span>
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold tracking-[-0.02em] text-foreground">{label}</div>
        <div className="text-xs font-medium text-muted-foreground/80">
          {clampedValue}% rubric
        </div>
      </div>
    </div>
  );
}

function ScoreSnapshot({ score }: { score: number }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.12] via-background/70 to-background/50 px-3 py-2.5 shadow-[var(--shadow-soft)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--primary),transparent_60%)] opacity-20" />
      <div className="relative flex items-center justify-between gap-3">
        <SectionLabel>Interview score</SectionLabel>
        <span className="text-2xl font-semibold tabular-nums tracking-[-0.05em] text-foreground">{score}</span>
      </div>
    </div>
  );
}

export function SessionDetail({
  session,
  initialBookmarks,
  initialAIJobs = [],
  initialAIOutputs = [],
}: SessionDetailProps) {
  const router = useRouter();
  const metadata = session.metadata as SessionMetadata;

  // Mirrors the AI Actions panel's own output fetch/poll cycle so the AI
  // Insights section below stays live without a second fetch loop. Seeded
  // from the server-rendered outputs so there's real data on first paint.
  const [aiOutputs, setAiOutputs] = useState<AIOutput[]>(initialAIOutputs);
  const handleAIOutputsChange = useCallback(
    (outputsMap: Record<string, AIOutput>) => {
      setAiOutputs(Object.values(outputsMap));
    },
    []
  );

  const latestSummaryOutput = useMemo(
    () => getLatestOutputByType(aiOutputs, 'summary'),
    [aiOutputs]
  );
  const latestTranscriptOutput = useMemo(
    () => getLatestOutputByType(aiOutputs, 'transcript'),
    [aiOutputs]
  );
  const latestActionItemsOutput = useMemo(
    () => getLatestOutputByType(aiOutputs, 'action_items'),
    [aiOutputs]
  );
  const latestScoreOutput = useMemo(
    () => getLatestOutputByType(aiOutputs, 'score'),
    [aiOutputs]
  );
  const { summary: summaryText, bullets: summaryBullets } =
    getSummaryInsights(latestSummaryOutput);
  const actionItems = getActionItems(latestActionItemsOutput);
  const {
    score: aiScore,
    feedback: scoreFeedback,
    rubric: scoreRubric,
  } = getScoreInsights(latestScoreOutput);
  const hasAIInsights =
    Boolean(summaryText) || summaryBullets.length > 0 || actionItems.length > 0;

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('transcript');

  // Share state
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [existingShares, setExistingShares] = useState<SessionShare[]>([]);
  const [isLoadingShares, setIsLoadingShares] = useState(false);
  const [revokingShareId, setRevokingShareId] = useState<string | null>(null);

  // Ref for the active media player (audio or video)
  const mediaPlayerRef = useRef<MediaPlayerRef>(null);

  // Determine which recorder/player to show based on recording_type
  const isAudioSession = session.recording_type === 'audio';
  const isVideoSession = session.recording_type === 'video';
  const hasAudioRecording =
    isAudioSession && session.audio_storage_path !== null;
  const hasVideoRecording =
    isVideoSession && session.video_storage_path !== null;

  // Form state
  const [title, setTitle] = useState(session.title);
  const [sessionType, setSessionType] = useState<SessionType>(
    metadata?.session_type || 'interview'
  );
  const [prompt, setPrompt] = useState(metadata?.prompt || '');

  function handleCancelEdit() {
    setTitle(session.title);
    setSessionType(metadata?.session_type || 'interview');
    setPrompt(metadata?.prompt || '');
    setIsEditing(false);
    setError(null);
  }

  async function handleSave() {
    setError(null);
    setIsLoading(true);

    try {
      const { error: updateError } = await updateSession(session.id, {
        title: title.trim(),
        session_type: sessionType,
        prompt: prompt.trim() || undefined,
      });

      if (updateError) {
        setError(updateError);
        toast.error('Failed to update session', { description: updateError });
        return;
      }

      setIsEditing(false);
      toast.success('Session updated');
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
      toast.error('Failed to update session');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);

    try {
      const { error: deleteError } = await deleteSession(session.id);

      if (deleteError) {
        setError(deleteError);
        toast.error('Failed to delete session', { description: deleteError });
        setIsDeleting(false);
        return;
      }

      toast.success('Session deleted', {
        description: 'Redirecting to dashboard...',
      });
      router.push('/dashboard');
    } catch {
      setError('An unexpected error occurred. Please try again.');
      toast.error('Failed to delete session');
      setIsDeleting(false);
    }
  }

  // Load existing shares when dialog opens
  async function loadExistingShares() {
    setIsLoadingShares(true);
    const { shares, error } = await getSessionShares(session.id);
    if (!error) {
      setExistingShares(shares);
    }
    setIsLoadingShares(false);
  }

  // Generate a new share link
  async function handleGenerateShareLink() {
    setIsGeneratingShare(true);
    setShareError(null);

    try {
      const result = await generateSessionShareToken(session.id);

      if (result.error) {
        setShareError(result.error);
        toast.error('Failed to generate share link', {
          description: result.error,
        });
        return;
      }

      if (result.shareUrl && result.share) {
        setShareUrl(result.shareUrl);
        setExistingShares((prev) => [result.share!, ...prev]);
        toast.success('Share link created');
      }
    } catch {
      setShareError('Failed to generate share link. Please try again.');
      toast.error('Failed to generate share link');
    } finally {
      setIsGeneratingShare(false);
    }
  }

  // Copy share URL to clipboard
  async function handleCopyShareUrl() {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      toast.error('Failed to copy to clipboard');
    }
  }

  // Copy any URL to clipboard
  async function handleCopyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      toast.error('Failed to copy to clipboard');
    }
  }

  // Revoke a share link
  async function handleRevokeShare(shareId: string) {
    setRevokingShareId(shareId);

    try {
      const { success, error } = await revokeSessionShare(shareId);

      if (error) {
        setShareError(error);
        toast.error('Failed to revoke share link', { description: error });
        return;
      }

      if (success) {
        setExistingShares((prev) => prev.filter((s) => s.id !== shareId));
        // Clear the displayed URL if it was the revoked share
        setShareUrl(null);
        toast.success('Share link revoked');
      }
    } catch {
      setShareError('Failed to revoke share link. Please try again.');
      toast.error('Failed to revoke share link');
    } finally {
      setRevokingShareId(null);
    }
  }

  // Handle share dialog open
  function handleShareDialogChange(open: boolean) {
    setIsShareDialogOpen(open);
    if (open) {
      // Reset state and load existing shares
      setShareUrl(null);
      setShareError(null);
      setCopied(false);
      loadExistingShares();
    }
  }

  const displayScore = aiScore;
  const sessionDuration =
    session.duration_seconds ??
    (isVideoSession ? session.video_duration_seconds : session.audio_duration_seconds);
  const formattedDuration = formatDuration(sessionDuration);
  const rubricSignals =
    scoreRubric.length > 0
      ? scoreRubric.slice(0, 4).map((item) => ({
          label: item.name,
          value: Math.round((item.score / (item.maxScore || 10)) * 100),
        }))
      : [];
  const coachPreviewText = scoreFeedback || summaryText;
  const topActionItems = actionItems.slice(0, 3);

  return (
    <div className="relative mx-auto w-full max-w-[1600px] px-4 py-2 sm:px-6 lg:px-8 lg:py-3">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[120px] bg-[radial-gradient(circle_at_top,var(--primary),transparent_55%)] opacity-10" />

      {/* Compact session header */}
      <header className="mb-2 rounded-2xl border border-border/40 bg-card/55 px-3 py-2 shadow-[var(--shadow-soft)] backdrop-blur-xl sm:px-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-3">
            <Link
              href="/sessions"
              className="group mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full border border-border/50 bg-background/50 p-1.5 text-muted-foreground shadow-sm transition-all hover:border-border hover:bg-accent/80 hover:text-foreground"
              aria-label="Back to sessions"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h1 className="truncate text-lg font-semibold tracking-[-0.03em] text-foreground sm:text-xl">
                  {session.title}
                </h1>
                <StatusBadge status={session.status} />
                <Badge variant="outline" className="gap-1 rounded-full border-border/50 bg-background/40 px-2 py-0.5 text-[10px]">
                  {isAudioSession ? <Mic className="h-3 w-3" /> : <Video className="h-3 w-3" />}
                  {getSessionTypeLabel(sessionType)}
                </Badge>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] font-medium text-muted-foreground">
                <span>{session.status === 'ready' ? 'Recorded' : session.status}</span>
                <span className="text-muted-foreground/40">•</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(session.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span className="text-muted-foreground/40">•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(session.created_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
                {formattedDuration && (
                  <>
                    <span className="text-muted-foreground/40">•</span>
                    <span>{formattedDuration}</span>
                  </>
                )}
              </div>
            </div>

            <div className="hidden shrink-0 items-center sm:flex">
              <div className="flex items-center gap-1.5 rounded-full border border-border/40 bg-gradient-to-r from-background/70 to-background/40 px-2.5 py-1 shadow-sm">
                <SectionLabel>Score</SectionLabel>
                <span className={cn('text-sm font-semibold tabular-nums', displayScore !== null ? 'text-foreground' : 'text-muted-foreground')}>
                  {displayScore ?? '—'}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {!isEditing && (
                <>
                  <Dialog open={isShareDialogOpen} onOpenChange={handleShareDialogChange}>
                    <DialogTrigger asChild>
                      <SecondaryButton size="sm" className="h-8 rounded-full border-border/70 bg-background/70 px-2.5">
                        <Share2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Share</span>
                      </SecondaryButton>
                    </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Share2 className="h-5 w-5" />
                            Share Session
                          </DialogTitle>
                          <DialogDescription>
                            Create a secure link to share this session. Anyone with the link can view the replay in read-only mode.
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                          {shareError && (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>{shareError}</AlertDescription>
                            </Alert>
                          )}

                          {!shareUrl && (
                            <PrimaryButton onClick={handleGenerateShareLink} disabled={isGeneratingShare} className="w-full">
                              {isGeneratingShare ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <LinkIcon className="h-4 w-4" />
                                  Generate Share Link
                                </>
                              )}
                            </PrimaryButton>
                          )}

                          {shareUrl && (
                            <div className="space-y-3">
                              <Label>Share Link</Label>
                              <div className="flex items-center gap-2">
                                <Input value={shareUrl} readOnly className="font-mono text-sm" />
                                <Button size="icon" variant="outline" onClick={handleCopyShareUrl} className="shrink-0">
                                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">Anyone with this link can view the session in read-only mode.</p>
                            </div>
                          )}

                          {existingShares.length > 0 && (
                            <div className="space-y-3 border-t border-border/70 pt-4">
                              <Label className="text-muted-foreground">Active Share Links ({existingShares.length})</Label>
                              <div className="max-h-[200px] space-y-2 overflow-y-auto">
                                {existingShares.map((share) => {
                                  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                                  const url = `${baseUrl}/share/${share.share_token ?? ''}`;
                                  return (
                                    <div key={share.id} className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/40 p-2">
                                      <div className="mr-2 min-w-0 flex-1">
                                        <p className="truncate font-mono text-xs text-muted-foreground">
                                          {share.share_token?.slice(0, 20) ?? 'N/A'}...
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">Created {new Date(share.created_at).toLocaleDateString()}</p>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleCopyUrl(url)}>
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="icon"
                                          variant="ghost"
                                          className="h-7 w-7 text-destructive hover:text-destructive"
                                          onClick={() => handleRevokeShare(share.id)}
                                          disabled={revokingShareId === share.id}
                                        >
                                          {revokingShareId === share.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash className="h-3 w-3" />}
                                        </Button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {isLoadingShares && (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    <SecondaryButton size="sm" onClick={() => setIsEditing(true)} className="h-8 rounded-full border-border/70 bg-background/70 px-2.5">
                      <Settings2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Settings</span>
                    </SecondaryButton>
                  </>
                )}
                {isEditing && (
                  <div className="flex items-center gap-1.5">
                    <SecondaryButton size="sm" onClick={handleCancelEdit} disabled={isLoading} className="h-8 rounded-full border-border px-2.5">
                      Cancel
                    </SecondaryButton>
                    <PrimaryButton size="sm" onClick={handleSave} disabled={isLoading || !title.trim()} className="h-8 rounded-full px-3 shadow-lg shadow-primary/20">
                      {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save
                    </PrimaryButton>
                  </div>
                )}
              </div>
            </div>

          {/* Mobile score row */}
          <div className="flex items-center gap-1.5 sm:hidden">
            <div className="flex flex-1 items-center justify-between rounded-xl border border-border/70 bg-background/55 px-2.5 py-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">AI Score</span>
              <span className={cn('text-sm font-semibold tabular-nums', displayScore !== null ? 'text-foreground' : 'text-muted-foreground')}>
                {displayScore ?? '—'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isEditing && (
        <SectionCard className="mb-6" title="Edit Session Information">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Session Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Google Mock Interview" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session_type">Session Type</Label>
                <Select value={sessionType} onValueChange={(value: SessionType) => setSessionType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="trading">Trading</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prompt">Context / Prompt</Label>
              <Textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Job description, specific questions, etc." className="h-[110px]" />
            </div>
          </div>

          <div className="mt-6 flex justify-end border-t border-border pt-6">
            {!showDeleteConfirm ? (
              <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="h-3.5 w-3.5" />
                Delete Session
              </Button>
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Are you sure?</span>
                <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </Button>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      <div className="flex flex-col gap-1 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(280px,31%)] xl:items-start xl:gap-x-2 xl:gap-y-1">
        {/* Left column row 1 / mobile order 1: video */}
        <section className="order-1 min-w-0 overflow-hidden rounded-2xl border border-border/45 bg-gradient-to-b from-card/85 via-background/70 to-surface/80 p-0.5 shadow-[var(--shadow-card)] ring-1 ring-primary/10 backdrop-blur-xl dark:border-border/40 dark:from-zinc-950/90 dark:via-zinc-950 dark:to-zinc-950/95 dark:shadow-[var(--shadow-elevated)] dark:ring-white/[0.06] xl:order-none xl:col-start-1 xl:row-start-1">
          <div className="p-0.5 sm:p-1">
            {isAudioSession && !hasAudioRecording && (
              <AudioRecorder sessionId={session.id} userId={session.user_id} onUploadComplete={() => router.refresh()} />
            )}
            {isAudioSession && hasAudioRecording && <AudioPlayer ref={mediaPlayerRef} sessionId={session.id} hasAudio={true} />}
            {isVideoSession && !hasVideoRecording && (
              <VideoRecorder sessionId={session.id} userId={session.user_id} onUploadComplete={() => router.refresh()} />
            )}
            {isVideoSession && hasVideoRecording && (
              <VideoPlayer ref={mediaPlayerRef} sessionId={session.id} hasVideo={true} compact />
            )}
            {!isAudioSession && !isVideoSession && (
              <EmptyState icon={AlertCircle} title="Configuration Missing" description="This session doesn't have a recording type configured." />
            )}
          </div>
        </section>

        {/* Right column / mobile order 2: compact AI Coach — spans left-column rows so row 1 height matches video only */}
        <aside className="order-2 min-w-0 xl:order-none xl:col-start-2 xl:row-start-1 xl:row-span-3 xl:self-start">
          <section className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.14] via-card/80 to-card/60 p-3 shadow-[var(--shadow-card)] ring-1 ring-primary/10 backdrop-blur-xl sm:p-4">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--primary),transparent_55%)] opacity-[0.12]" />
            <div className="relative mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/80">Companion</p>
                <h2 className="text-base font-semibold tracking-[-0.03em] text-foreground">AI Coach</h2>
                <p className="text-xs font-medium text-muted-foreground/85">Summary and analysis controls.</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 shadow-[0_0_20px_-6px_var(--primary)]">
                <Sparkles className="h-4 w-4 shrink-0 text-primary" />
              </div>
            </div>

            <div className="relative mb-3 space-y-2">
              {displayScore !== null && <ScoreSnapshot score={displayScore} />}

              {coachPreviewText && (
                <div className="rounded-xl border border-border/35 bg-background/45 p-3 backdrop-blur-sm">
                  <div className="mb-1.5 flex items-center gap-2 border-l-2 border-primary/50 pl-2">
                    <SectionLabel>Summary</SectionLabel>
                  </div>
                  <p className="line-clamp-3 text-sm font-medium leading-6 text-muted-foreground/90">
                    {coachPreviewText}
                  </p>
                </div>
              )}

              {topActionItems.length > 0 && (
                <div className="rounded-xl border border-border/35 bg-background/45 p-3 backdrop-blur-sm">
                  <SectionLabel>Top actions</SectionLabel>
                  <div className="mt-2 space-y-1.5">
                    {topActionItems.map((item, i) => (
                      <div
                        key={`top-action-${i}`}
                        className="flex items-start gap-2 rounded-lg border border-transparent px-1 py-0.5 transition-colors hover:border-border/40 hover:bg-background/50"
                      >
                        {item.priority && (
                          <span className={cn('mt-1.5 inline-flex shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider', PRIORITY_PILL_CLASS[item.priority])}>
                            {item.priority}
                          </span>
                        )}
                        <span className="line-clamp-2 text-sm font-medium leading-6 text-foreground">{item.title}</span>
                      </div>
                    ))}
                  </div>
                  {actionItems.length > topActionItems.length && (
                    <p className="mt-2 text-[11px] font-medium text-muted-foreground">
                      {actionItems.length - topActionItems.length} more in the full report below.
                    </p>
                  )}
                </div>
              )}
            </div>

            <AIActionsPanel sessionId={session.id} initialJobs={initialAIJobs} onOutputsChange={handleAIOutputsChange} />
          </section>
        </aside>

        {/* Left column row 2 / mobile order 3: transcript workspace */}
        <section className="order-3 min-w-0 rounded-2xl border border-border/40 bg-gradient-to-b from-background/80 via-background/65 to-background/55 px-3 py-2 shadow-[var(--shadow-soft)] backdrop-blur-sm sm:px-4 sm:py-3 xl:order-none xl:col-start-1 xl:row-start-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-2">
            <TabsList className="h-auto w-full justify-start gap-0.5 overflow-x-auto rounded-xl border border-border/35 bg-muted/40 p-0.5 backdrop-blur-sm">
              <TabsTrigger value="transcript" active={activeTab === 'transcript'} className="h-8 gap-1.5 rounded-lg px-3 text-xs data-[state=active]:shadow-sm">
                <MessageSquare className="h-3.5 w-3.5" />
                Transcript
              </TabsTrigger>
              <TabsTrigger value="notes" active={activeTab === 'notes'} className="h-8 gap-1.5 rounded-lg px-3 text-xs data-[state=active]:shadow-sm">
                <FileText className="h-3.5 w-3.5" />
                Notes
              </TabsTrigger>
              <TabsTrigger value="bookmarks" active={activeTab === 'bookmarks'} className="h-8 gap-1.5 rounded-lg px-3 text-xs data-[state=active]:shadow-sm">
                <Bookmark className="h-3.5 w-3.5" />
                Bookmarks
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transcript" active={activeTab === 'transcript'}>
              <TranscriptEditor sessionId={session.id} refreshKey={latestTranscriptOutput?.id ?? null} />
            </TabsContent>
            <TabsContent value="notes" active={activeTab === 'notes'}>
              <SessionNoteEditor sessionId={session.id} />
            </TabsContent>
            <TabsContent value="bookmarks" active={activeTab === 'bookmarks'}>
              <BookmarksList sessionId={session.id} initialBookmarks={initialBookmarks} mediaPlayerRef={mediaPlayerRef} />
            </TabsContent>
          </Tabs>
        </section>

        {/* Left column row 3 / mobile order 4: detailed report */}
        {(displayScore !== null || hasAIInsights) && (
          <section className="order-4 min-w-0 rounded-2xl border border-border/40 bg-gradient-to-b from-card/70 via-card/60 to-background/50 p-4 shadow-[var(--shadow-soft)] backdrop-blur-sm sm:p-5 xl:order-none xl:col-start-1 xl:row-start-3">
            <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <SectionLabel>Detailed analysis</SectionLabel>
                <h2 className="mt-1 text-base font-semibold tracking-[-0.03em] text-foreground">Interview report</h2>
                <p className="text-xs font-medium text-muted-foreground/85">Score, rubric breakdown, and coaching feedback.</p>
              </div>
              <Badge variant={aiScore === null ? 'secondary' : 'success'} className="rounded-full">
                {aiScore === null ? 'Pending' : 'Scored'}
              </Badge>
            </div>

            {displayScore !== null ? (
              <div className="space-y-4">
                <CircularScoreGauge value={displayScore} label="Interview score" helper="Composite score from the latest AI report." />

                {rubricSignals.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold tracking-[-0.02em] text-foreground">Rubric breakdown</h3>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {rubricSignals.map((item) => (
                        <ProgressRing key={item.label} value={item.value} label={item.label} />
                      ))}
                    </div>
                  </div>
                )}

                {(scoreFeedback || summaryText) && (
                  <div className="rounded-xl border border-border/35 bg-gradient-to-br from-background/70 to-background/40 p-4 backdrop-blur-sm">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-warning/20 bg-warning/10">
                        <Lightbulb className="h-4 w-4 text-warning" />
                      </div>
                      <h3 className="text-sm font-semibold tracking-[-0.02em] text-foreground">Coaching feedback</h3>
                    </div>
                    <p className="text-sm font-medium leading-7 text-muted-foreground/90">
                      {scoreFeedback || summaryText}
                    </p>
                  </div>
                )}

                {summaryBullets.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold tracking-[-0.02em] text-foreground">Key takeaways</h3>
                    <div className="grid gap-2 md:grid-cols-2">
                      {summaryBullets.map((bullet, i) => (
                        <div key={i} className="rounded-xl border border-border/35 bg-background/45 p-3 text-sm font-medium leading-6 text-muted-foreground/90 transition-colors hover:border-border/60 hover:bg-background/60">
                          {bullet}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {actionItems.length > 0 && (
                  <div className="border-t border-border/60 pt-4">
                    <div className="mb-3 flex items-center gap-2">
                      <ListChecks className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">Full action plan</h3>
                    </div>
                    <div className="space-y-2">
                      {actionItems.map((item, i) => (
                        <div key={`action-item-${i}`} className="rounded-xl border border-border/35 bg-background/45 p-3 transition-colors hover:border-primary/15 hover:bg-background/60">
                          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold leading-6 text-foreground">
                            {item.priority && (
                              <span className={cn('inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider', PRIORITY_PILL_CLASS[item.priority])}>
                                {item.priority}
                              </span>
                            )}
                            {item.title}
                          </p>
                          {item.description && <p className="mt-1 text-sm font-medium leading-6 text-muted-foreground/85">{item.description}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {(scoreFeedback || summaryText) && (
                  <div className="rounded-xl border border-border/35 bg-gradient-to-br from-background/70 to-background/40 p-4 backdrop-blur-sm">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-warning/20 bg-warning/10">
                        <Lightbulb className="h-4 w-4 text-warning" />
                      </div>
                      <h3 className="text-sm font-semibold tracking-[-0.02em] text-foreground">Coaching feedback</h3>
                    </div>
                    <p className="text-sm font-medium leading-7 text-muted-foreground/90">
                      {scoreFeedback || summaryText}
                    </p>
                  </div>
                )}

                {summaryBullets.length > 0 && (
                  <div className="grid gap-2 md:grid-cols-2">
                    {summaryBullets.map((bullet, i) => (
                      <div key={i} className="rounded-xl border border-border/35 bg-background/45 p-3 text-sm font-medium leading-6 text-muted-foreground/90">
                        {bullet}
                      </div>
                    ))}
                  </div>
                )}

                {actionItems.length > 0 && (
                  <div className="space-y-2">
                    {actionItems.map((item, i) => (
                      <div key={`action-item-${i}`} className="rounded-xl border border-border/35 bg-background/45 p-3">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold leading-6 text-foreground">
                          {item.priority && (
                            <span className={cn('inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider', PRIORITY_PILL_CLASS[item.priority])}>
                              {item.priority}
                            </span>
                          )}
                          {item.title}
                        </p>
                        {item.description && <p className="mt-1 text-sm font-medium leading-6 text-muted-foreground/85">{item.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
