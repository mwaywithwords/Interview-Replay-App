import Link from 'next/link';
import { requireUser } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { SessionsList } from '@/components/sessions/SessionsList';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Search } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sessions',
};

export default async function SessionsPage() {
  const user = await requireUser();

  return (
    <AppShell
      variant="app"
      headerActions={
        <div className="flex items-center gap-3">
          <div className="hidden flex-col items-end md:flex">
            <span className="text-sm font-semibold tracking-[-0.02em] text-foreground">
              {user.email?.split('@')[0]}
            </span>
            <span className="max-w-[220px] truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
          <form action="/auth/signout" method="post">
            <SecondaryButton
              type="submit"
              size="sm"
              variant="outline"
              className="rounded-full border-border/70 bg-background/70 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              Sign Out
            </SecondaryButton>
          </form>
        </div>
      }
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader
          title="Sessions"
          description="Your interview media library. Search, filter, organize, and jump back into reports from every recorded practice session."
          actions={
            <Link href="/sessions/new">
              <PrimaryButton size="lg" className="rounded-full shadow-[var(--shadow-soft)]">
                <Plus className="h-5 w-5" />
                New Session
              </PrimaryButton>
            </Link>
          }
        />

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <Search className="h-3 w-3" />
            Searchable library
          </Badge>
          <Badge variant="outline">Filters</Badge>
          <Badge variant="outline">Newest first</Badge>
          <Badge variant="outline">Interview reports</Badge>
        </div>

        <SessionsList />
      </div>
    </AppShell>
  );
}
