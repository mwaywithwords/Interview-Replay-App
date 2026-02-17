'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { SectionCard } from '@/components/layout/SectionCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { branding } from '@/lib/branding';
import { PlayCircle, Mail } from 'lucide-react';
import { Turnstile } from './Turnstile';
import { signUpAction } from '@/app/actions/auth';
import { getEmailError } from '@/lib/validation/email';

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md">
        <SectionCard className="text-center border-border shadow-2xl shadow-primary/5 p-8">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-foreground mb-4">
            Check your email
          </h2>
          <p className="text-muted-foreground mb-8 font-medium leading-relaxed">
            We&apos;ve sent a confirmation link to<br />
            <span className="text-primary font-bold">{email}</span>
          </p>
          <div className="flex flex-col gap-4">
            <Link href="/auth/signin">
              <PrimaryButton className="w-full h-12 rounded-xl font-bold">
                Continue to Sign In
              </PrimaryButton>
            </Link>
            <Link href="/">
              <SecondaryButton variant="ghost" className="w-full font-bold">
                Back to Home
              </SecondaryButton>
            </Link>
          </div>
        </SectionCard>
      </div>
    );
  }

  return (
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
        <h1 className="text-3xl font-black tracking-tight text-foreground">Create an account</h1>
        <p className="text-muted-foreground mt-2 font-medium">Start reviewing your performance like game film</p>
      </div>

      <SectionCard className="border-border shadow-2xl shadow-primary/5">
        <form onSubmit={handleSignUp} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              placeholder="you@example.com"
              required
              className={`bg-muted/50 border-border ${emailError ? 'border-destructive' : ''}`}
            />
            {emailError && (
              <p className="text-xs font-medium text-destructive">{emailError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-muted/50 border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-muted/50 border-border"
            />
          </div>

          <Turnstile
            onVerify={setTurnstileToken}
            onError={() => setError('CAPTCHA failed to load. Please refresh the page.')}
            onExpire={() => setTurnstileToken('')}
            className="flex justify-center"
          />

          {error && (
            <div className="rounded-xl bg-destructive/10 p-4 text-sm font-bold text-destructive border border-destructive/20 animate-in fade-in slide-in-from-top-2 duration-300">
              {error}
            </div>
          )}

          <PrimaryButton
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </PrimaryButton>
        </form>

        <div className="mt-8 text-center text-sm font-medium text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/auth/signin"
            className="text-primary font-bold hover:underline"
          >
            Sign in
          </Link>
        </div>
      </SectionCard>
      
      <div className="text-center">
        <Link href="/" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
          ← Return to landing page
        </Link>
      </div>
    </div>
  );
}
