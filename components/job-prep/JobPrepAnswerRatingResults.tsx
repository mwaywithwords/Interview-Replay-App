'use client';

import { CheckCircle2, Lightbulb, Sparkles, Target, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  getAnswerRatingCategoryEntries,
  getAnswerRatingLabel,
} from '@/lib/job-prep/answer-rating';
import type { InterviewAnswerRatingResult } from '@/types';
import { cn } from '@/lib/utils';

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
      {children}
    </p>
  );
}

function OverallScoreCard({ score }: { score: number }) {
  const clampedValue = Math.max(0, Math.min(100, score));

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-card/95 via-card/75 to-primary/[0.05] p-5 shadow-[var(--shadow-card)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--primary),transparent_55%)] opacity-[0.08]" />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <SectionLabel>Overall answer score</SectionLabel>
          <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground/90">
            {getAnswerRatingLabel(clampedValue)}
          </p>
        </div>
        <div className="relative grid h-28 w-28 shrink-0 place-items-center">
          <div
            className="absolute inset-0 rounded-full opacity-90 blur-sm"
            style={{
              background: `conic-gradient(from 220deg, var(--primary) ${clampedValue * 3.6}deg, transparent 0deg)`,
            }}
          />
          <div className="absolute inset-0 rounded-full bg-muted/40" />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from 220deg, var(--primary) ${clampedValue * 3.6}deg, var(--muted) 0deg)`,
            }}
          />
          <div className="absolute inset-[7px] rounded-full bg-card shadow-inner" />
          <div className="relative text-center">
            <div className="text-3xl font-semibold tracking-[-0.05em] text-foreground">
              {clampedValue}
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              / 100
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryScoreBar({ label, score }: { label: string; score: number }) {
  const clampedValue = Math.max(0, Math.min(100, score));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {clampedValue}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted/60">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}

function BulletList({
  title,
  items,
  icon: Icon,
  variant = 'default',
}: {
  title: string;
  items: string[];
  icon: typeof CheckCircle2;
  variant?: 'default' | 'success' | 'warning';
}) {
  const iconClass =
    variant === 'success'
      ? 'text-success'
      : variant === 'warning'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-primary';

  return (
    <Card className="border-border/50 bg-card/65 shadow-[var(--shadow-soft)] backdrop-blur">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <Icon className={cn('h-4 w-4', iconClass)} />
          <SectionLabel>{title}</SectionLabel>
        </div>
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item}
              className="text-sm font-medium leading-6 text-muted-foreground"
            >
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

interface JobPrepAnswerRatingResultsProps {
  rating: InterviewAnswerRatingResult;
}

export function JobPrepAnswerRatingResults({ rating }: JobPrepAnswerRatingResultsProps) {
  const categories = getAnswerRatingCategoryEntries(rating);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground">
          AI answer rating
        </h2>
      </div>

      <OverallScoreCard score={rating.overall_score} />

      <Card className="border-border/50 bg-card/65 shadow-[var(--shadow-soft)] backdrop-blur">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <SectionLabel>Category scores</SectionLabel>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {categories.map((category) => (
              <CategoryScoreBar
                key={category.key}
                label={category.label}
                score={category.score}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <BulletList
          title="What went well"
          items={rating.what_went_well}
          icon={CheckCircle2}
          variant="success"
        />
        <BulletList
          title="What was missing"
          items={rating.what_was_missing}
          icon={XCircle}
          variant="warning"
        />
      </div>

      <Card className="border-border/50 bg-card/65 shadow-[var(--shadow-soft)] backdrop-blur">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <SectionLabel>Improved sample answer</SectionLabel>
          </div>
          <p className="whitespace-pre-wrap text-sm font-medium leading-7 text-foreground">
            {rating.improved_sample_answer}
          </p>
        </CardContent>
      </Card>

      <div className="rounded-2xl border border-primary/20 bg-primary/[0.06] p-4">
        <div className="mb-2 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          <SectionLabel>Next practice tip</SectionLabel>
        </div>
        <p className="text-sm font-medium leading-6 text-foreground">
          {rating.next_practice_tip}
        </p>
      </div>
    </div>
  );
}
