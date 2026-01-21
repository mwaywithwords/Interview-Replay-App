import Link from 'next/link';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { AppShell } from '@/components/layout/AppShell';
import { SectionCard } from '@/components/layout/SectionCard';
import { Video, Play, TrendingUp, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <AppShell
      headerActions={
        <Link href="/dashboard">
          <SecondaryButton size="sm">Sign In</SecondaryButton>
        </Link>
      }
    >
      <div className="relative overflow-hidden">
        {/* Hero Section */}
        <div className="max-w-5xl mx-auto px-6 pt-24 pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border text-xs font-medium text-muted-foreground mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Review your performance like game film
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Master Interviews.<br />
            <span className="text-muted-foreground">Track Progress.</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            The all-in-one platform for professionals who want to ace their
            interviews and review their performance with precision.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <PrimaryButton size="lg" className="px-8">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </PrimaryButton>
            </Link>
            <SecondaryButton size="lg" variant="ghost">
              Learn More
            </SecondaryButton>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto px-6 pb-32">
          <div className="grid md:grid-cols-3 gap-6">
            <SectionCard 
              title="Mock Interviews"
              className="h-full"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-4">
                <Video className="w-5 h-5 text-foreground" />
              </div>
              <p className="text-muted-foreground">
                Practice with AI-powered mock interviews tailored to any role.
                Record, review, and improve.
              </p>
            </SectionCard>

            <SectionCard 
              title="Replay Sessions"
              className="h-full"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-4">
                <Play className="w-5 h-5 text-foreground" />
              </div>
              <p className="text-muted-foreground">
                Watch your past interviews like game film. Spot patterns,
                identify weaknesses, and track improvement over time.
              </p>
            </SectionCard>

            <SectionCard 
              title="Trading Journal"
              className="h-full"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-4">
                <TrendingUp className="w-5 h-5 text-foreground" />
              </div>
              <p className="text-muted-foreground">
                Log and analyze your trades. Review your decisions with the
                same rigor athletes use to study game tape.
              </p>
            </SectionCard>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-border py-12 px-6">
          <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
            © 2026 Interview Replay. Built for those who want to level up.
          </div>
        </footer>
      </div>
    </AppShell>
  );
}
