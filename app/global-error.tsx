'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-6">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              <div className="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
                <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                Critical Error
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400">
                A critical error has occurred. Please try refreshing the page.
              </p>
            </div>

            {process.env.NODE_ENV === 'development' && error.message && (
              <div className="mb-8 p-4 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-left">
                <p className="text-xs font-mono text-neutral-600 dark:text-neutral-400 break-all">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-xs font-mono text-neutral-500 dark:text-neutral-500 mt-2">
                    Digest: {error.digest}
                  </p>
                )}
              </div>
            )}

            <button
              onClick={reset}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-neutral-50 dark:text-neutral-900 font-semibold hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
