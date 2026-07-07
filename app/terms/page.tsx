import type { Metadata } from 'next';
import Link from 'next/link';
import { Scale } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { SectionCard } from '@/components/layout/SectionCard';
import { Badge } from '@/components/ui/badge';
import { branding } from '@/lib/branding';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `Terms of Service for ${branding.brandName}.`,
};

const lastUpdated = 'July 7, 2026';

const sections = [
  {
    title: 'Acceptance of Terms',
    content: [
      `These Terms of Service ("Terms") govern your access to and use of ${branding.brandName}, an AI-powered interview preparation platform operated by the ReplayAI team.`,
      'By creating an account, signing in, or using the service, you agree to these Terms and to our Privacy Policy. If you do not agree, do not use the service.',
    ],
  },
  {
    title: 'Description of Service',
    content: [
      `${branding.brandName} helps users prepare for interviews by uploading résumés and job descriptions, generating tailored résumés and personalized interview questions, recording practice responses, generating transcripts, receiving AI-powered feedback, saving notes and bookmarks, and sharing sessions through secure links.`,
      'We may update, improve, or discontinue features over time. Some features may be labeled as coming soon or otherwise unavailable until they are fully supported.',
    ],
  },
  {
    title: 'User Accounts',
    content: [
      'You may create an account using email and password or through supported OAuth providers such as Google, GitHub, or LinkedIn.',
      'You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us promptly if you believe your account has been accessed without authorization.',
      'You must provide accurate account information and keep it reasonably up to date. We may suspend or terminate accounts that violate these Terms or create security, legal, or operational risk.',
    ],
  },
  {
    title: 'Acceptable Use',
    content: [
      'You agree to use the service only for lawful interview preparation and related personal or professional development purposes.',
      'You may not misuse the service, attempt to gain unauthorized access to systems or data, interfere with service operation, scrape or reverse engineer the platform except as permitted by law, upload malicious code, or use the service to harass, impersonate, or infringe the rights of others.',
      'You may not use the service to generate, store, or distribute content that is unlawful, deceptive, harmful, or that violates applicable privacy, employment, or intellectual property laws.',
      'We may investigate suspected violations and take action including content removal, account suspension, or termination.',
    ],
  },
  {
    title: 'User-Uploaded Content',
    content: [
      'You retain ownership of the résumés, job descriptions, recordings, notes, bookmarks, and other content you upload or create in the service ("User Content").',
      'You grant us a limited license to host, store, process, display, and transmit your User Content solely as needed to operate, secure, and improve the service, including generating transcripts, AI feedback, and shareable session views you request.',
      'You represent that you have the rights necessary to upload and use your User Content in the service and that doing so does not violate any law or third-party rights.',
      'You are responsible for reviewing shared session links before distributing them. Anyone with access to a valid share link may be able to view the shared content according to the permissions of that link.',
    ],
  },
  {
    title: 'AI-Generated Content',
    content: [
      `${branding.brandName} uses artificial intelligence to generate tailored résumés, interview questions, transcripts, and feedback based on information you provide.`,
      'AI-generated outputs may be inaccurate, incomplete, outdated, or unsuitable for your specific situation. They are provided for preparation and informational purposes only and do not constitute legal, career, employment, or professional advice.',
      'You are solely responsible for reviewing, editing, and deciding whether to use any AI-generated content, including before submitting application materials or relying on feedback during real interviews.',
    ],
  },
  {
    title: 'Intellectual Property',
    content: [
      `The service, including its software, design, branding, and underlying technology, is owned by ${branding.brandName} and its licensors and is protected by applicable intellectual property laws.`,
      'Except for the limited rights expressly granted in these Terms, no license or other rights are granted to you in the service or its underlying technology.',
      'You may not copy, modify, distribute, sell, or lease any part of the service except as permitted by these Terms or applicable law.',
    ],
  },
  {
    title: 'Privacy',
    content: [
      'privacy-policy-reference',
      'By using the service, you acknowledge that we will process information as described in the Privacy Policy, including account data, uploaded content, recordings, transcripts, and AI processing necessary to provide the platform.',
    ],
  },
  {
    title: 'Limitation of Liability',
    content: [
      `To the fullest extent permitted by law, ${branding.brandName} and its operators will not be liable for any indirect, incidental, special, consequential, or punitive damages, or for any loss of profits, data, opportunities, or goodwill arising from your use of the service.`,
      'The service is provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement.',
      'To the fullest extent permitted by law, our total liability for any claim arising out of or relating to the service will not exceed the greater of the amount you paid us for the service in the twelve months before the claim or one hundred U.S. dollars (USD $100).',
      'Some jurisdictions do not allow certain limitations of liability, so some of the above limitations may not apply to you.',
    ],
  },
  {
    title: 'Termination',
    content: [
      'You may stop using the service at any time. We may suspend or terminate your access if you violate these Terms, create security or legal risk, or if we discontinue the service.',
      'Upon termination, your right to access the service ends. Provisions that by their nature should survive termination will remain in effect, including provisions relating to intellectual property, disclaimers, and limitations of liability.',
    ],
  },
  {
    title: 'Changes to These Terms',
    content: [
      'We may update these Terms from time to time. When we do, we will revise the "Last Updated" date at the top of this page.',
      'If changes are material, we may provide additional notice within the application or by other reasonable means. Continued use of the service after updated Terms become effective constitutes acceptance of the revised Terms.',
    ],
  },
  {
    title: 'Contact Information',
    content: [
      'For questions about these Terms, contact the ReplayAI team at privacy@replayai.app.',
      'privacy-policy-link',
    ],
  },
];

