'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSession } from '@/app/actions/sessions';
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
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import type { SessionType } from '@/types';

export default function NewSessionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [sessionType, setSessionType] = useState<SessionType>('mock_interview');
  const [prompt, setPrompt] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { session, error: createError } = await createSession({
        title: title.trim(),
        session_type: sessionType,
        prompt: prompt.trim() || undefined,
      });

      if (createError) {
        setError(createError);
        return;
      }

      if (session) {
        router.push(`/sessions/${session.id}`);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
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
        <main className="mx-auto max-w-2xl px-8 py-12">
          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-2xl text-white">
                Create New Session
              </CardTitle>
              <CardDescription className="text-slate-400">
                Set up a new interview practice session.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert
                    variant="destructive"
                    className="border-red-500/30 bg-red-500/10"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-red-300">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-slate-300">
                    Session Title *
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Frontend Developer Interview Practice"
                    required
                    className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session_type" className="text-slate-300">
                    Session Type *
                  </Label>
                  <Select
                    value={sessionType}
                    onValueChange={(value: SessionType) =>
                      setSessionType(value)
                    }
                  >
                    <SelectTrigger className="border-slate-700 bg-slate-800 text-white focus:border-emerald-500 focus:ring-emerald-500">
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

                <div className="space-y-2">
                  <Label htmlFor="prompt" className="text-slate-300">
                    Prompt (Optional)
                  </Label>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter any specific questions or topics you want to focus on..."
                    rows={4}
                    className="border-slate-700 bg-slate-800 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                  <p className="text-sm text-slate-500">
                    Add context or specific questions to guide your practice
                    session.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard')}
                    className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || !title.trim()}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Session'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
