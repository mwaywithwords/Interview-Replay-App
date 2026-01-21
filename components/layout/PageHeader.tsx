import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-4 border-b border-border">
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl font-medium">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 shrink-0 mb-1">
          {actions}
        </div>
      )}
    </div>
  );
}
