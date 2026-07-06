'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Briefcase,
  LayoutDashboard,
  Library,
  PlusCircle,
  Settings2,
  Target,
  UserRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const mobileNavItems = [
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
] as const;

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') {
    return pathname === '/dashboard';
  }

  if (href === '/sessions/new') {
    return pathname === '/sessions/new';
  }

  if (href === '/sessions') {
    return (
      pathname === '/sessions' ||
      (pathname.startsWith('/sessions/') && pathname !== '/sessions/new')
    );
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileTopNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="border-t border-border/50 lg:hidden"
    >
      <div className="flex gap-2 overflow-x-auto px-3 py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'inline-flex min-w-max shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition-colors',
                isActive
                  ? 'border border-primary/25 bg-primary/10 text-primary shadow-sm'
                  : 'border border-transparent text-muted-foreground hover:border-border/70 hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
