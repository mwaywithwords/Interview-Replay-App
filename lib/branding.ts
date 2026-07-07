/** Canonical production URL — overridden locally via NEXT_PUBLIC_SITE_URL. */
export const DEFAULT_SITE_URL = "https://www.replayai.app";

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? DEFAULT_SITE_URL;
}

export const branding = {
  brandName: "ReplayAI",
  brandShort: "ReplayAI",
  tagline: "From application to interview-ready",
  /** Short subtitle used on the Open Graph image and social card titles. */
  ogSubtitle: "AI-Powered Interview Preparation",
  /** Supporting line rendered on the Open Graph image. */
  ogSupportingLine: "Tailor your résumé • Practice interviews • Improve with AI",
  description:
    "Upload your résumé and a job description. ReplayAI analyzes your fit, generates a tailored résumé, creates personalized interview questions, lets you practice your answers, and provides AI coaching to help you walk into every interview prepared.",
  /** Concise copy for link previews (iMessage, Slack, LinkedIn, etc.). */
  socialDescription:
    "Tailor your résumé, practice role-specific interview questions, and improve with structured AI coaching — all in one workspace.",
};
