import Link from 'next/link';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { AppShell } from '@/components/layout/AppShell';
import { HowItWorksButton } from '@/components/HowItWorksButton';
import { LandingReplayDemo } from '@/components/LandingReplayDemo';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Brain,
  Check,
  ClipboardList,
  FileText,
  MessageSquareText,
  PlayCircle,
  Quote,
  Sparkles,
  Target,
  Upload,
  Video,
  WandSparkles,
} from 'lucide-react';
import { branding } from '@/lib/branding';

const features = [
  {
    icon: Video,
    title: 'Record the real performance',
    description:
      'Capture mock interviews, practice sessions, or high-stakes calls with a workspace built for review.',
  },
  {
    icon: MessageSquareText,
    title: 'Replay every answer',
    description:
      'Jump between bookmarks, transcript moments, and notes without losing the thread of the session.',
  },
  {
    icon: Brain,
    title: 'Surface AI coaching signals',
    description:
      'Turn vague feedback into focused next steps around clarity, pacing, structure, and confidence.',
  },
];

const workflow = [
  {
    icon: Video,
    title: 'Record',
    description: 'Start a focused practice session for interviews, presentations, or performance reviews.',
  },
  {
    icon: Upload,
    title: 'Replay',
    description: 'Review the session like game film with synced media, transcript, and notes.',
  },
  {
    icon: ClipboardList,
    title: 'Mark moments',
    description: 'Bookmark the exact answers, pauses, and decisions that deserve another look.',
  },
  {
    icon: WandSparkles,
    title: 'Improve',
    description: 'Convert observations into a sharper plan for your next rep.',
  },
];

const testimonials = [
  {
    quote:
      'Replay AI turned our mock interview loop into something candidates actually wanted to repeat.',
    name: 'Maya Chen',
    role: 'Founder, Hiring Lab',
  },
  {
    quote:
      'It feels like Linear for performance review: fast, calm, and clear about what changed.',
    name: 'Andre Wallace',
    role: 'Product Lead',
  },
  {
    quote:
      'The bookmark and transcript flow makes coaching specific instead of anecdotal.',
    name: 'Priya Shah',
    role: 'Interview Coach',
  },
];

const pricing = [
  {
    name: 'Starter',
    price: '$0',
    description: 'For building your first review habit.',
    features: ['Record practice sessions', 'Replay with notes', 'Basic bookmarks'],
  },
  {
    name: 'Pro',
    price: 'Soon',
    description: 'For candidates and operators taking reps seriously.',
    features: ['AI coaching summaries', 'Advanced insights', 'Unlimited session library'],
    featured: true,
  },
  {
    name: 'Teams',
    price: 'Soon',
    description: 'For coaching groups and hiring teams.',
    features: ['Shared review spaces', 'Team analytics', 'Admin controls'],
  },
];

