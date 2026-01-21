import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] bg-[size:4rem_4rem]" />

      {/* Glow effects */}
      <div className="absolute top-0 left-1/4 h-96 w-96 animate-pulse rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="absolute right-1/4 bottom-0 h-96 w-96 animate-pulse rounded-full bg-cyan-500/20 blur-3xl delay-1000" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-400">
              <svg
                className="h-6 w-6 text-slate-900"
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
            <span className="text-xl font-bold text-white">
              Interview Replay
            </span>
          </div>
          <Link href="/dashboard">
            <Button
              variant="outline"
              className="border-slate-700 bg-slate-800/50 text-white hover:bg-slate-700 hover:text-white"
            >
              Sign In
            </Button>
          </Link>
        </header>

        {/* Hero Section */}
        <main className="mx-auto max-w-6xl px-8 py-24">
          <div className="text-center">
            <div className="mb-6 inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
              <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Review your performance like game film
            </div>

            <h1 className="mb-6 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-7xl">
              Master Interviews.
              <br />
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text">
                Track Trades.
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-400 sm:text-xl">
              The all-in-one platform for professionals who want to ace their
              interviews and traders who review their performance with
              precision.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 text-slate-900 hover:from-emerald-400 hover:to-cyan-400"
                >
                  Get Started Free
                  <svg
                    className="ml-2 h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="lg"
                className="text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="mt-32 grid gap-8 md:grid-cols-3">
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10">
                  <svg
                    className="h-6 w-6 text-emerald-400"
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
                </div>
                <CardTitle className="text-white">Mock Interviews</CardTitle>
                <CardDescription className="text-slate-400">
                  Practice with AI-powered mock interviews tailored to any role.
                  Record, review, and improve.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10">
                  <svg
                    className="h-6 w-6 text-cyan-400"
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
                <CardTitle className="text-white">Replay Sessions</CardTitle>
                <CardDescription className="text-slate-400">
                  Watch your past interviews like game film. Spot patterns,
                  identify weaknesses, and track improvement over time.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                  <svg
                    className="h-6 w-6 text-amber-400"
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
                </div>
                <CardTitle className="text-white">Trading Journal</CardTitle>
                <CardDescription className="text-slate-400">
                  Log and analyze your trades. Review your decisions with the
                  same rigor athletes use to study game tape.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-24 border-t border-slate-800 px-8 py-8">
          <p className="text-center text-sm text-slate-500">
            © 2026 Interview Replay. Built for those who want to level up.
          </p>
        </footer>
      </div>
    </div>
  );
}
