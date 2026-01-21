import Link from 'next/link';
import { requireUser } from '@/lib/supabase/server';
import { getSessions } from '@/app/actions/sessions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Plus, FileText, Clock, ArrowRight } from 'lucide-react';
import type { InterviewSession, SessionMetadata } from '@/types';

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
    draft: 'bg-slate-500/20 text-slate-300',
    recording: 'bg-red-500/20 text-red-300',
    processing: 'bg-amber-500/20 text-amber-300',
    ready: 'bg-emerald-500/20 text-emerald-300',
    archived: 'bg-slate-500/20 text-slate-400',
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] || styles.draft}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function SessionCard({ session }: { session: InterviewSession }) {
  const metadata = session.metadata as SessionMetadata;
  const sessionType = metadata?.session_type;

  return (
    <Link href={`/sessions/${session.id}`}>
      <Card className="group border-slate-800 bg-slate-900/50 transition-all hover:border-slate-700 hover:bg-slate-900">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg text-white group-hover:text-emerald-400 transition-colors">
              {session.title}
            </CardTitle>
            {getStatusBadge(session.status)}
          </div>
          <CardDescription className="text-slate-400">
            {getSessionTypeLabel(sessionType)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock className="h-4 w-4" />
              {new Date(session.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </div>
            <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900/30 py-16 px-8 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
        <FileText className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">No sessions yet</h3>
      <p className="mb-6 max-w-sm text-slate-400">
        Create your first interview session to start practicing and improving
        your skills.
      </p>
      <Link href="/sessions/new">
        <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600">
          <Plus className="mr-2 h-4 w-4" />
          Create Your First Session
        </Button>
      </Link>
    </div>
  );
}

function SessionsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card
          key={i}
          className="animate-pulse border-slate-800 bg-slate-900/50"
        >
          <CardHeader className="pb-3">
            <div className="h-5 w-3/4 rounded bg-slate-700" />
            <div className="h-4 w-1/2 rounded bg-slate-800" />
          </CardHeader>
          <CardContent>
            <div className="h-4 w-1/3 rounded bg-slate-800" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function Dashboard() {
  // This will redirect to /auth/signin if not authenticated
  const user = await requireUser();
  const { sessions, error } = await getSessions();

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

            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">{user.email}</span>
              <form action="/auth/signout" method="post">
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto max-w-6xl px-8 py-12">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-white">
                Your Sessions
              </h1>
              <p className="text-slate-400">
                Manage and review your interview sessions.
              </p>
            </div>
            {sessions.length > 0 && (
              <Link href="/sessions/new">
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600">
                  <Plus className="mr-2 h-4 w-4" />
                  New Session
                </Button>
              </Link>
            )}
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-300">
              Failed to load sessions: {error}
            </div>
          )}

          {/* Sessions List */}
          {!error && sessions.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
