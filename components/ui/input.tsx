import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-11 w-full rounded-xl border border-input bg-background/72 px-4 py-2 text-base shadow-sm backdrop-blur-sm transition-all duration-200 ease-out file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground/70 hover:border-primary/25 hover:bg-background/90 focus-visible:border-primary/45 focus-visible:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:shadow-[var(--shadow-soft)] disabled:cursor-not-allowed disabled:border-border/60 disabled:bg-muted/55 disabled:text-muted-foreground disabled:opacity-70 md:text-sm',
        className
      )}
      {...props}
    />
  );
}

export { Input };
