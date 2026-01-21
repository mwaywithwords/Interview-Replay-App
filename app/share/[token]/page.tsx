import { notFound } from 'next/navigation';
import {
  getSharedSession,
  getSharedBookmarks,
  getSharedTranscript,
  getSharedSessionNote,
} from '@/app/actions/shares';
import { SharedSessionView } from './shared-session-view';
import type { Metadata } from 'next';

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { token } = await params;
  const { session } = await getSharedSession(token);
  
  return {
    title: session ? `${session.title} - Shared Replay` : 'Shared Replay',
    description: 'View a shared interview replay session',
    // Prevent indexing of shared pages
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;

  // Fetch all data in parallel
  const [sessionResult, bookmarksResult, transcriptResult, noteResult] = await Promise.all([
    getSharedSession(token),
    getSharedBookmarks(token),
    getSharedTranscript(token),
    getSharedSessionNote(token),
  ]);

  // If session not found, expired, or revoked, show 404
  if (sessionResult.error || !sessionResult.session) {
    notFound();
  }

  return (
    <SharedSessionView
      token={token}
      session={sessionResult.session}
      bookmarks={bookmarksResult.bookmarks}
      transcript={transcriptResult.transcript}
      note={noteResult.note}
    />
  );
}
