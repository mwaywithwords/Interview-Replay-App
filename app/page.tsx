import Link from 'next/link';
import { PrimaryButton, SecondaryButton } from '@/components/ui/button';
import { AppShell } from '@/components/layout/AppShell';
import { HowItWorksButton } from '@/components/HowItWorksButton';
import { LandingReplayDemo } from '@/components/LandingReplayDemo';
import { Badge } from '@/components/ui/badge';
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Brain,
  Check,
  FilePen,
  MessageSquareText,
  Mic,
  Quote,
  Sparkles,
  Target,
  Upload,
} from 'lucide-react';
import { branding } from '@/lib/branding';
import { BrandMark } from '@/components/BrandLogo';

const howItWorksSteps = [
  {
    icon: Upload,
    title: 'Upload your résumé',
    description: 'Start from the résumé you have today — no need to rebuild from scratch.',
  },
  {
    icon: FilePen,
    title: 'Paste the job description',
    description: 'Add the exact requirements, responsibilities, and company context for the role.',
  },
  {
    icon: Target,
    title: 'Analyze résumé fit',
    description: 'See where you align with the role, where you’re light, and what to emphasize.',
  },
  {
    icon: Sparkles,
    title: 'Generate a tailored résumé',
    description: 'Get a role-specific draft that highlights your strongest matches.',
  },
  {
    icon: MessageSquareText,
    title: 'Generate interview questions',
    description: 'Build a focused practice set from your fit analysis and the job posting.',
  },
  {
    icon: Mic,
    title: 'Practice your answers',
    description: 'Record video or audio responses tied to each question — just like the real thing.',
  },
  {
    icon: Brain,
    title: 'Receive AI coaching',
    description: 'Get structured ratings and clear next steps on every answer you record.',
  },
  {
    icon: BadgeCheck,
    title: 'Become interview-ready',
    description: 'Walk in with practiced answers, measurable improvement, and real confidence.',
  },
];

const journeyStages = [
  {
    stage: '01',
    eyebrow: 'Understand your fit',
    title: 'Know exactly where you stand before you apply',
    description:
      'ReplayAI compares your résumé to the job description and shows match score, missing keywords, weak sections, and what to emphasize — so you know what to fix first.',
    highlights: ['Résumé ↔ role match score', 'Gap analysis and keyword gaps', 'Clear priorities before you tailor'],
  },
  {
    stage: '02',
    eyebrow: 'Tailor your application',
    title: 'Turn insight into a résumé built for this role',
    description:
      'Use your fit analysis to generate a tailored résumé draft that surfaces your strongest evidence for the specific job — not a generic rewrite.',
    highlights: ['Role-specific résumé drafts', 'Highlights aligned to the posting', 'One workspace per opportunity'],
  },
  {
    stage: '03',
    eyebrow: 'Practice with purpose',
    title: 'Answer the questions you’ll actually face',
    description:
      'Generate personalized interview questions from your materials, then record video or audio answers tied to each one. Review transcripts and coachable moments in one place.',
    highlights: ['Questions from your résumé and JD', 'Video and audio practice', 'Synced replay and transcripts'],
  },
  {
    stage: '04',
    eyebrow: 'Improve with coaching',
    title: 'Get feedback you can act on — not generic advice',
    description:
      'Every answer is scored against the question, job description, and résumé. See what worked, what was missing, and how to improve on the next attempt.',
    highlights: ['8 dimensions scored per answer', 'Actionable coaching notes', 'Progress you can measure'],
  },
];

const testimonials = [
  {
    quote:
      'I uploaded my résumé, pasted the JD, and had tailored questions to practice within an hour. The ratings told me exactly what to fix.',
    name: 'Maya Chen',
    role: 'Software Engineer',
  },
  {
    quote:
      'It’s the first prep tool that connects the job posting to what I actually say out loud — and shows me whether I’m improving.',
    name: 'Andre Wallace',
    role: 'Product Manager',
  },
  {
    quote:
      'I stopped guessing what to prepare. ReplayAI gave me a clear path from fit analysis to confident answers.',
    name: 'Priya Shah',
    role: 'Data Analyst',
  },
];

