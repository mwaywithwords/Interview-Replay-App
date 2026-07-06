'use client';

import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  Target,
  XCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getMatchScoreLabel } from '@/lib/job-prep/analysis';
import type { ResumeJobAnalysisSummary } from '@/types';
import { cn } from '@/lib/utils';

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
      {children}
    </p>
  );
}

function CircularMatchScore({ score }: { score: number }) {
  const clampedValue = Math.max(0, Math.min(100, score));

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-gradient-to-br from-card/95 via-card/75 to-primary/[0.05] p-5 shadow-[var(--shadow-card)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--primary),transparent_55%)] opacity-[0.08]" />
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <SectionLabel>Overall match</SectionLabel>
          <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground/90">
            {getMatchScoreLabel(clampedValue)}
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

function KeywordList({
  title,
  items,
  emptyMessage,
  variant = 'default',
}: {
  title: string;
  items: string[];
  emptyMessage: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}) {
  const badgeVariant =
    variant === 'success'
      ? 'success'
      : variant === 'warning'
        ? 'warning'
        : variant === 'destructive'
          ? 'destructive'
          : 'secondary';

  return (
    <Card className="border-border/50 bg-card/65 shadow-[var(--shadow-soft)] backdrop-blur">
      <CardContent className="p-5">
        <SectionLabel>{title}</SectionLabel>
        {items.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {items.map((item) => (
              <Badge key={item} variant={badgeVariant} className="rounded-full px-3 py-1">
                {item}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">
            {emptyMessage}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function BulletCard({
  title,
  icon: Icon,
  items,
  emptyMessage,
  iconClassName,
}: {
  title: string;
  icon: React.ElementType;
  items: string[];
  emptyMessage: string;
  iconClassName?: string;
}) {
  return (
    <Card className="border-border/50 bg-card/65 shadow-[var(--shadow-soft)] backdrop-blur">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/70 bg-background">
            <Icon className={cn('h-4 w-4 text-primary', iconClassName)} />
          </div>
          <h3 className="text-sm font-semibold tracking-[-0.02em] text-foreground">
            {title}
          </h3>
        </div>
        {items.length > 0 ? (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item}
                className="rounded-xl border border-border/35 bg-background/45 px-3 py-2 text-sm font-medium leading-6 text-foreground"
              >
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm font-medium leading-6 text-muted-foreground">{emptyMessage}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface JobPrepAnalysisResultsProps {
  analysis: ResumeJobAnalysisSummary;
}

export function JobPrepAnalysisResults({ analysis }: JobPrepAnalysisResultsProps) {
  return (
    <div className="space-y-5">
      <CircularMatchScore score={analysis.overall_match_score} />

      <Card className="border-border/50 bg-card/65 shadow-[var(--shadow-soft)] backdrop-blur">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <SectionLabel>Summary</SectionLabel>
          </div>
          <p className="text-sm font-medium leading-7 text-foreground">{analysis.summary}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <KeywordList
          title="Matched skills"
          items={analysis.matched_skills}
          emptyMessage="No strong skill matches were identified."
          variant="success"
        />
        <KeywordList
          title="Missing keywords"
          items={analysis.missing_keywords}
          emptyMessage="No major keyword gaps were found."
          variant="warning"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <BulletCard
          title="Weak resume sections"
          icon={Target}
          items={analysis.weak_resume_sections}
          emptyMessage="No weak sections flagged."
        />
        <BulletCard
          title="Recommended changes"
          icon={Lightbulb}
          items={analysis.recommended_resume_changes}
          emptyMessage="No specific changes recommended."
        />
      </div>

      <Card
        className={cn(
          'border-border/50 bg-card/65 shadow-[var(--shadow-soft)] backdrop-blur',
          analysis.risk_flags.length > 0 && 'border-destructive/25 bg-destructive/[0.03]'
        )}
      >
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle
              className={cn(
                'h-4 w-4',
                analysis.risk_flags.length > 0 ? 'text-destructive' : 'text-muted-foreground'
              )}
            />
            <SectionLabel>Risk flags</SectionLabel>
          </div>
          {analysis.risk_flags.length > 0 ? (
            <ul className="space-y-2">
              {analysis.risk_flags.map((flag) => (
                <li
                  key={flag}
                  className="flex items-start gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm font-medium leading-6 text-foreground"
                >
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  {flag}
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-success" />
              No major risk flags identified.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
