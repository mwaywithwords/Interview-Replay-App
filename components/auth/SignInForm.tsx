'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { PrimaryButton } from '@/components/ui/button';
import { SectionCard } from '@/components/layout/SectionCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { branding } from '@/lib/branding';
import { PlayCircle } from 'lucide-react';

export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Check if error is due to unconfirmed email
        if (error.message.toLowerCase().includes('email not confirmed')) {
          setError('Please verify your email before signing in. Check your inbox for the confirmation link.');
        } else {
          setError(error.message);
        }
        return;
      }

      // Check if email is confirmed
      if (data.user && !data.user.email_confirmed_at) {
        router.push('/auth/verify');
        router.refresh();
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
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
        <h1 className="text-3xl font-black tracking-tight text-foreground">Welcome back</h1>
        <p className="text-muted-foreground mt-2 font-medium">Sign in to your account to continue</p>
      </div>

      <SectionCard className="border-border shadow-2xl shadow-primary/5">
        <form onSubmit={handleSignIn} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="bg-muted/50 border-border"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Password</Label>
              <Link
                href="/auth/forgot-password"
                className="text-xs font-medium text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
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
            {loading ? 'Signing in...' : 'Sign In'}
          </PrimaryButton>
        </form>

        <div className="mt-8 text-center text-sm font-medium text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href="/auth/signup"
            className="text-primary font-bold hover:underline"
          >
            Sign up
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
