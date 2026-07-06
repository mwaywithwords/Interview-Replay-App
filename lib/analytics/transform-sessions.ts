import type { InterviewSessionWithGroupings, SessionMetadata } from '@/types';

export interface AnalyticsSnapshot {
  kpis: {
    totalSessions: number;
    totalMinutes: number;
    currentStreak: number;
    longestStreak: number;
    weeklyGoalProgress: number;
    readinessScore: number;
  };
  trends: {
    weeklyImprovement: number;
    monthlyImprovement: number;
  };
  scoreTrend: Array<{ label: string; value: number }>;
  weeklyVolume: Array<{ label: string; value: number; minutes: number }>;
  monthlyVolume: Array<{ label: string; value: number }>;
  heatMap: Array<{ date: string; count: number; day: number; week: number }>;
  rubricBreakdown: Array<{ label: string; value: number }>;
  history: Array<{
    id: string;
    title: string;
    date: string;
    durationMinutes: number;
    status: string;
    type: string;
    readiness: number;
  }>;
}

function getSessionDate(session: InterviewSessionWithGroupings): Date {
  const raw = session.recorded_at || session.created_at;
  return new Date(raw);
}

function getDurationMinutes(session: InterviewSessionWithGroupings): number {
  const seconds =
    session.duration_seconds ??
    session.audio_duration_seconds ??
    session.video_duration_seconds ??
    0;
  return Math.round(seconds / 60);
}

function getSessionType(session: InterviewSessionWithGroupings): string {
  const metadata = session.metadata as SessionMetadata;
  const labels: Record<string, string> = {
    interview: 'Interview',
    trading: 'Trading',
  };
  return labels[metadata?.session_type || ''] || 'Practice';
}

function getReadinessForStatus(status: string): number {
  switch (status) {
    case 'ready':
      return 100;
    case 'recorded':
      return 78;
    case 'processing':
      return 62;
    case 'recording':
      return 45;
    default:
      return 35;
  }
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDayKey(date: Date): string {
  return startOfDay(date).toISOString().slice(0, 10);
}

function formatWeekLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short' });
}

