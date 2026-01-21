import Link from 'next/link';
import { requireUser } from '@/lib/supabase/server';
import { getSessions } from '@/app/actions/sessions';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { EmptyState } from '@/components/layout/EmptyState';
import { Plus, Clock, ArrowRight, FileText } from 'lucide-react';
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground border-border',
    recording: 'bg-red-500/10 text-red-500 border-red-500/20',
    processing: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    ready: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    archived: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.draft}`}
    >
      {status}
    </span>
  );
}

function SessionCard({ session }: { session: InterviewSession }) {
  const metadata = session.metadata as SessionMetadata;
  const sessionType = metadata?.session_type;

  return (
    <Link href={`/sessions/${session.id}`}>
      <SectionCard className="group hover:border-foreground/20 transition-all active:scale-[0.98]">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <h3 className="font-bold text-lg group-hover:text-muted-foreground transition-colors">
              {session.title}
            </h3>
            <StatusBadge status={session.status} />
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                {getSessionTypeLabel(sessionType)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {new Date(session.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
          </div>
        </div>
      </SectionCard>
    </Link>
  );
}

export default async function Dashboard() {
  const user = await requireUser();
  const { sessions, error } = await getSessions();

  return (
    <AppShell
      headerActions={
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user.email}</span>
          <form action="/auth/signout" method="post">
            <SecondaryButton type="submit" size="sm" variant="ghost">
              Sign Out
            </SecondaryButton>
          </form>
        </div>
      }
    >
      <div className="max-w-6xl mx-auto px-6 py-10">
        <PageHeader 
          title="Your Sessions" 
          description="Manage and review your interview sessions."
          actions={
            sessions.length > 0 && (
              <Link href="/sessions/new">
                <PrimaryButton size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  New Session
                </PrimaryButton>
              </Link>
            )
          }
        />

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
            Failed to load sessions: {error}
          </div>
        )}

        {!error && sessions.length === 0 ? (
          <EmptyState 
            icon={FileText}
            title="No sessions yet"
            description="Create your first interview session to start practicing and improving your skills."
            action={
              <Link href="/sessions/new">
                <PrimaryButton>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Session
                </PrimaryButton>
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
