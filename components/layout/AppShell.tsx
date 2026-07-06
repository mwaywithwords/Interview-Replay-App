import Link from 'next/link';
import { ReactNode } from 'react';
import { LayoutDashboard, Library, BarChart3, PlusCircle, PlayCircle, Sparkles } from 'lucide-react';
import { branding } from '@/lib/branding';
import { ThemeToggle } from './ThemeToggle';

interface AppShellProps {
  children: ReactNode;
  headerActions?: ReactNode;
  showNav?: boolean;
  variant?: 'default' | 'app';
}

const appNavItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Sessions',
    href: '/sessions',
    icon: Library,
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    label: 'New Session',
    href: '/sessions/new',
    icon: PlusCircle,
  },
];

export function AppShell({
  children,
  headerActions,
  showNav = true,
  variant = 'default',
}: AppShellProps) {
  if (!showNav) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/20">
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    );
  }

  if (variant === 'app') {
    return (
      <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
        <div className="pointer-events-none fixed inset-0 -z-0">
          <div className="absolute left-[-180px] top-[-160px] h-[420px] w-[420px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-[-220px] right-[-180px] h-[500px] w-[500px] rounded-full bg-info/10 blur-3xl" />
        </div>

        <div className="relative z-10 lg:grid lg:min-h-screen lg:grid-cols-[236px_1fr]">
          <aside className="sticky top-0 hidden h-screen border-r border-border/70 bg-card/45 p-3 backdrop-blur-xl lg:flex lg:flex-col">
            <Link
              href="/dashboard"
              className="group flex items-center gap-2.5 rounded-2xl px-3 py-3 transition-colors hover:bg-accent"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary text-primary-foreground shadow-[var(--shadow-soft)] transition-transform group-hover:scale-105">
                <PlayCircle className="h-5 w-5 fill-current" />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-[-0.03em] text-foreground">
                  {branding.brandName}
                </div>
                <div className="text-xs font-medium text-muted-foreground">
                  Practice workspace
                </div>
              </div>
            </Link>

            <nav className="mt-6 space-y-1">
              {appNavItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
                  >
                    <Icon className="h-4 w-4 transition-colors group-hover:text-primary" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto rounded-3xl border border-border/70 bg-background/60 p-4 shadow-[var(--shadow-soft)]">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="mt-4 text-sm font-semibold tracking-[-0.02em] text-foreground">
                Review faster
              </div>
              <p className="mt-1 text-xs font-medium leading-5 text-muted-foreground">
                Record, replay, bookmark, and improve from one focused workspace.
              </p>
              <div className="mt-4 flex items-center justify-between">
                <ThemeToggle />
                <Link
                  href="/sessions/new"
                  className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  New
                </Link>
              </div>
            </div>
          </aside>

          <div className="flex min-w-0 flex-col">
            <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
              <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
                <Link href="/dashboard" className="flex items-center gap-2.5 lg:hidden">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                    <PlayCircle className="h-5 w-5 fill-current" />
                  </div>
                  <span className="text-lg font-semibold tracking-[-0.04em] text-foreground">
                    {branding.brandName}
                  </span>
                </Link>

                <div className="hidden items-center gap-2 lg:flex">
                  <span className="rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
                    App workspace
                  </span>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="hidden lg:block">
                    <ThemeToggle />
                  </div>
                  {headerActions}
                </div>
              </div>

              <nav className="flex gap-2 overflow-x-auto border-t border-border/50 px-4 py-2 sm:px-6 lg:hidden">
                {appNavItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex shrink-0 items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm transition-colors hover:border-primary/25 hover:bg-accent hover:text-foreground"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </header>

            <main className="flex flex-1 flex-col">{children}</main>
          </div>
        </div>
      </div>
    );
  }

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
