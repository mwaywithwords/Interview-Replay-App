'use client';

import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  FileText,
  Lightbulb,
  ListChecks,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SecondaryButton } from '@/components/ui/button';
import type { TailoredResumeResult } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
      {children}
    </p>
  );
}

function BulletCard({
  title,
  icon: Icon,
  items,
  emptyMessage,
  variant = 'default',
}: {
  title: string;
  icon: React.ElementType;
  items: string[];
  emptyMessage: string;
  variant?: 'default' | 'warning' | 'destructive';
}) {
  return (
    <Card
      className={cn(
        'border-border/50 bg-card/65 shadow-[var(--shadow-soft)] backdrop-blur',
        variant === 'warning' && 'border-warning/25',
        variant === 'destructive' && 'border-destructive/25 bg-destructive/[0.03]'
      )}
    >
      <CardContent className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/70 bg-background">
            <Icon
              className={cn(
                'h-4 w-4',
                variant === 'warning' && 'text-warning',
                variant === 'destructive' && 'text-destructive',
                variant === 'default' && 'text-primary'
              )}
            />
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

interface JobPrepTailoredResumeResultsProps {
  result: TailoredResumeResult;
}

export function JobPrepTailoredResumeResults({ result }: JobPrepTailoredResumeResultsProps) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result.tailored_resume_text);
      toast.success('Tailored résumé copied to clipboard');
    } catch {
      toast.error('Could not copy résumé text');
    }
  }

  return (
    <div className="space-y-5">
      <Card className="border-border/50 bg-card/65 shadow-[var(--shadow-card)] backdrop-blur">
        <CardContent className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <SectionLabel>Tailored résumé</SectionLabel>
            </div>
            <SecondaryButton
              type="button"
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={handleCopy}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy résumé
            </SecondaryButton>
          </div>
          <div className="max-h-[520px] overflow-y-auto rounded-xl border border-border/35 bg-background/45 p-4">
            <pre className="whitespace-pre-wrap font-mono text-sm leading-6 text-foreground">
              {result.tailored_resume_text}
            </pre>
          </div>
        </CardContent>
      </Card>

      <BulletCard
        title="What changed"
        icon={ListChecks}
        items={result.change_summary}
        emptyMessage="No change summary was returned."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <BulletCard
          title="Truthfulness warnings"
          icon={AlertTriangle}
          items={result.truthfulness_warnings}
          emptyMessage="No truthfulness warnings."
          variant="destructive"
        />
        <BulletCard
          title="Suggested additions (confirm before using)"
          icon={Lightbulb}
          items={result.suggested_additions_user_must_confirm}
          emptyMessage="No suggested additions."
          variant="warning"
        />
      </div>

      {result.suggested_additions_user_must_confirm.length > 0 && (
        <div className="rounded-2xl border border-warning/25 bg-warning/5 px-4 py-3 text-sm font-medium leading-6 text-muted-foreground">
          Suggested additions are ideas only. Do not add them to your résumé unless they are
          factually true.
        </div>
      )}

      <div className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/55 px-4 py-3">
        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
        <p className="text-sm font-medium text-muted-foreground">
          Generated from your source résumé and saved profile only. Review before submitting.
        </p>
        <Badge variant="outline" className="ml-auto shrink-0 rounded-full">
          No export yet
        </Badge>
      </div>
    </div>
  );
}
