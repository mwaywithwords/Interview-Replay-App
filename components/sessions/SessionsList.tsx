'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { getSessions, type SessionsFilter } from '@/app/actions/sessions';
import { getCompanies } from '@/app/actions/companies';
import { getSymbols } from '@/app/actions/symbols';
import { EmptyState } from '@/components/layout/EmptyState';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Clock, FileText, Filter, Search, AlertCircle, Loader2, Video, Mic, ArrowRight } from 'lucide-react';
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
    <Card className="h-full border-border/70 bg-card/65 p-4 shadow-[var(--shadow-soft)] backdrop-blur">
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
      </div>
    </Card>
  );
}

function RecordingTypeBadge({ recordingType }: { recordingType: string | null }) {
  if (!recordingType) return null;
  
  const isVideo = recordingType === 'video';
  const Icon = isVideo ? Video : Mic;
  const label = isVideo ? 'Video' : 'Audio';
  
  return (
    <span className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold ${
      isVideo 
        ? 'border-info/20 bg-info/10 text-info' 
        : 'border-primary/20 bg-primary/10 text-primary'
    }`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function SessionCard({ session }: { session: InterviewSessionWithGroupings }) {
  const metadata = session.metadata as SessionMetadata;
  const sessionType = metadata?.session_type;

  return (
    <Link href={`/sessions/${session.id}`}>
      <Card className="group flex h-full cursor-pointer flex-col border-border/70 bg-card/65 p-4 shadow-[var(--shadow-soft)] backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[var(--shadow-card)] active:translate-y-0">
        <div className="flex h-full flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 flex-1 text-base font-semibold tracking-[-0.02em] text-foreground transition-colors group-hover:text-primary">
              {session.title}
            </h3>
            <StatusBadge status={session.status} />
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border/50 pt-3 text-sm font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/50 px-2 py-0.5 text-xs font-semibold text-foreground">
              <FileText className="h-3 w-3" />
              {getSessionTypeLabel(sessionType)}
            </span>
            <RecordingTypeBadge recordingType={session.recording_type} />
            <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Clock className="h-3 w-3 text-muted-foreground/60" />
              {new Date(session.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </div>
        </div>
      </Card>
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
    <div className="mb-4 ml-1 flex items-center gap-2">
      <h2 className="text-lg font-semibold tracking-[-0.03em] text-foreground">{title}</h2>
      <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{count}</span>
    </div>
  );
}

function LoadingSkeletons() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
  const activeFilterCount = [
    sessionType !== 'all',
    status !== 'all',
    companyId !== 'all',
    symbolId !== 'all',
    Boolean(debouncedSearch.trim()),
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="overflow-hidden rounded-3xl border border-border/70 bg-card/65 shadow-[var(--shadow-card)] backdrop-blur">
        <div className="flex flex-col gap-4 border-b border-border/60 p-4 lg:flex-row lg:items-center">
        {/* Search Input */}
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search sessions by title or prompt..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="h-11 rounded-2xl bg-background/70 pl-11"
            />
            {sessionsFetching && !sessionsLoading && (
              <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>

          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-3 py-2 text-xs font-semibold text-muted-foreground">
              <Filter className="h-3.5 w-3.5 text-primary" />
              {activeFilterCount > 0 ? `${activeFilterCount} active` : 'Filters'}
            </div>
            <div className="rounded-full border border-border/70 bg-background/60 px-3 py-2 text-xs font-semibold text-muted-foreground">
              {sessionsFetching ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading
                </span>
              ) : (
                <span>{total} session{total !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap items-center gap-2 p-4">
          {/* Session Type Filter */}
          <Select
            value={sessionType}
            onValueChange={(value) => handleFilterChange('sessionType', value)}
          >
            <SelectTrigger className="h-10 w-full rounded-full border-border/70 bg-background/70 font-semibold sm:w-[150px]">
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
            <SelectTrigger className="h-10 w-full rounded-full border-border/70 bg-background/70 font-semibold sm:w-[150px]">
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
              <SelectTrigger className="h-10 w-full rounded-full border-border/70 bg-background/70 font-semibold sm:w-[190px]">
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
              <SelectTrigger className="h-10 w-full rounded-full border-border/70 bg-background/70 font-semibold sm:w-[190px]">
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

          {hasActiveFilters && (
            <div className="ml-auto rounded-full border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
              Refined results
            </div>
          )}
          <div className="rounded-full border border-border/70 bg-background/60 px-3 py-2 text-xs font-semibold text-muted-foreground">
            Sorted: Newest first
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isInitialLoading && <LoadingSkeletons />}

      {/* Error State */}
      {(sessionsError || sessionsData?.error) && !isInitialLoading && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-destructive/20 bg-destructive/10 px-6 py-16 text-center shadow-[var(--shadow-soft)]">
          <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
          <h3 className="mb-2 text-lg font-semibold text-destructive">Failed to load sessions</h3>
          <p className="max-w-sm text-sm text-destructive/80">
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
              title={hasActiveFilters ? 'No practice sessions found' : 'No practice sessions yet'}
              description={
                hasActiveFilters
                  ? 'No sessions match your current search or filters. Try adjusting your criteria.'
                  : 'Create a Job Prep project to practice targeted questions, or start a quick practice session.'
              }
              action={
                !hasActiveFilters && (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link href="/job-prep/new">
                      <PrimaryButton className="rounded-full px-8 font-semibold shadow-[var(--shadow-soft)]">
                        <Plus className="h-5 w-5" />
                        New Job Prep Project
                      </PrimaryButton>
                    </Link>
                    <Link href="/sessions/new">
                      <SecondaryButton className="rounded-full px-8 font-semibold">
                        Start Quick Practice
                      </SecondaryButton>
                    </Link>
                  </div>
                )
              }
            />
          ) : shouldGroupByCompany || shouldGroupBySymbol ? (
            // Grouped view
            <div className="space-y-9">
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
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                className="rounded-full px-8 font-semibold"
              >
                {sessionsFetching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
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