export default function Home() {
  return (
    <AppShell
      headerActions={
        <Link href="/auth/signin">
          <SecondaryButton
            size="sm"
            variant="outline"
            className="rounded-full border-border/70 bg-background/60 px-5 font-semibold backdrop-blur"
          >
            Sign In
          </SecondaryButton>
        </Link>
      }
    >
      <div className="relative overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute left-1/2 top-[-220px] h-[560px] w-[760px] -translate-x-1/2 rounded-full bg-primary/18 blur-3xl" />
          <div className="absolute right-[-160px] top-[420px] h-[420px] w-[420px] rounded-full bg-info/12 blur-3xl" />
          <div className="absolute bottom-[420px] left-[-180px] h-[460px] w-[460px] rounded-full bg-warning/10 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.18] [mask-image:radial-gradient(circle_at_top,black,transparent_62%)]" />
        </div>

        <section className="relative z-10 mx-auto flex max-w-6xl flex-col items-center px-6 pb-28 pt-28 text-center md:pb-36 md:pt-36">
          <div className="animate-in fade-in slide-in-from-bottom-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/70 px-4 py-1.5 text-xs font-semibold text-primary shadow-[var(--shadow-soft)] backdrop-blur duration-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-40" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            YC-style performance review for ambitious professionals
          </div>

          <h1 className="animate-in fade-in slide-in-from-bottom-5 mt-8 max-w-5xl text-6xl font-semibold leading-[0.92] tracking-[-0.075em] text-foreground duration-700 md:text-8xl">
            Replay every interview.
            <span className="block bg-gradient-to-r from-primary via-info to-primary bg-clip-text text-transparent">
              Improve every answer.
            </span>
          </h1>

          <p className="animate-in fade-in slide-in-from-bottom-6 mt-8 max-w-3xl text-xl font-medium leading-8 text-muted-foreground duration-700 md:text-2xl md:leading-9">
            {branding.description} Record practice, replay the moments that matter, and turn every rep into a sharper performance.
          </p>

          <div className="animate-in fade-in slide-in-from-bottom-8 mt-12 flex flex-col items-center justify-center gap-4 duration-1000 sm:flex-row">
            <Link href="/dashboard">
              <PrimaryButton
                size="lg"
                className="h-14 rounded-full px-8 text-base shadow-[0_18px_48px_oklch(0.57_0.19_262/0.28)] hover:-translate-y-0.5"
              >
                Start Free Session
                <ArrowRight className="h-5 w-5" />
              </PrimaryButton>
            </Link>
            <HowItWorksButton />
          </div>

          <div className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
            {[
              ['2 min', 'to review a key answer'],
              ['5x', 'more specific feedback loops'],
              ['0 setup', 'record and replay instantly'],
            ].map(([metric, label]) => (
              <div
                key={metric}
                className="rounded-2xl border border-border/70 bg-card/55 p-4 shadow-[var(--shadow-soft)] backdrop-blur"
              >
                <div className="text-2xl font-semibold tracking-[-0.04em] text-foreground">{metric}</div>
                <div className="mt-1 text-sm font-medium text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-7xl px-6 pb-28">
          <SectionIntro
            eyebrow="Product Demo"
            title="A replay room for your best reps."
            description="Click the bookmarks to see how synced review turns a long recording into coachable moments."
          />
          <LandingReplayDemo />
        </section>

        <section className="relative z-10 mx-auto max-w-7xl px-6 pb-28">
          <SectionIntro
            eyebrow="Features"
            title="Built for high-signal practice."
            description="Replay AI keeps the workflow calm, visual, and specific so improvement does not get buried in a recording."
          />

          <div className="grid gap-5 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group rounded-3xl border border-border/70 bg-card/65 p-6 shadow-[var(--shadow-card)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/25"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/70 bg-muted/60 transition-all duration-300 group-hover:border-primary/25 group-hover:bg-primary/10">
                    <Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                  </div>
                  <h3 className="mt-8 text-xl font-semibold tracking-[-0.025em] text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm font-medium leading-7 text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section id="how-it-works" className="relative z-10 mx-auto max-w-7xl px-6 pb-28">
          <SectionIntro
            eyebrow="Interview Workflow"
            title="From practice session to next rep."
            description="A lightweight loop for capturing what happened, finding the signal, and improving the next attempt."
          />

          <div className="grid gap-4 md:grid-cols-4">
            {workflow.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-5 shadow-[var(--shadow-soft)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/25"
                >
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-xs font-semibold text-muted-foreground">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mt-8 text-lg font-semibold tracking-[-0.02em] text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm font-medium leading-7 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-7xl px-6 pb-28">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-border/70 bg-card/65 p-8 shadow-[var(--shadow-card)] backdrop-blur">
              <Badge variant="info" className="mb-6">
                AI Review Layer
              </Badge>
              <h2 className="text-3xl font-semibold tracking-[-0.045em] text-foreground md:text-5xl">
                Specific feedback beats generic practice.
              </h2>
              <p className="mt-5 text-base font-medium leading-8 text-muted-foreground">
                Replay AI is designed around the moment you say, "I need to watch that answer again." Everything stays close to the recording so feedback remains grounded.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                { icon: Target, label: 'Answer structure', value: 'Sharper examples' },
                { icon: BarChart3, label: 'Delivery trends', value: 'Pace and clarity' },
                { icon: FileText, label: 'Review notes', value: 'Context in one place' },
                { icon: BadgeCheck, label: 'Progress loop', value: 'Better next reps' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-border/70 bg-background/55 p-6 shadow-[var(--shadow-soft)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/25"
                  >
                    <Icon className="h-5 w-5 text-primary" />
                    <div className="mt-8 text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {item.label}
                    </div>
                    <div className="mt-2 text-xl font-semibold tracking-[-0.025em] text-foreground">
                      {item.value}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-7xl px-6 pb-28">
          <SectionIntro
            eyebrow="Testimonials"
            title="Designed for people who take practice seriously."
            description="Static examples for now, shaped to show the audience and credibility the product is aiming for."
          />

          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="rounded-3xl border border-border/70 bg-card/65 p-6 shadow-[var(--shadow-card)] backdrop-blur"
              >
                <Quote className="h-5 w-5 text-primary" />
                <p className="mt-8 text-lg font-medium leading-8 tracking-[-0.015em] text-foreground">
                  "{testimonial.quote}"
                </p>
                <div className="mt-8 border-t border-border/70 pt-5">
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="mt-1 text-sm font-medium text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-7xl px-6 pb-28">
          <SectionIntro
            eyebrow="Pricing"
            title="Simple plans while the product grows."
            description="Placeholder pricing for the landing page only. No billing flow or backend behavior is connected."
          />

          <div className="grid gap-5 lg:grid-cols-3">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-3xl border p-6 shadow-[var(--shadow-card)] backdrop-blur ${
                  plan.featured
                    ? 'border-primary/30 bg-primary/10'
                    : 'border-border/70 bg-card/65'
                }`}
              >
                {plan.featured && (
                  <Badge className="absolute right-6 top-6" variant="default">
                    Popular
                  </Badge>
                )}
                <div className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {plan.name}
                </div>
                <div className="mt-6 text-5xl font-semibold tracking-[-0.06em] text-foreground">
                  {plan.price}
                </div>
                <p className="mt-4 min-h-14 text-sm font-medium leading-7 text-muted-foreground">
                  {plan.description}
                </p>
                <div className="mt-8 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3 text-sm font-medium text-foreground">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-7xl px-6 pb-28">
          <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/70 p-8 text-center shadow-[var(--shadow-elevated)] backdrop-blur md:p-14">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="mx-auto mt-8 max-w-3xl text-4xl font-semibold tracking-[-0.055em] text-foreground md:text-6xl">
              Make every practice rep compound.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-8 text-muted-foreground">
              Start with one recorded session. Leave with clearer answers, better notes, and a plan for the next attempt.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/dashboard">
                <PrimaryButton size="lg" className="h-13 rounded-full px-8">
                  Start Free Session
                  <ArrowRight className="h-5 w-5" />
                </PrimaryButton>
              </Link>
              <Link href="/auth/signin">
                <SecondaryButton size="lg" variant="outline" className="h-13 rounded-full px-8">
                  Sign In
                </SecondaryButton>
              </Link>
            </div>
          </div>
        </section>

        <footer className="relative z-10 border-t border-border/70 bg-card/35 px-6 py-14">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                  <PlayCircle className="h-4 w-4 fill-current" />
                </div>
                <span className="text-lg font-semibold tracking-[-0.04em] text-foreground">
                  {branding.brandName}
                </span>
              </div>
              <p className="mt-3 max-w-md text-sm font-medium leading-6 text-muted-foreground">
                {branding.tagline}. Built for replaying practice, finding signal, and improving faster.
              </p>
            </div>
            <div className="text-sm font-semibold text-muted-foreground">
              © 2026 {branding.brandName}. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </AppShell>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto mb-12 max-w-3xl text-center">
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/65 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground shadow-sm backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        {eyebrow}
      </div>
      <h2 className="text-4xl font-semibold tracking-[-0.055em] text-foreground md:text-6xl">
        {title}
      </h2>
      <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-8 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
