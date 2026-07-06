'use client';

import Link from 'next/link';
import type { AnalyticsSnapshot } from '@/lib/analytics/transform-sessions';
import { AnalyticsCard } from '@/components/analytics/AnalyticsCard';
import { TrendIndicator } from '@/components/analytics/TrendIndicator';
import { LineChart } from '@/components/analytics/charts/LineChart';
import { BarChart } from '@/components/analytics/charts/BarChart';
import { HeatMap } from '@/components/analytics/charts/HeatMap';
import { CircularKPI } from '@/components/analytics/charts/CircularKPI';
import { InterviewHistory } from '@/components/analytics/InterviewHistory';
import { PrimaryButton } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Flame,
  LineChart as LineChartIcon,
  Target,
  Timer,
  TrendingUp,
  Zap,
} from 'lucide-react';

interface AnalyticsDashboardProps {
  data: AnalyticsSnapshot;
}

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const { kpis, trends, scoreTrend, weeklyVolume, monthlyVolume, heatMap, rubricBreakdown, history } =
    data;

  return (
    <div className="space-y-6">
      {/* Hero KPI row */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CircularKPI
          value={kpis.readinessScore}
          label="Readiness score"
          helper="Average session completion quality"
          icon={TrendingUp}
          tone="primary"
        />
        <CircularKPI
          value={kpis.currentStreak}
          max={Math.max(kpis.longestStreak, 7)}
          label="Practice streak"
          helper={`Longest: ${kpis.longestStreak} day${kpis.longestStreak === 1 ? '' : 's'}`}
          icon={Flame}
          tone="warning"
          suffix=""
        />
        <CircularKPI
          value={kpis.weeklyGoalProgress}
          label="Weekly goal"
          helper="Target: 3 sessions per week"
          icon={Target}
          tone="success"
        />
        <CircularKPI
          value={kpis.totalMinutes}
          max={Math.max(kpis.totalMinutes, 60)}
          label="Total practice"
          helper={`${kpis.totalSessions} session${kpis.totalSessions === 1 ? '' : 's'} recorded`}
          icon={Timer}
          tone="info"
          suffix="m"
        />
      </div>

      {/* Improvement trends */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-primary/[0.08] via-card/80 to-card/60 p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Weekly improvement
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
                Readiness change vs last week
              </p>
            </div>
            <TrendIndicator value={trends.weeklyImprovement} />
          </div>
          <div className="mt-4 flex items-end gap-3">
            <span className="text-4xl font-semibold tabular-nums tracking-[-0.05em] text-foreground">
              {trends.weeklyImprovement > 0 ? '+' : ''}
              {trends.weeklyImprovement}%
            </span>
            <Badge variant="info" className="mb-1 rounded-full">
              <Zap className="mr-1 h-3 w-3" />
              WoW
            </Badge>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-info/[0.08] via-card/80 to-card/60 p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Monthly improvement
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
                Readiness change vs last month
              </p>
            </div>
            <TrendIndicator value={trends.monthlyImprovement} />
          </div>
          <div className="mt-4 flex items-end gap-3">
            <span className="text-4xl font-semibold tabular-nums tracking-[-0.05em] text-foreground">
              {trends.monthlyImprovement > 0 ? '+' : ''}
              {trends.monthlyImprovement}%
            </span>
            <Badge variant="secondary" className="mb-1 rounded-full">
              <Calendar className="mr-1 h-3 w-3" />
              MoM
            </Badge>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <AnalyticsCard
          title="Readiness trend"
          subtitle="8-week rolling readiness index from your sessions"
          action={
            <Badge variant="outline" className="rounded-full text-[10px]">
              <LineChartIcon className="mr-1 h-3 w-3" />
              Line
            </Badge>
          }
        >
          <LineChart data={scoreTrend} maxValue={100} accent="primary" height={180} />
        </AnalyticsCard>

        <AnalyticsCard title="Session mix" subtitle="Completion breakdown across your library">
          <BarChart
            data={rubricBreakdown.map((r) => ({ label: r.label.split(' ')[0], value: r.value }))}
            maxValue={100}
            height={180}
          />
          <div className="mt-4 space-y-2">
            {rubricBreakdown.map((item) => (
              <div key={item.label} className="flex items-center justify-between text-xs">
                <span className="font-medium text-muted-foreground">{item.label}</span>
                <span className="font-semibold tabular-nums text-foreground">{item.value}%</span>
              </div>
            ))}
          </div>
        </AnalyticsCard>
      </div>

      {/* Volume + heat map */}
      <div className="grid gap-4 lg:grid-cols-2">
        <AnalyticsCard title="Weekly volume" subtitle="Sessions recorded per week">
          <BarChart
            data={weeklyVolume.map((w) => ({ label: w.label, value: w.value }))}
            height={160}
          />
          <div className="mt-4 grid grid-cols-2 gap-2">
            {weeklyVolume.slice(-2).map((w) => (
              <div
                key={w.label}
                className="rounded-xl border border-border/35 bg-background/45 px-3 py-2"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {w.label}
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                  {w.minutes}
                  <span className="ml-1 text-xs font-medium text-muted-foreground">min</span>
                </p>
              </div>
            ))}
          </div>
        </AnalyticsCard>

        <AnalyticsCard title="Practice heat map" subtitle="16 weeks of session activity">
          <HeatMap data={heatMap} />
        </AnalyticsCard>
      </div>

      {/* Monthly + progress */}
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <AnalyticsCard title="Monthly sessions" subtitle="6-month practice volume">
          <BarChart data={monthlyVolume} height={140} />
        </AnalyticsCard>

        <AnalyticsCard title="Goal progress" subtitle="Weekly practice target">
          <div className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Weekly sessions</span>
                <span>{kpis.weeklyGoalProgress}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary via-info to-success transition-all duration-700"
                  style={{ width: `${kpis.weeklyGoalProgress}%` }}
                />
              </div>
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                {Math.round((kpis.weeklyGoalProgress / 100) * 3)} of 3 sessions this week
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Library completion</span>
                <span>{kpis.readinessScore}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-muted/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-warning to-primary transition-all duration-700"
                  style={{ width: `${kpis.readinessScore}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-border/35 bg-gradient-to-br from-background/70 to-background/40 p-3">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-warning" />
                <span className="text-sm font-semibold text-foreground">
                  {kpis.currentStreak}-day streak
                </span>
              </div>
              <p className="mt-1 text-xs font-medium leading-5 text-muted-foreground">
                Keep practicing daily to compound your interview readiness.
              </p>
            </div>
          </div>
        </AnalyticsCard>
      </div>

      {/* Interview history */}
      <AnalyticsCard
        title="Interview history"
        subtitle="Recent sessions with readiness and status"
        action={
          <Link href="/sessions">
            <PrimaryButton size="sm" variant="outline" className="rounded-full">
              View all
            </PrimaryButton>
          </Link>
        }
      >
        <InterviewHistory items={history} />
      </AnalyticsCard>
    </div>
  );
}
