'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface CircularKPIProps {
  value: number;
  max?: number;
  label: string;
  helper?: string;
  icon?: LucideIcon;
  suffix?: string;
  tone?: 'primary' | 'success' | 'info' | 'warning';
  className?: string;
}

const toneStyles = {
  primary: {
    ring: 'var(--primary)',
    bg: 'from-primary/15 via-card to-card',
    border: 'border-primary/20',
    icon: 'border-primary/20 bg-primary/10 text-primary',
  },
  success: {
    ring: 'var(--success)',
    bg: 'from-success/12 via-card to-card',
    border: 'border-success/20',
    icon: 'border-success/20 bg-success/10 text-success',
  },
  info: {
    ring: 'var(--info)',
    bg: 'from-info/12 via-card to-card',
    border: 'border-info/20',
    icon: 'border-info/20 bg-info/10 text-info',
  },
  warning: {
    ring: 'var(--warning)',
    bg: 'from-warning/12 via-card to-card',
    border: 'border-warning/20',
    icon: 'border-warning/20 bg-warning/10 text-warning',
  },
};

export function CircularKPI({
  value,
  max = 100,
  label,
  helper,
  icon: Icon,
  suffix = '',
  tone = 'primary',
  className,
}: CircularKPIProps) {
  const clamped = Math.max(0, Math.min(max, value));
  const pct = max > 0 ? (clamped / max) * 100 : 0;
  const styles = toneStyles[tone];

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-gradient-to-br p-4 shadow-[var(--shadow-soft)]',
        styles.border,
        styles.bg,
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--primary),transparent_55%)] opacity-[0.06]" />
      <div className="relative flex items-center gap-4">
        <div className="relative grid h-[4.5rem] w-[4.5rem] shrink-0 place-items-center">
          <div
            className="absolute inset-0 rounded-full opacity-70 blur-[2px]"
            style={{
              background: `conic-gradient(${styles.ring} ${pct * 3.6}deg, transparent 0deg)`,
            }}
          />
          <div className="absolute inset-0 rounded-full bg-muted/35" />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(${styles.ring} ${pct * 3.6}deg, var(--muted) 0deg)`,
            }}
          />
          <div className="absolute inset-[5px] rounded-full bg-card shadow-inner" />
          <div className="relative text-center">
            <div className="text-lg font-semibold tabular-nums tracking-[-0.04em] text-foreground">
              {clamped}
              {suffix}
            </div>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          {Icon && (
            <div
              className={cn(
                'mb-2 flex h-7 w-7 items-center justify-center rounded-lg border',
                styles.icon
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>
          )}
          <p className="text-sm font-semibold tracking-[-0.02em] text-foreground">{label}</p>
          {helper && (
            <p className="mt-0.5 text-xs font-medium leading-5 text-muted-foreground">{helper}</p>
          )}
        </div>
      </div>
    </div>
  );
}
