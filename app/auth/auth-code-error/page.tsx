'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function AuthCodeError() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4">
      {/* Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />

      {/* Gradient orbs */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-red-500/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />

      <Card className="relative z-10 w-full max-w-md border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
            <svg
              className="h-8 w-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl text-white">
            Authentication Error
          </CardTitle>
          <CardDescription className="text-slate-400">
            We couldn&apos;t complete your sign in
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-lg bg-slate-800/50 p-4 text-sm text-slate-300">
            <p className="mb-2">This could happen because:</p>
            <ul className="list-inside list-disc space-y-1 text-slate-400">
              <li>The confirmation link has expired</li>
              <li>The link has already been used</li>
              <li>The link was invalid or corrupted</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link href="/auth/signin" className="block">
              <Button className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90">
                Back to Sign In
              </Button>
            </Link>
            <Link href="/auth/signup" className="block">
              <Button
                variant="outline"
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Create New Account
              </Button>
            </Link>
          </div>

          <p className="text-center text-xs text-slate-500">
            If you continue to have issues, please try signing up again or
            contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
