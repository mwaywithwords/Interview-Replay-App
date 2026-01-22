import Link from 'next/link';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { AppShell } from '@/components/layout/AppShell';
import { SectionCard } from '@/components/layout/SectionCard';
import { HowItWorksButton } from '@/components/HowItWorksButton';
import { Video, Play, TrendingUp, ArrowRight, PlayCircle, Upload, Bookmark, FileText } from 'lucide-react';
import { branding } from '@/lib/branding';

export default function Home() {
  return (
    <AppShell
      headerActions={
        <Link href="/auth/signin">
          <SecondaryButton size="sm" variant="outline" className="rounded-full px-5 border-border hover:bg-accent font-semibold">
            Sign In
          </SecondaryButton>
        </Link>
      }
    >
      <div className="relative overflow-hidden bg-background">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] pointer-events-none opacity-[0.05]" 
             style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, var(--primary) 0%, transparent 50%)' }} />

        {/* Hero Section */}
        <div className="max-w-5xl mx-auto px-6 pt-32 pb-40 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            {branding.tagline}
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 text-foreground leading-[0.9]">
            Master Your<br />
            <span className="text-primary italic">Craft.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-14 leading-relaxed font-medium">
            {branding.description}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <Link href="/dashboard">
              <PrimaryButton size="lg" className="px-10 h-14 rounded-full text-lg font-bold shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 transition-all hover:-translate-y-0.5 active:translate-y-0">
                Start Free Session
                <ArrowRight className="ml-2 h-5 w-5" />
              </PrimaryButton>
            </Link>
            <HowItWorksButton />
          </div>
        </div>

        {/* How It Works Section */}
        <section id="how-it-works" className="max-w-4xl mx-auto px-6 pb-32 relative z-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-4">
              How it works
            </h2>
            <p className="text-lg text-muted-foreground">
              Get started in 5 simple steps
            </p>
          </div>
          
          <div className="space-y-4">
            {[
              { icon: Video, title: 'Record a session', description: 'Record audio or video for an interview or trading review session.' },
              { icon: Upload, title: 'Upload and replay', description: 'Upload the recording and replay it like game film.' },
              { icon: Bookmark, title: 'Add bookmarks', description: 'Mark key moments with timestamps and labels.' },
              { icon: FileText, title: 'Notes and transcript', description: 'Add session notes and paste a transcript for quick review.' },
              { icon: TrendingUp, title: 'Improve over time', description: 'Track sessions, review patterns, and level up.' },
            ].map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-4 p-5 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {index + 1}
                      </span>
                      <h3 className="text-lg font-bold text-foreground">
                        {step.title}
                      </h3>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-6 pb-40 relative z-10">
          <div className="grid md:grid-cols-3 gap-8">
            <SectionCard 
              className="group hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 rounded-3xl p-2 bg-card/50 backdrop-blur-sm"
            >
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500">
                <Video className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4 tracking-tight">Mock Interviews</h3>
              <p className="text-muted-foreground leading-relaxed font-medium">
                Simulate real-world interview scenarios. Record your audio and video 
                to analyze body language, tone, and content quality.
              </p>
            </SectionCard>

            <SectionCard 
              className="group hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 rounded-3xl p-2 bg-card/50 backdrop-blur-sm"
            >
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500">
                <Play className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4 tracking-tight">Performance Replay</h3>
              <p className="text-muted-foreground leading-relaxed font-medium">
                Review your sessions like game film. Tag important moments, 
                add notes, and track your progress across multiple sessions.
              </p>
            </SectionCard>

            <SectionCard 
              className="group hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 rounded-3xl p-2 bg-card/50 backdrop-blur-sm"
            >
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-500">
                <TrendingUp className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-4 tracking-tight">AI Insights</h3>
              <p className="text-muted-foreground leading-relaxed font-medium">
                Get instant feedback on your speaking pace, filler word usage, 
                and content clarity powered by advanced speech analysis.
              </p>
            </SectionCard>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-border py-20 px-6 bg-card/30">
          <div className="max-w-6xl mx-auto flex flex-col items-center">
            <div className="flex items-center gap-2 mb-8 transition-opacity hover:opacity-100">
               <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                <PlayCircle className="w-3 h-3 fill-current" />
              </div>
              <span className="text-lg font-bold tracking-tighter text-foreground">
                {branding.brandShort}<span className="text-primary">.ai</span>
              </span>
            </div>
            <div className="text-muted-foreground font-bold text-center">
              © 2026 {branding.brandName}. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </AppShell>
  );
}
