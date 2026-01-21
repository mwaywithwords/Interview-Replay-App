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
    <Card className={cn("overflow-hidden border-border bg-card shadow-sm transition-all duration-200", className)}>
      {(title || headerActions) && (
        <CardHeader className="border-b border-border pb-4 bg-muted/30">
          <div className="flex items-center justify-between w-full">
            {title && (
              <CardTitle className="text-xs font-black text-muted-foreground uppercase tracking-widest">
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
