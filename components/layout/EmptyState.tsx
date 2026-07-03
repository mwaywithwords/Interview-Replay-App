import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-muted/30 px-6 py-20 text-center shadow-[var(--shadow-soft)] transition-all">
      {Icon && (
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-border/80 bg-background shadow-[var(--shadow-soft)]">
          <Icon className="h-10 w-10 text-muted-foreground" />
        </div>
      )}
      <h3 className="mb-2 text-xl font-semibold tracking-[-0.02em] text-foreground">{title}</h3>
      <p className="mb-8 max-w-sm font-medium leading-7 text-muted-foreground">{description}</p>
      {action && (
        <div className="animate-in fade-in zoom-in duration-300">
          {action}
        </div>
      )}
    </div>
  );
}
