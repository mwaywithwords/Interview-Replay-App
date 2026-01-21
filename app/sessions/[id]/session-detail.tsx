'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { updateSession, deleteSession } from '@/app/actions/sessions';
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
  Plus,
  FileText,
  MessageSquare,
  Bookmark,
  Activity,
  Lightbulb,
  Video,
  Mic,
  Settings2,
} from 'lucide-react';
import type { InterviewSession, SessionType, SessionMetadata } from '@/types';
import { VideoPlayer } from '@/components/VideoPlayer';
import { AudioPlayer } from '@/components/AudioPlayer';
import { VideoRecorder } from '@/components/VideoRecorder';
import { AudioRecorder } from '@/components/AudioRecorder';
import { SectionCard } from '@/components/layout/SectionCard';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/layout/EmptyState';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface SessionDetailProps {
  session: InterviewSession;
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

export function SessionDetail({ session }: SessionDetailProps) {
  const router = useRouter();
  const metadata = session.metadata as SessionMetadata;

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('transcript');

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
              <SecondaryButton size="sm" onClick={() => setIsEditing(true)} className="rounded-full px-4 border-border bg-muted/50 hover:bg-accent text-foreground transition-colors">
                <Settings2 className="h-4 w-4 mr-2 text-muted-foreground" />
                Session Settings
              </SecondaryButton>
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
                {isReady ? (
                  <div className="space-y-8 py-2">
                    <div className="group relative pl-6 border-l-2 border-border hover:border-primary/30 transition-colors">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-muted border-2 border-background group-hover:bg-primary/20 transition-colors" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Interviewer • 00:12</span>
                      <p className="text-foreground leading-relaxed font-bold">
                        Can you tell me about a challenging project you worked on?
                      </p>
                    </div>
                    <div className="group relative pl-6 border-l-2 border-border hover:border-primary/30 transition-colors">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-muted border-2 border-background group-hover:bg-primary/20 transition-colors" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Interviewee • 00:45</span>
                      <p className="text-foreground leading-relaxed font-medium">
                        Sure, I led the launch of a new feature that increased user
                        engagement by 40%. We faced tight deadlines and had to adapt quickly. It taught
                        me a lot about prioritization and teamwork.
                      </p>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icon={MessageSquare}
                    title="Transcript Pending"
                    description="Your transcript will appear here once the session is processed."
                  />
                )}
              </SectionCard>
            </TabsContent>

            <TabsContent value="notes" active={activeTab === 'notes'}>
              <SectionCard title="Personal Notes">
                <EmptyState
                  icon={FileText}
                  title="No notes yet"
                  description="Add your thoughts and reflections about this session here."
                  action={
                    <PrimaryButton variant="outline" size="sm" className="rounded-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Note
                    </PrimaryButton>
                  }
                />
              </SectionCard>
            </TabsContent>

            <TabsContent value="bookmarks" active={activeTab === 'bookmarks'}>
              <SectionCard title="Saved Moments">
                <EmptyState
                  icon={Bookmark}
                  title="No bookmarks"
                  description="Bookmark important parts of the recording to review them later."
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
