'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import type {
  SharedSessionData,
  SharedBookmark,
  SharedTranscript,
  SharedSessionNote,
} from '@/types';
import { SharedMediaPlayer, type MediaPlayerRef } from '@/components/share/SharedMediaPlayer';
import { SharedBookmarksList } from '@/components/share/SharedBookmarksList';
import { SharedTranscriptViewer } from '@/components/share/SharedTranscriptViewer';
import { SharedNoteViewer } from '@/components/share/SharedNoteViewer';
import { SectionCard } from '@/components/layout/SectionCard';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import {
  Clock,
  Calendar,
  MessageSquare,
  FileText,
  Bookmark,
  Mic,
  Video,
  Eye,
  Lock,
} from 'lucide-react';

interface SharedSessionViewProps {
  token: string;
  session: SharedSessionData;
  bookmarks: SharedBookmark[];
  transcript: SharedTranscript | null;
  note: SharedSessionNote | null;
}

function getSessionTypeLabel(type: string | null | undefined): string {
  const labels: Record<string, string> = {
    interview: 'Interview',
    trading: 'Trading',
  };
  return labels[type || ''] || 'Session';
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

/**
 * SharedSessionView - Read-only replay view for shared sessions
 * 
 * Features:
 * - Read-only banner indicator
 * - Media playback (audio/video)
 * - View bookmarks, transcript, and notes
 * - No editing capabilities
 * - Theme toggle
 */
export function SharedSessionView({
  token,
  session,
  bookmarks,
  transcript,
  note,
}: SharedSessionViewProps) {
  const [activeTab, setActiveTab] = useState('transcript');
  const mediaPlayerRef = useRef<MediaPlayerRef>(null);

  const isAudioSession = session.recording_type === 'audio';
  const isVideoSession = session.recording_type === 'video';

  return (
    <div className="min-h-screen bg-background">
      {/* Read-only Banner */}
      <div className="sticky top-0 z-50 bg-amber-500/10 border-b border-amber-500/20 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                Read-only shared replay
              </p>
              <p className="text-xs text-amber-600/70 dark:text-amber-400/70">
                This session has been shared with you for viewing only
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="w-3 h-3" />
              <span>Secure link</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card p-6 rounded-2xl border border-border shadow-sm">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <StatusBadge status={session.status} />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  {isAudioSession ? <Mic className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                  {getSessionTypeLabel(session.session_type)}
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
                {session.title}
              </h1>
              <div className="flex items-center gap-6 text-sm text-muted-foreground font-bold">
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {new Date(session.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  {new Date(session.created_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            {/* Branding / Link back */}
            <div className="flex flex-col items-end gap-2">
              <Link
                href="/"
                className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
              >
                Powered by Interview Replay
              </Link>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          {/* Left Column - Media and Tabs */}
          <div className="space-y-8">
            {/* Media Player */}
            <SharedMediaPlayer
              ref={mediaPlayerRef}
              shareToken={token}
            />

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
                  <SharedTranscriptViewer transcript={transcript} />
                </SectionCard>
              </TabsContent>

              <TabsContent value="notes" active={activeTab === 'notes'}>
                <SectionCard title="Session Notes" className="bg-card border-border">
                  <SharedNoteViewer note={note} />
                </SectionCard>
              </TabsContent>

              <TabsContent value="bookmarks" active={activeTab === 'bookmarks'}>
                <SectionCard title="Saved Moments" className="bg-card border-border">
                  <SharedBookmarksList
                    bookmarks={bookmarks}
                    mediaPlayerRef={mediaPlayerRef}
                  />
                </SectionCard>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Info Panel */}
          <div className="space-y-8">
            {/* Session Info Card */}
            <SectionCard title="Session Information" className="bg-card border-border">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <span className="text-sm font-bold text-foreground capitalize">
                    {session.recording_type || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <span className="text-sm font-bold text-foreground">
                    {getSessionTypeLabel(session.session_type)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <StatusBadge status={session.status} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="text-sm text-muted-foreground">Bookmarks</span>
                  <span className="text-sm font-bold text-foreground">
                    {bookmarks.length}
                  </span>
                </div>
              </div>
            </SectionCard>

            {/* Quick Jump Bookmarks */}
            {bookmarks.length > 0 && (
              <SectionCard title="Quick Jump" className="bg-card border-border">
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {bookmarks.slice(0, 5).map((bookmark) => (
                    <button
                      key={bookmark.id}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-border hover:bg-muted/50 transition-all group text-left"
                      onClick={() => mediaPlayerRef.current?.seekToMs(bookmark.timestamp_ms)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Bookmark className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                            {formatTimestamp(bookmark.timestamp_ms)}
                          </span>
                          <span className="text-xs font-bold text-foreground truncate block max-w-[180px]">
                            {bookmark.label}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                  {bookmarks.length > 5 && (
                    <p className="text-xs text-center text-muted-foreground pt-2">
                      +{bookmarks.length - 5} more bookmarks
                    </p>
                  )}
                </div>
              </SectionCard>
            )}

            {/* Privacy Notice */}
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Privacy Notice</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This is a secure, read-only view of a shared session. 
                    No changes can be made from this view.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Shared session view</span>
            <Link
              href="/"
              className="hover:text-primary transition-colors"
            >
              Interview Replay
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Format milliseconds into MM:SS display format.
 */
function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
