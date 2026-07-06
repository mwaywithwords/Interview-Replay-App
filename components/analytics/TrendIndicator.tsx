import { cn } from '@/lib/utils';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

interface TrendIndicatorProps {
  value: number;
  label?: string;
  className?: string;
}

export function TrendIndicator({ value, label, className }: TrendIndicatorProps) {
  const isUp = value > 0;
  const isDown = value < 0;
  const Icon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : Minus;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums',
        isUp && 'border-success/25 bg-success/10 text-success',
        isDown && 'border-destructive/25 bg-destructive/10 text-destructive',
        !isUp && !isDown && 'border-border/60 bg-muted/50 text-muted-foreground',
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {isUp && '+'}
      {value}%
      {label && <span className="font-medium text-muted-foreground">{label}</span>}
    </div>
  );
}
