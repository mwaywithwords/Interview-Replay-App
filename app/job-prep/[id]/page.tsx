import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/supabase/server';
import { getJobPrepProject } from '@/app/actions/job-prep';
import { AppShell } from '@/components/layout/AppShell';
import { JobPrepDetail } from '@/components/job-prep/JobPrepDetail';
import { SecondaryButton } from '@/components/ui/button';
import type { Metadata } from 'next';

interface JobPrepDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: JobPrepDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const { project } = await getJobPrepProject(id);
  return {
    title: project?.title || 'Job Prep',
  };
}

export default async function JobPrepDetailPage({ params }: JobPrepDetailPageProps) {
  const user = await requireUser();
  const { id } = await params;
  const { project, error } = await getJobPrepProject(id);

  if (error || !project) {
    notFound();
  }

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
      <JobPrepDetail project={project} />
    </AppShell>
  );
}
