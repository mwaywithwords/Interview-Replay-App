'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { SectionCard } from '@/components/layout/SectionCard';
import { branding } from '@/lib/branding';
import { PlayCircle, Mail, RefreshCw, CheckCircle, LogOut } from 'lucide-react';
import { toast } from 'sonner';

interface VerifyEmailFormProps {
  email: string;
}

export function VerifyEmailForm({ email }: VerifyEmailFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResendEmail = async () => {
    setLoading(true);
    setResent(false);

    try {
      const supabase = createClient();
      
      // Use NEXT_PUBLIC_SITE_URL for production, fallback to window.location.origin for dev
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${siteUrl}/auth/confirm`,
        },
      });

      if (error) {
        toast.error('Failed to resend email', { description: error.message });
        return;
      }

      setResent(true);
      toast.success('Confirmation email sent!', { description: 'Check your inbox for the new link.' });
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/signin');
    router.refresh();
  };

  const handleCheckStatus = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        toast.error('Error checking status', { description: error.message });
        return;
      }

      if (user?.email_confirmed_at) {
        toast.success('Email verified!', { description: 'Redirecting to dashboard...' });
        router.push('/dashboard');
        router.refresh();
      } else {
        toast.info('Email not yet verified', { description: 'Please check your inbox and click the confirmation link.' });
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Mail className="w-10 h-10 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Verify your email
            </h1>
            <p className="text-muted-foreground font-medium">
              We sent a confirmation link to
            </p>
            <p className="text-primary font-bold text-lg">{email}</p>
          </div>

          <div className="rounded-xl bg-muted/50 p-4 text-sm font-medium text-muted-foreground border border-border/50">
            <p>
              Click the link in your email to verify your account and access {branding.brandName}.
              If you don&apos;t see it, check your spam folder.
            </p>
          </div>

          {resent && (
            <div className="rounded-xl bg-primary/10 p-4 text-sm font-bold text-primary border border-primary/20 flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <CheckCircle className="w-5 h-5" />
              New confirmation email sent!
            </div>
          )}

          <div className="space-y-3 pt-2">
            <PrimaryButton
              onClick={handleCheckStatus}
              disabled={loading}
              className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
            >
              {loading ? 'Checking...' : "I've verified my email"}
            </PrimaryButton>
            
            <SecondaryButton
              onClick={handleResendEmail}
              disabled={loading}
              variant="outline"
              className="w-full h-12 rounded-xl font-bold border-border"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Resend confirmation email
            </SecondaryButton>
          </div>

          <div className="pt-4 border-t border-border">
            <button
              onClick={handleSignOut}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign out and use a different email
            </button>
          </div>
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
