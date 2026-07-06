import Link from 'next/link';
import { requireUser } from '@/lib/supabase/server';
import { getJobPrepProjects } from '@/app/actions/job-prep';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { JobPrepProjectList } from '@/components/job-prep/JobPrepProjectList';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Plus } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Job Prep',
};

export default async function JobPrepPage() {
  const user = await requireUser();
  const { projects, error } = await getJobPrepProjects();

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
          title="Job Prep"
          description="Save job descriptions and résumés together so you can analyze fit and practice interview questions for each role."
          actions={
            <Link href="/job-prep/new">
              <PrimaryButton size="lg" className="rounded-full shadow-[var(--shadow-soft)]">
                <Plus className="h-5 w-5" />
                New Job Prep
              </PrimaryButton>
            </Link>
          }
        />

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="gap-1.5">
            <Briefcase className="h-3 w-3" />
            {projects.length} project{projects.length === 1 ? '' : 's'}
          </Badge>
          <Badge variant="outline">Résumé + job description</Badge>
          <Badge variant="outline">ReplayAI fit analysis</Badge>
        </div>

        {error ? (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            Could not load projects: {error}
          </div>
        ) : (
          <JobPrepProjectList projects={projects} />
        )}
      </div>
    </AppShell>
  );
}
