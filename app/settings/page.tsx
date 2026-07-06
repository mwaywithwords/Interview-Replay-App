import Link from 'next/link';
import { requireUser } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, Database, LockKeyhole, Palette, Plus, Settings2, Shield } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings',
};

export default async function SettingsPage() {
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
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <PageHeader
          title="Settings"
          description="Minimal account controls and workspace preferences."
          actions={
            <Link href="/sessions/new">
              <PrimaryButton size="lg" className="rounded-full shadow-[var(--shadow-soft)]">
                <Plus className="h-5 w-5" />
                New Session
              </PrimaryButton>
            </Link>
          }
        />

        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-primary/12 via-card/80 to-card/55 shadow-[var(--shadow-card)] backdrop-blur">
            <CardContent className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                <Settings2 className="h-5 w-5" />
              </div>
              <h2 className="mt-6 text-3xl font-semibold tracking-[-0.055em] text-foreground">
                Workspace preferences
              </h2>
              <p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">
                Keep the experience calm, focused, and accessible across light and dark mode.
              </p>
              <div className="mt-6 rounded-2xl border border-border/40 bg-background/50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Appearance</p>
                    <p className="mt-1 text-xs font-medium text-muted-foreground">
                      Toggle between light, dark, and system mode.
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5">
            <Card className="border-border/50 bg-card/65 shadow-[var(--shadow-card)] backdrop-blur">
              <CardContent className="p-6">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Account
                    </p>
                    <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-foreground">
                      Security and identity
                    </h3>
                  </div>
                  <Badge variant="success" className="rounded-full">
                    Protected
                  </Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    {
                      icon: Shield,
                      title: 'Authenticated session',
                      copy: 'Access is guarded by the existing Supabase auth flow.',
                    },
                    {
                      icon: LockKeyhole,
                      title: 'Password recovery',
                      copy: 'Use the existing secure reset flow from the auth screens.',
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="rounded-2xl border border-border/40 bg-background/45 p-4">
                        <Icon className="h-5 w-5 text-primary" />
                        <p className="mt-4 text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="mt-1 text-xs font-medium leading-5 text-muted-foreground">
                          {item.copy}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/65 shadow-[var(--shadow-card)] backdrop-blur">
              <CardContent className="p-6">
                <div className="mb-5 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Preferences</h3>
                </div>
                <div className="space-y-3">
                  {[
                    {
                      icon: Bell,
                      title: 'Notifications',
                      copy: 'Email and product notifications stay on the existing account path.',
                    },
                    {
                      icon: Database,
                      title: 'Data controls',
                      copy: 'Recordings, transcripts, bookmarks, and notes remain unchanged.',
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className="flex items-start gap-4 rounded-2xl border border-border/40 bg-background/45 p-4"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/45 bg-card/70 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{item.title}</p>
                          <p className="mt-1 text-xs font-medium leading-5 text-muted-foreground">
                            {item.copy}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
