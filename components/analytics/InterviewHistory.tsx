import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HistoryItem {
  id: string;
  title: string;
  date: string;
  durationMinutes: number;
  status: string;
  type: string;
  readiness: number;
}

interface InterviewHistoryProps {
  items: HistoryItem[];
}

const statusVariant: Record<
  string,
  'success' | 'warning' | 'info' | 'destructive' | 'secondary'
> = {
  ready: 'success',
  recorded: 'info',
  processing: 'warning',
  recording: 'destructive',
  draft: 'secondary',
  archived: 'secondary',
};

export function InterviewHistory({ items }: InterviewHistoryProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/20 py-12 text-center">
        <p className="text-sm font-semibold text-foreground">No interview history yet</p>
        <p className="mt-1 text-xs font-medium text-muted-foreground">
          Record your first session to start building analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/sessions/${item.id}`}
          className="group flex items-center gap-4 rounded-xl border border-border/35 bg-background/45 px-4 py-3 transition-all hover:border-primary/20 hover:bg-background/70"
        >
          <div className="relative grid h-11 w-11 shrink-0 place-items-center">
            <div
              className="absolute inset-0 rounded-full opacity-60"
              style={{
                background: `conic-gradient(var(--primary) ${item.readiness * 3.6}deg, var(--muted) 0deg)`,
              }}
            />
            <div className="absolute inset-1 rounded-full bg-card" />
            <span className="relative text-xs font-semibold tabular-nums text-foreground">
              {item.readiness}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-semibold text-foreground group-hover:text-primary">
                {item.title}
              </p>
              <Badge variant="secondary" className="rounded-full text-[9px] uppercase">
                {item.type}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground">
              <span>{item.date}</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {item.durationMinutes > 0 ? `${item.durationMinutes} min` : '—'}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Badge
              variant={statusVariant[item.status] || 'secondary'}
              className="rounded-full capitalize"
            >
              {item.status}
            </Badge>
            <ArrowRight
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary'
              )}
            />
          </div>
        </Link>
      ))}
    </div>
  );
}
