import Link from 'next/link';
import { ReactNode } from 'react';
import {
  BarChart3,
  Briefcase,
  LayoutDashboard,
  Library,
  LogOut,
  PlusCircle,
  Settings2,
  Sparkles,
  Target,
  UserRound,
} from 'lucide-react';
import { branding } from '@/lib/branding';
import { ThemeToggle } from './ThemeToggle';
import { BrandMark } from '@/components/BrandLogo';
import { MobileTopNav } from './MobileTopNav';

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
    label: 'Job Prep',
    href: '/job-prep',
    icon: Briefcase,
  },
  {
    label: 'Practice Sessions',
    href: '/sessions',
    icon: Library,
  },
  {
    label: 'Progress',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    label: 'Goals',
    href: '/goals',
    icon: Target,
  },
  {
    label: 'Profile',
    href: '/profile',
    icon: UserRound,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings2,
  },
  {
    label: 'Quick Practice',
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
              <BrandMark size="md" className="transition-transform group-hover:scale-105" />
              <div>
                <div className="text-sm font-semibold tracking-[-0.03em] text-foreground">
                  {branding.brandName}
                </div>
                <div className="text-xs font-medium text-muted-foreground">
                  Interview prep workspace
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
                Prepare smarter
              </div>
              <p className="mt-1 text-xs font-medium leading-5 text-muted-foreground">
                Start a Job Prep project or record a quick practice session — all feedback stays tied to your goal.
              </p>
              <div className="mt-4 flex items-center justify-between">
                <ThemeToggle />
                <Link
                  href="/job-prep/new"
                  className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  New Project
                </Link>
              </div>
            </div>
          </aside>

          <div className="flex min-w-0 flex-col">
            <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur-xl">
              <div className="flex h-14 min-w-0 items-center justify-between gap-3 px-3 sm:px-6 lg:h-16 lg:px-8">
                <Link href="/dashboard" className="flex min-w-0 items-center gap-2 lg:hidden">
                  <BrandMark size="sm" className="shrink-0" />
                  <span className="truncate text-base font-semibold tracking-[-0.04em] text-foreground">
                    {branding.brandName}
                  </span>
                </Link>

                <div className="hidden items-center gap-2 lg:flex">
                  <span className="rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
                    Prep workspace
                  </span>
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
                  <div className="hidden lg:block">
                    <ThemeToggle />
                  </div>
                  <div className="hidden lg:flex">{headerActions}</div>
                  {headerActions && (
                    <form action="/auth/signout" method="post" className="lg:hidden">
                      <button
                        type="submit"
                        aria-label="Sign out"
                        className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border/70 bg-background/70 px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      >
                        <LogOut className="h-4 w-4 shrink-0" />
                        <span>Sign out</span>
                      </button>
                    </form>
                  )}
                </div>
              </div>

              <MobileTopNav />
            </header>

            <main className="flex flex-1 flex-col pt-3 lg:pt-0">{children}</main>
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
            <BrandMark size="sm" className="transition-transform group-hover:scale-105" />
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
