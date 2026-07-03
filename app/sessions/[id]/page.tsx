import { notFound } from 'next/navigation';
import { getSession } from '@/app/actions/sessions';
import { getBookmarks } from '@/app/actions/bookmarks';
import { getSessionAIJobs, getSessionAIOutputs } from '@/app/actions/ai-jobs';
import { SessionDetail } from './session-detail';
import { AppShell } from '@/components/layout/AppShell';
import { SecondaryButton } from '@/components/ui/button';
import { requireUser } from '@/lib/supabase/server';
import type { Metadata } from 'next';

interface SessionPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: SessionPageProps): Promise<Metadata> {
  const { id } = await params;
  const { session } = await getSession(id);
  return {
    title: session?.title || 'Session Detail',
  };
}

export default async function SessionPage({ params }: SessionPageProps) {
  const user = await requireUser();
  const { id } = await params;
  const [sessionResult, bookmarksResult, aiJobsResult, aiOutputsResult] = await Promise.all([
    getSession(id),
    getBookmarks(id),
    getSessionAIJobs(id),
    getSessionAIOutputs(id),
  ]);

  const { session, error } = sessionResult;
  const { bookmarks } = bookmarksResult;
  const { jobs: aiJobs } = aiJobsResult;
  const { outputs: aiOutputs } = aiOutputsResult;

  if (error || !session) {
    notFound();
  }

  return (
    <AppShell
      variant="app"
      headerActions={
        <div className="flex items-center gap-3">
          <div className="hidden flex-col items-end md:flex">
            <span className="text-sm font-semibold tracking-[-0.02em] text-foreground">
              {user.email?.split('@')[0]}
            </span>
            <span className="max-w-[220px] truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
          <form action="/auth/signout" method="post">
            <SecondaryButton
              type="submit"
              size="sm"
              variant="outline"
              className="rounded-full border-border/70 bg-background/70 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              Sign Out
            </SecondaryButton>
          </form>
        </div>
      }
    >
      <SessionDetail
        session={session}
        initialBookmarks={bookmarks}
        initialAIJobs={aiJobs}
        initialAIOutputs={aiOutputs}
      />
    </AppShell>
  );
}
