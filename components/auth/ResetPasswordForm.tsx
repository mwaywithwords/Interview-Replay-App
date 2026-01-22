'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { PrimaryButton } from '@/components/ui/button';
import { SectionCard } from '@/components/layout/SectionCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { branding } from '@/lib/branding';
import { PlayCircle, Lock, CheckCircle, AlertCircle } from 'lucide-react';
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
        </div>

        <SectionCard className="border-border shadow-2xl shadow-primary/5">
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-muted animate-pulse mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">Verifying reset link...</p>
          </div>
        </SectionCard>
      </div>
    );
  }

  // Invalid or expired link
  if (!isValidSession) {
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
        </div>

        <SectionCard className="border-border shadow-2xl shadow-primary/5">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-foreground">Invalid or expired link</h2>
              <p className="text-muted-foreground font-medium">
                This password reset link is invalid or has expired.
              </p>
            </div>
            <Link href="/auth/forgot-password">
              <PrimaryButton className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20">
                Request a new link
              </PrimaryButton>
            </Link>
          </div>
        </SectionCard>

        <div className="text-center">
          <Link href="/auth/signin" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
            ← Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
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
        </div>

        <SectionCard className="border-border shadow-2xl shadow-primary/5">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-foreground">Password updated!</h2>
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
        <h1 className="text-3xl font-black tracking-tight text-foreground">Reset your password</h1>
        <p className="text-muted-foreground mt-2 font-medium">
          Enter your new password below
        </p>
      </div>

      <SectionCard className="border-border shadow-2xl shadow-primary/5">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
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
                className="bg-muted/50 border-border pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
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
                className="bg-muted/50 border-border pl-10"
              />
            </div>
          </div>

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
            {loading ? 'Updating...' : 'Update password'}
          </PrimaryButton>
        </form>
      </SectionCard>

      <div className="text-center">
        <Link href="/auth/signin" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
}
