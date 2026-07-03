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
  Pencil,
  Trash2,
  Save,
  X,
  Clock,
  Calendar,
  ChevronRight,
  Play,
  FileText,
  MessageSquare,
  Bookmark,
  Activity,
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
import { PageHeader } from '@/components/layout/PageHeader';
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

const PRIORITY_DOT_COLOR: Record<'high' | 'medium' | 'low', string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-muted-foreground',
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

function getSessionTypeLabel(type: string | undefined): string {
  const labels: Record<string, string> = {
    interview: 'Interview',
    trading: 'Trading',
  };
  return labels[type || ''] || 'Unknown';
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
      className="px-3 py-1 text-[10px] tracking-wider uppercase"
    >
      {status}
    </Badge>
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
  const { summary: summaryText, bullets: summaryBullets } =
    getSummaryInsights(latestSummaryOutput);
  const actionItems = getActionItems(latestActionItemsOutput);
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
  const isReady = session.status === 'ready';

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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10">
      <div className="mb-10">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-primary group mb-6 inline-flex items-center gap-2 text-sm font-bold transition-colors"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Sessions
        </Link>

        <div className="bg-card border-border flex flex-col justify-between gap-6 rounded-2xl border p-6 shadow-sm md:flex-row md:items-center">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <StatusBadge status={session.status} />
              <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase">
                {isAudioSession ? (
                  <Mic className="h-3 w-3" />
                ) : (
                  <Video className="h-3 w-3" />
                )}
                {getSessionTypeLabel(sessionType)}
              </span>
            </div>
            <h1 className="text-foreground text-3xl font-extrabold tracking-tight">
              {session.title}
            </h1>
            <div className="text-muted-foreground flex items-center gap-6 text-sm font-bold">
              <span className="flex items-center gap-2">
                <Calendar className="text-muted-foreground h-4 w-4" />
                {new Date(session.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="text-muted-foreground h-4 w-4" />
                {new Date(session.created_at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isEditing && (
              <>
                {/* Share Button */}
                <Dialog
                  open={isShareDialogOpen}
                  onOpenChange={handleShareDialogChange}
                >
                  <DialogTrigger asChild>
                    <SecondaryButton
                      size="sm"
                      className="border-border bg-muted/50 hover:bg-accent text-foreground rounded-full px-4 transition-colors"
                    >
                      <Share2 className="text-muted-foreground mr-2 h-4 w-4" />
                      Share
                    </SecondaryButton>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5" />
                        Share Session
                      </DialogTitle>
                      <DialogDescription>
                        Create a secure link to share this session. Anyone with
                        the link can view the replay in read-only mode.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                      {shareError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{shareError}</AlertDescription>
                        </Alert>
                      )}

                      {/* Generate new share link */}
                      {!shareUrl && (
                        <PrimaryButton
                          onClick={handleGenerateShareLink}
                          disabled={isGeneratingShare}
                          className="w-full"
                        >
                          {isGeneratingShare ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <LinkIcon className="mr-2 h-4 w-4" />
                              Generate Share Link
                            </>
                          )}
                        </PrimaryButton>
                      )}

                      {/* Display generated share link */}
                      {shareUrl && (
                        <div className="space-y-3">
                          <Label>Share Link</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              value={shareUrl}
                              readOnly
                              className="font-mono text-sm"
                            />
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={handleCopyShareUrl}
                              className="shrink-0"
                            >
                              {copied ? (
                                <Check className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-muted-foreground text-xs">
                            Anyone with this link can view the session in
                            read-only mode.
                          </p>
                        </div>
                      )}

                      {/* Existing shares */}
                      {existingShares.length > 0 && (
                        <div className="space-y-3 border-t pt-4">
                          <Label className="text-muted-foreground">
                            Active Share Links ({existingShares.length})
                          </Label>
                          <div className="max-h-[200px] space-y-2 overflow-y-auto">
                            {existingShares.map((share) => {
                              const baseUrl =
                                typeof window !== 'undefined'
                                  ? window.location.origin
                                  : '';
                              const url = `${baseUrl}/share/${share.share_token ?? ''}`;
                              return (
                                <div
                                  key={share.id}
                                  className="bg-muted/50 border-border flex items-center justify-between rounded-lg border p-2"
                                >
                                  <div className="mr-2 min-w-0 flex-1">
                                    <p className="text-muted-foreground truncate font-mono text-xs">
                                      {share.share_token?.slice(0, 20) ?? 'N/A'}
                                      ...
                                    </p>
                                    <p className="text-muted-foreground text-[10px]">
                                      Created{' '}
                                      {new Date(
                                        share.created_at
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                      onClick={() => handleCopyUrl(url)}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="text-destructive hover:text-destructive h-7 w-7"
                                      onClick={() =>
                                        handleRevokeShare(share.id)
                                      }
                                      disabled={revokingShareId === share.id}
                                    >
                                      {revokingShareId === share.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Trash className="h-3 w-3" />
                                      )}
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
                          <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <SecondaryButton
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="border-border bg-muted/50 hover:bg-accent text-foreground rounded-full px-4 transition-colors"
                >
                  <Settings2 className="text-muted-foreground mr-2 h-4 w-4" />
                  Session Settings
                </SecondaryButton>
              </>
            )}
            {isEditing && (
              <div className="flex items-center gap-2">
                <SecondaryButton
                  size="sm"
                  onClick={handleCancelEdit}
                  disabled={isLoading}
                  className="border-border rounded-full px-4"
                >
                  Cancel
                </SecondaryButton>
                <PrimaryButton
                  size="sm"
                  onClick={handleSave}
                  disabled={isLoading || !title.trim()}
                  className="shadow-primary/20 rounded-full px-5 shadow-lg"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Changes
                </PrimaryButton>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isEditing && (
        <SectionCard className="mb-8" title="Edit Session Information">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Session Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Google Mock Interview"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session_type">Session Type</Label>
                <Select
                  value={sessionType}
                  onValueChange={(value: SessionType) => setSessionType(value)}
                >
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
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Job description, specific questions, etc."
                className="h-[110px]"
              />
            </div>
          </div>

          <div className="border-border mt-6 flex justify-end border-t pt-6">
            {!showDeleteConfirm ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete Session
              </Button>
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground text-sm">
                  Are you sure?
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </Button>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Recording/Playback Section */}
          <SectionCard className="border-none bg-transparent p-0 shadow-none">
            {isAudioSession && !hasAudioRecording && (
              <AudioRecorder
                sessionId={session.id}
                userId={session.user_id}
                onUploadComplete={() => {
                  router.refresh();
                }}
              />
            )}
            {isAudioSession && hasAudioRecording && (
              <AudioPlayer
                ref={mediaPlayerRef}
                sessionId={session.id}
                hasAudio={true}
              />
            )}
            {isVideoSession && !hasVideoRecording && (
              <VideoRecorder
                sessionId={session.id}
                userId={session.user_id}
                onUploadComplete={() => {
                  router.refresh();
                }}
              />
            )}
            {isVideoSession && hasVideoRecording && (
              <VideoPlayer
                ref={mediaPlayerRef}
                sessionId={session.id}
                hasVideo={true}
              />
            )}
            {!isAudioSession && !isVideoSession && (
              <EmptyState
                icon={AlertCircle}
                title="Configuration Missing"
                description="This session doesn't have a recording type configured."
              />
            )}
          </SectionCard>

          {/* Tabbed Content */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="bg-muted border-border h-12 w-full justify-start gap-1 rounded-xl border p-1">
              <TabsTrigger
                value="transcript"
                active={activeTab === 'transcript'}
                className="data-[state=active]:bg-background data-[state=active]:text-primary h-10 gap-2 rounded-lg px-4 data-[state=active]:shadow-sm"
              >
                <MessageSquare className="h-4 w-4" />
                Transcript
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                active={activeTab === 'notes'}
                className="data-[state=active]:bg-background data-[state=active]:text-primary h-10 gap-2 rounded-lg px-4 data-[state=active]:shadow-sm"
              >
                <FileText className="h-4 w-4" />
                Notes
              </TabsTrigger>
              <TabsTrigger
                value="bookmarks"
                active={activeTab === 'bookmarks'}
                className="data-[state=active]:bg-background data-[state=active]:text-primary h-10 gap-2 rounded-lg px-4 data-[state=active]:shadow-sm"
              >
                <Bookmark className="h-4 w-4" />
                Bookmarks
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transcript" active={activeTab === 'transcript'}>
              <SectionCard
                title="Session Transcript"
                className="bg-card border-border"
              >
                <TranscriptEditor
                  sessionId={session.id}
                  refreshKey={latestTranscriptOutput?.id ?? null}
                />
              </SectionCard>
            </TabsContent>

            <TabsContent value="notes" active={activeTab === 'notes'}>
              <SectionCard title="Personal Notes">
                <SessionNoteEditor sessionId={session.id} />
              </SectionCard>
            </TabsContent>

            <TabsContent value="bookmarks" active={activeTab === 'bookmarks'}>
              <SectionCard title="Saved Moments">
                <BookmarksList
                  sessionId={session.id}
                  initialBookmarks={initialBookmarks}
                  mediaPlayerRef={mediaPlayerRef}
                />
              </SectionCard>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* AI Actions */}
          <SectionCard title="AI Actions" className="bg-card border-border">
            <AIActionsPanel
              sessionId={session.id}
              initialJobs={initialAIJobs}
              onOutputsChange={handleAIOutputsChange}
            />
          </SectionCard>

          {/*
            Speech Analysis - TODO: still placeholder data.
            Filler word count and pace both require transcript-derived timing
            (word-level timestamps), which isn't produced by ai_run_job yet.
            Wire this up once a transcript/timing analysis job type exists.
          */}
          <SectionCard
            title="Performance Metrics"
            className="bg-card border-border"
          >
            <div className="space-y-8">
              <div className="group">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2 text-sm font-bold">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                      <MessageSquare className="h-4 w-4 text-amber-500" />
                    </div>
                    Filler Words
                  </span>
                  <span className="text-foreground text-xl font-black">12</span>
                </div>
                <div className="bg-muted h-3 w-full overflow-hidden rounded-full">
                  <div className="h-full w-[70%] origin-left rounded-full bg-amber-500 transition-all duration-500 group-hover:scale-x-105" />
                </div>
                <p className="text-muted-foreground mt-2 text-[11px] font-medium">
                  Try to reduce 'um' and 'like' usage by 20%.
                </p>
              </div>

              <div className="group">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2 text-sm font-bold">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                      <Activity className="h-4 w-4 text-emerald-500" />
                    </div>
                    Pace
                  </span>
                  <span className="text-foreground text-xl font-black">
                    135{' '}
                    <span className="text-muted-foreground text-xs font-normal">
                      wpm
                    </span>
                  </span>
                </div>
                <div className="bg-muted h-3 w-full overflow-hidden rounded-full">
                  <div className="h-full w-[85%] origin-left rounded-full bg-emerald-500 transition-all duration-500 group-hover:scale-x-105" />
                </div>
                <p className="text-muted-foreground mt-2 text-[11px] font-medium">
                  Excellent! You are within the ideal speaking range.
                </p>
              </div>
            </div>
          </SectionCard>

          {/* AI Feedback - driven by the latest completed Summary and Action Items outputs */}
          <SectionCard title="AI Insights" className="bg-card border-border">
            {!hasAIInsights ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                Generate AI insights to see personalized feedback.
              </p>
            ) : (
              <div className="space-y-4">
                {summaryText && (
                  <div className="bg-muted/30 border-border hover:bg-muted/50 hover:border-primary/20 group flex gap-4 rounded-xl border p-4 transition-all">
                    <div className="bg-background border-border flex h-8 w-8 shrink-0 items-center justify-center rounded-full border shadow-sm">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                      {summaryText}
                    </p>
                  </div>
                )}

                {summaryBullets.map((bullet, i) => (
                  <div
                    key={`summary-bullet-${i}`}
                    className="bg-muted/30 border-border hover:bg-muted/50 hover:border-primary/20 group flex gap-4 rounded-xl border p-4 transition-all"
                  >
                    <div className="bg-background border-border flex h-8 w-8 shrink-0 items-center justify-center rounded-full border shadow-sm">
                      <Activity className="h-4 w-4 text-blue-500" />
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                      {bullet}
                    </p>
                  </div>
                ))}

                {actionItems.map((item, i) => (
                  <div
                    key={`action-item-${i}`}
                    className="bg-muted/30 border-border hover:bg-muted/50 hover:border-primary/20 group flex gap-4 rounded-xl border p-4 transition-all"
                  >
                    <div className="bg-background border-border flex h-8 w-8 shrink-0 items-center justify-center rounded-full border shadow-sm">
                      <ListChecks className="text-primary h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-foreground flex items-center gap-2 text-sm leading-relaxed font-bold">
                        {item.priority && (
                          <span
                            className={cn(
                              'h-1.5 w-1.5 shrink-0 rounded-full',
                              PRIORITY_DOT_COLOR[item.priority]
                            )}
                          />
                        )}
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed font-medium">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/*
            Key Moments - TODO: still placeholder data.
            Real "jump to moment" timestamps depend on either bookmarks with
            timestamps (see suggest_bookmarks job/BookmarksList) or transcript
            timing data. Wire this up to real bookmarks once that flow is
            surfaced here instead of this static sample list.
          */}
          <SectionCard
            title="Jump to Moments"
            className="bg-card border-border"
          >
            <div className="space-y-3">
              {[
                {
                  time: '03:10',
                  label: 'Strengths & Weaknesses',
                  icon: MessageSquare,
                },
                {
                  time: '07:45',
                  label: 'Case Study Question',
                  icon: Lightbulb,
                },
                { time: '12:30', label: 'Follow-up Questions', icon: Activity },
              ].map((moment, i) => (
                <button
                  key={i}
                  className="hover:border-border hover:bg-muted/50 group bg-muted/30 flex w-full items-center justify-between rounded-xl border border-transparent p-3.5 text-left shadow-sm transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-background text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary border-border flex h-10 w-10 items-center justify-center rounded-lg border transition-colors">
                      <moment.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] font-bold tracking-widest uppercase">
                        {moment.time}
                      </span>
                      <span className="text-foreground text-sm font-bold">
                        {moment.label}
                      </span>
                    </div>
                  </div>
                  <div className="bg-background border-border flex h-8 w-8 items-center justify-center rounded-full border opacity-0 transition-all group-hover:opacity-100">
                    <Play className="text-primary h-3 w-3 fill-current" />
                  </div>
                </button>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
