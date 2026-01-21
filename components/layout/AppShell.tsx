import Link from 'next/link';
import { ReactNode } from 'react';

interface AppShellProps {
  children: ReactNode;
  headerActions?: ReactNode;
}

export function AppShell({ children, headerActions }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-foreground">
            Interview Replay
          </span>
        </Link>
        <div className="flex items-center gap-3">
          {headerActions}
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
