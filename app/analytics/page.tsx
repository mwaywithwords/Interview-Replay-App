import Link from 'next/link';
import { requireUser } from '@/lib/supabase/server';
import { getSessions } from '@/app/actions/sessions';
import { getDashboardStats } from '@/app/actions/stats';
import { transformSessionsToAnalytics } from '@/lib/analytics/transform-sessions';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Progress',
};

export default async function AnalyticsPage() {
  const user = await requireUser();

  const [sessionsResult, statsResult] = await Promise.all([
    getSessions({ limit: 100, offset: 0 }),
    getDashboardStats(),
  ]);

  const analytics = transformSessionsToAnalytics(
    sessionsResult.sessions,
    statsResult.stats?.sessionsThisWeek ?? 0
  );

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
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader
          title="Progress"
          description="Track preparation activity, practice streaks, and readiness trends across your Job Prep projects."
          actions={
            <Link href="/job-prep/new">
              <PrimaryButton size="lg" className="rounded-full shadow-[var(--shadow-soft)]">
                <Plus className="h-5 w-5" />
                New Job Prep Project
              </PrimaryButton>
            </Link>
          }
        />

        <AnalyticsDashboard data={analytics} />
      </div>
    </AppShell>
  );
}
