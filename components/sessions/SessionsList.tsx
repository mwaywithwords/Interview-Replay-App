'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { getSessions, type SessionsFilter } from '@/app/actions/sessions';
import { getCompanies } from '@/app/actions/companies';
import { getSymbols } from '@/app/actions/symbols';
import { SectionCard } from '@/components/layout/SectionCard';
import { EmptyState } from '@/components/layout/EmptyState';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Clock, ArrowRight, FileText, Filter, Search, AlertCircle, Loader2 } from 'lucide-react';
import type {
  InterviewSessionWithGroupings,
  SessionMetadata,
  SessionType,
  SessionStatus,
} from '@/types';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useDebounce } from '@/lib/hooks/useDebounce';

const SESSIONS_PER_PAGE = 50;

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
    recorded: "success",
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

function SessionCardSkeleton() {
  return (
    <Card className="border-border bg-card/50 backdrop-blur-sm p-5 h-full">
      <div className="flex flex-col gap-5 h-full">
        <div className="flex items-start justify-between gap-4">
          <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
          <div className="h-5 w-16 bg-muted rounded animate-pulse" />
        </div>
        <div className="mt-auto pt-4 border-t border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-5 w-20 bg-muted rounded animate-pulse" />
            <div className="h-5 w-16 bg-muted rounded animate-pulse" />
          </div>
          <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
        </div>
      </div>
    </Card>
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

function LoadingSkeletons() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <SessionCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function SessionsList() {
  // Local state for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionType, setSessionType] = useState<SessionType | 'all'>('all');
  const [status, setStatus] = useState<SessionStatus | 'all'>('all');
  const [companyId, setCompanyId] = useState<string | 'all'>('all');
  const [symbolId, setSymbolId] = useState<string | 'all'>('all');
  const [offset, setOffset] = useState(0);

  // Debounce search query (300ms)
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Build filters object
  const filters: SessionsFilter = useMemo(() => ({
    ...(sessionType !== 'all' && { session_type: sessionType }),
    ...(status !== 'all' && { status }),
    ...(companyId !== 'all' && { company_id: companyId }),
    ...(symbolId !== 'all' && { symbol_id: symbolId }),
    ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
    limit: SESSIONS_PER_PAGE,
    offset,
  }), [sessionType, status, companyId, symbolId, debouncedSearch, offset]);

  // Fetch sessions
  const {
    data: sessionsData,
    isLoading: sessionsLoading,
    isFetching: sessionsFetching,
    error: sessionsError,
  } = useQuery({
    queryKey: ['sessions', filters],
    queryFn: () => getSessions(filters),
    placeholderData: (previousData) => previousData, // Keep previous data while fetching
  });

  // Fetch companies (only if filtering by interview or showing company filter)
  const shouldFetchCompanies = sessionType === 'all' || sessionType === 'interview';
  const {
    data: companiesData,
    isLoading: companiesLoading,
  } = useQuery({
    queryKey: ['companies'],
    queryFn: () => getCompanies(),
    enabled: shouldFetchCompanies,
  });

  // Fetch symbols (only if filtering by trading or showing symbol filter)
  const shouldFetchSymbols = sessionType === 'all' || sessionType === 'trading';
  const {
    data: symbolsData,
    isLoading: symbolsLoading,
  } = useQuery({
    queryKey: ['symbols'],
    queryFn: () => getSymbols(),
    enabled: shouldFetchSymbols,
  });

  const sessions = sessionsData?.sessions || [];
  const total = sessionsData?.total || 0;
  const hasMore = sessionsData?.hasMore || false;
  const companies = companiesData?.companies || [];
  const symbols = symbolsData?.symbols || [];
  const isInitialLoading = sessionsLoading || companiesLoading || symbolsLoading;

  // Reset offset when filters change
  const handleFilterChange = useCallback((
    type: 'sessionType' | 'status' | 'company' | 'symbol',
    value: string
  ) => {
    setOffset(0); // Reset pagination
    switch (type) {
      case 'sessionType':
        setSessionType(value as SessionType | 'all');
        // Clear related filters when session type changes
        setCompanyId('all');
        setSymbolId('all');
        break;
      case 'status':
        setStatus(value as SessionStatus | 'all');
        break;
      case 'company':
        setCompanyId(value);
        break;
      case 'symbol':
        setSymbolId(value);
        break;
    }
  }, []);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setOffset(0); // Reset pagination on search
  }, []);

  // Load more sessions
  const handleLoadMore = useCallback(() => {
    setOffset((prev) => prev + SESSIONS_PER_PAGE);
  }, []);

  // Group sessions when filters are applied
  const shouldGroupByCompany = sessionType === 'interview';
  const shouldGroupBySymbol = sessionType === 'trading';

  // Group sessions by company or symbol
  const groupedSessions = useMemo(() => {
    const map = new Map<string, InterviewSessionWithGroupings[]>();
    
    if (shouldGroupByCompany) {
      sessions.forEach((session) => {
        const company = session.companies?.[0];
        if (company) {
          const key = company.id;
          const existing = map.get(key) || [];
          map.set(key, [...existing, session]);
        } else {
          const key = '__unassigned__';
          const existing = map.get(key) || [];
          map.set(key, [...existing, session]);
        }
      });
    } else if (shouldGroupBySymbol) {
      sessions.forEach((session) => {
        const symbol = session.symbols?.[0];
        if (symbol) {
          const key = symbol.id;
          const existing = map.get(key) || [];
          map.set(key, [...existing, session]);
        } else {
          const key = '__unassigned__';
          const existing = map.get(key) || [];
          map.set(key, [...existing, session]);
        }
      });
    }

    return map;
  }, [sessions, shouldGroupByCompany, shouldGroupBySymbol]);

  // Check if any filters are active
  const hasActiveFilters = sessionType !== 'all' || status !== 'all' || companyId !== 'all' || symbolId !== 'all' || debouncedSearch.trim();

  return (
    <div className="space-y-8">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 p-5 rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-sm">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search sessions by title or prompt..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-11 h-11"
          />
          {sessionsFetching && !sessionsLoading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
          )}
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-black text-foreground uppercase tracking-tight mr-2">
            <Filter className="h-4 w-4 text-primary" />
            Filters
          </div>

          {/* Session Type Filter */}
          <Select
            value={sessionType}
            onValueChange={(value) => handleFilterChange('sessionType', value)}
          >
            <SelectTrigger className="w-[140px] h-10 bg-muted/30 border-border rounded-xl font-bold">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border bg-popover">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="trading">Trading</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select
            value={status}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger className="w-[140px] h-10 bg-muted/30 border-border rounded-xl font-bold">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border bg-popover">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="recorded">Recorded</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          {/* Company Filter - shown when filtering interview sessions */}
          {shouldFetchCompanies && companies.length > 0 && (
            <Select
              value={companyId}
              onValueChange={(value) => handleFilterChange('company', value)}
            >
              <SelectTrigger className="w-[180px] h-10 bg-muted/30 border-border rounded-xl font-bold">
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
          {shouldFetchSymbols && symbols.length > 0 && (
            <Select
              value={symbolId}
              onValueChange={(value) => handleFilterChange('symbol', value)}
            >
              <SelectTrigger className="w-[180px] h-10 bg-muted/30 border-border rounded-xl font-bold">
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

          {/* Results count */}
          <div className="ml-auto text-sm text-muted-foreground font-medium">
            {sessionsFetching ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading...
              </span>
            ) : (
              <span>{total} session{total !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isInitialLoading && <LoadingSkeletons />}

      {/* Error State */}
      {(sessionsError || sessionsData?.error) && !isInitialLoading && (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center border border-destructive/20 rounded-2xl bg-destructive/5">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h3 className="text-lg font-bold text-destructive mb-2">Failed to load sessions</h3>
          <p className="text-sm text-destructive/80 max-w-sm">
            {sessionsError?.message || sessionsData?.error}
          </p>
        </div>
      )}

      {/* Sessions List */}
      {!isInitialLoading && !sessionsError && !sessionsData?.error && (
        <>
          {sessions.length === 0 ? (
            <EmptyState
              icon={hasActiveFilters ? Search : FileText}
              title={hasActiveFilters ? 'No sessions found' : 'No sessions yet'}
              description={
                hasActiveFilters
                  ? 'No sessions match your current search or filters. Try adjusting your criteria.'
                  : 'Create your first session to start practicing and improving your skills.'
              }
              action={
                !hasActiveFilters && (
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

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-6">
              <SecondaryButton
                onClick={handleLoadMore}
                disabled={sessionsFetching}
                className="rounded-xl font-bold px-8"
              >
                {sessionsFetching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  `Load More (${total - sessions.length} remaining)`
                )}
              </SecondaryButton>
            </div>
          )}
        </>
      )}
    </div>
  );
}
