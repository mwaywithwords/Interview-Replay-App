import { notFound } from 'next/navigation';
import { getSession } from '@/app/actions/sessions';
import { SessionDetail } from './session-detail';
import { AppShell } from '@/components/layout/AppShell';
import { SecondaryButton } from '@/components/ui/button';
import { requireUser } from '@/lib/supabase/server';
import type { Metadata } from 'next';

interface SessionPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: SessionPageProps): Promise<Metadata> {
  const { id } = await params;
  const { session } = await getSession(id);
  return {
    title: session?.title || 'Session Detail',
  };
}

export default async function SessionPage({ params }: SessionPageProps) {
  const user = await requireUser();
  const { id } = await params;
  const { session, error } = await getSession(id);

  if (error || !session) {
    notFound();
  }

  return (
    <AppShell
      headerActions={
        <div className="flex items-center gap-4">
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
      <SessionDetail session={session} />
    </AppShell>
  );
}
