import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface AnalyticsCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function AnalyticsCard({
  title,
  subtitle,
  action,
  className,
  children,
}: AnalyticsCardProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-b from-card/90 via-card/70 to-background/50 shadow-[var(--shadow-card)] backdrop-blur-sm',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border/35 px-4 py-3 sm:px-5">
        <div>
          <h3 className="text-sm font-semibold tracking-[-0.02em] text-foreground">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}
