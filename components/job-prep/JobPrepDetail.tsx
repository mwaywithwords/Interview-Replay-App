'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { SectionCard } from '@/components/layout/SectionCard';
import { JobPrepAnalysisPanel } from '@/components/job-prep/JobPrepAnalysisPanel';
import { JobPrepAnalysisResults } from '@/components/job-prep/JobPrepAnalysisResults';
import { JobPrepTailoredResumePanel } from '@/components/job-prep/JobPrepTailoredResumePanel';
import { JobPrepTailoredResumeResults } from '@/components/job-prep/JobPrepTailoredResumeResults';
import { JobPrepInterviewQuestionsPanel } from '@/components/job-prep/JobPrepInterviewQuestionsPanel';
import { JobPrepInterviewQuestionsResults } from '@/components/job-prep/JobPrepInterviewQuestionsResults';
import { parseResumeJobAnalysisSummary } from '@/lib/job-prep/analysis';
import { parseTailoredResumeResult } from '@/lib/job-prep/tailored-resume';
import { ArrowLeft, Briefcase, Building2, FileText, MessageCircleQuestion, Sparkles } from 'lucide-react';
import type { JobPrepProjectWithDetails } from '@/types';

interface JobPrepDetailProps {
  project: JobPrepProjectWithDetails;
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

export function JobPrepDetail({ project: initialProject }: JobPrepDetailProps) {
  const [project, setProject] = useState(initialProject);

  const company = project.job_description?.company_name;
  const role = project.job_description?.role_title;
  const parsedSummary = useMemo(
    () => parseResumeJobAnalysisSummary(project.analysis?.summary ?? null),
    [project.analysis?.summary]
  );
  const parsedTailoredResume = useMemo(
    () => parseTailoredResumeResult(project.tailored_resume?.result ?? null),
    [project.tailored_resume?.result]
  );
  const showFullResults =
    project.analysis?.status === 'completed' && parsedSummary !== null;
  const showTailoredResumeResults =
    project.tailored_resume?.status === 'completed' && parsedTailoredResume !== null;
  const fitAnalysisComplete = project.analysis?.status === 'completed';
  const interviewQuestions = project.interview_questions ?? [];
  const showInterviewQuestionsResults =
    project.interview_question_generation?.status === 'completed' &&
    interviewQuestions.length > 0;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6">
        <Link
          href="/job-prep"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Job Prep
        </Link>
      </div>

      <div className="mb-6 flex flex-col justify-between gap-4 rounded-3xl border border-border/70 bg-card/55 p-5 shadow-[var(--shadow-soft)] backdrop-blur md:flex-row md:items-center">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariants[project.status]} className="rounded-full">
              {statusLabels[project.status]}
            </Badge>
            <Badge variant="outline" className="gap-1.5 rounded-full">
              <Briefcase className="h-3 w-3" />
              Job prep
            </Badge>
          </div>
          <h1 className="text-3xl font-semibold tracking-[-0.045em] text-foreground md:text-4xl">
            {project.title}
          </h1>
          {(company || role) && (
            <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Building2 className="h-4 w-4" />
              {[role, company].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,38%)] xl:items-start">
        <div className="space-y-6">
          <SectionCard title="Job description">
            <div className="max-h-[420px] overflow-y-auto rounded-xl border border-border/35 bg-background/45 p-4">
              <p className="whitespace-pre-wrap font-mono text-sm leading-6 text-foreground">
                {project.job_description?.content || 'No job description saved.'}
              </p>
            </div>
          </SectionCard>

          <SectionCard title="Résumé">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {project.resume?.file_name && (
                <Badge variant="secondary" className="gap-1.5 rounded-full">
                  <FileText className="h-3 w-3" />
                  {project.resume.file_name}
                </Badge>
              )}
              {project.resume?.source && (
                <Badge variant="outline" className="rounded-full capitalize">
                  {project.resume.source}
                </Badge>
              )}
            </div>
            <div className="max-h-[420px] overflow-y-auto rounded-xl border border-border/35 bg-background/45 p-4">
              <p className="whitespace-pre-wrap font-mono text-sm leading-6 text-foreground">
                {project.resume?.content || 'No résumé saved.'}
              </p>
            </div>
          </SectionCard>

          {showFullResults && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground">
                  Fit analysis report
                </h2>
              </div>
              <JobPrepAnalysisResults analysis={parsedSummary} />
            </section>
          )}

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground">
                Tailored résumé
              </h2>
            </div>
            {showTailoredResumeResults ? (
              <JobPrepTailoredResumeResults result={parsedTailoredResume} />
            ) : (
              <JobPrepTailoredResumePanel
                projectId={project.id}
                initialProject={project}
                fitAnalysisComplete={fitAnalysisComplete}
                onProjectChange={setProject}
              />
            )}
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <MessageCircleQuestion className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground">
                Interview questions
              </h2>
            </div>
            {showInterviewQuestionsResults ? (
              <JobPrepInterviewQuestionsResults questions={interviewQuestions} />
            ) : (
              <JobPrepInterviewQuestionsPanel
                projectId={project.id}
                initialProject={project}
                fitAnalysisComplete={fitAnalysisComplete}
                onProjectChange={setProject}
              />
            )}
          </section>
        </div>