function getStartOfWeek(date: Date): Date {
  const d = startOfDay(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function computeStreaks(activeDays: Set<string>): { current: number; longest: number } {
  if (activeDays.size === 0) return { current: 0, longest: 0 };

  const sorted = [...activeDays].sort();
  let longest = 1;
  let run = 1;

  for (let i = 1; i < sorted.length; i += 1) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  let current = 0;
  const today = startOfDay(new Date());
  for (let i = 0; i < 365; i += 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (activeDays.has(formatDayKey(d))) {
      current += 1;
    } else if (i > 0) {
      break;
    }
  }

  return { current, longest };
}

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function transformSessionsToAnalytics(
  sessions: InterviewSessionWithGroupings[],
  sessionsThisWeek: number
): AnalyticsSnapshot {
  const sorted = [...sessions].sort(
    (a, b) => getSessionDate(b).getTime() - getSessionDate(a).getTime()
  );

  const totalMinutes = sorted.reduce((acc, s) => acc + getDurationMinutes(s), 0);
  const activeDays = new Set(sorted.map((s) => formatDayKey(getSessionDate(s))));
  const { current: currentStreak, longest: longestStreak } = computeStreaks(activeDays);

  const readinessScores = sorted.map((s) => getReadinessForStatus(s.status));
  const readinessScore =
    readinessScores.length === 0
      ? 0
      : Math.round(
          readinessScores.reduce((a, b) => a + b, 0) / readinessScores.length
        );

  const weeklyGoalProgress = Math.min(
    100,
    Math.round((sessionsThisWeek / 3) * 100)
  );

  const now = new Date();
  const weekBuckets = Array.from({ length: 8 }, (_, i) => {
    const weekStart = getStartOfWeek(now);
    weekStart.setDate(weekStart.getDate() - (7 - i) * 7);
    return weekStart;
  });

  const weeklyVolume = weekBuckets.map((weekStart) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const inWeek = sorted.filter((s) => {
      const d = getSessionDate(s);
      return d >= weekStart && d < weekEnd;
    });
    const minutes = inWeek.reduce((acc, s) => acc + getDurationMinutes(s), 0);
    return {
      label: formatWeekLabel(weekStart),
      value: inWeek.length,
      minutes,
    };
  });

  const scoreTrend = weekBuckets.map((weekStart, i) => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const inWeek = sorted.filter((s) => {
      const d = getSessionDate(s);
      return d >= weekStart && d < weekEnd;
    });
    const avg =
      inWeek.length === 0
        ? i === 0
          ? 0
          : weeklyVolume[i - 1]?.value
            ? readinessScore
            : 0
        : Math.round(
            inWeek.reduce((acc, s) => acc + getReadinessForStatus(s.status), 0) /
              inWeek.length
          );
    return { label: formatWeekLabel(weekStart), value: avg };
  });

  const monthBuckets: Date[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthBuckets.push(d);
  }

  const monthlyVolume = monthBuckets.map((monthStart) => {
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
    const inMonth = sorted.filter((s) => {
      const d = getSessionDate(s);
      return d >= monthStart && d < monthEnd;
    });
    return { label: formatMonthLabel(monthStart), value: inMonth.length };
  });

  const thisWeekStart = getStartOfWeek(now);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisWeekSessions = sorted.filter((s) => getSessionDate(s) >= thisWeekStart);
  const lastWeekSessions = sorted.filter((s) => {
    const d = getSessionDate(s);
    return d >= lastWeekStart && d < thisWeekStart;
  });
  const thisMonthSessions = sorted.filter((s) => getSessionDate(s) >= thisMonthStart);
  const lastMonthSessions = sorted.filter((s) => {
    const d = getSessionDate(s);
    return d >= lastMonthStart && d < lastMonthEnd;
  });

  const thisWeekAvg =
    thisWeekSessions.length === 0
      ? 0
      : thisWeekSessions.reduce((acc, s) => acc + getReadinessForStatus(s.status), 0) /
        thisWeekSessions.length;
  const lastWeekAvg =
    lastWeekSessions.length === 0
      ? 0
      : lastWeekSessions.reduce((acc, s) => acc + getReadinessForStatus(s.status), 0) /
        lastWeekSessions.length;
  const thisMonthAvg =
    thisMonthSessions.length === 0
      ? 0
      : thisMonthSessions.reduce((acc, s) => acc + getReadinessForStatus(s.status), 0) /
        thisMonthSessions.length;
  const lastMonthAvg =
    lastMonthSessions.length === 0
      ? 0
      : lastMonthSessions.reduce((acc, s) => acc + getReadinessForStatus(s.status), 0) /
        lastMonthSessions.length;

  const heatMap: AnalyticsSnapshot['heatMap'] = [];
  const heatWeeks = 16;
  for (let w = heatWeeks - 1; w >= 0; w -= 1) {
    for (let d = 0; d < 7; d += 1) {
      const cell = new Date(thisWeekStart);
      cell.setDate(cell.getDate() - w * 7 + d);
      const key = formatDayKey(cell);
      const count = sorted.filter((s) => formatDayKey(getSessionDate(s)) === key).length;
      heatMap.push({ date: key, count, day: d, week: heatWeeks - 1 - w });
    }
  }

  const readyCount = sorted.filter((s) => s.status === 'ready').length;
  const recordedCount = sorted.filter((s) => s.status === 'recorded').length;
  const draftCount = sorted.filter((s) =>
    ['draft', 'recording', 'processing'].includes(s.status)
  ).length;

  const rubricBreakdown = [
    {
      label: 'Analysis ready',
      value: sorted.length ? Math.round((readyCount / sorted.length) * 100) : 0,
    },
    {
      label: 'Recorded',
      value: sorted.length ? Math.round((recordedCount / sorted.length) * 100) : 0,
    },
    {
      label: 'In progress',
      value: sorted.length ? Math.round((draftCount / sorted.length) * 100) : 0,
    },
    {
      label: 'Consistency',
      value: Math.min(100, currentStreak * 14),
    },
  ];

  const history = sorted.slice(0, 12).map((s) => ({
    id: s.id,
    title: s.title,
    date: getSessionDate(s).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    durationMinutes: getDurationMinutes(s),
    status: s.status,
    type: getSessionType(s),
    readiness: getReadinessForStatus(s.status),
  }));

  return {
    kpis: {
      totalSessions: sorted.length,
      totalMinutes,
      currentStreak,
      longestStreak,
      weeklyGoalProgress,
      readinessScore,
    },
    trends: {
      weeklyImprovement: percentChange(thisWeekAvg, lastWeekAvg),
      monthlyImprovement: percentChange(thisMonthAvg, lastMonthAvg),
    },
    scoreTrend,
    weeklyVolume,
    monthlyVolume,
    heatMap,
    rubricBreakdown,
    history,
  };
}