const pricing = [
  {
    name: 'Starter',
    price: '$0',
    description: 'Start your first role from application to practice.',
    features: ['Full prep workflow', 'Fit analysis', 'Interview questions'],
  },
  {
    name: 'Pro',
    price: 'Soon',
    description: 'Prepare seriously across multiple opportunities.',
    features: ['Tailored résumé drafts', 'Answer ratings & coaching', 'Unlimited practice sessions'],
    featured: true,
  },
  {
    name: 'Teams',
    price: 'Soon',
    description: 'For coaches and cohort programs.',
    features: ['Shared prep workspaces', 'Team progress', 'Admin controls'],
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
            End-to-end interview preparation
          </div>

          <h1 className="animate-in fade-in slide-in-from-bottom-5 mt-8 max-w-5xl text-6xl font-semibold leading-[0.92] tracking-[-0.075em] text-foreground duration-700 md:text-8xl">
            Everything you need to go
            <span className="block bg-gradient-to-r from-primary via-info to-primary bg-clip-text text-transparent">
              from application to interview-ready.
            </span>
          </h1>

          <p className="animate-in fade-in slide-in-from-bottom-6 mt-8 max-w-3xl text-xl font-medium leading-8 text-muted-foreground duration-700 md:text-2xl md:leading-9">
            {branding.description}
          </p>

          <div className="animate-in fade-in slide-in-from-bottom-8 mt-12 flex flex-col items-center justify-center gap-4 duration-1000 sm:flex-row">
            <Link href="/job-prep/new">
              <PrimaryButton
                size="lg"
                className="h-14 rounded-full px-8 text-base shadow-[0_18px_48px_oklch(0.57_0.19_262/0.28)] hover:-translate-y-0.5"
              >
                Start Preparing Free
                <ArrowRight className="h-5 w-5" />
              </PrimaryButton>
            </Link>
            <HowItWorksButton />
          </div>

          <div className="mt-12 grid w-full max-w-3xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
            {[
              ['Full workflow', 'résumé through coaching'],
              ['Role-specific', 'questions and feedback'],
              ['Measurable', 'improvement every session'],
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

        <section id="how-it-works" className="relative z-10 mx-auto max-w-7xl px-6 pb-28">
          <SectionIntro
            eyebrow="How ReplayAI works"
            title="Your path from application to interview-ready"
            description="Eight connected steps in one workspace — no switching tools, no starting over for each role."
          />

          <div className="mx-auto max-w-2xl">
            {howItWorksSteps.map((step, index) => {
              const Icon = step.icon;
              const isLast = index === howItWorksSteps.length - 1;

              return (
                <div key={step.title}>
                  <div className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-5 shadow-[var(--shadow-soft)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/25">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-lg font-semibold tracking-[-0.02em] text-foreground">
                            {step.title}
                          </h3>
                          <span className="shrink-0 font-mono text-xs font-semibold text-muted-foreground">
                            0{index + 1}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-medium leading-7 text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {!isLast && (
                    <div className="flex justify-center py-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-background/60 text-primary/60 shadow-sm backdrop-blur">
                        <ArrowDown className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-7xl px-6 pb-28">
          <SectionIntro
            eyebrow="Your preparation journey"
            title="Every stage connected to the role you’re pursuing"
            description="Instead of scattered tools and generic prompts, ReplayAI groups your prep into four stages — each building on the last."
          />

          <div className="grid gap-5 lg:grid-cols-2">
            {journeyStages.map((stage) => (
              <div
                key={stage.stage}
                className="group rounded-3xl border border-border/70 bg-card/65 p-6 shadow-[var(--shadow-card)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-primary/25"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="info">{stage.eyebrow}</Badge>
                  <span className="font-mono text-xs font-semibold text-muted-foreground">{stage.stage}</span>
                </div>
                <h3 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                  {stage.title}
                </h3>
                <p className="mt-3 text-sm font-medium leading-7 text-muted-foreground">{stage.description}</p>
                <ul className="mt-6 space-y-2">
                  {stage.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-center gap-3 text-sm font-medium text-foreground">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="relative z-10 mx-auto max-w-7xl px-6 pb-28">
          <SectionIntro
            eyebrow="Practice in action"
            title="Record answers and review coachable moments"
            description="When you reach the practice stage, everything stays in one workspace — synced media, transcripts, and coaching tied to each question."
          />
          <LandingReplayDemo />
        </section>

        <section className="relative z-10 mx-auto max-w-7xl px-6 pb-28">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-border/70 bg-card/65 p-8 shadow-[var(--shadow-card)] backdrop-blur">
              <Badge variant="info" className="mb-6">
                Why ReplayAI
              </Badge>
              <h2 className="text-3xl font-semibold tracking-[-0.045em] text-foreground md:text-5xl">
                Built for interview readiness — not generic AI chat
              </h2>
              <p className="mt-5 text-base font-medium leading-8 text-muted-foreground">
                ChatGPT can brainstorm answers, but it doesn&apos;t know your résumé, the job you&apos;re targeting,
                or how your last practice session went. ReplayAI connects every step — fit analysis, tailored materials,
                role-specific questions, recorded answers, and structured coaching — so feedback is personalized,
                measurable, and tied to the interview you&apos;re actually preparing for.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                { icon: Target, label: 'Fit analysis', value: 'Résumé ↔ role match' },
                { icon: MessageSquareText, label: 'Practice questions', value: 'From your materials' },
                { icon: BarChart3, label: 'Answer ratings', value: '8 dimensions scored' },
                { icon: BadgeCheck, label: 'Interview readiness', value: 'Confidence you can measure' },
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
            title="Candidates who prepare with a plan"
            description="From fit analysis to practiced answers — real outcomes from following the full workflow."
          />

          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.name}
                className="rounded-3xl border border-border/70 bg-card/65 p-6 shadow-[var(--shadow-card)] backdrop-blur"
              >
                <Quote className="h-5 w-5 text-primary" />
                <p className="mt-8 text-lg font-medium leading-8 tracking-[-0.015em] text-foreground">
                  &ldquo;{testimonial.quote}&rdquo;
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
            title="Start free, grow as you prepare"
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
              Walk into your next interview prepared
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-8 text-muted-foreground">
              Upload your résumé, target a role, practice personalized questions, and improve with coaching —
              all in one place. Start with one job and leave interview-ready.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/job-prep/new">
                <PrimaryButton size="lg" className="h-13 rounded-full px-8">
                  Start Preparing Free
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
                <BrandMark size="sm" />
                <span className="text-lg font-semibold tracking-[-0.04em] text-foreground">
                  {branding.brandName}
                </span>
              </div>
              <p className="mt-3 max-w-md text-sm font-medium leading-6 text-muted-foreground">
                {branding.tagline}. Personalized coaching, measurable improvement, and interview confidence —
                from your first upload to your final practice session.
              </p>
            </div>
            <div className="flex flex-col gap-2 text-sm font-semibold text-muted-foreground sm:items-end">
              <Link href="/privacy" className="transition-colors hover:text-foreground">
                Privacy Policy
              </Link>
              <span>© 2026 {branding.brandName}. All rights reserved.</span>
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