        <aside className="min-w-0 xl:sticky xl:top-6 space-y-4">
          <section className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.14] via-card/80 to-card/60 p-4 shadow-[var(--shadow-card)] ring-1 ring-primary/10 backdrop-blur-xl sm:p-5">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--primary),transparent_55%)] opacity-[0.12]" />
            <div className="relative mb-4 flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/80">
                  Companion
                </p>
                <h2 className="text-base font-semibold tracking-[-0.03em] text-foreground">
                  ReplayAI Fit Analysis
                </h2>
                <p className="text-xs font-medium text-muted-foreground/85">
                  Resume-to-job comparison and improvement guidance.
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 shadow-[0_0_20px_-6px_var(--primary)]">
                <Sparkles className="h-4 w-4 shrink-0 text-primary" />
              </div>
            </div>

            <JobPrepAnalysisPanel
              projectId={project.id}
              initialProject={project}
              showResults={false}
              onProjectChange={setProject}
            />
          </section>

          {showTailoredResumeResults && (
            <section className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.14] via-card/80 to-card/60 p-4 shadow-[var(--shadow-card)] ring-1 ring-primary/10 backdrop-blur-xl sm:p-5">
              <JobPrepTailoredResumePanel
                projectId={project.id}
                initialProject={project}
                showResults={false}
                fitAnalysisComplete={fitAnalysisComplete}
                onProjectChange={setProject}
              />
            </section>
          )}

          {fitAnalysisComplete && !showInterviewQuestionsResults && (
            <section className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.14] via-card/80 to-card/60 p-4 shadow-[var(--shadow-card)] ring-1 ring-primary/10 backdrop-blur-xl sm:p-5">
              <div className="relative mb-4 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary/80">
                    Companion
                  </p>
                  <h2 className="text-base font-semibold tracking-[-0.03em] text-foreground">
                    Interview Questions
                  </h2>
                  <p className="text-xs font-medium text-muted-foreground/85">
                    Practice questions tailored to your résumé and this role.
                  </p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 shadow-[0_0_20px_-6px_var(--primary)]">
                  <MessageCircleQuestion className="h-4 w-4 shrink-0 text-primary" />
                </div>
              </div>
              <JobPrepInterviewQuestionsPanel
                projectId={project.id}
                initialProject={project}
                showResults={false}
                fitAnalysisComplete={fitAnalysisComplete}
                onProjectChange={setProject}
              />
            </section>
          )}

          {showInterviewQuestionsResults && (
            <section className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.14] via-card/80 to-card/60 p-4 shadow-[var(--shadow-card)] ring-1 ring-primary/10 backdrop-blur-xl sm:p-5">
              <JobPrepInterviewQuestionsPanel
                projectId={project.id}
                initialProject={project}
                showResults={false}
                fitAnalysisComplete={fitAnalysisComplete}
                onProjectChange={setProject}
              />
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
