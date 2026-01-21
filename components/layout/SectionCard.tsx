import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  children: ReactNode;
  title?: string;
  className?: string;
  headerActions?: ReactNode;
}

export function SectionCard({ children, title, className, headerActions }: SectionCardProps) {
  return (
    <div className={cn("bg-card border border-border rounded-xl overflow-hidden shadow-sm", className)}>
      {(title || headerActions) && (
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          {title && <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</h3>}
          {headerActions}
        </div>
      )}
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}
