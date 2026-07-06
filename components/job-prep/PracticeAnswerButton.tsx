'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { startInterviewAnswerPractice } from '@/app/actions/job-prep-answers';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, Mic, Play, Video } from 'lucide-react';
import type { InterviewQuestion, RecordingType } from '@/types';
import { toast } from 'sonner';

interface PracticeAnswerButtonProps {
  question: InterviewQuestion;
  variant?: 'default' | 'compact';
}

export function PracticeAnswerButton({
  question,
  variant = 'default',
}: PracticeAnswerButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart(recordingType: RecordingType) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await startInterviewAnswerPractice(question.id, recordingType);

      if (result.error || !result.sessionId) {
        setError(result.error ?? 'Failed to start practice session.');
        toast.error('Could not start practice session', {
          description: result.error ?? 'Unknown error',
        });
        return;
      }

      toast.success(
        result.reused ? 'Resuming your practice session' : 'Practice session ready'
      );
      setIsOpen(false);
      router.push(`/sessions/${result.sessionId}`);
    } catch {
      setError('An unexpected error occurred. Please try again.');
      toast.error('Failed to start practice session');
    } finally {
      setIsLoading(false);
    }
  }

  if (variant === 'compact') {
    return (
      <SecondaryButton
        size="sm"
        variant="outline"
        className="rounded-full"
        disabled={isLoading}
        onClick={() => void handleStart('audio')}
      >
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Play className="h-3.5 w-3.5" />
        )}
        Practice
      </SecondaryButton>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <PrimaryButton size="sm" className="rounded-full">
          <Play className="h-3.5 w-3.5" />
          Practice Answer
        </PrimaryButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Practice this answer</DialogTitle>
          <DialogDescription>
            Record your answer using the existing ReplayAI session recorder. Your recording
            will be linked to this Job Prep question for review and AI feedback.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-3 py-2">
          <PrimaryButton
            className="h-auto justify-start rounded-2xl px-4 py-4"
            disabled={isLoading}
            onClick={() => void handleStart('audio')}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
            <div className="text-left">
              <p className="font-semibold">Audio answer</p>
              <p className="text-xs font-medium opacity-80">
                Recommended for most interview practice
              </p>
            </div>
          </PrimaryButton>

          <SecondaryButton
            className="h-auto justify-start rounded-2xl px-4 py-4"
            disabled={isLoading}
            variant="outline"
            onClick={() => void handleStart('video')}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Video className="h-5 w-5" />
            )}
            <div className="text-left">
              <p className="font-semibold">Video answer</p>
              <p className="text-xs font-medium opacity-80">
                Practice delivery, eye contact, and pacing
              </p>
            </div>
          </SecondaryButton>
        </div>

        <DialogFooter>
          <SecondaryButton variant="ghost" onClick={() => setIsOpen(false)} disabled={isLoading}>
            Cancel
          </SecondaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
