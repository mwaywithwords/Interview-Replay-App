'use client';

import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '@/app/actions/stats';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, TrendingUp } from 'lucide-react';

function StatCardSkeleton() {
  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-muted animate-pulse" />
          <div className="flex-1">
            <div className="h-4 w-24 bg-muted rounded animate-pulse mb-2" />
            <div className="h-8 w-16 bg-muted rounded animate-pulse" />
          </div>
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
      <div className="grid gap-4 md:grid-cols-3 mb-10">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
    );
  }

  if (error || data?.error) {
    return (
      <div className="mb-10 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-destructive text-sm font-medium text-center">
        Failed to load stats: {error?.message || data?.error}
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-10">
      {/* Sessions This Week */}
      <Card className="border-border bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sessions This Week</p>
              <p className="text-3xl font-black tracking-tight text-foreground">
                {stats?.sessionsThisWeek ?? 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Minutes Practiced */}
      <Card className="border-border bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Minutes Practiced</p>
              <p className="text-3xl font-black tracking-tight text-foreground">
                {stats?.totalMinutesPracticed ?? 0}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Session Type */}
      <Card className="border-border bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Top Session Type</p>
              <p className="text-3xl font-black tracking-tight text-foreground">
                {getSessionTypeLabel(stats?.topSessionType ?? null)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
