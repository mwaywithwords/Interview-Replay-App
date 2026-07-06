'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { PrimaryButton } from '@/components/ui/button';
import { SectionCard } from '@/components/layout/SectionCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      const supabase = createClient();
      
      // Listen for auth state changes to detect recovery link
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'PASSWORD_RECOVERY') {
            setIsValidSession(true);
          } else if (session) {
            // User has a valid session (might have arrived via recovery link)
            setIsValidSession(true);
          }
        }
      );

      // Check current session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      } else {
        // Give a moment for the auth state change to trigger
        setTimeout(() => {
          setIsValidSession((prev) => prev === null ? false : prev);
        }, 1000);
      }

      return () => {
        subscription.unsubscribe();
      };
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast.error(error.message);
        setError(error.message);
        return;
      }

      setSuccess(true);
      toast.success('Password updated successfully!');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <div className="w-full space-y-5">
        <SectionCard className="rounded-3xl border-border/45 bg-background/55 shadow-[var(--shadow-card)] backdrop-blur">
          <div className="text-center py-8">
            <div className="mx-auto mb-4 h-12 w-12 animate-pulse rounded-2xl bg-muted" />
            <p className="text-muted-foreground font-medium">Verifying reset link...</p>
          </div>
        </SectionCard>
      </div>
    );
  }

  // Invalid or expired link
  if (!isValidSession) {
    return (
      <div className="w-full space-y-5">
        <SectionCard className="rounded-3xl border-border/45 bg-background/55 shadow-[var(--shadow-card)] backdrop-blur">
          <div className="text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-foreground">Invalid or expired link</h2>
              <p className="text-muted-foreground font-medium">
                This password reset link is invalid or has expired.
              </p>
            </div>
            <Link href="/auth/forgot-password">
              <PrimaryButton className="h-12 w-full rounded-full font-semibold shadow-[var(--shadow-soft)]">
                Request a new link
              </PrimaryButton>
            </Link>
          </div>
        </SectionCard>

        <div className="text-center">
          <Link href="/auth/signin" className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="w-full space-y-5">
        <SectionCard className="rounded-3xl border-border/45 bg-background/55 shadow-[var(--shadow-card)] backdrop-blur">
          <div className="text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-foreground">Password updated!</h2>
              <p className="text-muted-foreground font-medium">
                Your password has been successfully updated.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Redirecting you to the dashboard...
            </p>
          </div>
        </SectionCard>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="w-full space-y-5">
      <SectionCard className="rounded-3xl border-border/45 bg-background/55 shadow-[var(--shadow-card)] backdrop-blur">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              New password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="border-border/60 bg-card/70 pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Confirm password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="border-border/60 bg-card/70 pl-10"
              />
            </div>
          </div>

          {error && (
            <div className="animate-in fade-in slide-in-from-top-2 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-semibold text-destructive duration-300">
              {error}
            </div>
          )}

          <PrimaryButton
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-full font-semibold shadow-[var(--shadow-soft)]"
          >
            {loading ? 'Updating...' : 'Update password'}
          </PrimaryButton>
        </form>
      </SectionCard>

      <div className="text-center">
        <Link href="/auth/signin" className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
