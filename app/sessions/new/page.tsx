'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSession } from '@/app/actions/sessions';
import { getCompanies, createCompany } from '@/app/actions/companies';
import { getSymbols, createSymbol } from '@/app/actions/symbols';
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
import type { SessionType, RecordingType, Company, Symbol } from '@/types';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/layout/SectionCard';

export default function NewSessionPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [sessionType, setSessionType] = useState<SessionType | ''>('');
  const [recordingType, setRecordingType] = useState<RecordingType | ''>('');
  const [prompt, setPrompt] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedSymbolId, setSelectedSymbolId] = useState<string>('');

  // Companies and symbols state
  const [companies, setCompanies] = useState<Company[]>([]);
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingSymbols, setIsLoadingSymbols] = useState(false);

  // Dialog states
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [isSymbolDialogOpen, setIsSymbolDialogOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newSymbolTicker, setNewSymbolTicker] = useState('');
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [isCreatingSymbol, setIsCreatingSymbol] = useState(false);

  // Fetch companies and symbols on mount
  useEffect(() => {
    async function fetchData() {
      setIsLoadingCompanies(true);
      setIsLoadingSymbols(true);

      const [companiesResult, symbolsResult] = await Promise.all([
        getCompanies(),
        getSymbols(),
      ]);

      if (companiesResult.error) {
        console.error('Error fetching companies:', companiesResult.error);
      } else {
        setCompanies(companiesResult.companies);
      }

      if (symbolsResult.error) {
        console.error('Error fetching symbols:', symbolsResult.error);
      } else {
        setSymbols(symbolsResult.symbols);
      }

      setIsLoadingCompanies(false);
      setIsLoadingSymbols(false);
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
        setIsCreatingCompany(false);
        return;
      }

      if (company) {
        setCompanies([...companies, company]);
        setSelectedCompanyId(company.id);
        setNewCompanyName('');
        setIsCompanyDialogOpen(false);
      }
    } catch (err) {
      setError('Failed to create company. Please try again.');
    } finally {
      setIsCreatingCompany(false);
    }
  }

  async function handleCreateSymbol() {
    if (!newSymbolTicker.trim()) {
      return;
    }

    setIsCreatingSymbol(true);
    setError(null);

    try {
      const { symbol, error: createError } = await createSymbol({
        ticker: newSymbolTicker.trim(),
      });

      if (createError) {
        setError(createError);
        setIsCreatingSymbol(false);
        return;
      }

      if (symbol) {
        setSymbols([...symbols, symbol]);
        setSelectedSymbolId(symbol.id);
        setNewSymbolTicker('');
        setIsSymbolDialogOpen(false);
      }
    } catch (err) {
      setError('Failed to create symbol. Please try again.');
    } finally {
      setIsCreatingSymbol(false);
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

    if (!sessionType) {
      setError('Session type is required');
      return;
    }

    if (!recordingType) {
      setError('Recording type is required');
      return;
    }

    if (sessionType === 'interview' && !selectedCompanyId) {
      setError('Please select or create a company for interview sessions');
      return;
    }

    if (sessionType === 'trading' && !selectedSymbolId) {
      setError('Please select or create a symbol for trading sessions');
      return;
    }

    setIsLoading(true);

    try {
      const { session, error: createError } = await createSession({
        title: title.trim(),
        session_type: sessionType,
        recording_type: recordingType,
        prompt: prompt.trim() || undefined,
        company_id: sessionType === 'interview' ? selectedCompanyId : undefined,
        symbol_id: sessionType === 'trading' ? selectedSymbolId : undefined,
      });

      if (createError) {
        setError(createError);
        return;
      }

      if (session) {
        router.push(`/sessions/${session.id}`);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const isFormValid =
    title.trim() &&
    sessionType &&
    recordingType &&
    ((sessionType === 'interview' && selectedCompanyId) ||
      (sessionType === 'trading' && selectedSymbolId));

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <PageHeader
          title="Create New Session"
          description="Set up a new interview or trading session."
        />

        <SectionCard>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Session Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Frontend Developer Interview Practice"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="session_type">Session Type *</Label>
              <Select
                value={sessionType}
                onValueChange={(value: SessionType) => {
                  setSessionType(value);
                  // Reset selections when session type changes
                  setSelectedCompanyId('');
                  setSelectedSymbolId('');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select session type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="trading">Trading</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recording_type">Recording Type *</Label>
              <Select
                value={recordingType}
                onValueChange={(value: RecordingType) => setRecordingType(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recording type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {sessionType === 'interview' && (
              <div className="space-y-2">
                <Label htmlFor="company">Company *</Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedCompanyId}
                    onValueChange={setSelectedCompanyId}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingCompanies ? (
                        <SelectItem value="loading" disabled>
                          Loading...
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
                      <SecondaryButton type="button" className="shrink-0">
                        <Plus className="h-4 w-4 mr-2" />
                        New
                      </SecondaryButton>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Company</DialogTitle>
                        <DialogDescription>
                          Add a new company to organize your interview sessions.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="company_name">Company Name</Label>
                          <Input
                            id="company_name"
                            value={newCompanyName}
                            onChange={(e) => setNewCompanyName(e.target.value)}
                            placeholder="e.g., Google, Microsoft"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCreateCompany();
                              }
                            }}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <SecondaryButton
                          type="button"
                          onClick={() => {
                            setIsCompanyDialogOpen(false);
                            setNewCompanyName('');
                          }}
                          disabled={isCreatingCompany}
                        >
                          Cancel
                        </SecondaryButton>
                        <PrimaryButton
                          type="button"
                          onClick={handleCreateCompany}
                          disabled={!newCompanyName.trim() || isCreatingCompany}
                        >
                          {isCreatingCompany ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            'Create'
                          )}
                        </PrimaryButton>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                {!selectedCompanyId && sessionType === 'interview' && (
                  <p className="text-sm text-muted-foreground">
                    Please select or create a company for this interview session.
                  </p>
                )}
              </div>
            )}

            {sessionType === 'trading' && (
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol *</Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedSymbolId}
                    onValueChange={setSelectedSymbolId}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select a symbol" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingSymbols ? (
                        <SelectItem value="loading" disabled>
                          Loading...
                        </SelectItem>
                      ) : symbols.length === 0 ? (
                        <SelectItem value="none" disabled>
                          No symbols found
                        </SelectItem>
                      ) : (
                        symbols.map((symbol) => (
                          <SelectItem key={symbol.id} value={symbol.id}>
                            {symbol.ticker}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Dialog open={isSymbolDialogOpen} onOpenChange={setIsSymbolDialogOpen}>
                    <DialogTrigger asChild>
                      <SecondaryButton type="button" className="shrink-0">
                        <Plus className="h-4 w-4 mr-2" />
                        New
                      </SecondaryButton>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Symbol</DialogTitle>
                        <DialogDescription>
                          Add a new trading symbol to organize your trading sessions.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="symbol_ticker">Symbol Ticker</Label>
                          <Input
                            id="symbol_ticker"
                            value={newSymbolTicker}
                            onChange={(e) => setNewSymbolTicker(e.target.value.toUpperCase())}
                            placeholder="e.g., AAPL, TSLA"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCreateSymbol();
                              }
                            }}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <SecondaryButton
                          type="button"
                          onClick={() => {
                            setIsSymbolDialogOpen(false);
                            setNewSymbolTicker('');
                          }}
                          disabled={isCreatingSymbol}
                        >
                          Cancel
                        </SecondaryButton>
                        <PrimaryButton
                          type="button"
                          onClick={handleCreateSymbol}
                          disabled={!newSymbolTicker.trim() || isCreatingSymbol}
                        >
                          {isCreatingSymbol ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            'Create'
                          )}
                        </PrimaryButton>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                {!selectedSymbolId && sessionType === 'trading' && (
                  <p className="text-sm text-muted-foreground">
                    Please select or create a symbol for this trading session.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt (Optional)</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter any specific questions or topics you want to focus on..."
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                Add context or specific questions to guide your practice session.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <SecondaryButton
                type="button"
                onClick={() => router.push('/dashboard')}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </SecondaryButton>
              <PrimaryButton
                type="submit"
                disabled={isLoading || !isFormValid}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Session'
                )}
              </PrimaryButton>
            </div>
          </form>
        </SectionCard>
      </div>
    </AppShell>
  );
}
