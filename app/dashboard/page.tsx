import Link from 'next/link';
import { requireUser } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DashboardFeatures } from './dashboard-features';

export default async function Dashboard() {
  // This will redirect to /auth/signin if not authenticated
  const user = await requireUser();

  const features: Array<{
    id: string;
    title: string;
    description: string;
    icon: 'video' | 'play' | 'chart';
    gradient: string;
    bgGlow: string;
    buttonText: string;
  }> = [
    {
      id: 'mock-interview',
      title: 'Start Mock Interview',
      description:
        "Begin a new practice session with AI-powered interview questions tailored to any role you're targeting.",
      icon: 'video',
      gradient: 'from-emerald-500 to-teal-500',
      bgGlow: 'bg-emerald-500/20',
      buttonText: 'Start Session',
    },
    {
      id: 'past-replays',
      title: 'View Past Replays',
      description:
        'Review your previous interview sessions. Watch recordings, read transcripts, and track your progress.',
      icon: 'play',
      gradient: 'from-cyan-500 to-blue-500',
      bgGlow: 'bg-cyan-500/20',
      buttonText: 'View Replays',
    },
    {
      id: 'trading-journal',
      title: 'Trading Journal',
      description:
        'Log your trades, analyze patterns, and review your decisions with detailed performance metrics.',
      icon: 'chart',
      gradient: 'from-amber-500 to-orange-500',
      bgGlow: 'bg-amber-500/20',
      buttonText: 'Open Journal',
    },
  ];

  return (
    <div className="relative min-h-screen bg-slate-950">
      {/* Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400">
                <svg
                  className="h-5 w-5 text-slate-900"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-lg font-bold text-white">
                Interview Replay
              </span>
            </Link>

            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">
                {user.email}
              </span>
              <form action="/auth/signout" method="post">
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  Sign Out
                </Button>
              </form>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto max-w-6xl px-8 py-12">
          <div className="mb-12">
            <h1 className="mb-2 text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400">
              Choose what you&apos;d like to work on today.
            </p>
          </div>

          {/* Feature Cards */}
          <DashboardFeatures features={features} />

          {/* Stats Preview */}
          <div className="mt-12 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="mb-6 text-lg font-semibold text-white">
              Quick Stats
            </h2>
            <div className="grid gap-6 md:grid-cols-4">
              {[
                { label: 'Mock Interviews', value: '—', subtext: 'This month' },
                { label: 'Avg. Score', value: '—', subtext: 'Last 30 days' },
                { label: 'Trades Logged', value: '—', subtext: 'This week' },
                { label: 'Win Rate', value: '—', subtext: 'All time' },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm font-medium text-slate-300">
                    {stat.label}
                  </p>
                  <p className="text-xs text-slate-500">{stat.subtext}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
