import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/layout/EmptyState';
import { PrimaryButton } from '@/components/ui/button';
import { parseResumeJobAnalysisSummary } from '@/lib/job-prep/analysis';
import { Briefcase, Building2, Clock, Plus, Sparkles } from 'lucide-react';
import type { JobPrepProjectWithDetails } from '@/types';

interface JobPrepProjectListProps {
  projects: JobPrepProjectWithDetails[];
}

const statusLabels: Record<JobPrepProjectWithDetails['status'], string> = {
  draft: 'Draft',
  analyzing: 'Analyzing',
  ready: 'Ready',
  archived: 'Archived',
};

const statusVariants: Record<
  JobPrepProjectWithDetails['status'],
  'secondary' | 'info' | 'success' | 'outline'
> = {
  draft: 'secondary',
  analyzing: 'info',
  ready: 'success',
  archived: 'outline',
};

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateString));
}

export function JobPrepProjectList({ projects }: JobPrepProjectListProps) {
  if (projects.length === 0) {
    return (
      <EmptyState
        icon={Briefcase}
        title="No Job Prep projects yet"
        description="Create your first project to prepare for a specific role — fit analysis, tailored questions, and answer feedback in one workspace."
        action={
          <Link href="/job-prep/new">
            <PrimaryButton size="lg" className="rounded-full shadow-[var(--shadow-soft)]">
              <Plus className="h-5 w-5" />
              New Job Prep
            </PrimaryButton>
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => {
        const company = project.job_description?.company_name;
        const role = project.job_description?.role_title;
        const matchScore = parseResumeJobAnalysisSummary(
          project.analysis?.summary ?? null
        )?.overall_match_score;

        return (
          <Link key={project.id} href={`/job-prep/${project.id}`} className="group block">
            <Card className="border-border/50 bg-card/65 shadow-[var(--shadow-card)] backdrop-blur transition-all group-hover:border-primary/25 group-hover:shadow-[var(--shadow-soft)]">
              <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-semibold tracking-[-0.03em] text-foreground">
                    {project.title}
                  </h3>
                  {(company || role) && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {[role, company].filter(Boolean).join(' · ')}
                      </span>
                    </p>
                  )}
                </div>
                <Badge variant={statusVariants[project.status]} className="shrink-0 rounded-full">
                  {statusLabels[project.status]}
                </Badge>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Updated {formatDate(project.updated_at)}
                </div>
                {matchScore !== undefined && (
                  <Badge variant="info" className="gap-1.5 rounded-full">
                    <Sparkles className="h-3 w-3" />
                    {matchScore}% match
                  </Badge>
                )}
              </div>

              <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted-foreground">
                {project.job_description?.content ?? 'No job description saved yet.'}
              </p>
            </CardContent>
          </Card>
          </Link>
        );
      })}
    </div>
  );
}
