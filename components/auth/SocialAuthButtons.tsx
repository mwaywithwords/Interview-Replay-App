'use client';

import { useState } from 'react';
import type { ComponentType } from 'react';
import type { Provider } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type SocialProviderId = 'google' | 'github' | 'linkedin';

interface SocialAuthButtonsProps {
  mode: 'signin' | 'signup';
  next?: string;
  className?: string;
  disabled?: boolean;
  onRedirectingChange?: (isRedirecting: boolean) => void;
}

interface SocialProviderConfig {
  id: SocialProviderId;
  label: string;
  provider: Provider;
  icon: ComponentType<{ className?: string }>;
}

function getSiteUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

function getLinkedInProvider(): Provider {
  return 'linkedin_oidc';
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.78-.07-1.53-.2-2.23H12v4.22h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.3 2.98-7.52z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.89 6.62-2.42l-3.23-2.51c-.9.6-2.04.95-3.39.95-2.6 0-4.8-1.76-5.59-4.12H3.08v2.59A10 10 0 0 0 12 22z" />
      <path fill="#FBBC05" d="M6.41 13.9A6 6 0 0 1 6.1 12c0-.66.11-1.3.31-1.9V7.51H3.08A10 10 0 0 0 2 12c0 1.61.39 3.14 1.08 4.49l3.33-2.59z" />
      <path fill="#EA4335" d="M12 5.98c1.47 0 2.79.51 3.82 1.5l2.87-2.87C16.95 2.99 14.69 2 12 2a10 10 0 0 0-8.92 5.51l3.33 2.59C7.2 7.74 9.4 5.98 12 5.98z" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.5 0 12.3c0 5.44 3.44 10.05 8.2 11.68.6.11.82-.27.82-.59 0-.29-.01-1.06-.02-2.08-3.34.74-4.04-1.65-4.04-1.65-.55-1.42-1.33-1.8-1.33-1.8-1.09-.76.08-.75.08-.75 1.2.09 1.84 1.27 1.84 1.27 1.07 1.88 2.81 1.34 3.5 1.02.11-.8.42-1.34.76-1.65-2.66-.31-5.46-1.37-5.46-6.08 0-1.34.47-2.44 1.24-3.3-.12-.31-.54-1.56.12-3.25 0 0 1.01-.33 3.3 1.26A11.24 11.24 0 0 1 12 5.96c1.02 0 2.04.14 3 .42 2.28-1.59 3.29-1.26 3.29-1.26.66 1.69.24 2.94.12 3.25.77.86 1.24 1.96 1.24 3.3 0 4.73-2.8 5.76-5.48 6.07.43.38.82 1.13.82 2.28 0 1.65-.02 2.98-.02 3.38 0 .33.22.71.83.59A12.25 12.25 0 0 0 24 12.3C24 5.5 18.63 0 12 0z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.61 0 4.27 2.37 4.27 5.46v6.28zM5.32 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.1 20.45H3.53V9H7.1v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0z" />
    </svg>
  );
}

const providers: SocialProviderConfig[] = [
  { id: 'google', label: 'Google', provider: 'google', icon: GoogleIcon },
  { id: 'github', label: 'GitHub', provider: 'github', icon: GitHubIcon },
  { id: 'linkedin', label: 'LinkedIn', provider: getLinkedInProvider(), icon: LinkedInIcon },
];

export const authMethodButtonClass =
  'group relative !grid h-[52px] w-full cursor-pointer !grid-cols-[1.5rem_1fr_1.5rem] items-center !gap-0 rounded-[14px] border border-border/70 bg-white/92 px-4 text-sm font-semibold text-slate-900 shadow-[0_1px_1px_rgba(255,255,255,0.9)_inset,0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white hover:shadow-[0_14px_36px_rgba(15,23,42,0.11)] active:translate-y-0 active:scale-[0.98] active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:translate-y-0 disabled:scale-100 disabled:cursor-default disabled:opacity-60 [&_svg]:!size-5 dark:border-white/10 dark:bg-white/[0.075] dark:text-foreground dark:shadow-[0_1px_1px_rgba(255,255,255,0.08)_inset,0_12px_32px_rgba(0,0,0,0.22)] dark:hover:border-primary/35 dark:hover:bg-white/[0.11] dark:hover:shadow-[0_18px_42px_rgba(0,0,0,0.34)]';

export function SocialAuthButtons({
  next = '/dashboard',
  className,
  disabled = false,
  onRedirectingChange,
}: SocialAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<SocialProviderId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const actionLabel = 'Continue with';

  async function handleOAuthSignIn(config: SocialProviderConfig) {
    if (loadingProvider || disabled) return;

    setError(null);
    setLoadingProvider(config.id);
    onRedirectingChange?.(true);

    const siteUrl = getSiteUrl().replace(/\/$/, '');
    const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`;
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: config.provider,
      options: {
        redirectTo,
      },
    });

    if (oauthError) {
      setError(`Could not start ${config.label} sign-in. Please try again.`);
      setLoadingProvider(null);
      onRedirectingChange?.(false);
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid gap-3">
        {providers.map((config, index) => {
          const Icon = config.icon;
          const isLoading = loadingProvider === config.id;
          const isDisabled = loadingProvider !== null || disabled;
          const buttonText = isLoading
            ? `Redirecting to ${config.label}...`
            : `${actionLabel} ${config.label}`;

          return (
            <Button
              key={config.id}
              type="button"
              variant="outline"
              disabled={isDisabled}
              onClick={() => handleOAuthSignIn(config)}
              aria-label={buttonText}
              className={cn(
                authMethodButtonClass,
                'animate-in fade-in slide-in-from-bottom-1 duration-300'
              )}
              style={{ animationDelay: `${index * 45}ms` }}
            >
              <span className="flex items-center justify-start">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </span>
              <span className="text-center">{buttonText}</span>
              <span aria-hidden="true" />
            </Button>
          );
        })}
      </div>

      {error && (
        <div className="animate-in fade-in slide-in-from-top-2 rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-sm font-semibold text-destructive duration-300">
          {error}
        </div>
      )}
    </div>
  );
}
