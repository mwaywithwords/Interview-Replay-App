'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function Dashboard() {
  const router = useRouter();
  const [showComingSoon, setShowComingSoon] = useState<string | null>(null);

  // TODO: Replace with Supabase Auth
  // This is a placeholder auth check that always passes for development
  const isAuthenticated = true;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // While checking auth or if not authenticated, show nothing
  if (!isAuthenticated) {
    return null;
  }

  const features = [
    {
      id: 'mock-interview',
      title: 'Start Mock Interview',
      description:
        "Begin a new practice session with AI-powered interview questions tailored to any role you're targeting.",
      icon: (
        <svg
          className="h-8 w-8 text-emerald-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      ),
      gradient: 'from-emerald-500 to-teal-500',
      bgGlow: 'bg-emerald-500/20',
    },
    {
      id: 'past-replays',
      title: 'View Past Replays',
      description:
        'Review your previous interview sessions. Watch recordings, read transcripts, and track your progress.',
      icon: (
        <svg
          className="h-8 w-8 text-cyan-400"
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
      ),
      gradient: 'from-cyan-500 to-blue-500',
      bgGlow: 'bg-cyan-500/20',
    },
    {
      id: 'trading-journal',
      title: 'Trading Journal',
      description:
        'Log your trades, analyze patterns, and review your decisions with detailed performance metrics.',
      icon: (
        <svg
          className="h-8 w-8 text-amber-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      gradient: 'from-amber-500 to-orange-500',
      bgGlow: 'bg-amber-500/20',
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
              <span className="text-sm text-slate-400">Welcome back!</span>
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  Sign Out
                </Button>
              </Link>
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
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.id}
                className="group relative cursor-pointer overflow-hidden border-slate-800 bg-slate-900/50 transition-all duration-300 hover:border-slate-700 hover:shadow-lg hover:shadow-slate-900/50"
                onClick={() => setShowComingSoon(feature.id)}
              >
                {/* Glow effect on hover */}
                <div
                  className={`absolute -top-24 -right-24 h-48 w-48 rounded-full ${feature.bgGlow} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100`}
                />

                <CardHeader className="relative">
                  <div
                    className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${feature.gradient} p-0.5`}
                  >
                    <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-900">
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl text-white">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {feature.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <Button
                    className={`w-full bg-gradient-to-r ${feature.gradient} text-white hover:opacity-90`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowComingSoon(feature.id);
                    }}
                  >
                    {feature.id === 'mock-interview' && 'Start Session'}
                    {feature.id === 'past-replays' && 'View Replays'}
                    {feature.id === 'trading-journal' && 'Open Journal'}
                  </Button>
                </CardContent>

                {/* Coming Soon Overlay */}
                {showComingSoon === feature.id && (
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowComingSoon(null);
                    }}
                  >
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
                      <svg
                        className="h-8 w-8 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="mb-2 text-lg font-semibold text-white">
                      Coming Soon
                    </p>
                    <p className="px-6 text-center text-sm text-slate-400">
                      This feature is under development. Click anywhere to
                      dismiss.
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>

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
