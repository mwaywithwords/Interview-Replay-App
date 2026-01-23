'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppShell } from '@/components/layout/AppShell';
import { branding } from '@/lib/branding';
import { AlertCircle, ArrowLeft, PlayCircle, RefreshCw, Loader2 } from 'lucide-react';

function AuthCodeErrorContent() {
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get('error');

  return (
    <AppShell showNav={false}>
      <div className="flex-1 flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 group transition-all mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                <PlayCircle className="w-6 h-6 fill-current" />
              </div>
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {branding.brandShort}<span className="text-primary">.ai</span>
              </span>
            </Link>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Verification Failed</h1>
            <p className="text-muted-foreground mt-2 font-medium">We couldn&apos;t verify your email</p>
          </div>

          <SectionCard className="border-border shadow-2xl shadow-primary/5">
            <div className="space-y-6">
              {errorMessage && (
                <div className="rounded-xl bg-destructive/10 p-4 text-sm font-bold text-destructive border border-destructive/20">
                  {errorMessage}
                </div>
              )}

              <div className="rounded-xl bg-muted/50 p-6 text-sm font-medium text-muted-foreground border border-border/50">
                <p className="mb-4 text-foreground font-bold">This could happen because:</p>
                <ul className="list-inside list-disc space-y-2">
                  <li>The confirmation link has expired (links expire after 24 hours)</li>
                  <li>The link has already been used</li>
                  <li>The link was invalid or corrupted</li>
                </ul>
              </div>

              <div className="space-y-4">
                <Link href="/auth/signin" className="block">
                  <PrimaryButton className="w-full h-12 rounded-xl font-bold">
                    Back to Sign In
                  </PrimaryButton>
                </Link>
                <Link href="/auth/signup" className="block">
                  <SecondaryButton variant="outline" className="w-full h-12 rounded-xl font-bold border-border">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Create New Account
                  </SecondaryButton>
                </Link>
              </div>

              <p className="text-center text-xs font-medium text-muted-foreground leading-relaxed">
                If you already have an account, sign in and you&apos;ll be able to resend
                the confirmation email from there.
              </p>
            </div>
          </SectionCard>
          
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Return to landing page
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function AuthCodeErrorFallback() {
  return (
    <AppShell showNav={false}>
      <div className="flex-1 flex items-center justify-center bg-background px-4 py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    </AppShell>
  );
}

export default function AuthCodeError() {
  return (
    <Suspense fallback={<AuthCodeErrorFallback />}>
      <AuthCodeErrorContent />
    </Suspense>
  );
}
