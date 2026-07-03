import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 rounded-3xl border border-border/70 bg-card/55 p-5 shadow-[var(--shadow-soft)] backdrop-blur md:flex-row md:items-center">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-[-0.045em] text-foreground md:text-4xl">{title}</h1>
        {description && (
          <p className="max-w-2xl text-sm font-medium leading-6 text-muted-foreground md:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
