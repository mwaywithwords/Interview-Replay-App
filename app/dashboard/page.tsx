import Link from 'next/link';
import { requireUser } from '@/lib/supabase/server';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { SessionsList } from '@/components/sessions/SessionsList';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { Plus } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default async function Dashboard() {
  const user = await requireUser();

  return (
    <AppShell
      headerActions={
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-semibold text-foreground">{user.email?.split('@')[0]}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
          <form action="/auth/signout" method="post">
            <SecondaryButton type="submit" size="sm" variant="outline" className="text-muted-foreground hover:text-foreground hover:bg-accent border-border">
              Sign Out
            </SecondaryButton>
          </form>
        </div>
      }
    >
      <div className="max-w-6xl mx-auto px-6 py-12">
        <PageHeader
          title="Session Library"
          description="Review and analyze your recorded sessions to sharpen your performance."
          actions={
            <Link href="/sessions/new">
              <PrimaryButton size="lg" className="shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-95">
                <Plus className="mr-2 h-5 w-5" />
                New Session
              </PrimaryButton>
            </Link>
          }
        />

        <StatsCards />

        <SessionsList />
      </div>
    </AppShell>
  );
}
