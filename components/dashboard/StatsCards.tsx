'use client';

import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/app/actions/stats';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, TrendingUp } from 'lucide-react';

function StatCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/70 bg-card/65 shadow-[var(--shadow-soft)] backdrop-blur">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="h-11 w-11 rounded-2xl" />
        </div>
      </CardContent>
    </Card>
  );
}

function getSessionTypeLabel(type: string | null): string {
  if (!type) return '—';
  const labels: Record<string, string> = {
    interview: 'Interview',
    trading: 'Trading',
  };
  return labels[type] || type;
}

export function StatsCards() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => getDashboardStats(),
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  if (error || data?.error) {
    return (
      <div className="mb-6 rounded-3xl border border-destructive/20 bg-destructive/10 p-4 text-center text-sm font-medium text-destructive shadow-[var(--shadow-soft)]">
        Failed to load stats: {error?.message || data?.error}
      </div>
    );
  }

  const stats = data?.stats;
  const cards = [
    {
      label: 'This week',
      value: stats?.sessionsThisWeek ?? 0,
      helper: 'sessions recorded',
      icon: Calendar,
      tone: 'bg-primary/10 text-primary border-primary/20',
    },
    {
      label: 'Practice time',
      value: stats?.totalMinutesPracticed ?? 0,
      helper: 'total minutes',
      icon: Clock,
      tone: 'bg-success/10 text-success border-success/20',
    },
    {
      label: 'Top focus',
      value: getSessionTypeLabel(stats?.topSessionType ?? null),
      helper: 'session type',
      icon: TrendingUp,
      tone: 'bg-warning/10 text-warning border-warning/20',
    },
  ];

  return (
    <div className="mb-6 grid gap-3 md:grid-cols-3">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card
            key={card.label}
            className="group overflow-hidden border-border/70 bg-card/65 shadow-[var(--shadow-soft)] backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/25"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {card.label}
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-foreground">
                    {card.value}
                  </p>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">
                    {card.helper}
                  </p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${card.tone}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
