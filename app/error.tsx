'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Route error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Something went wrong
          </h1>
          <p className="text-muted-foreground">
            We encountered an unexpected error. Don&apos;t worry, your data is safe.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-8 p-4 rounded-lg bg-muted/50 border border-border text-left">
            <p className="text-xs font-mono text-muted-foreground break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-muted-foreground mt-2">
                Digest: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <PrimaryButton onClick={reset} className="w-full sm:w-auto">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </PrimaryButton>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <SecondaryButton className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Go to Dashboard
            </SecondaryButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
