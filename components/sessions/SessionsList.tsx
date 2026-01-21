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

function getSessionTypeLabel(type: string | undefined): string {
  const labels: Record<string, string> = {
    interview: 'Interview',
    trading: 'Trading',
  };
  return labels[type || ''] || 'Unknown';
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground border-border',
    recording: 'bg-red-500/10 text-red-500 border-red-500/20',
    processing: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    ready: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    archived: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${styles[status] || styles.draft}`}
    >
      {status}
    </span>
  );
}

function SessionCard({ session }: { session: InterviewSessionWithGroupings }) {
  const metadata = session.metadata as SessionMetadata;
  const sessionType = metadata?.session_type;

  return (
    <Link href={`/sessions/${session.id}`}>
      <SectionCard className="group hover:border-foreground/20 transition-all active:scale-[0.98]">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <h3 className="font-bold text-lg group-hover:text-muted-foreground transition-colors">
              {session.title}
            </h3>
            <StatusBadge status={session.status} />
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                {getSessionTypeLabel(sessionType)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {new Date(session.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
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
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-xl font-bold">{title}</h2>
      <span className="text-sm text-muted-foreground">({count})</span>
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
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading sessions...</div>
      </div>
    );
  }

  if (sessionsError || sessionsData?.error) {
    return (
      <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive text-sm">
        Failed to load sessions: {sessionsError?.message || sessionsData?.error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg border bg-card">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Filter className="h-4 w-4" />
          Filters:
        </div>

        {/* Session Type Filter */}
        <Select
          value={sessionType || 'all'}
          onValueChange={(value) =>
            updateFilter('session_type', value === 'all' ? null : value)
          }
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Session Type" />
          </SelectTrigger>
          <SelectContent>
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
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Company" />
            </SelectTrigger>
            <SelectContent>
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
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Symbol" />
            </SelectTrigger>
            <SelectContent>
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
              ? 'No sessions match your current filters. Try adjusting your filters.'
              : 'Create your first session to start practicing and improving your skills.'
          }
          action={
            !sessionType && !companyId && !symbolId && (
              <Link href="/sessions/new">
                <PrimaryButton>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Session
                </PrimaryButton>
              </Link>
            )
          }
        />
      ) : shouldGroupByCompany || shouldGroupBySymbol ? (
        // Grouped view
        <div className="space-y-8">
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
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}
