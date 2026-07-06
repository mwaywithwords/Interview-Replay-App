import Link from 'next/link';
import { requireUser } from '@/lib/supabase/server';
import { getDashboardStats } from '@/app/actions/stats';
import { getSessions } from '@/app/actions/sessions';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Flame, Plus, Target, TrendingUp } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Goals',
};

function progressPct(value: number, target: number): number {
  return Math.min(100, Math.round((value / target) * 100));
}

export default async function GoalsPage() {
  const user = await requireUser();
  const [statsResult, sessionsResult] = await Promise.all([
    getDashboardStats(),
    getSessions({ limit: 8, offset: 0 }),
  ]);

  const sessionsThisWeek = statsResult.stats?.sessionsThisWeek ?? 0;
  const totalMinutes = statsResult.stats?.totalMinutesPracticed ?? 0;
  const readySessions = sessionsResult.sessions.filter((session) => session.status === 'ready').length;
  const weeklyProgress = progressPct(sessionsThisWeek, 3);
  const reviewProgress = progressPct(readySessions, 3);
  const minutesProgress = progressPct(totalMinutes, 120);
  const progressCards = [
    { label: 'Practice cadence', value: weeklyProgress, icon: Target },
    { label: 'Ready reviews', value: reviewProgress, icon: CheckCircle2 },
    { label: 'Practice time', value: minutesProgress, icon: TrendingUp },
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
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader
          title="Goals"
          description="A focused, minimal view of your weekly interview practice progress."
          actions={
            <Link href="/sessions/new">
              <PrimaryButton size="lg" className="rounded-full shadow-[var(--shadow-soft)]">
                <Plus className="h-5 w-5" />
                New Session
              </PrimaryButton>
            </Link>
          }
        />

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-primary/12 via-card/80 to-card/55 shadow-[var(--shadow-card)] backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge variant="info" className="mb-4 rounded-full">
                    Weekly focus
                  </Badge>
                  <h2 className="text-4xl font-semibold tracking-[-0.06em] text-foreground">
                    {sessionsThisWeek} of 3 sessions
                  </h2>
                  <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-muted-foreground">
                    Keep the loop simple: record, review, and capture one improvement from each session.
                  </p>
                </div>
                <div className="relative grid h-24 w-24 shrink-0 place-items-center">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(var(--primary) ${weeklyProgress * 3.6}deg, var(--muted) 0deg)`,
                    }}
                  />
                  <div className="absolute inset-2 rounded-full bg-card shadow-inner" />
                  <span className="relative text-xl font-semibold tabular-nums text-foreground">
                    {weeklyProgress}%
                  </span>
                </div>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {progressCards.map((item) => {
                  const Icon = item.icon;
                  return (
                  <div key={item.label} className="rounded-2xl border border-border/40 bg-background/45 p-4">
                    <div className="flex items-center justify-between">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold tabular-nums text-foreground">
                        {item.value}%
                      </span>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted/60">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-info"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                    <p className="mt-3 text-xs font-semibold text-muted-foreground">{item.label}</p>
                  </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/65 shadow-[var(--shadow-card)] backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-warning" />
                <h3 className="text-lg font-semibold tracking-[-0.04em] text-foreground">
                  Goal stack
                </h3>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  {
                    title: 'Record 3 sessions this week',
                    copy: `${sessionsThisWeek} completed so far`,
                    done: sessionsThisWeek >= 3,
                  },
                  {
                    title: 'Review 3 completed sessions',
                    copy: `${readySessions} ready review${readySessions === 1 ? '' : 's'} available`,
                    done: readySessions >= 3,
                  },
                  {
                    title: 'Reach 120 practice minutes',
                    copy: `${totalMinutes} minute${totalMinutes === 1 ? '' : 's'} tracked`,
                    done: totalMinutes >= 120,
                  },
                ].map((goal) => (
                  <div
                    key={goal.title}
                    className="rounded-2xl border border-border/40 bg-background/45 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border ${goal.done ? 'border-success/25 bg-success/10 text-success' : 'border-border/60 bg-muted/40 text-muted-foreground'}`}>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{goal.title}</p>
                        <p className="mt-1 text-xs font-medium text-muted-foreground">{goal.copy}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
