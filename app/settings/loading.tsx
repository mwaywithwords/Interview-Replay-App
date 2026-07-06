import { AppShell } from '@/components/layout/AppShell';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLoading() {
  return (
    <AppShell variant="app">
      <div className="mx-auto w-full max-w-[96rem] px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 2xl:px-10">
        <div className="mb-6 rounded-3xl border border-border/70 bg-card/55 p-5 shadow-[var(--shadow-soft)] backdrop-blur">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="mt-3 h-5 w-full max-w-2xl" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="rounded-[1.5rem] border border-border/45 bg-card/65 p-4 shadow-[var(--shadow-soft)] backdrop-blur">
            <Skeleton className="h-4 w-24" />
            <div className="mt-5 space-y-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-14 rounded-2xl" />
              ))}
            </div>
          </div>
          <div className="space-y-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-56 rounded-[1.75rem]" />
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
