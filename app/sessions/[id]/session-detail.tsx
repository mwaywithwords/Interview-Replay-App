'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { updateSession, deleteSession } from '@/app/actions/sessions';
import { generateSessionShareToken, revokeSessionShare, getSessionShares } from '@/app/actions/shares';
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
} from 'lucide-react';
import type { SessionShare } from '@/types';
import type { InterviewSession, SessionType, SessionMetadata, Bookmark as BookmarkType } from '@/types';
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
import { cn } from '@/lib/utils';

interface SessionDetailProps {
  session: InterviewSession;
  initialBookmarks: BookmarkType[];
}

function getSessionTypeLabel(type: string | undefined): string {
  const labels: Record<string, string> = {
    interview: 'Interview',
    trading: 'Trading',
  };
  return labels[type || ''] || 'Unknown';
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "success" | "warning" | "info" | "destructive" | "secondary"> = {
    draft: "secondary",
    recording: "destructive",
    processing: "warning",
    ready: "success",
    archived: "secondary",
  };

  return (
    <Badge variant={variants[status] || "secondary"} className="uppercase tracking-wider text-[10px] px-3 py-1">
      {status}
    </Badge>
  );
}

export function SessionDetail({ session, initialBookmarks }: SessionDetailProps) {
  const router = useRouter();
  const metadata = session.metadata as SessionMetadata;

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
  const hasAudioRecording = isAudioSession && session.audio_storage_path !== null;
  const hasVideoRecording = isVideoSession && session.video_storage_path !== null;
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
        return;
      }

      setIsEditing(false);
      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
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
        setIsDeleting(false);
        return;
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
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
        return;
      }

      if (result.shareUrl && result.share) {
        setShareUrl(result.shareUrl);
        setExistingShares((prev) => [result.share!, ...prev]);
      }
    } catch (err) {
      setShareError('Failed to generate share link. Please try again.');
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
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }

  // Copy any URL to clipboard
  async function handleCopyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }

  // Revoke a share link
  async function handleRevokeShare(shareId: string) {
    setRevokingShareId(shareId);

    try {
      const { success, error } = await revokeSessionShare(shareId);

      if (error) {
        setShareError(error);
        return;
      }

      if (success) {
        setExistingShares((prev) => prev.filter((s) => s.id !== shareId));
        // Clear the displayed URL if it was the revoked share
        setShareUrl(null);
      }
    } catch (err) {
      setShareError('Failed to revoke share link. Please try again.');
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
    <div className="max-w-[1400px] mx-auto px-6 py-10">
      <div className="mb-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Sessions
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card p-6 rounded-2xl border border-border shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <StatusBadge status={session.status} />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                {isAudioSession ? <Mic className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                {getSessionTypeLabel(sessionType)}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{session.title}</h1>
            <div className="flex items-center gap-6 text-sm text-muted-foreground font-bold">
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                {new Date(session.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                {new Date(session.created_at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isEditing && (
              <>
                {/* Share Button */}
                <Dialog open={isShareDialogOpen} onOpenChange={handleShareDialogChange}>
                  <DialogTrigger asChild>
                    <SecondaryButton size="sm" className="rounded-full px-4 border-border bg-muted/50 hover:bg-accent text-foreground transition-colors">
                      <Share2 className="h-4 w-4 mr-2 text-muted-foreground" />
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

                      {/* Generate new share link */}
                      {!shareUrl && (
                        <PrimaryButton
                          onClick={handleGenerateShareLink}
                          disabled={isGeneratingShare}
                          className="w-full"
                        >
                          {isGeneratingShare ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <LinkIcon className="h-4 w-4 mr-2" />
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
                          <p className="text-xs text-muted-foreground">
                            Anyone with this link can view the session in read-only mode.
                          </p>
                        </div>
                      )}

                      {/* Existing shares */}
                      {existingShares.length > 0 && (
                        <div className="space-y-3 pt-4 border-t">
                          <Label className="text-muted-foreground">Active Share Links ({existingShares.length})</Label>
                          <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {existingShares.map((share) => {
                              const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                              const url = `${baseUrl}/share/${share.share_token}`;
                              return (
                                <div
                                  key={share.id}
                                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border"
                                >
                                  <div className="flex-1 min-w-0 mr-2">
                                    <p className="text-xs font-mono truncate text-muted-foreground">
                                      {share.share_token.slice(0, 20)}...
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                      Created {new Date(share.created_at).toLocaleDateString()}
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
                                      className="h-7 w-7 text-destructive hover:text-destructive"
                                      onClick={() => handleRevokeShare(share.id)}
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
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <SecondaryButton size="sm" onClick={() => setIsEditing(true)} className="rounded-full px-4 border-border bg-muted/50 hover:bg-accent text-foreground transition-colors">
                  <Settings2 className="h-4 w-4 mr-2 text-muted-foreground" />
                  Session Settings
                </SecondaryButton>
              </>
            )}
            {isEditing && (
              <div className="flex items-center gap-2">
                <SecondaryButton size="sm" onClick={handleCancelEdit} disabled={isLoading} className="rounded-full px-4 border-border">
                  Cancel
                </SecondaryButton>
                <PrimaryButton size="sm" onClick={handleSave} disabled={isLoading || !title.trim()} className="rounded-full px-5 shadow-lg shadow-primary/20">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
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
          <div className="grid md:grid-cols-2 gap-6">
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
          
          <div className="mt-6 pt-6 border-t border-border flex justify-end">
            {!showDeleteConfirm ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete Session
              </Button>
            ) : (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Are you sure?</span>
                <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isDeleting}>
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </Button>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        {/* Left Column */}
        <div className="space-y-8">
          {/* Recording/Playback Section */}
          <SectionCard className="p-0 border-none bg-transparent shadow-none">
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-muted p-1 rounded-xl w-full justify-start gap-1 h-12 border border-border">
              <TabsTrigger 
                value="transcript" 
                active={activeTab === 'transcript'} 
                className="rounded-lg gap-2 px-4 h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary"
              >
                <MessageSquare className="w-4 h-4" />
                Transcript
              </TabsTrigger>
              <TabsTrigger 
                value="notes" 
                active={activeTab === 'notes'} 
                className="rounded-lg gap-2 px-4 h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary"
              >
                <FileText className="w-4 h-4" />
                Notes
              </TabsTrigger>
              <TabsTrigger 
                value="bookmarks" 
                active={activeTab === 'bookmarks'} 
                className="rounded-lg gap-2 px-4 h-10 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary"
              >
                <Bookmark className="w-4 h-4" />
                Bookmarks
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transcript" active={activeTab === 'transcript'}>
              <SectionCard title="Session Transcript" className="bg-card border-border">
                <TranscriptEditor sessionId={session.id} />
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
          {/* Speech Analysis */}
          <SectionCard title="Performance Metrics" className="bg-card border-border">
            <div className="space-y-8">
              <div className="group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-amber-500" />
                    </div>
                    Filler Words
                  </span>
                  <span className="text-xl font-black text-foreground">12</span>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full w-[70%] group-hover:scale-x-105 transition-all duration-500 origin-left" />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground font-medium">Try to reduce 'um' and 'like' usage by 20%.</p>
              </div>
              
              <div className="group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-muted-foreground flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                      <Activity className="w-4 h-4 text-emerald-500" />
                    </div>
                    Pace
                  </span>
                  <span className="text-xl font-black text-foreground">135 <span className="text-xs font-normal text-muted-foreground">wpm</span></span>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[85%] group-hover:scale-x-105 transition-all duration-500 origin-left" />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground font-medium">Excellent! You are within the ideal speaking range.</p>
              </div>
            </div>
          </SectionCard>

          {/* AI Feedback */}
          <SectionCard 
            title="AI Insights" 
            className="bg-card border-border"
            headerActions={
              <button className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest transition-colors">
                Full Report
              </button>
            }
          >
            <div className="space-y-4">
              <div className="flex gap-4 p-4 rounded-xl bg-muted/30 border border-border hover:bg-muted/50 hover:border-primary/20 transition-all group">
                <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shrink-0 shadow-sm border border-border">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  Good explanation of <span className="text-foreground font-bold">product strategy</span> and how it aligns with user needs.
                </p>
              </div>
              <div className="flex gap-4 p-4 rounded-xl bg-muted/30 border border-border hover:bg-muted/50 hover:border-primary/20 transition-all group">
                <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shrink-0 shadow-sm border border-border">
                  <Activity className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  Improve on <span className="text-foreground font-bold">structuring</span> your answers using the STAR method.
                </p>
              </div>
            </div>
          </SectionCard>

          {/* Key Moments */}
          <SectionCard title="Jump to Moments" className="bg-card border-border">
            <div className="space-y-3">
              {[
                { time: "03:10", label: "Strengths & Weaknesses", icon: MessageSquare },
                { time: "07:45", label: "Case Study Question", icon: Lightbulb },
                { time: "12:30", label: "Follow-up Questions", icon: Activity }
              ].map((moment, i) => (
                <button 
                  key={i}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl border border-transparent hover:border-border hover:bg-muted/50 transition-all group text-left shadow-sm bg-muted/30"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors border border-border">
                      <moment.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">{moment.time}</span>
                      <span className="text-sm font-bold text-foreground">{moment.label}</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-border">
                    <Play className="h-3 w-3 fill-current text-primary" />
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
