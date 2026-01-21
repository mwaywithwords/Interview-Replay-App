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
} from 'lucide-react';
import type { InterviewSession, SessionType, SessionMetadata } from '@/types';
import { VideoPlayer } from '@/components/VideoPlayer';
import { SectionCard } from '@/components/layout/SectionCard';
import { cn } from '@/lib/utils';

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
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsDeleting(false);
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sessions
        </Link>
        
        <div className="flex items-center gap-2">
          {!isEditing && (
            <SecondaryButton size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Edit Details
            </SecondaryButton>
          )}
          {isEditing && (
            <div className="flex items-center gap-2">
              <SecondaryButton size="sm" onClick={handleCancelEdit} disabled={isLoading}>
                Cancel
              </SecondaryButton>
              <PrimaryButton size="sm" onClick={handleSave} disabled={isLoading || !title.trim()}>
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-2" />}
                Save Changes
              </PrimaryButton>
            </div>
          )}
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
                    <SelectItem value="mock_interview">Mock Interview</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="behavioral">Behavioral</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
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
          {/* Video Player Section */}
          <SectionCard className="p-0 border-none bg-transparent shadow-none">
            <VideoPlayer
              sessionId={session.id}
              hasVideo={session.recording_type === 'video'}
            />
          </SectionCard>

          {/* Transcript Section */}
          <SectionCard title="Transcript">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Interviewer</span>
                <p className="mt-1 text-foreground leading-relaxed">
                  Can you tell me about a challenging project you worked on?
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Interviewee</span>
                <p className="mt-1 text-foreground leading-relaxed">
                  Sure, I led the launch of a new feature that increased user
                  engagement by 40%. We faced tight deadlines and had to adapt quickly. It taught
                  me a lot about prioritization and teamwork.
                </p>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Speech Analysis */}
          <SectionCard title="Speech Analysis">
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <span className="text-amber-500">🔔</span> Filler Words
                  </span>
                  <span className="text-lg font-bold">12</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 w-[70%]" />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <span className="text-emerald-500">▶</span> Talking Speed
                  </span>
                  <span className="text-lg font-bold">135 wpm</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[85%]" />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* AI Feedback */}
          <SectionCard title="AI Feedback" headerActions={<button className="text-xs text-muted-foreground hover:underline">View Detailed Report</button>}>
            <ul className="space-y-3">
              <li className="flex gap-3 text-sm">
                <span className="text-amber-500 mt-1">•</span>
                <span>Good explanation of product strategy.</span>
              </li>
              <li className="flex gap-3 text-sm">
                <span className="text-amber-500 mt-1">•</span>
                <span>Improve on structuring your answers.</span>
              </li>
              <li className="flex gap-3 text-sm">
                <span className="text-amber-500 mt-1">•</span>
                <span>Avoid saying 'um' too often.</span>
              </li>
            </ul>
          </SectionCard>

          {/* Key Moments */}
          <SectionCard title="Key Moments">
            <div className="space-y-2">
              {[
                { time: "03:10", label: "Strengths & Weaknesses" },
                { time: "07:45", label: "Case Study Question" },
                { time: "12:30", label: "Follow-up Questions" }
              ].map((moment, i) => (
                <button 
                  key={i}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground">{moment.time}</span>
                    <span className="text-sm font-medium">{moment.label}</span>
                  </div>
                  <Play className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
