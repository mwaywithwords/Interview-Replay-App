import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-10 flex flex-col justify-between gap-4 border-b border-border/70 pb-5 md:flex-row md:items-end">
      <div className="space-y-2.5">
        <h1 className="text-4xl font-semibold tracking-[-0.045em] text-foreground">{title}</h1>
        {description && (
          <p className="max-w-2xl text-lg font-medium leading-8 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="mb-1 flex shrink-0 items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
