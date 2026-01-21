'use client';

import Link from 'next/link';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { SectionCard } from '@/components/layout/SectionCard';
import { AppShell } from '@/components/layout/AppShell';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function AuthCodeError() {
  return (
    <AppShell showNav={false}>
      <div className="flex-1 flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Authentication Error</h1>
            <p className="text-muted-foreground mt-2 font-medium">We couldn&apos;t complete your sign in</p>
          </div>

          <SectionCard className="border-border shadow-2xl shadow-primary/5">
            <div className="space-y-6">
              <div className="rounded-xl bg-muted/50 p-6 text-sm font-medium text-muted-foreground border border-border/50">
                <p className="mb-4 text-foreground font-bold">This could happen because:</p>
                <ul className="list-inside list-disc space-y-2">
                  <li>The confirmation link has expired</li>
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
                    Create New Account
                  </SecondaryButton>
                </Link>
              </div>

              <p className="text-center text-xs font-medium text-muted-foreground leading-relaxed">
                If you continue to have issues, please try signing up again or
                contact support.
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
