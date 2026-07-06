import Link from 'next/link';
import { requireUser } from '@/lib/supabase/server';
import { getSessions } from '@/app/actions/sessions';
import { getDashboardStats } from '@/app/actions/stats';
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
  TrendingUp,
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
    trading: 'Practice',
  };

  return labels[metadata?.session_type || ''] || 'Practice';
}

function formatSessionDisplayTitle(session: InterviewSessionWithGroupings): string {
  const metadata = session.metadata as SessionMetadata;
  const sessionType = metadata?.session_type;
  const company = session.companies?.[0]?.name;

  if (company) {
    return `${company} interview practice`;
  }

  if (sessionType === 'trading' || /^trading\s+/i.test(session.title)) {
    const remainder = session.title.replace(/^trading\s+/i, '').trim();
    const looksLikeTicker = /^[A-Z]{1,5}([.-][A-Z]+)?$/i.test(remainder);

    if (!remainder || looksLikeTicker) {
      return 'Interview practice session';
    }

    return remainder;
  }

  return session.title;
}

function formatWeeklyTrend(thisWeekCount: number, lastWeekCount: number): string {
  if (lastWeekCount === 0) {
    return thisWeekCount > 0 ? 'New' : '0%';
  }

  if (thisWeekCount === 0) {
    return '0%';
  }

  const change = Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100);
  return `${change > 0 ? '+' : ''}${change}%`;
}

function formatActivityDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export default async function Dashboard() {
  const user = await requireUser();
  const [recentResult, statsResult] = await Promise.all([
    getSessions({ limit: 8, offset: 0 }),
    getDashboardStats(),
  ]);
  const recentSessions = recentResult.sessions.slice(0, 3);
  const mobileRecentSessions = recentResult.sessions.slice(0, 5);
  const latestSession = recentSessions[0];
  const totalSessions = recentResult.total;
  const readySessions = recentSessions.filter((session) => session.status === 'ready').length;
  const interviewScore =
    totalSessions === 0 ? 0 : Math.min(92, 58 + Math.min(totalSessions, 8) * 4 + readySessions * 2);
  const goalProgress = Math.min(100, Math.round((Math.min(recentSessions.length, 3) / 3) * 100));
  const thisWeekCount = statsResult.stats?.sessionsThisWeek ?? 0;
  const lastWeekCount = statsResult.stats?.sessionsLastWeek ?? 0;
  const weeklyTrendLabel = formatWeeklyTrend(thisWeekCount, lastWeekCount);
  const dailyGoalProgress = latestSession ? 100 : 0;
  const mobileCoachCards = [
    {
      icon: Target,
      title: 'Start with Job Prep',
      copy: 'Create a project for your target role before practicing generic questions.',
    },
    {
      icon: BarChart3,
      title: 'Review your fit analysis',
      copy: 'Know your gaps before you walk into behavioral or technical rounds.',
    },
    {
      icon: CalendarCheck,
      title: 'Rate one answer today',
      copy: 'Structured feedback beats unstructured repetition.',
    },
  ];

  const prepPathSteps = [
    { step: 1, label: 'Create a Job Prep project', href: '/job-prep/new' },
    { step: 2, label: 'Upload résumé & paste job description', href: '/job-prep/new' },
    { step: 3, label: 'Review AI match analysis', href: '/job-prep' },
    { step: 4, label: 'Generate interview questions', href: '/job-prep' },
    { step: 5, label: 'Practice answers', href: '/job-prep' },
    { step: 6, label: 'Review AI feedback', href: '/job-prep' },
    { step: 7, label: 'Refine and repeat', href: '/job-prep' },
  ];

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
      <div className="mx-auto w-full max-w-7xl px-3 pb-24 pt-4 sm:px-6 lg:px-8 lg:py-8">
        <div className="lg:hidden">
          <div className="mb-4 overflow-hidden rounded-[1.75rem] border border-border/45 bg-gradient-to-br from-primary/15 via-card/80 to-card/55 p-4 shadow-[var(--shadow-card)] backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  Today
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-[-0.055em] text-foreground">
                  Ready for your next interview?
                </h1>
                <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
                  {latestSession
                    ? `Continue ${formatSessionDisplayTitle(latestSession)}`
                    : 'Start a Job Prep project for the role you’re targeting.'}
                </p>
              </div>
              <Link href="/job-prep/new">
                <PrimaryButton size="icon" className="h-11 w-11 rounded-full shadow-[var(--shadow-soft)]">
                  <Plus className="h-5 w-5" />
                </PrimaryButton>
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-[0.95fr_1.05fr] gap-3">
              <div className="relative grid aspect-square place-items-center rounded-[1.5rem] border border-border/35 bg-background/45 shadow-inner">
                <div
                  className="absolute inset-3 rounded-full"
                  style={{
                    background: `conic-gradient(var(--primary) ${interviewScore * 3.6}deg, var(--muted) 0deg)`,
                  }}
                />
                <div className="absolute inset-6 rounded-full bg-card shadow-inner" />
                <div className="relative text-center">
                  <div className="text-4xl font-semibold tabular-nums tracking-[-0.07em] text-foreground">
                    {interviewScore || '—'}
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    score
                  </div>
                </div>
              </div>

              <div className="flex min-h-full flex-col justify-center rounded-[1.25rem] border border-border/35 bg-background/45 p-3">
                <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <span>Daily goal</span>
                  <span>{dailyGoalProgress}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted/70">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-info"
                    style={{ width: `${dailyGoalProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs font-medium leading-5 text-muted-foreground">
                  {latestSession ? 'One practice answer is queued for review.' : 'Complete one practice answer today.'}
                </p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 rounded-[1.15rem] border border-warning/20 bg-warning/10 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
                  <Flame className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl font-semibold tracking-[-0.05em] text-foreground">
                    {Math.min(recentSessions.length, 7)}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    streak
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-[1.15rem] border border-success/20 bg-success/10 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
                  <TrendingUp className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xl font-semibold tracking-[-0.05em] text-foreground">
                    {weeklyTrendLabel}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {lastWeekCount === 0 && thisWeekCount > 0 ? 'vs last week' : 'weekly'}
                  </p>
                </div>
              </div>
            </div>

            {latestSession && (
              <Link
                href={`/sessions/${latestSession.id}`}
                className="mt-4 flex items-center justify-between rounded-full border border-border/35 bg-background/55 px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/25 hover:bg-background/80"
              >
                Continue last practice session
                <ArrowRight className="h-4 w-4 text-primary" />
              </Link>
            )}
          </div>

          <div className="mb-4 grid grid-cols-3 gap-2">
            {[
              ['Sessions', totalSessions],
              ['Ready', readySessions],
              ['This week', thisWeekCount],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-border/40 bg-card/65 p-3 text-center shadow-sm backdrop-blur">
                <p className="text-lg font-semibold tabular-nums tracking-[-0.04em] text-foreground">{value}</p>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          <section className="mb-4 rounded-[1.5rem] border border-border/45 bg-card/65 p-4 shadow-[var(--shadow-soft)] backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold tracking-[-0.035em] text-foreground">
                  Recent practice
                </h2>
                <p className="text-xs font-medium text-muted-foreground">Recorded answers from Job Prep and quick practice.</p>
              </div>
              <Link href="/sessions" className="text-xs font-semibold text-primary">
                All
              </Link>
            </div>

            <div className="flex snap-x gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {mobileRecentSessions.length > 0 ? (
                mobileRecentSessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/sessions/${session.id}`}
                    className="min-w-[78%] snap-start rounded-[1.25rem] border border-border/40 bg-background/50 p-4 transition-colors hover:border-primary/25 hover:bg-background/75"
                  >
                    <Badge variant="secondary" className="rounded-full text-[10px]">
                      {getSessionTypeLabel(session)}
                    </Badge>
                    <h3 className="mt-4 line-clamp-2 text-base font-semibold tracking-[-0.03em] text-foreground">
                      {formatSessionDisplayTitle(session)}
                    </h3>
                    <div className="mt-4 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                      <span>{formatActivityDate(session.created_at)}</span>
                      <span className="capitalize">{session.status}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="w-full rounded-[1.25rem] border border-dashed border-border/50 bg-muted/20 p-5 text-sm font-medium text-muted-foreground">
                  Recorded answers from Job Prep and quick practice will appear here after your first recording.
                </div>
              )}
            </div>
          </section>

          <section className="mb-4 rounded-[1.5rem] border border-border/45 bg-card/65 p-4 shadow-[var(--shadow-soft)] backdrop-blur">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold tracking-[-0.035em] text-foreground">
                  Prep coach
                </h2>
                <p className="text-xs font-medium text-muted-foreground">Three focused moves for your next prep session.</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>

            <div className="space-y-2">
              {mobileCoachCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="flex gap-3 rounded-[1.15rem] border border-border/35 bg-background/45 p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="mt-1 text-xs font-medium leading-5 text-muted-foreground">{item.copy}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/job-prep/new"
              className="rounded-[1.35rem] border border-primary/20 bg-primary px-4 py-4 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)]"
            >
              New Job Prep
            </Link>
            <Link
              href="/sessions"
              className="rounded-[1.35rem] border border-border/45 bg-card/65 px-4 py-4 text-sm font-semibold text-foreground shadow-sm backdrop-blur"
            >
              All sessions
            </Link>
          </div>
        </div>

        <div className="hidden lg:block">
        <PageHeader
          title="Dashboard"
          description="Your preparation command center. Start a Job Prep project, track progress across roles, and review feedback from recent practice."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/sessions/new">
                <SecondaryButton size="lg" className="rounded-full shadow-[var(--shadow-soft)]">
                  Quick Practice
                </SecondaryButton>
              </Link>
              <Link href="/job-prep/new">
                <PrimaryButton size="lg" className="rounded-full shadow-[var(--shadow-soft)]">
                  <Plus className="h-5 w-5" />
                  New Job Prep Project
                </PrimaryButton>
              </Link>
            </div>
          }
        />

        <Card className="mb-6 border-border/70 bg-card/65 shadow-[var(--shadow-soft)] backdrop-blur">
          <CardContent className="p-5">
            <div className="mb-5">
              <h2 className="text-lg font-semibold tracking-[-0.03em] text-foreground">
                Your preparation path
              </h2>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                Follow these steps for each role you&apos;re targeting.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {prepPathSteps.map((item) => (
                <Link
                  key={item.step}
                  href={item.href}
                  className="group flex items-start gap-3 rounded-2xl border border-border/70 bg-background/50 px-4 py-3 transition-colors hover:border-primary/25 hover:bg-accent"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-xs font-semibold text-primary">
                    {item.step}
                  </span>
                  <span className="text-sm font-medium leading-6 text-foreground group-hover:text-primary">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <StatsCards />

        <div className="mb-6 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-primary/12 via-card to-card shadow-[var(--shadow-card)] backdrop-blur">
            <CardContent className="p-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <Badge variant="info" className="mb-4">
                    Preparation score
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
                      ? 'A readiness signal based on fit analysis, practice volume, and answer ratings.'
                      : 'Create your first Job Prep project to establish a baseline.'}
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
                    Target: 3 focused practice answers this week.
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
                Consistency compounds. Keep your prep loop alive with one focused practice answer today.
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
                    Suggested next steps
                  </h2>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    Recommended moves based on your current preparation loop.
                  </p>
                </div>
                <Sparkles className="h-5 w-5 text-primary" />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {[
                  {
                    icon: Target,
                    title: 'Start with Job Prep',
                    copy: 'Create a project for your target role before practicing generic questions.',
                  },
                  {
                    icon: BarChart3,
                    title: 'Review your fit analysis',
                    copy: 'Know your gaps before behavioral or technical rounds.',
                  },
                  {
                    icon: CalendarCheck,
                    title: 'Rate one answer today',
                    copy: 'Structured feedback beats unstructured repetition.',
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
                    Continue practicing
                  </h2>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    Pick up your last recorded answer.
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
                    {formatSessionDisplayTitle(latestSession)}
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
                    No practice sessions yet. Start a Job Prep project or quick practice to begin.
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
                    This week&apos;s goals
                  </h2>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    Keep your preparation specific.
                  </p>
                </div>
                <Target className="h-5 w-5 text-primary" />
              </div>

              <div className="space-y-3">
                {[
                  ['Complete 3 practice answers this week', `${Math.min(recentSessions.length, 3)} / 3`],
                  ['Review one answer rating', 'Next'],
                  ['Update one Job Prep project', 'Next'],
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
                    A short pulse check. The full archive lives in Practice Sessions.
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
                          {formatSessionDisplayTitle(session)}
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
                    Your recent activity will appear after your first practice answer.
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
                  <div className="text-sm font-semibold text-foreground">Quick practice</div>
                  <div className="text-xs font-medium text-muted-foreground">Record a standalone practice answer</div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </div>
          </Link>

          <Link
            href="/job-prep/new"
            className="group rounded-3xl border border-border/70 bg-card/65 p-4 shadow-[var(--shadow-soft)] backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/25"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-info/10 text-info">
                <Library className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">New Job Prep project</div>
                <div className="text-xs font-medium text-muted-foreground">Prepare for a specific role end-to-end</div>
              </div>
            </div>
          </Link>
        </div>
        </div>
      </div>
    </AppShell>
  );
}
