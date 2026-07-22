'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  Copy,
  Download,
  FileText,
  Lightbulb,
  ListChecks,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { SecondaryButton } from '@/components/ui/button';
import type { TailoredResumeResult } from '@/types';
import {
  accuracyCheckToneClasses,
  resolveAccuracyCheckState,
} from '@/lib/job-prep/accuracy-check';
import {
  buildTailoredResumeFilename,
  createTailoredResumeDocxBlob,
  createTailoredResumeTextBlob,
  downloadBlob,
  ResumeExportError,
} from '@/lib/resume/export-tailored-resume';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type ResumeExportEvent =
  | 'resume_export_requested'
  | 'resume_export_generation_record_found'
  | 'resume_export_document_created'
  | 'resume_export_response_size'
  | 'resume_export_response_returned'
  | 'resume_export_failed';

function logResumeExport(
  event: ResumeExportEvent,
  details: Record<string, string | number | boolean> = {}
) {
  const payload = {
    event,
    format: 'docx',
    ...details,
  };

  if (event === 'resume_export_failed') {
    console.error('[resume_export]', payload);
  } else {
    console.info('[resume_export]', payload);
  }
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-muted-foreground/80 text-[11px] font-semibold tracking-[0.14em] uppercase">
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
        variant === 'destructive' &&
          'border-destructive/25 bg-destructive/[0.03]'
      )}
    >
      <CardContent className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="border-border/70 bg-background flex h-8 w-8 items-center justify-center rounded-xl border">
            <Icon
              className={cn(
                'h-4 w-4',
                variant === 'warning' && 'text-warning',
                variant === 'destructive' && 'text-destructive',
                variant === 'default' && 'text-primary'
              )}
            />
          </div>
          <h3 className="text-foreground text-sm font-semibold tracking-[-0.02em]">
            {title}
          </h3>
        </div>
        {items.length > 0 ? (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item}
                className="border-border/35 bg-background/45 text-foreground rounded-xl border px-3 py-2 text-sm leading-6 font-medium"
              >
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm leading-6 font-medium">
            {emptyMessage}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function AccuracyCheckCard({
  warnings,
  reviewItems,
}: {
  warnings: string[];
  reviewItems: string[];
}) {
  const state = resolveAccuracyCheckState({ warnings, reviewItems });
  const styles = accuracyCheckToneClasses[state.status];
  const StatusIcon =
    state.status === 'success'
      ? CheckCircle2
      : state.status === 'neutral'
        ? CircleHelp
        : AlertTriangle;

  return (
    <Card
      role="status"
      aria-label={state.accessibleLabel}
      data-accuracy-status={state.status}
      className={cn(
        'border-border/50 bg-card/65 shadow-[var(--shadow-soft)] backdrop-blur',
        styles.card
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="border-border/70 bg-background flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border">
            <StatusIcon
              aria-hidden="true"
              className={cn('h-4 w-4', styles.icon)}
            />
          </div>
          <div className="min-w-0">
            <SectionLabel>Accuracy check</SectionLabel>
            <h3 className="text-foreground mt-1 text-sm font-semibold tracking-[-0.02em]">
              {state.title}
            </h3>
            <p className="text-muted-foreground mt-1 text-sm leading-6 font-medium">
              {state.description}
            </p>
          </div>
        </div>

        {warnings.length > 0 && (
          <ul
            className="mt-4 space-y-2"
            aria-label="Claims to review or remove"
          >
            {warnings.map((warning) => (
              <li
                key={warning}
                className="border-destructive/20 bg-background/45 text-foreground flex items-start gap-2 rounded-xl border px-3 py-2 text-sm leading-6 font-medium"
              >
                <AlertTriangle
                  aria-hidden="true"
                  className="text-destructive mt-1 h-4 w-4 shrink-0"
                />
                {warning}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

interface JobPrepTailoredResumeResultsProps {
  result: TailoredResumeResult;
  companyName?: string | null;
  roleTitle?: string | null;
}

export function JobPrepTailoredResumeResults({
  result,
  companyName,
  roleTitle,
}: JobPrepTailoredResumeResultsProps) {
  const [docxBlob, setDocxBlob] = useState<Blob | null>(null);
  const [isPreparingDocx, setIsPreparingDocx] = useState(true);
  const preparationIdRef = useRef(0);

  const prepareDocx = useCallback(async () => {
    const preparationId = ++preparationIdRef.current;
    setIsPreparingDocx(true);
    setDocxBlob(null);
    logResumeExport('resume_export_generation_record_found', { found: true });

    try {
      const blob = await createTailoredResumeDocxBlob(
        result.tailored_resume_text
      );
      if (preparationId === preparationIdRef.current) {
        setDocxBlob(blob);
      }
      logResumeExport('resume_export_document_created');
      logResumeExport('resume_export_response_size', { bytes: blob.size });
      return blob;
    } catch (error) {
      logResumeExport('resume_export_failed', {
        stage: 'document_creation',
        code: error instanceof ResumeExportError ? error.code : 'UNKNOWN_ERROR',
      });
      throw error;
    } finally {
      if (preparationId === preparationIdRef.current) {
        setIsPreparingDocx(false);
      }
    }
  }, [result.tailored_resume_text]);

  useEffect(() => {
    void prepareDocx().catch(() => {
      // The next click retries preparation and displays the user-facing error.
    });
  }, [prepareDocx]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result.tailored_resume_text);
      toast.success('Tailored résumé copied to clipboard');
    } catch {
      toast.error('Could not copy résumé text');
    }
  }

  function handleDownloadTxt() {
    try {
      const blob = createTailoredResumeTextBlob(result.tailored_resume_text);
      downloadBlob(
        blob,
        buildTailoredResumeFilename('txt', companyName, roleTitle)
      );
      toast.success('Tailored résumé downloaded as plain text');
    } catch {
      toast.error(
        'Could not create the text download. Your generated résumé is still available above.'
      );
    }
  }

  function handleDownloadDocx() {
    logResumeExport('resume_export_requested');

    if (!docxBlob) {
      void prepareDocx()
        .then(() => {
          toast.info(
            'Word document is ready. Click Download Word again to save it.'
          );
        })
        .catch((error) => {
          toast.error(
            error instanceof ResumeExportError
              ? error.message
              : 'Could not create the Word document. Please try again.'
          );
        });
      return;
    }

    try {
      downloadBlob(
        docxBlob,
        buildTailoredResumeFilename('docx', companyName, roleTitle)
      );
      logResumeExport('resume_export_response_returned', {
        bytes: docxBlob.size,
      });
      toast.success('Word document download started');
    } catch (error) {
      logResumeExport('resume_export_failed', {
        stage: 'download',
        code: error instanceof ResumeExportError ? error.code : 'UNKNOWN_ERROR',
      });
      toast.error(
        error instanceof ResumeExportError
          ? error.message
          : 'Could not start the Word download. Check browser download permissions and try again.'
      );
    }
  }

  return (
    <div className="space-y-5">
      <Card className="border-border/50 bg-card/65 shadow-[var(--shadow-card)] backdrop-blur">
        <CardContent className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileText className="text-primary h-4 w-4" />
              <SectionLabel>Tailored résumé</SectionLabel>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
              <SecondaryButton
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                disabled={isPreparingDocx}
                onClick={handleDownloadDocx}
              >
                {isPreparingDocx ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Download Word
              </SecondaryButton>
              <SecondaryButton
                type="button"
                size="sm"
                variant="outline"
                className="rounded-full"
                onClick={handleDownloadTxt}
              >
                <Download className="h-3.5 w-3.5" />
                Download Text
              </SecondaryButton>
            </div>
          </div>
          <div className="border-border/35 bg-background/45 max-h-[520px] overflow-y-auto rounded-xl border p-4">
            <pre className="text-foreground font-mono text-sm leading-6 whitespace-pre-wrap">
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
        <AccuracyCheckCard
          warnings={result.truthfulness_warnings}
          reviewItems={result.suggested_additions_user_must_confirm}
        />
        <BulletCard
          title="Suggested additions (confirm before using)"
          icon={Lightbulb}
          items={result.suggested_additions_user_must_confirm}
          emptyMessage="No suggested additions."
          variant={
            result.suggested_additions_user_must_confirm.length > 0
              ? 'warning'
              : 'default'
          }
        />
      </div>

      {result.suggested_additions_user_must_confirm.length > 0 && (
        <div className="border-warning/25 bg-warning/5 text-muted-foreground rounded-2xl border px-4 py-3 text-sm leading-6 font-medium">
          Suggested additions are ideas only. Do not add them to your résumé
          unless they are factually true.
        </div>
      )}

      <div className="border-border/70 bg-background/55 flex items-center gap-2 rounded-2xl border px-4 py-3">
        <ShieldCheck
          aria-hidden="true"
          className="text-muted-foreground h-4 w-4 shrink-0"
        />
        <p className="text-muted-foreground text-sm font-medium">
          Generated from your source résumé and saved profile only. Review
          before submitting.
        </p>
      </div>
    </div>
  );
}
