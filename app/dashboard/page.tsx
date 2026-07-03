import Link from 'next/link';
import { requireUser } from '@/lib/supabase/server';
import { getSessions } from '@/app/actions/sessions';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  Flame,
  Library,
  Plus,
  Sparkles,
  Target,
} from 'lucide-react';
import type { Metadata } from 'next';
import type { InterviewSessionWithGroupings, SessionMetadata } from '@/types';

export const metadata: Metadata = {
  title: 'Dashboard',
};

function getSessionTypeLabel(session: InterviewSessionWithGroupings): string {
  const metadata = session.metadata as SessionMetadata;
  const labels: Record<string, string> = {
    interview: 'Interview',
    trading: 'Trading',
  };

  return labels[metadata?.session_type || ''] || 'Practice';
}

function formatActivityDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default async function Dashboard() {
  const user = await requireUser();
  const recentResult = await getSessions({ limit: 3, offset: 0 });
  const recentSessions = recentResult.sessions;
  const latestSession = recentSessions[0];
  const totalSessions = recentResult.total;
  const readySessions = recentSessions.filter((session) => session.status === 'ready').length;
  const interviewScore =
    totalSessions === 0 ? 0 : Math.min(92, 58 + Math.min(totalSessions, 8) * 4 + readySessions * 2);
  const goalProgress = Math.min(100, Math.round((Math.min(recentSessions.length, 3) / 3) * 100));

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
          title="Dashboard"
          description="Your improvement command center. Track progress, keep a practice streak alive, and turn recent sessions into better next reps."
          actions={
            <Link href="/sessions/new">
              <PrimaryButton size="lg" className="rounded-full shadow-[var(--shadow-soft)]">
                <Plus className="h-5 w-5" />
                New Session
              </PrimaryButton>
            </Link>
          }
        />

        <StatsCards />

        <div className="mb-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-primary/12 via-card to-card shadow-[var(--shadow-card)] backdrop-blur">
            <CardContent className="p-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <Badge variant="info" className="mb-4">
                    Overall Interview Score
                  </Badge>
                  <div className="flex items-end gap-3">
                    <span className="text-6xl font-semibold tracking-[-0.07em] text-foreground">
                      {interviewScore || '—'}
                    </span>
                    <span className="mb-2 text-sm font-semibold text-muted-foreground">
                      / 100
                    </span>
                  </div>
                  <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-muted-foreground">
                    {totalSessions > 0
                      ? 'A lightweight readiness signal based on your recent practice volume and completed sessions.'
                      : 'Record your first session to establish a baseline score.'}
                  </p>
                </div>
                <div className="min-w-[220px] rounded-3xl border border-border/70 bg-background/55 p-4">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    <span>Goal progress</span>
                    <span>{goalProgress}%</span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-info"
                      style={{ width: `${goalProgress}%` }}
                    />
                  </div>
                  <p className="mt-4 text-sm font-medium leading-6 text-muted-foreground">
                    Target: 3 focused practice sessions this week.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/65 shadow-[var(--shadow-card)] backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Practice streak
                  </p>
                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-4xl font-semibold tracking-[-0.05em] text-foreground">
                      {Math.min(recentSessions.length, 7)}
                    </span>
                    <span className="mb-1 text-sm font-semibold text-muted-foreground">
                      active reps
                    </span>
                  </div>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-warning/20 bg-warning/10 text-warning">
                  <Flame className="h-6 w-6" />
                </div>
              </div>
              <p className="mt-5 text-sm font-medium leading-6 text-muted-foreground">
                Consistency compounds. Keep your loop alive with one focused interview review today.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <Card className="border-border/70 bg-card/65 shadow-[var(--shadow-soft)] backdrop-blur lg:col-span-2">
            <CardContent className="p-5">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold tracking-[-0.03em] text-foreground">
                    AI Coach recommendations
                  </h2>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    Suggested next moves based on your current practice loop.
                  </p>
                </div>
                <Sparkles className="h-5 w-5 text-primary" />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {[
                  {
                    icon: Target,
                    title: 'Tighten your opener',
                    copy: 'Start answers with the outcome before adding implementation details.',
                  },
                  {
                    icon: BarChart3,
                    title: 'Review pacing',
                    copy: 'Bookmark one strong answer and one rambling answer in your next replay.',
                  },
                  {
                    icon: CalendarCheck,
                    title: 'Set a weekly cadence',
                    copy: 'Aim for three short sessions instead of one long practice block.',
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-3xl border border-border/70 bg-background/55 p-4"
                    >
                      <Icon className="h-5 w-5 text-primary" />
                      <h3 className="mt-5 text-sm font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-2 text-xs font-medium leading-5 text-muted-foreground">
                        {item.copy}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/65 shadow-[var(--shadow-soft)] backdrop-blur">
            <CardContent className="p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-[-0.03em] text-foreground">
                    Continue last session
                  </h2>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    Pick up where you left off.
                  </p>
                </div>
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>

              {latestSession ? (
                <Link
                  href={`/sessions/${latestSession.id}`}
                  className="group block rounded-3xl border border-border/70 bg-background/55 p-4 transition-all hover:border-primary/25 hover:bg-accent"
                >
                  <Badge variant="secondary">{getSessionTypeLabel(latestSession)}</Badge>
                  <h3 className="mt-4 line-clamp-2 text-base font-semibold tracking-[-0.02em] text-foreground">
                    {latestSession.title}
                  </h3>
                  <p className="mt-2 text-xs font-semibold text-muted-foreground">
                    {formatActivityDate(latestSession.created_at)} · {latestSession.status}
                  </p>
                  <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-primary">
                    Open session
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ) : (
                <div className="rounded-3xl border border-dashed border-border/70 bg-background/45 p-4">
                  <p className="text-sm font-medium leading-6 text-muted-foreground">
                    No sessions yet. Start one to create your first activity trail.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <Card className="border-border/70 bg-card/65 shadow-[var(--shadow-soft)] backdrop-blur">
            <CardContent className="p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold tracking-[-0.03em] text-foreground">
                    Interview goals
                  </h2>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    Keep the next rep specific.
                  </p>
                </div>
                <Target className="h-5 w-5 text-primary" />
              </div>

              <div className="space-y-3">
                {[
                  ['Complete 3 sessions this week', `${Math.min(recentSessions.length, 3)} / 3`],
                  ['Review one bookmarked answer', 'Next'],
                  ['Write one improvement note', 'Next'],
                ].map(([goal, status]) => (
                  <div
                    key={goal}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background/50 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-foreground">{goal}</span>
                    <Badge variant="outline">{status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/65 shadow-[var(--shadow-soft)] backdrop-blur">
            <CardContent className="p-5">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold tracking-[-0.03em] text-foreground">
                    Recent activity
                  </h2>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    A short pulse check. The full archive lives in Sessions.
                  </p>
                </div>
                <Link
                  href="/sessions"
                  className="rounded-full border border-border/70 bg-background/60 px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  View library
                </Link>
              </div>

              <div className="space-y-2">
                {recentSessions.length > 0 ? (
                  recentSessions.map((session) => (
                    <Link
                      key={session.id}
                      href={`/sessions/${session.id}`}
                      className="group flex items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background/50 px-4 py-3 transition-colors hover:border-primary/25 hover:bg-accent"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-foreground">
                          {session.title}
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <span>{getSessionTypeLabel(session)}</span>
                          <span>·</span>
                          <span>{formatActivityDate(session.created_at)}</span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </Link>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/70 bg-background/45 px-4 py-6 text-sm font-medium text-muted-foreground">
                    Your recent activity will appear after your first session.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <Link
            href="/sessions/new"
            className="group rounded-3xl border border-border/70 bg-card/65 p-4 shadow-[var(--shadow-soft)] backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/25"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Record a session</div>
                  <div className="text-xs font-medium text-muted-foreground">Start a new review loop</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
          </Link>

          <Link
            href="/sessions"
            className="group rounded-3xl border border-border/70 bg-card/65 p-4 shadow-[var(--shadow-soft)] backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/25"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-info/10 text-info">
                <Library className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Open session library</div>
                <div className="text-xs font-medium text-muted-foreground">Search, filter, and revisit every interview</div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
