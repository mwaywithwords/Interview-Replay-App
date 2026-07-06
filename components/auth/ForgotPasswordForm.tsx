'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { PrimaryButton } from '@/components/ui/button';
import { SectionCard } from '@/components/layout/SectionCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Turnstile } from './Turnstile';
import { forgotPasswordAction } from '@/app/actions/auth';
import { getEmailError } from '@/lib/validation/email';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>('');

  // Validate email on blur
  const handleEmailBlur = useCallback(() => {
    if (email) {
      // Don't block disposable for password reset
      const error = getEmailError(email, false);
      setEmailError(error);
    }
  }, [email]);

  // Clear email error when typing
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) setEmailError(null);
  }, [emailError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    const emailValidationError = getEmailError(email, false);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      return;
    }

    if (!turnstileToken) {
      toast.error('Please complete the CAPTCHA verification');
      return;
    }

    setLoading(true);

    try {
      const result = await forgotPasswordAction(email, turnstileToken);

      if (!result.success) {
        if (result.rateLimited) {
          toast.error(result.error || 'Too many requests');
        } else {
          toast.error(result.error || 'Failed to send reset email');
        }
        return;
      }

      setEmailSent(true);
      toast.success('Password reset link sent!');
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="w-full space-y-5">
        <SectionCard className="rounded-3xl border-border/45 bg-background/55 shadow-[var(--shadow-card)] backdrop-blur">
          <div className="text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-foreground">Check your email</h2>
              <p className="text-muted-foreground font-medium">
                We&apos;ve sent a password reset link to{' '}
                <span className="font-semibold text-foreground">{email}</span>
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Click the link in the email to reset your password. If you don&apos;t see it, check your spam folder.
            </p>
            <div className="border-t border-border/45 pt-4">
              <button
                onClick={() => setEmailSent(false)}
                className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                Didn&apos;t receive the email? Try again
              </button>
            </div>
          </div>
        </SectionCard>

        <div className="text-center">
          <Link href="/auth/signin" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      <SectionCard className="rounded-3xl border-border/45 bg-background/55 shadow-[var(--shadow-card)] backdrop-blur">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Email address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                placeholder="you@example.com"
                required
                className={`border-border/60 bg-card/70 pl-10 ${emailError ? 'border-destructive' : ''}`}
              />
            </div>
            {emailError && (
              <p className="text-xs font-medium text-destructive">{emailError}</p>
            )}
          </div>

          <Turnstile
            onVerify={setTurnstileToken}
            onError={() => toast.error('CAPTCHA failed to load. Please refresh the page.')}
            onExpire={() => setTurnstileToken('')}
            className="flex justify-center"
          />

          <PrimaryButton
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-full font-semibold shadow-[var(--shadow-soft)]"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </PrimaryButton>
        </form>
      </SectionCard>

      <div className="text-center">
        <Link href="/auth/signin" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
