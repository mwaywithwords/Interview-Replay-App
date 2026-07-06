'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createJobPrepProject } from '@/app/actions/job-prep';
import { extractResumeText } from '@/app/actions/resume-upload';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, CheckCircle2, FileText, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

const MAX_RESUME_FILE_SIZE_BYTES = 5 * 1024 * 1024;

type ResumeUploadStatus = 'idle' | 'extracting' | 'uploaded' | 'failed';

export function NewJobPrepForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [resumeUploadStatus, setResumeUploadStatus] = useState<ResumeUploadStatus>('idle');
  const [showResumeEditor, setShowResumeEditor] = useState(false);

  const isExtracting = resumeUploadStatus === 'extracting';
  const hasUploadedResume = resumeUploadStatus === 'uploaded';
  const shouldShowResumeTextarea =
    resumeUploadStatus === 'idle' ||
    resumeUploadStatus === 'failed' ||
    (resumeUploadStatus === 'uploaded' && showResumeEditor);

  function clearResumeErrors() {
    setResumeError(null);
  }

  function clearUploadedResume() {
    setResumeText('');
    setResumeFileName(null);
    setResumeUploadStatus('idle');
    setShowResumeEditor(false);
    clearResumeErrors();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleEditExtractedText() {
    setShowResumeEditor(true);
    clearResumeErrors();
  }

  function handleDoneEditing() {
    if (!resumeText.trim()) {
      setResumeError('Résumé text cannot be empty. Paste your résumé or upload a file.');
      return;
    }

    setShowResumeEditor(false);
    clearResumeErrors();
  }

  async function handleResumeFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    clearResumeErrors();
    setFormError(null);
    setResumeFileName(file.name);
    setShowResumeEditor(false);

    if (file.size > MAX_RESUME_FILE_SIZE_BYTES) {
      setResumeUploadStatus('failed');
      setResumeText('');
      setResumeError('Résumé must be 5 MB or smaller.');
      event.target.value = '';
      return;
    }

    setResumeUploadStatus('extracting');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await extractResumeText(formData);

      if (result.error || !result.text) {
        setResumeText('');
        setResumeFileName(null);
        setResumeUploadStatus('failed');
        setResumeError(
          result.error ??
            'Could not extract résumé text. Try another file or paste your résumé manually.'
        );
        return;
      }

      setResumeText(result.text);
      setResumeFileName(result.fileName ?? file.name);
      setResumeUploadStatus('uploaded');
      setShowResumeEditor(false);
      clearResumeErrors();
    } catch {
      setResumeText('');
      setResumeFileName(null);
      setResumeUploadStatus('failed');
      setResumeError(
        'Could not extract résumé text. Try another file or paste your résumé manually.'
      );
    } finally {
      event.target.value = '';
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setFormError(null);
    clearResumeErrors();

    if (resumeUploadStatus === 'extracting') {
      setResumeError('Please wait for résumé extraction to finish.');
      setIsLoading(false);
      return;
    }

    const hasResumeContent = resumeText.trim().length > 0;
    if (!hasResumeContent) {
      setResumeError('Upload a résumé file or paste your résumé text.');
      setIsLoading(false);
      return;
    }

    try {
      const result = await createJobPrepProject({
        title,
        jobDescription: {
          content: jobDescription,
          companyName,
          roleTitle,
        },
        resume: {
          content: resumeText.trim(),
          source: resumeFileName ? 'upload' : 'paste',
          fileName: resumeFileName ?? undefined,
        },
      });

      if (result.error || !result.project) {
        setFormError(result.error ?? 'Failed to create job prep project');
        return;
      }

      toast.success('Job prep project saved');
      router.push(`/job-prep/${result.project.id}`);
      router.refresh();
    } catch {
      setFormError('Something went wrong. Please try again.');
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
        description="Paste a job description and your résumé to start a prep project. ReplayAI will analyze fit, create personalized interview questions, and guide your practice from here."
      />

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {formError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{formError}</AlertDescription>
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
            <p className="text-sm text-muted-foreground">
              Upload a résumé file, or paste your résumé text below.
            </p>

            {resumeError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{resumeError}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                className="hidden"
                onChange={handleResumeFileChange}
              />
              <SecondaryButton
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={isExtracting || isLoading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                {hasUploadedResume ? 'Replace résumé file' : 'Upload résumé (.pdf, .docx, .txt)'}
              </SecondaryButton>
            </div>

            {isExtracting && resumeFileName && (
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                <div className="min-w-0">
                  <p className="font-medium text-foreground">Extracting résumé text...</p>
                  <p className="mt-0.5 inline-flex items-center gap-1.5 truncate">
                    <FileText className="h-4 w-4 shrink-0" />
                    {resumeFileName}
                  </p>
                </div>
              </div>
            )}

            {hasUploadedResume && !showResumeEditor && (
              <div className="rounded-xl border border-success/20 bg-success/10 px-4 py-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">Résumé uploaded</p>
                    {resumeFileName && (
                      <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4 shrink-0" />
                        <span className="truncate">{resumeFileName}</span>
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <SecondaryButton
                        type="button"
                        variant="outline"
                        className="rounded-full"
                        onClick={handleEditExtractedText}
                      >
                        Edit extracted text
                      </SecondaryButton>
                      <SecondaryButton
                        type="button"
                        variant="ghost"
                        className="rounded-full"
                        onClick={clearUploadedResume}
                      >
                        Remove file
                      </SecondaryButton>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {shouldShowResumeTextarea && (
              <div className="space-y-2">
                <Label htmlFor="resumeText">
                  {hasUploadedResume && showResumeEditor
                    ? 'Edit extracted text'
                    : 'Or paste résumé text'}
                </Label>
                <Textarea
                  id="resumeText"
                  value={resumeText}
                  onChange={(event) => {
                    setResumeText(event.target.value);
                    if (resumeError) {
                      clearResumeErrors();
                    }
                  }}
                  placeholder="Paste your résumé content here..."
                  rows={12}
                  className="min-h-[240px] rounded-xl font-mono text-sm leading-6"
                />
                {hasUploadedResume && showResumeEditor && (
                  <div className="flex flex-wrap gap-2">
                    <SecondaryButton
                      type="button"
                      variant="ghost"
                      className="rounded-full text-xs"
                      onClick={handleDoneEditing}
                    >
                      Done editing
                    </SecondaryButton>
                    <SecondaryButton
                      type="button"
                      variant="ghost"
                      className="rounded-full text-xs"
                      onClick={clearUploadedResume}
                    >
                      Remove file
                    </SecondaryButton>
                  </div>
                )}
              </div>
            )}
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
            disabled={isLoading || isExtracting}
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
