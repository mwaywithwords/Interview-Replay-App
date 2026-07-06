'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Button, PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { SectionCard } from '@/components/layout/SectionCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail } from 'lucide-react';
import { Turnstile } from './Turnstile';
import { signUpAction } from '@/app/actions/auth';
import { getEmailError } from '@/lib/validation/email';
import { SocialAuthButtons, authMethodButtonClass } from '@/components/auth/SocialAuthButtons';

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOAuthRedirecting, setIsOAuthRedirecting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');

  // Validate email on blur
  const handleEmailBlur = useCallback(() => {
    if (email) {
      const error = getEmailError(email, true);
      setEmailError(error);
    }
  }, [email]);

  // Clear email error when typing
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) setEmailError(null);
  }, [emailError]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    const emailValidationError = getEmailError(email, true);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!turnstileToken) {
      setError('Please complete the CAPTCHA verification');
      return;
    }

    setLoading(true);

    try {
      const result = await signUpAction(email, password, turnstileToken);

      if (!result.success) {
        setError(result.error || 'Failed to create account');
        return;
      }

      setSuccess(true);
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full">
        <SectionCard className="rounded-3xl border-border/45 bg-background/55 text-center shadow-[var(--shadow-card)] backdrop-blur">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h2 className="mb-4 text-3xl font-semibold tracking-[-0.05em] text-foreground">
            Check your email
          </h2>
          <p className="mb-8 font-medium leading-relaxed text-muted-foreground">
            We&apos;ve sent a confirmation link to<br />
            <span className="font-semibold text-primary">{email}</span>
          </p>
          <div className="flex flex-col gap-4">
            <Link href="/auth/signin">
              <PrimaryButton className="h-12 w-full rounded-full font-semibold">
                Continue to Sign In
              </PrimaryButton>
            </Link>
            <Link href="/">
              <SecondaryButton variant="ghost" className="w-full rounded-full font-semibold">
                Back to Home
              </SecondaryButton>
            </Link>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      <SectionCard className="animate-in fade-in slide-in-from-bottom-2 rounded-[1.75rem] border-border/45 bg-background/60 shadow-[var(--shadow-elevated)] backdrop-blur-xl duration-500">
        <div className="space-y-4">
          <SocialAuthButtons
            mode="signup"
            disabled={loading}
            onRedirectingChange={setIsOAuthRedirecting}
          />

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border/60" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              secure email access
            </span>
            <div className="h-px flex-1 bg-border/60" />
          </div>
        </div>

        <form onSubmit={handleSignUp} className="mt-5 space-y-5">
          <div className="space-y-2.5">
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              placeholder="you@example.com"
              required
              disabled={isOAuthRedirecting}
              className={`h-12 rounded-[14px] border-border/60 bg-card/70 text-base shadow-sm disabled:opacity-60 ${emailError ? 'border-destructive' : ''}`}
            />
            {emailError && (
              <p className="text-xs font-medium text-destructive">{emailError}</p>
            )}
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isOAuthRedirecting}
              className="h-12 rounded-[14px] border-border/60 bg-card/70 text-base shadow-sm disabled:opacity-60"
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isOAuthRedirecting}
              className="h-12 rounded-[14px] border-border/60 bg-card/70 text-base shadow-sm disabled:opacity-60"
            />
          </div>

          <Turnstile
            onVerify={setTurnstileToken}
            onError={() => setError('CAPTCHA failed to load. Please refresh the page.')}
            onExpire={() => setTurnstileToken('')}
            className="flex justify-center"
          />

          {error && (
            <div className="animate-in fade-in slide-in-from-top-2 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-semibold text-destructive duration-300">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || isOAuthRedirecting}
            aria-label="Continue with Email"
            className={authMethodButtonClass}
          >
            <span className="flex items-center justify-start">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <Mail className="h-5 w-5 text-muted-foreground" />
              )}
            </span>
            <span className="text-center">
              {loading ? 'Continuing with Email...' : 'Continue with Email'}
            </span>
            <span aria-hidden="true" />
          </Button>
        </form>

        <div className="mt-8 text-center text-sm font-medium text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/auth/signin"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </SectionCard>

      <div className="text-center">
        <Link href="/" className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
          Return to landing page
        </Link>
      </div>
    </div>
  );
}
