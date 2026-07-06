import { requireUser } from '@/lib/supabase/server';
import { getSessions } from '@/app/actions/sessions';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { SettingsExperience } from '@/components/settings/SettingsExperience';
import { SlidersHorizontal } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings',
};

function getDisplayName(user: Awaited<ReturnType<typeof requireUser>>): string {
  const metadataName = user.user_metadata?.name;
  if (typeof metadataName === 'string' && metadataName.trim()) {
    return metadataName.trim();
  }
  return user.email?.split('@')[0] || 'Replay user';
}

export default async function SettingsPage() {
  const user = await requireUser();
  const sessionsResult = await getSessions({ limit: 100, offset: 0 });
  const sessions = sessionsResult.sessions;
  const totalBytes = sessions.reduce((sum, session) => {
    return sum + (session.audio_file_size_bytes || 0) + (session.video_file_size_bytes || 0);
  }, 0);
  const storageUsedMb = Math.round((totalBytes / (1024 * 1024)) * 10) / 10;
  const aiReadySessions = sessions.filter((session) => session.status === 'ready').length;

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
      <div className="mx-auto w-full max-w-[96rem] px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 2xl:px-10">
        <PageHeader
          title="Settings"
          description="Tune Replay’s account, AI, playback, transcript, privacy, and appearance preferences from one polished workspace."
          actions={
            <PrimaryButton size="lg" className="rounded-full shadow-[var(--shadow-soft)]">
              <SlidersHorizontal className="h-5 w-5" />
              Preferences
            </PrimaryButton>
          }
        />

        <SettingsExperience
          user={{
            id: user.id,
            email: user.email,
            name: getDisplayName(user),
          }}
          usage={{
            totalSessions: sessionsResult.total,
            storageUsedMb,
            aiReadySessions,
          }}
        />
      </div>
    </AppShell>
  );
}
