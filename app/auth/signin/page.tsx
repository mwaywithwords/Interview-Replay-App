import { Suspense } from 'react';
import { SignInForm } from '@/components/auth/SignInForm';
import { AppShell } from '@/components/layout/AppShell';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
};

export default function SignInPage() {
  return (
    <AppShell showNav={false}>
      <div className="flex-1 flex items-center justify-center bg-background px-4 py-12">
        <Suspense fallback={<SignInFormSkeleton />}>
          <SignInForm />
        </Suspense>
      </div>
    </AppShell>
  );
}

function SignInFormSkeleton() {
  return (
    <div className="w-full max-w-md space-y-8 animate-pulse">
      <div className="text-center space-y-4">
        <div className="h-10 w-10 mx-auto rounded-xl bg-muted" />
        <div className="h-8 w-48 mx-auto rounded bg-muted" />
        <div className="h-4 w-64 mx-auto rounded bg-muted" />
      </div>
      <div className="rounded-2xl border bg-card p-6 space-y-6">
        <div className="space-y-2">
          <div className="h-4 w-16 rounded bg-muted" />
          <div className="h-10 rounded bg-muted" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-20 rounded bg-muted" />
          <div className="h-10 rounded bg-muted" />
        </div>
        <div className="h-12 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
