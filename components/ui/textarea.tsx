import * as React from 'react';

import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'flex min-h-[100px] w-full resize-none rounded-xl border border-input bg-background/70 px-4 py-3 text-base shadow-sm transition-all duration-200 placeholder:text-muted-foreground/75 hover:border-border focus-visible:border-primary/40 focus-visible:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-60 md:text-sm',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
