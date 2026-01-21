import { notFound } from 'next/navigation';
import { getSession } from '@/app/actions/sessions';
import { SessionDetail } from './session-detail';

interface SessionPageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { id } = await params;
  const { session, error } = await getSession(id);

  if (error || !session) {
    notFound();
  }

  return <SessionDetail session={session} />;
}