export default function TermsPage() {
  return (
    <AppShell
      headerActions={
        <Link
          href="/auth/signin"
          className="rounded-full border border-border/70 bg-background/60 px-4 py-2 text-sm font-semibold text-muted-foreground shadow-sm backdrop-blur transition-colors hover:border-primary/25 hover:text-foreground"
        >
          Sign In
        </Link>
      }
    >
      <div className="relative overflow-hidden bg-background">
        <div className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute left-1/2 top-[-240px] h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-primary/14 blur-3xl" />
          <div className="absolute right-[-160px] top-[360px] h-[420px] w-[420px] rounded-full bg-info/10 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.12] [mask-image:radial-gradient(circle_at_top,black,transparent_60%)]" />
        </div>

        <section className="relative z-10 mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mb-10 text-center">
            <Badge variant="info" className="mb-5 gap-2 rounded-full px-3 py-1">
              <Scale className="h-3.5 w-3.5" />
              Legal
            </Badge>
            <h1 className="text-4xl font-semibold tracking-[-0.06em] text-foreground sm:text-5xl lg:text-6xl">
              Terms of Service
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-8 text-muted-foreground sm:text-lg">
              The rules and expectations for using {branding.brandName} responsibly and effectively.
            </p>
            <p className="mt-4 text-sm font-semibold text-muted-foreground">
              Last Updated: {lastUpdated}
            </p>
          </div>

          <SectionCard className="rounded-[2rem] border-border/60 bg-card/70 shadow-[var(--shadow-elevated)] backdrop-blur-xl">
            <div className="space-y-10">
              {sections.map((section) => (
                <section key={section.title} className="scroll-mt-24">
                  <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground sm:text-2xl">
                    {section.title}
                  </h2>
                  <div className="mt-4 space-y-3">
                    {section.content.map((paragraph) => (
                      <p
                        key={paragraph}
                        className="text-sm font-medium leading-7 text-muted-foreground sm:text-base sm:leading-8"
                      >
                        {paragraph === 'privacy-policy-reference' ? (
                          <>
                            Our collection and use of personal information is described in our{' '}
                            <Link
                              href="/privacy"
                              className="text-foreground underline underline-offset-4 transition-colors hover:text-primary"
                            >
                              Privacy Policy
                            </Link>
                            .
                          </>
                        ) : paragraph === 'privacy-policy-link' ? (
                          <>
                            For privacy-related requests, please refer to our{' '}
                            <Link
                              href="/privacy"
                              className="text-foreground underline underline-offset-4 transition-colors hover:text-primary"
                            >
                              Privacy Policy
                            </Link>
                            .
                          </>
                        ) : (
                          paragraph
                        )}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </SectionCard>
        </section>
      </div>
    </AppShell>
  );
}
