import Link from 'next/link';
import { requireUser } from '@/lib/supabase/server';
import { getSessions } from '@/app/actions/sessions';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, Mail, Plus, ShieldCheck, UserRound } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile',
};

function formatDate(date: string | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default async function ProfilePage() {
  const user = await requireUser();
  const sessionsResult = await getSessions({ limit: 4, offset: 0 });
  const recentSessions = sessionsResult.sessions;
  const displayName = user.email?.split('@')[0] || 'Practitioner';

  return (
    <AppShell
      variant="app"
      headerActions={
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
      }
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader
          title="Profile"
          description="Your account identity and practice footprint in one minimal workspace."
          actions={
            <Link href="/sessions/new">
              <PrimaryButton size="lg" className="rounded-full shadow-[var(--shadow-soft)]">
                <Plus className="h-5 w-5" />
                New Session
              </PrimaryButton>
            </Link>
          }
        />

        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-primary/12 via-card/80 to-card/55 shadow-[var(--shadow-card)] backdrop-blur">
            <CardContent className="p-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-primary/20 bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
                <UserRound className="h-9 w-9" />
              </div>
              <div className="mt-6">
                <Badge variant="info" className="mb-3 rounded-full">
                  Profile
                </Badge>
                <h2 className="text-3xl font-semibold tracking-[-0.055em] text-foreground">
                  {displayName}
                </h2>
                <p className="mt-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </p>
              </div>
              <div className="mt-6 grid gap-3">
                <div className="rounded-2xl border border-border/40 bg-background/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    User ID
                  </p>
                  <p className="mt-2 truncate text-sm font-semibold text-foreground">
                    {user.id}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/40 bg-background/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Account created
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {formatDate(user.created_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5">
            <Card className="border-border/50 bg-card/65 shadow-[var(--shadow-card)] backdrop-blur">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Practice summary
                    </p>
                    <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-foreground">
                      {sessionsResult.total} total session{sessionsResult.total === 1 ? '' : 's'}
                    </h3>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-success/20 bg-success/10 text-success">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    ['Recent sessions', recentSessions.length],
                    ['Ready reviews', recentSessions.filter((s) => s.status === 'ready').length],
                    ['Recorded', recentSessions.filter((s) => s.status === 'recorded').length],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-border/40 bg-background/45 p-4">
                      <p className="text-2xl font-semibold tracking-[-0.05em] text-foreground">
                        {value}
                      </p>
                      <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/65 shadow-[var(--shadow-card)] backdrop-blur">
              <CardContent className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Recent activity</h3>
                </div>
                <div className="space-y-2">
                  {recentSessions.length > 0 ? (
                    recentSessions.map((session) => (
                      <Link
                        key={session.id}
                        href={`/sessions/${session.id}`}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-border/35 bg-background/45 px-4 py-3 transition-colors hover:border-primary/20 hover:bg-background/70"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {session.title}
                          </p>
                          <p className="mt-1 text-xs font-medium text-muted-foreground">
                            {formatDate(session.created_at)}
                          </p>
                        </div>
                        <Badge variant="secondary" className="rounded-full capitalize">
                          {session.status}
                        </Badge>
                      </Link>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border/50 bg-muted/20 p-6 text-center">
                      <p className="text-sm font-semibold text-foreground">No sessions yet</p>
                      <p className="mt-1 text-xs font-medium text-muted-foreground">
                        Your profile activity appears after your first recording.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
