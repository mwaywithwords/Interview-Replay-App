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
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/30">
      {showNav && (
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <Link href="/" className="flex items-center gap-2 group transition-all">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <PlayCircle className="w-5 h-5 fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              {branding.brandShort}<span className="text-primary">.ai</span>
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
