'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSessions } from '@/app/actions/sessions';
import { getCompanies } from '@/app/actions/companies';
import { getSymbols } from '@/app/actions/symbols';
import { SectionCard } from '@/components/layout/SectionCard';
import { EmptyState } from '@/components/layout/EmptyState';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Clock, ArrowRight, FileText, Filter } from 'lucide-react';
import type {
  InterviewSessionWithGroupings,
  SessionMetadata,
  SessionType,
} from '@/types';
import { PrimaryButton } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function getSessionTypeLabel(type: string | undefined): string {
  const labels: Record<string, string> = {
    interview: 'Interview',
    trading: 'Trading',
  };
  return labels[type || ''] || 'Unknown';
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "success" | "warning" | "info" | "destructive" | "secondary"> = {
    draft: "secondary",
    recording: "destructive",
    processing: "warning",
    ready: "success",
    archived: "secondary",
  };

  return (
    <Badge variant={variants[status] || "secondary"} className="uppercase tracking-wider text-[10px] px-2 py-0.5">
      {status}
    </Badge>
  );
}

function SessionCard({ session }: { session: InterviewSessionWithGroupings }) {
  const metadata = session.metadata as SessionMetadata;
  const sessionType = metadata?.session_type;

  return (
    <Link href={`/sessions/${session.id}`}>
      <SectionCard className="group hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all active:scale-[0.99] h-full flex flex-col border-border bg-card/50 backdrop-blur-sm">
        <div className="flex flex-col gap-5 h-full">
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {session.title}
            </h3>
            <StatusBadge status={session.status} />
          </div>

          <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between text-sm text-muted-foreground font-medium">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded text-xs font-bold text-foreground">
                <FileText className="h-3 w-3" />
                {getSessionTypeLabel(sessionType)}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold">
                <Clock className="h-3 w-3 text-muted-foreground/60" />
                {new Date(session.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-primary-foreground transition-all">
              <ArrowRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </SectionCard>
    </Link>
  );
}

function GroupHeader({
  title,
  count,
}: {
  title: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-6 ml-1">
      <h2 className="text-xl font-black tracking-tight text-foreground">{title}</h2>
      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">{count}</span>
    </div>
  );
}

export function SessionsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionType = searchParams.get('session_type') as SessionType | null;
  const companyId = searchParams.get('company_id');
  const symbolId = searchParams.get('symbol_id');

  // Build filters object
  const filters = {
    ...(sessionType && { session_type: sessionType }),
    ...(companyId && { company_id: companyId }),
    ...(symbolId && { symbol_id: symbolId }),
  };

  // Fetch sessions
  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    error: sessionsError,
  } = useQuery({
    queryKey: ['sessions', filters],
    queryFn: () => getSessions(Object.keys(filters).length > 0 ? filters : undefined),
  });

  // Fetch companies (only if filtering by interview or showing company filter)
  const shouldFetchCompanies = !sessionType || sessionType === 'interview';
  const {
    data: companiesData,
    isLoading: companiesLoading,
  } = useQuery({
    queryKey: ['companies'],
    queryFn: () => getCompanies(),
    enabled: shouldFetchCompanies,
  });

  // Fetch symbols (only if filtering by trading or showing symbol filter)
  const shouldFetchSymbols = !sessionType || sessionType === 'trading';
  const {
    data: symbolsData,
    isLoading: symbolsLoading,
  } = useQuery({
    queryKey: ['symbols'],
    queryFn: () => getSymbols(),
    enabled: shouldFetchSymbols,
  });

  const sessions = sessionsData?.sessions || [];
  const companies = companiesData?.companies || [];
  const symbols = symbolsData?.symbols || [];
  const isLoading = sessionsLoading || companiesLoading || symbolsLoading;

  // Update URL params
  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // If changing session_type, clear related filters
    if (key === 'session_type') {
      params.delete('company_id');
      params.delete('symbol_id');
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  // Group sessions when filters are applied
  // Group by company when filtering interview sessions
  // Group by symbol when filtering trading sessions
  const shouldGroupByCompany = sessionType === 'interview';
  const shouldGroupBySymbol = sessionType === 'trading';

  // Group sessions by company or symbol
  const groupedSessions = new Map<string, InterviewSessionWithGroupings[]>();
  
  if (shouldGroupByCompany) {
    sessions.forEach((session) => {
      const company = session.companies?.[0];
      if (company) {
        const key = company.id;
        const existing = groupedSessions.get(key) || [];
        groupedSessions.set(key, [...existing, session]);
      } else {
        // Sessions without a company go into an "Unassigned" group
        const key = '__unassigned__';
        const existing = groupedSessions.get(key) || [];
        groupedSessions.set(key, [...existing, session]);
      }
    });
  } else if (shouldGroupBySymbol) {
    sessions.forEach((session) => {
      const symbol = session.symbols?.[0];
      if (symbol) {
        const key = symbol.id;
        const existing = groupedSessions.get(key) || [];
        groupedSessions.set(key, [...existing, session]);
      } else {
        // Sessions without a symbol go into an "Unassigned" group
        const key = '__unassigned__';
        const existing = groupedSessions.get(key) || [];
        groupedSessions.set(key, [...existing, session]);
      }
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground font-bold animate-pulse">Loading sessions...</div>
      </div>
    );
  }

  if (sessionsError || sessionsData?.error) {
    return (
      <div className="mb-8 rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-destructive text-sm font-bold text-center">
        Failed to load sessions: {sessionsError?.message || sessionsData?.error}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-5 rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm mb-8">
        <div className="flex items-center gap-2 text-sm font-black text-foreground uppercase tracking-tight mr-4">
          <Filter className="h-4 w-4 text-primary" />
          Refine Results
        </div>

        {/* Session Type Filter */}
        <Select
          value={sessionType || 'all'}
          onValueChange={(value) =>
            updateFilter('session_type', value === 'all' ? null : value)
          }
        >
          <SelectTrigger className="w-[160px] h-10 bg-muted/30 border-border rounded-xl font-bold">
            <SelectValue placeholder="Session Type" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border bg-popover">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="interview">Interview</SelectItem>
            <SelectItem value="trading">Trading</SelectItem>
          </SelectContent>
        </Select>

        {/* Company Filter - shown when filtering interview sessions */}
        {shouldFetchCompanies && (
          <Select
            value={companyId || 'all'}
            onValueChange={(value) =>
              updateFilter('company_id', value === 'all' ? null : value)
            }
          >
            <SelectTrigger className="w-[200px] h-10 bg-muted/30 border-border rounded-xl font-bold">
              <SelectValue placeholder="Company" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border bg-popover">
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Symbol Filter - shown when filtering trading sessions */}
        {shouldFetchSymbols && (
          <Select
            value={symbolId || 'all'}
            onValueChange={(value) =>
              updateFilter('symbol_id', value === 'all' ? null : value)
            }
          >
            <SelectTrigger className="w-[200px] h-10 bg-muted/30 border-border rounded-xl font-bold">
              <SelectValue placeholder="Symbol" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border bg-popover">
              <SelectItem value="all">All Symbols</SelectItem>
              {symbols.map((symbol) => (
                <SelectItem key={symbol.id} value={symbol.id}>
                  {symbol.ticker}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No sessions found"
          description={
            sessionType || companyId || symbolId
              ? 'No sessions match your current filters. Try adjusting your filters or clearing them.'
              : 'Create your first session to start practicing and improving your skills.'
          }
          action={
            !sessionType && !companyId && !symbolId && (
              <Link href="/sessions/new">
                <PrimaryButton className="rounded-xl font-bold px-8 shadow-lg shadow-primary/20">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Your First Session
                </PrimaryButton>
              </Link>
            )
          }
        />
      ) : shouldGroupByCompany || shouldGroupBySymbol ? (
        // Grouped view
        <div className="space-y-12">
          {Array.from(groupedSessions.entries())
            .sort(([groupIdA], [groupIdB]) => {
              // Sort unassigned to the end
              if (groupIdA === '__unassigned__') return 1;
              if (groupIdB === '__unassigned__') return -1;
              
              if (shouldGroupByCompany) {
                const companyA = companies.find((c) => c.id === groupIdA);
                const companyB = companies.find((c) => c.id === groupIdB);
                return (companyA?.name || '').localeCompare(companyB?.name || '');
              } else {
                const symbolA = symbols.find((s) => s.id === groupIdA);
                const symbolB = symbols.find((s) => s.id === groupIdB);
                return (symbolA?.ticker || '').localeCompare(symbolB?.ticker || '');
              }
            })
            .map(([groupId, groupSessions]) => {
              const company = shouldGroupByCompany
                ? companies.find((c) => c.id === groupId)
                : null;
              const symbol = shouldGroupBySymbol
                ? symbols.find((s) => s.id === groupId)
                : null;
              const groupTitle =
                groupId === '__unassigned__'
                  ? 'Unassigned'
                  : company?.name || symbol?.ticker || 'Unknown';

              return (
                <div key={groupId}>
                  <GroupHeader title={groupTitle} count={groupSessions.length} />
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {groupSessions.map((session) => (
                      <SessionCard key={session.id} session={session} />
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        // Ungrouped view
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}
