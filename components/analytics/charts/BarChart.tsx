'use client';

import { cn } from '@/lib/utils';

interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  maxValue?: number;
  height?: number;
  className?: string;
  showValues?: boolean;
}

export function BarChart({
  data,
  maxValue,
  height = 160,
  className,
  showValues = true,
}: BarChartProps) {
  if (data.length === 0) {
    return (
      <div className={cn('flex h-40 items-center justify-center text-sm text-muted-foreground', className)}>
        No data yet
      </div>
    );
  }

  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn('w-full', className)}>
      <div
        className="flex items-end justify-between gap-2"
        style={{ height }}
        role="img"
        aria-label="Bar chart"
      >
        {data.map((d, i) => {
          const pct = max > 0 ? (d.value / max) * 100 : 0;
          const isLast = i === data.length - 1;
          return (
            <div key={d.label} className="group flex flex-1 flex-col items-center gap-2">
              {showValues && d.value > 0 && (
                <span className="text-[10px] font-semibold tabular-nums text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                  {d.value}
                </span>
              )}
              <div className="relative w-full max-w-[2.5rem] flex-1 rounded-t-lg bg-muted/40">
                <div
                  className={cn(
                    'absolute bottom-0 w-full rounded-t-lg transition-all duration-500',
                    isLast
                      ? 'bg-gradient-to-t from-primary to-primary/60 shadow-[0_0_20px_var(--primary)]'
                      : 'bg-gradient-to-t from-primary/70 to-primary/30'
                  )}
                  style={{ height: `${Math.max(pct, d.value > 0 ? 8 : 0)}%` }}
                />
              </div>
              <span className="truncate text-[10px] font-medium text-muted-foreground">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
