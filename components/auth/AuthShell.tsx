import Link from 'next/link';
import { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import { branding } from '@/lib/branding';
import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/BrandLogo';

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}

export function AuthBrandMark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        'group inline-flex items-center gap-2.5 rounded-full border border-border/50 bg-background/55 px-3 py-2 shadow-sm backdrop-blur transition-all hover:border-primary/25 hover:bg-background/80',
        className
      )}
    >
      <BrandMark size="sm" className="transition-transform group-hover:scale-105" />
      <span className="text-sm font-semibold tracking-[-0.03em] text-foreground">
        {branding.brandName}
      </span>
    </Link>
  );
}

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  className,
}: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-background px-4 py-8 text-foreground sm:px-6 sm:py-10 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-12rem] top-[-12rem] h-[28rem] w-[28rem] rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute bottom-[-14rem] right-[-10rem] h-[32rem] w-[32rem] rounded-full bg-info/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-success/5 blur-3xl" />
      </div>

      <div
        className={cn(
          'animate-in fade-in slide-in-from-bottom-3 relative grid w-full max-w-[1040px] overflow-hidden rounded-[2rem] border border-border/50 bg-card/70 shadow-[var(--shadow-elevated)] backdrop-blur-xl duration-500 lg:grid-cols-[0.95fr_1.05fr]',
          className
        )}
      >
        <div className="hidden min-h-[660px] flex-col justify-between overflow-hidden border-r border-border/40 bg-gradient-to-br from-primary/12 via-card/75 to-card/35 p-8 lg:flex">
          <div>
            <AuthBrandMark />
            <div className="mt-16 max-w-sm">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Practice intelligence
              </div>
              <h2 className="text-4xl font-semibold tracking-[-0.06em] text-foreground">
                Review every rep with sharper context.
              </h2>
              <p className="mt-4 text-sm font-medium leading-6 text-muted-foreground">
                Record, replay, bookmark, and improve from a calm workspace built for serious interview practice.
              </p>
            </div>
          </div>

          <div className="grid gap-3">
            {['Secure sessions', 'Private recordings', 'AI-ready replays'].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-border/35 bg-background/45 px-4 py-3 text-sm font-semibold text-foreground shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="flex min-h-[620px] flex-col justify-center p-5 sm:p-8 lg:p-10">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 text-center lg:hidden">
              <AuthBrandMark />
            </div>
            <div className="mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                {eyebrow}
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.055em] text-foreground sm:text-4xl">
                {title}
              </h1>
              <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
                {description}
              </p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
