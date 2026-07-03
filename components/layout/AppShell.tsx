import Link from 'next/link';
import { ReactNode } from 'react';
import { PlayCircle } from 'lucide-react';
import { branding } from '@/lib/branding';
import { ThemeToggle } from './ThemeToggle';

interface AppShellProps {
  children: ReactNode;
  headerActions?: ReactNode;
  showNav?: boolean;
}

export function AppShell({ children, headerActions, showNav = true }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20">
      {showNav && (
        <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border/70 bg-background/80 px-6 backdrop-blur-xl">
          <Link href="/" className="group flex items-center gap-2.5 transition-all">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary/20 bg-primary text-primary-foreground shadow-[var(--shadow-soft)] transition-transform group-hover:scale-105">
              <PlayCircle className="h-5 w-5 fill-current" />
            </div>
            <span className="text-xl font-semibold tracking-[-0.04em] text-foreground">
              {branding.brandName}
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {headerActions}
          </div>
        </header>
      )}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
}
