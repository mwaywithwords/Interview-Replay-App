'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { updateSession, deleteSession } from '@/app/actions/sessions';
import { Button } from '@/components/ui/button';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
} from 'lucide-react';
import type { InterviewSession, SessionType, SessionMetadata } from '@/types';
import { AudioRecorder } from '@/components/AudioRecorder';
import { AudioPlayer } from '@/components/AudioPlayer';
import { VideoRecorder } from '@/components/VideoRecorder';
import { VideoPlayer } from '@/components/VideoPlayer';

interface SessionDetailProps {
  session: InterviewSession;
}

function getSessionTypeLabel(type: string | undefined): string {
  const labels: Record<string, string> = {
    mock_interview: 'Mock Interview',
    technical: 'Technical',
    behavioral: 'Behavioral',
    custom: 'Custom',
  };
  return labels[type || ''] || 'Unknown';
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    draft: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    recording: 'bg-red-500/20 text-red-300 border-red-500/30',
    processing: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    ready: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    archived: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  return (
    <span
      className={`rounded-full border px-3 py-1 text-sm font-medium ${styles[status] || styles.draft}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
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

  // Form state
  const [title, setTitle] = useState(session.title);
  const [sessionType, setSessionType] = useState<SessionType>(
    metadata?.session_type || 'mock_interview'
  );
  const [prompt, setPrompt] = useState(metadata?.prompt || '');

  function handleCancelEdit() {
    setTitle(session.title);
    setSessionType(metadata?.session_type || 'mock_interview');
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
      // The deleteSession action redirects to /dashboard
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsDeleting(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-slate-950">
      {/* Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400">
                <svg
                  className="h-5 w-5 text-slate-900"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-lg font-bold text-white">
                Interview Replay
              </span>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto max-w-4xl px-8 py-12">
          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          {error && (
            <Alert
              variant="destructive"
              className="mb-6 border-red-500/30 bg-red-500/10"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-300">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Audio Recorder Section */}
          <div className="mb-6">
            <AudioRecorder
              sessionId={session.id}
              userId={session.user_id}
              onRecordingComplete={(blob) => {
                console.log('Audio recording complete:', blob.type, blob.size);
              }}
              onUploadComplete={(storagePath) => {
                console.log('Audio uploaded to:', storagePath);
                router.refresh();
              }}
            />
          </div>

          {/* Audio Player Section - for playback of recorded audio */}
          <div className="mb-6">
            <AudioPlayer
              sessionId={session.id}
              hasAudio={!!session.audio_storage_path}
            />
          </div>

          {/* Video Recorder Section */}
          <div className="mb-6">
            <VideoRecorder
              sessionId={session.id}
              userId={session.user_id}
              onRecordingComplete={(blob) => {
                console.log('Video recording complete:', blob.type, blob.size);
              }}
              onUploadComplete={(storagePath) => {
                console.log('Video uploaded to:', storagePath);
                router.refresh();
              }}
            />
          </div>

          {/* Video Player Section - for playback of recorded video */}
          <div className="mb-6">
            <VideoPlayer
              sessionId={session.id}
              hasVideo={!!session.video_storage_path}
            />
          </div>

          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-slate-300">
                      Session Title
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="max-w-md border-slate-700 bg-slate-800 text-white focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                ) : (
                  <>
                    <CardTitle className="text-2xl text-white">
                      {session.title}
                    </CardTitle>
                    <CardDescription className="mt-2 text-slate-400">
                      {getSessionTypeLabel(metadata?.session_type)}
                    </CardDescription>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {!isEditing && getStatusBadge(session.status)}
                {!isEditing ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setIsEditing(true)}
                    className="text-slate-400 hover:bg-slate-800 hover:text-white"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={handleCancelEdit}
                      disabled={isLoading}
                      className="text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={handleSave}
                      disabled={isLoading || !title.trim()}
                      className="text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Metadata */}
              <div className="flex gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Created{' '}
                  {new Date(session.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
                {session.updated_at !== session.created_at && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Updated{' '}
                    {new Date(session.updated_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                )}
              </div>

              {/* Session Type (Editing) */}
              {isEditing && (
                <div className="space-y-2">
                  <Label htmlFor="session_type" className="text-slate-300">
                    Session Type
                  </Label>
                  <Select
                    value={sessionType}
                    onValueChange={(value: SessionType) =>
                      setSessionType(value)
                    }
                  >
                    <SelectTrigger className="max-w-md border-slate-700 bg-slate-800 text-white focus:border-emerald-500 focus:ring-emerald-500">
                      <SelectValue placeholder="Select session type" />
                    </SelectTrigger>
                    <SelectContent className="border-slate-700 bg-slate-800">
                      <SelectItem
                        value="mock_interview"
                        className="text-white focus:bg-slate-700"
                      >
                        Mock Interview
                      </SelectItem>
                      <SelectItem
                        value="technical"
                        className="text-white focus:bg-slate-700"
                      >
                        Technical
                      </SelectItem>
                      <SelectItem
                        value="behavioral"
                        className="text-white focus:bg-slate-700"
                      >
                        Behavioral
                      </SelectItem>
                      <SelectItem
                        value="custom"
                        className="text-white focus:bg-slate-700"
                      >
                        Custom
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Prompt */}
              <div className="space-y-2">
                <Label className="text-slate-300">Prompt</Label>
                {isEditing ? (
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter any specific questions or topics..."
                    rows={4}
                    className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                ) : (
                  <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                    {metadata?.prompt ? (
                      <p className="text-slate-300 whitespace-pre-wrap">
                        {metadata.prompt}
                      </p>
                    ) : (
                      <p className="text-slate-500 italic">No prompt set</p>
                    )}
                  </div>
                )}
              </div>

              {/* Delete Section */}
              <div className="border-t border-slate-700 pt-6">
                {!showDeleteConfirm ? (
                  <Button
                    variant="ghost"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-red-400 hover:bg-red-500/20 hover:text-red-300"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Session
                  </Button>
                ) : (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                    <p className="mb-4 text-sm text-red-300">
                      Are you sure you want to delete this session? This action
                      cannot be undone.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeleting}
                        className="border-slate-600 text-slate-300 hover:bg-slate-800"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-red-600 text-white hover:bg-red-700"
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          'Delete'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
