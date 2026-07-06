'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSession } from '@/app/actions/sessions';
import { getCompanies, createCompany } from '@/app/actions/companies';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Loader2, AlertCircle, Plus } from 'lucide-react';
import type { SessionType, RecordingType, Company } from '@/types';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';
import { toast } from 'sonner';

export function NewSessionForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [sessionType, setSessionType] = useState<SessionType>('interview');
  const [recordingType, setRecordingType] = useState<RecordingType | ''>('');
  const [prompt, setPrompt] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

  // Companies state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

  // Dialog states
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);

  // Fetch companies on mount
  useEffect(() => {
    async function fetchData() {
      setIsLoadingCompanies(true);

      const companiesResult = await getCompanies();

      if (companiesResult.error) {
        console.error('Error fetching companies:', companiesResult.error);
      } else {
        setCompanies(companiesResult.companies);
      }

      setIsLoadingCompanies(false);
    }

    fetchData();
  }, []);

  async function handleCreateCompany() {
    if (!newCompanyName.trim()) {
      return;
    }

    setIsCreatingCompany(true);
    setError(null);

    try {
      const { company, error: createError } = await createCompany({
        name: newCompanyName.trim(),
      });

      if (createError) {
        setError(createError);
        toast.error('Failed to create company', { description: createError });
        setIsCreatingCompany(false);
        return;
      }

      if (company) {
        setCompanies([...companies, company]);
        setSelectedCompanyId(company.id);
        setNewCompanyName('');
        setIsCompanyDialogOpen(false);
        toast.success('Company added');
      }
    } catch (err) {
      setError('Failed to create company. Please try again.');
      toast.error('Failed to create company');
    } finally {
      setIsCreatingCompany(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) {
      setError('Session title is required');
      return;
    }

    if (!recordingType) {
      setError('Recording type is required');
      return;
    }

    if (!selectedCompanyId) {
      setError('Please select or create a company for this practice session');
      return;
    }

    setIsLoading(true);

    try {
      const { session, error: createError } = await createSession({
        title: title.trim(),
        session_type: sessionType,
        recording_type: recordingType,
        prompt: prompt.trim() || undefined,
        company_id: selectedCompanyId,
      });

      if (createError) {
        setError(createError);
        toast.error('Failed to create session', { description: createError });
        return;
      }

      if (session) {
        toast.success('Session created', { description: 'Redirecting to session...' });
        router.push(`/sessions/${session.id}`);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      toast.error('Failed to create session');
    } finally {
      setIsLoading(false);
    }
  }

  const isFormValid =
    title.trim() &&
    recordingType &&
    selectedCompanyId;

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <Link
        href="/dashboard"
        className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Back to Dashboard
      </Link>

      <PageHeader
        title="Quick Practice Session"
        description="Record a standalone practice session, or start from Job Prep for role-specific questions."
      />

      <SectionCard className="border-border shadow-xl shadow-primary/5 bg-card/50 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <Alert variant="destructive" className="rounded-xl border-destructive/20 bg-destructive/5">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="font-bold">{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Label htmlFor="title" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Session Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Frontend Developer Interview Practice"
              required
              className="h-12 bg-muted/30 border-border focus:bg-background transition-all rounded-xl"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="recording_type" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Recording Type</Label>
              <Select
                value={recordingType}
                onValueChange={(value: RecordingType) => setRecordingType(value)}
              >
                <SelectTrigger className="h-12 bg-muted/30 border-border rounded-xl">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border bg-popover">
                  <SelectItem value="audio">Audio Only</SelectItem>
                  <SelectItem value="video">Video + Audio</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <Label htmlFor="company" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Target Company / Role</Label>
              <div className="flex gap-3">
                <Select
                  value={selectedCompanyId}
                  onValueChange={setSelectedCompanyId}
                >
                  <SelectTrigger className="h-12 bg-muted/30 border-border rounded-xl flex-1">
                    <SelectValue placeholder="Select a company" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-popover">
                    {isLoadingCompanies ? (
                      <SelectItem value="loading" disabled>
                        Loading companies...
                      </SelectItem>
                    ) : companies.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No companies found
                      </SelectItem>
                    ) : (
                      companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Dialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen}>
                  <DialogTrigger asChild>
                    <SecondaryButton type="button" className="shrink-0 h-12 rounded-xl px-4 border-border hover:bg-accent transition-colors">
                      <Plus className="h-5 w-5" />
                    </SecondaryButton>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl border-border bg-popover">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-black tracking-tight">Add Company</DialogTitle>
                      <DialogDescription className="font-medium text-muted-foreground">
                        Organize your sessions by adding the company you're interviewing with.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-6">
                      <div className="space-y-2">
                        <Label htmlFor="company_name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Company Name</Label>
                        <Input
                          id="company_name"
                          value={newCompanyName}
                          onChange={(e) => setNewCompanyName(e.target.value)}
                          placeholder="e.g., Google, Microsoft"
                          className="h-12 bg-muted/30 rounded-xl border-border"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCreateCompany();
                            }
                          }}
                        />
                      </div>
                    </div>
                    <DialogFooter className="gap-2">
                      <SecondaryButton
                        type="button"
                        onClick={() => {
                          setIsCompanyDialogOpen(false);
                          setNewCompanyName('');
                        }}
                        disabled={isCreatingCompany}
                        className="rounded-xl"
                      >
                        Cancel
                      </SecondaryButton>
                      <PrimaryButton
                        type="button"
                        onClick={handleCreateCompany}
                        disabled={!newCompanyName.trim() || isCreatingCompany}
                        className="rounded-xl px-6 font-bold"
                      >
                        {isCreatingCompany ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Company'}
                      </PrimaryButton>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

          <div className="space-y-3">
            <Label htmlFor="prompt" className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Focus & Context (Optional)</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Job description, role details, or specific interview questions..."
              rows={5}
              className="bg-muted/30 border-border focus:bg-background transition-all rounded-xl resize-none py-4"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4 pt-6">
            <SecondaryButton
              type="button"
              onClick={() => router.push('/dashboard')}
              className="flex-1 h-12 rounded-xl font-bold text-muted-foreground border-border hover:bg-accent transition-colors"
              disabled={isLoading}
            >
              Go Back
            </SecondaryButton>
            <PrimaryButton
              type="submit"
              disabled={isLoading || !isFormValid}
              className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Preparing Session...
                </>
              ) : (
                'Start Session'
              )}
            </PrimaryButton>
          </div>
        </form>
      </SectionCard>
    </div>
  );
}
