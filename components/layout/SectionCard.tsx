import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent, CardAction } from '@/components/ui/card';

interface SectionCardProps {
  children: ReactNode;
  title?: string;
  className?: string;
  headerActions?: ReactNode;
}

export function SectionCard({ children, title, className, headerActions }: SectionCardProps) {
  return (
    <Card className={cn("overflow-hidden border-border/80 bg-card shadow-[var(--shadow-card)] transition-all duration-200", className)}>
      {(title || headerActions) && (
        <CardHeader className="border-b border-border/70 bg-muted/30 pb-4">
          <div className="flex w-full items-center justify-between">
            {title && (
              <CardTitle className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {title}
              </CardTitle>
            )}
            {headerActions && (
              <CardAction className="m-0">
                {headerActions}
              </CardAction>
            )}
          </div>
        </CardHeader>
      )}
      <CardContent className={cn("p-6", !title && !headerActions && "pt-6")}>
        {children}
      </CardContent>
    </Card>
  );
}
