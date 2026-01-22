'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { PrimaryButton } from '@/components/ui/button';
import { SectionCard } from '@/components/layout/SectionCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { branding } from '@/lib/branding';
import { PlayCircle, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      
      // Build the redirect URL using the environment variable
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
      const redirectTo = `${siteUrl}/auth/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        toast.error(error.message);
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
              <h2 className="text-2xl font-black tracking-tight text-foreground">Check your email</h2>
              <p className="text-muted-foreground font-medium">
                We&apos;ve sent a password reset link to{' '}
                <span className="text-foreground font-bold">{email}</span>
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Click the link in the email to reset your password. If you don&apos;t see it, check your spam folder.
            </p>
            <div className="pt-4 border-t border-border">
              <button
                onClick={() => setEmailSent(false)}
                className="text-sm font-medium text-primary hover:underline"
              >
                Didn&apos;t receive the email? Try again
              </button>
            </div>
          </div>
        </SectionCard>

        <div className="text-center">
          <Link href="/auth/signin" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
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
        <h1 className="text-3xl font-black tracking-tight text-foreground">Forgot password?</h1>
        <p className="text-muted-foreground mt-2 font-medium">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <SectionCard className="border-border shadow-2xl shadow-primary/5">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Email address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="bg-muted/50 border-border pl-10"
              />
            </div>
          </div>

          <PrimaryButton
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </PrimaryButton>
        </form>
      </SectionCard>

      <div className="text-center">
        <Link href="/auth/signin" className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
