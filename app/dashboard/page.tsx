import Link from 'next/link';
import { requireUser } from '@/lib/supabase/server';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { SessionsList } from '@/components/sessions/SessionsList';
import { Plus } from 'lucide-react';

export default async function Dashboard() {
  const user = await requireUser();

  return (
    <AppShell
      headerActions={
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user.email}</span>
          <form action="/auth/signout" method="post">
            <SecondaryButton type="submit" size="sm" variant="ghost">
              Sign Out
            </SecondaryButton>
          </form>
        </div>
      }
    >
      <div className="max-w-6xl mx-auto px-6 py-10">
        <PageHeader
          title="Your Sessions"
          description="Manage and review your interview and trading sessions."
          actions={
            <Link href="/sessions/new">
              <PrimaryButton size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Session
              </PrimaryButton>
            </Link>
          }
        />

        <SessionsList />
      </div>
    </AppShell>
  );
}
