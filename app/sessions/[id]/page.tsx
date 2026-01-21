import { notFound } from 'next/navigation';
import { getSession } from '@/app/actions/sessions';
import { SessionDetail } from './session-detail';
import { AppShell } from '@/components/layout/AppShell';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import Link from 'next/link';
import { requireUser } from '@/lib/supabase/server';

interface SessionPageProps {
  params: Promise<{ id: string }>;
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
        <div className="flex items-center gap-2">
          <SecondaryButton variant="pill" size="sm">Product Manager Role</SecondaryButton>
          <SecondaryButton variant="pill" size="sm">Mock Interview</SecondaryButton>
        </div>
      }
    >
      <SessionDetail session={session} />
    </AppShell>
  );
}
