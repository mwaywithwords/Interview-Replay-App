import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-[100px] w-full rounded-xl border border-input bg-muted/30 px-4 py-3 text-base shadow-sm transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary/30 focus-visible:bg-background disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
