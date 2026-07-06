'use client';

import { cn } from '@/lib/utils';

interface HeatMapProps {
  data: Array<{ date: string; count: number; day: number; week: number }>;
  weeks?: number;
  className?: string;
}

const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function intensityClass(count: number): string {
  if (count === 0) return 'bg-muted/30';
  if (count === 1) return 'bg-primary/25';
  if (count === 2) return 'bg-primary/45';
  return 'bg-primary/70 shadow-[0_0_8px_var(--primary)]';
}

export function HeatMap({ data, weeks = 16, className }: HeatMapProps) {
  const grid: number[][] = Array.from({ length: weeks }, () => Array(7).fill(0));

  data.forEach((cell) => {
    if (cell.week >= 0 && cell.week < weeks && cell.day >= 0 && cell.day < 7) {
      grid[cell.week][cell.day] = cell.count;
    }
  });

  return (
    <div className={cn('w-full', className)}>
      <div className="flex gap-2">
        <div className="flex flex-col justify-between py-0.5 text-[9px] font-semibold text-muted-foreground">
          {dayLabels.map((label, i) => (
            <span key={`${label}-${i}`} className="leading-none">
              {i % 2 === 1 ? label : ''}
            </span>
          ))}
        </div>
        <div className="flex-1 overflow-x-auto">
          <div className="flex min-w-max gap-1" role="img" aria-label="Practice activity heat map">
            {grid.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((count, di) => (
                  <div
                    key={`${wi}-${di}`}
                    title={`${count} session${count === 1 ? '' : 's'}`}
                    className={cn(
                      'h-3 w-3 rounded-[3px] border border-border/20 transition-colors sm:h-3.5 sm:w-3.5',
                      intensityClass(count)
                    )}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-end gap-2 text-[10px] font-medium text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="h-3 w-3 rounded-[3px] bg-muted/30" />
          <div className="h-3 w-3 rounded-[3px] bg-primary/25" />
          <div className="h-3 w-3 rounded-[3px] bg-primary/45" />
          <div className="h-3 w-3 rounded-[3px] bg-primary/70" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
