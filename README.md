<p align="center">
  <img src="public/replayai-logo.png" alt="ReplayAI" width="96" height="96" />
</p>

<h1 align="center">ReplayAI</h1>

<p align="center">
  <strong>AI-powered interview preparation — from application to interview-ready.</strong>
</p>

<p align="center">
  <a href="https://www.replayai.app"><strong>🌐 Live Demo → replayai.app</strong></a>
</p>

<p align="center">
  <a href="#product-overview">Overview</a> ·
  <a href="#why-replayai">Why ReplayAI</a> ·
  <a href="#core-features">Features</a> ·
  <a href="#how-it-works">How It Works</a> ·
  <a href="#tech-stack">Tech Stack</a> ·
  <a href="#local-development">Development</a> ·
  <a href="#roadmap">Roadmap</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active%20development-orange?style=flat-square" alt="Active Development" />
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

---

## Product Overview

Job seekers juggle résumé tweaks, scattered practice tools, and generic AI prompts — none of which know the specific role they're targeting. **ReplayAI** brings the full interview prep workflow into one connected workspace.

Upload your résumé, add a job description, and work through fit analysis, tailored application materials, personalized practice questions, recorded answers, and structured AI coaching. Every step builds on the last, so feedback is grounded in *your* experience and *this* opportunity — not a blank chat window.

