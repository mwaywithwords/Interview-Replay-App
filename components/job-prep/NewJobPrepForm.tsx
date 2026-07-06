'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createJobPrepProject } from '@/app/actions/job-prep';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, FileText, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

export function NewJobPrepForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);

  async function handleResumeFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('text/') && file.type !== 'application/json') {
      setError('Please upload a plain text file (.txt). PDF parsing is not available yet.');
      return;
    }

    try {
      const text = await file.text();
      setResumeText(text);
      setResumeFileName(file.name);
      setError(null);
    } catch {
      setError('Could not read the uploaded file. Try pasting your résumé instead.');
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const result = await createJobPrepProject({
        title,
        jobDescription: {
          content: jobDescription,
          companyName,
          roleTitle,
        },
        resume: {
          content: resumeText,
          source: resumeFileName ? 'upload' : 'paste',
          fileName: resumeFileName ?? undefined,
        },
      });

      if (result.error || !result.project) {
        setError(result.error ?? 'Failed to create job prep project');
        return;
      }

      toast.success('Job prep project saved');
      router.push(`/job-prep/${result.project.id}`);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-6">
        <Link
          href="/job-prep"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Job Prep
        </Link>
      </div>

      <PageHeader
        title="New Job Prep"
        description="Paste a job description and your résumé to start a prep project. ReplayAI will analyze fit, generate questions, and guide your practice from here."
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <SectionCard title="Project details">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">Project title (optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Senior PM at Acme Corp"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company (optional)</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="Acme Corp"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roleTitle">Role (optional)</Label>
              <Input
                id="roleTitle"
                value={roleTitle}
                onChange={(event) => setRoleTitle(event.target.value)}
                placeholder="Senior Product Manager"
                className="rounded-xl"
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Job description">
          <div className="space-y-2">
            <Label htmlFor="jobDescription">Paste the full job posting</Label>
            <Textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="Paste the job description here..."
              rows={12}
              required
              className="min-h-[240px] rounded-xl font-mono text-sm leading-6"
            />
          </div>
        </SectionCard>

        <SectionCard title="Résumé">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,text/plain"
                className="hidden"
                onChange={handleResumeFileChange}
              />
              <SecondaryButton
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Upload .txt file
              </SecondaryButton>
              {resumeFileName && (
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {resumeFileName}
                </span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="resumeText">Or paste résumé text</Label>
              <Textarea
                id="resumeText"
                value={resumeText}
                onChange={(event) => {
                  setResumeText(event.target.value);
                  if (event.target.value.trim()) {
                    setResumeFileName(null);
                  }
                }}
                placeholder="Paste your résumé content here..."
                rows={12}
                required
                className="min-h-[240px] rounded-xl font-mono text-sm leading-6"
              />
            </div>
          </div>
        </SectionCard>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Link href="/job-prep">
            <SecondaryButton type="button" variant="outline" className="rounded-full">
              Cancel
            </SecondaryButton>
          </Link>
          <PrimaryButton
            type="submit"
            size="lg"
            disabled={isLoading}
            className="rounded-full shadow-[var(--shadow-soft)]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              'Save project'
            )}
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}