> 🚧 **Active Development** — ReplayAI is live at [replayai.app](https://www.replayai.app) with core Job Prep and practice workflows shipping regularly. APIs and pricing may change.

---

## Why ReplayAI?

**The hiring problem:** Candidates prepare in fragments. They rewrite résumés in one tool, brainstorm answers in a chatbot, and record practice sessions somewhere else. Nothing connects their materials to their performance, and nothing tracks whether they're actually improving.

**What makes ReplayAI different:**

| Standalone tools | ReplayAI |
|---|---|
| Generic résumé builders | Fit analysis tied to a specific job posting |
| One-size-fits-all question banks | Questions generated from your résumé and JD |
| Self-review with no structure | 8-dimension answer ratings with coaching tips |
| Recordings lost in camera roll | Synced replay, transcripts, bookmarks, and notes |

ReplayAI isn't a chatbot with an interview skin. It's an end-to-end preparation platform where every feature — from keyword gap analysis to answer scoring — is connected to the role you're pursuing.

---

## Core Features

Everything listed below is **implemented and available today**.

### Understand your fit
- **Résumé ↔ job description analysis** — Match score, keyword gaps, weak sections, and prioritized recommendations
- **Tailored résumé generation** — Role-specific drafts grounded in your existing experience (no fabricated credentials)

### Practice with purpose
- **Personalized interview questions** — Behavioral, technical, résumé-specific, and role-fit questions
- **Video & audio recording** — Browser-based capture tied to Job Prep questions or quick practice sessions
- **Session replay** — Playback with signed media URLs, timeline scrubbing, and bookmark navigation

### Improve with coaching
- **AI-powered feedback** — Session summaries, scoring, action items, and per-answer ratings across 8 dimensions
- **Transcript editing** — OpenAI auto-transcription plus manual paste, search, and highlight
- **Notes & bookmarks** — Timestamped bookmarks with millisecond precision and session-level notes

### Stay organized
- **Dashboard analytics** — Session counts, practice minutes, and preparation trends
- **Share links** — Secure, read-only public views for practice answers
- **Secure authentication** — Email/password with confirmation and password reset; OAuth via Google, GitHub, and LinkedIn
- **Responsive UI** — Mobile-friendly layout with dark mode support

---

## How It Works

```
Upload Résumé  →  Add Job Description  →  Analyze Fit  →  Generate Tailored Résumé
       →  Generate Questions  →  Practice Interview  →  Receive AI Feedback  →  Improve
```

| Step | What you do | What you get |
|:---:|---|---|
| 1 | Upload your résumé (PDF, DOCX, or text) | Parsed experience ready for analysis |
| 2 | Paste the target job description | Role requirements stored in your workspace |
| 3 | Run fit analysis | Match score, gaps, and what to emphasize |
| 4 | Generate a tailored résumé | Role-specific draft highlighting your strongest evidence |
| 5 | Generate interview questions | Focused practice set from your materials |
| 6 | Record video or audio answers | Responses tied to each question |
| 7 | Receive AI coaching | Structured ratings and actionable next steps |
| 8 | Review & iterate | Replay sessions, edit transcripts, bookmark moments, practice again |

Each job opportunity gets its own **Job Prep workspace** — no switching tools, no starting over.

---

## Screenshots

> Replace the placeholders below with real captures when available.

| Dashboard | Job Prep Workspace |
|:---:|:---:|
| *Screenshot placeholder* | *Screenshot placeholder* |
| Session overview, stats, and quick actions | Fit analysis → tailored résumé → questions |

| Session Replay | AI Coaching |
|:---:|:---:|
| *Screenshot placeholder* | *Screenshot placeholder* |
| Synced media, transcript, and bookmarks | 8-dimension answer ratings and tips |

---

## Tech Stack

### Frontend
- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS v4** · **shadcn/ui** · **TanStack React Query**

### Backend
- **Next.js Server Actions** for data mutations
- **Supabase Edge Functions** (Deno) for AI workloads

### Database
- **PostgreSQL** via Supabase with Row Level Security (RLS)

### Storage
- **Supabase Storage** (`replays` bucket) for audio and video recordings

### AI
- **OpenAI** (`gpt-4o-mini`, `gpt-4o-transcribe`) invoked from Supabase Edge Functions

### Authentication
- **Supabase Auth** — email/password, Google, GitHub, LinkedIn OIDC
- **Cloudflare Turnstile** CAPTCHA on signup and password reset

### Deployment
- **Vercel** — Next.js frontend
- **Supabase** — database, auth, storage, and edge functions

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     Next.js App (Vercel)                     │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────────────┐ │
│  │  App Router  │→ │ Server Actions │→ │ Client Components  │ │
│  │  (pages)     │  │  (data layer)  │  │ (recorders, player)│ │
│  └──────────────┘  └───────────────┘  └────────────────────┘ │
└────────────────────────────┬─────────────────────────────────┘
                             │
           ┌─────────────────┼─────────────────┐
           ▼                 ▼                 ▼
     Supabase Auth    Supabase Postgres   Supabase Storage
     (OAuth, email)   (RLS-protected)     (recordings)
                             │
                             ▼
                Supabase Edge Functions
                ┌─────────────────────────────────┐
                │ ai_run_job_prep_analysis        │
                │ ai_run_job_prep_tailored_resume │
                │ ai_run_job_prep_interview_quest.│
                │ ai_run_job_prep_answer_rating   │
                │ ai_run_job (transcript, summary,│
                │            score, action_items) │
                └─────────────────────────────────┘
                             │
                             ▼
                          OpenAI
```

| Directory | Purpose |
|---|---|
| `app/` | Pages, layouts, auth route handlers |
| `app/actions/` | Server Actions — sessions, job prep, transcripts, shares, stats |
| `app/job-prep/` | Job Prep workflow (analysis → résumé → questions → answers) |
| `app/sessions/` | Practice session list, recording, and replay |
| `components/` | UI — recorders, players, job prep panels, auth forms |
| `lib/supabase/` | Browser/server Supabase clients and storage helpers |
| `supabase/functions/` | Deno edge functions for all AI workloads |
| `supabase/` | SQL schema and migrations |
| `proxy.ts` | Auth proxy — session refresh, route protection, security headers |

**Data flow:** UI → Server Action → Supabase (RLS check) → Postgres / Storage → response → UI update. AI jobs are queued and processed asynchronously by edge functions.

---

## Local Development

### Prerequisites

- Node.js 18.17+
- npm, yarn, or pnpm
- A [Supabase](https://supabase.com/) project
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for edge function deployment)

### Installation

```bash
git clone https://github.com/mwaywithwords/Interview-Replay-App.git
cd Interview-Replay-App
npm install
```

### Environment setup

Create `.env.local` in the project root (see [Environment Variables](#environment-variables) below).

Apply database migrations via the Supabase SQL Editor — start with `supabase/schema.sql`, then run remaining migrations in order.

### Deploy edge functions

AI features require Supabase Edge Functions with an OpenAI API key:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF

supabase functions deploy ai_run_job
supabase functions deploy ai_run_job_prep_analysis
supabase functions deploy ai_run_job_prep_tailored_resume
supabase functions deploy ai_run_job_prep_interview_questions
supabase functions deploy ai_run_job_prep_answer_rating
```

Set `OPENAI_API_KEY` in your Supabase project's Edge Function secrets.

### Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

---

## Environment Variables

Never commit secrets. Use `.env.local` for local development and your hosting provider's dashboard for production.

### Next.js (`.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous (public) key |
| `NEXT_PUBLIC_APP_URL` | Application URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_SITE_URL` | Site URL for auth redirects |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret key |

### Supabase Edge Function secrets

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key for AI workloads |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |

---

## Deployment

ReplayAI deploys on **Vercel** (frontend) with **Supabase** handling auth, database, storage, and edge functions.

1. Push the repository to GitHub and import the project in [Vercel](https://vercel.com/)
2. Set all Next.js environment variables in the Vercel project settings
3. Apply database migrations in the Supabase SQL Editor
4. Deploy edge functions via the Supabase CLI (see [Local Development](#local-development))
5. Configure Supabase **Authentication → URL Configuration** with production redirect URLs:
   - `https://www.replayai.app/auth/callback`
   - `https://www.replayai.app/auth/confirm`
   - `https://www.replayai.app/auth/reset-password`
6. Enable OAuth providers (Google, GitHub, LinkedIn) in Supabase and add credentials from each provider's developer console

**Production:** [https://www.replayai.app](https://www.replayai.app)

---

## Roadmap

The following features are **planned** and not yet implemented:

- [ ] **Mock interview avatars** — Practice with simulated interviewers
- [ ] **AI coaching improvements** — Deeper, more contextual feedback loops
- [ ] **Team accounts** — Shared prep workspaces for cohorts and coaches
- [ ] **Recruiter dashboard** — Hiring-side visibility into candidate preparation
- [ ] **Mobile application** — Native iOS and Android experience

---

## License

This repository does not currently include a LICENSE file. All rights reserved.

---

<p align="center">
  Built with ❤️ for job seekers who want to walk into every interview prepared.<br/>
  <a href="https://www.replayai.app">replayai.app</a>
</p>
