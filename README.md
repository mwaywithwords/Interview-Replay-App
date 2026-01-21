<p align="center">
  <img src="docs/logo-placeholder.png" alt="Replay.ai Logo" width="120" height="120" />
</p>

<h1 align="center">Replay.ai</h1>

<p align="center">
  <strong>Review your performance like game film.</strong><br/>
  Practice interviews, replay sessions, and sharpen your skills with AI-powered analysis.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#screenshots">Screenshots</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#roadmap">Roadmap</a>
</p>

---

## What is Replay.ai?

Replay.ai is an all-in-one platform for professionals preparing for interviews and traders tracking performance with precision. Record mock interview sessions, replay them at any time, bookmark important moments, add notes, and get AI-powered insights to improve your performance.

Whether you're preparing for a big tech interview or analyzing your trading decisions, Replay.ai helps you identify patterns, track improvement, and perform at your best.

## Features

### Core Features (Current)

- **Session Recording** — Record audio or video sessions directly in the browser
- **Session Replay** — Watch or listen to past sessions with full playback controls
- **Bookmarks** — Mark important moments with timestamps for quick navigation
- **Notes** — Add personal notes to sessions and individual bookmarks
- **Transcripts** — Paste and search through session transcripts with highlighting
- **AI Actions** — Queue AI jobs for transcription, summarization, scoring, and bookmark suggestions
- **Share Links** — Generate secure, read-only share links for sessions
- **Dashboard** — Track your practice sessions with stats and filtering
- **Dark Mode** — Full dark mode support throughout the app
- **Session Types** — Support for both Interview and Trading session types
- **Company & Symbol Tracking** — Organize sessions by target company or trading symbol

### Production Features

- **Toast Notifications** — Real-time feedback for all user actions
- **Error Boundaries** — Graceful error handling that doesn't crash the app
- **Optimistic Updates** — Instant UI feedback for bookmark operations
- **Skeleton Loading** — Smooth loading states throughout the app

## Screenshots

> Screenshots coming soon. Below are placeholder images for key screens.

### Dashboard
![Dashboard](docs/screenshots/dashboard-placeholder.png)
*View all your sessions, filter by type, and track your practice stats.*

### Session Replay
![Session Replay](docs/screenshots/replay-placeholder.png)
*Full playback controls with synchronized bookmarks, transcripts, and notes.*

### AI Actions
![AI Actions](docs/screenshots/ai-actions-placeholder.png)
*Queue AI jobs to analyze your sessions and get actionable feedback.*

### Dark Mode
![Dark Mode](docs/screenshots/dark-mode-placeholder.png)
*Beautiful dark mode throughout the entire application.*

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | [Next.js 16](https://nextjs.org/) with App Router |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Components** | [shadcn/ui](https://ui.shadcn.com/) |
| **Backend** | [Supabase](https://supabase.com/) (Auth, Database, Storage, Edge Functions) |
| **State Management** | [TanStack React Query](https://tanstack.com/query) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Linting** | [ESLint](https://eslint.org/) |
| **Formatting** | [Prettier](https://prettier.io/) |

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm
- A [Supabase](https://supabase.com/) account

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/replay-ai.git
   cd replay-ai
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```bash
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   
   # Optional: App URL for share links
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

   Get your Supabase credentials from the [Supabase Dashboard](https://app.supabase.com/) under **Project Settings** → **API**.

4. **Set up the database**

   Run the migrations in the `supabase/` folder in order:
   
   ```
   schema.sql
   migration_add_recording_type.sql
   migration_add_bookmark_ms.sql
   migration_add_grouping_entities.sql
   migration_add_notes.sql
   migration_add_transcripts.sql
   migration_add_share_tokens.sql
   migration_ai_jobs_plumbing.sql
   migration_fix_single_recording_constraint.sql
   ```

5. **Deploy Edge Functions (optional)**

   If using AI features, deploy the Edge Functions:

   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase functions deploy ai_run_job
   ```

6. **Run the development server**

   ```bash
   npm run dev
   ```

7. **Open the app**

   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## Architecture

### Project Structure

```
replay-ai/
├── app/                        # Next.js App Router pages
│   ├── actions/                # Server Actions for data mutations
│   ├── auth/                   # Authentication pages and handlers
│   ├── dashboard/              # Main dashboard page
│   ├── sessions/               # Session pages (list, detail, new)
│   ├── share/                  # Public share view pages
│   ├── error.tsx               # Route-level error boundary
│   ├── global-error.tsx        # Global error boundary
│   └── layout.tsx              # Root layout with providers
├── components/
│   ├── auth/                   # Authentication components
│   ├── dashboard/              # Dashboard-specific components
│   ├── layout/                 # Layout components (AppShell, PageHeader)
│   ├── providers/              # React context providers
│   ├── sessions/               # Session-related components
│   ├── share/                  # Shared view components
│   └── ui/                     # shadcn/ui components
├── lib/
│   ├── hooks/                  # Custom React hooks
│   ├── supabase/               # Supabase client configuration
│   └── utils.ts                # Utility functions
├── supabase/
│   ├── functions/              # Edge Functions
│   └── *.sql                   # Database migrations
└── types/                      # TypeScript type definitions
```

### Supabase Schema Overview

| Table | Purpose |
|-------|---------|
| `sessions` | Core session data (title, status, recording paths, metadata) |
| `bookmarks` | Timestamped bookmarks within sessions |
| `bookmark_notes` | Notes attached to individual bookmarks |
| `session_notes` | General notes for a session |
| `transcripts` | Session transcript text |
| `session_shares` | Share tokens for public session access |
| `ai_jobs` | AI job queue (transcription, summary, scoring, etc.) |
| `ai_outputs` | AI job results |
| `companies` | Target companies for interview sessions |
| `symbols` | Trading symbols for trading sessions |
| `session_companies` | Many-to-many: sessions ↔ companies |
| `session_symbols` | Many-to-many: sessions ↔ symbols |

### Authentication Flow

1. User signs in/up via Supabase Auth
2. Middleware refreshes session on every request
3. Server components use `requireUser()` to protect routes
4. Client components use `createClient()` for auth state
5. Row Level Security (RLS) policies enforce data access

### Data Flow

```
User Action → Server Action → Supabase → Database
                    ↓
              RLS Policy Check
                    ↓
              Response → UI Update
```

## Roadmap

### Coming Soon

- [ ] **Real AI Transcription** — Integrate Whisper/AssemblyAI for automatic transcription
- [ ] **AI Scoring** — Performance scoring with detailed rubric breakdowns
- [ ] **AI Summaries** — Automatic session summaries with key takeaways
- [ ] **Bookmark Suggestions** — AI-detected important moments
- [ ] **Performance Analytics** — Track improvement over time with charts
- [ ] **Team Collaboration** — Share sessions with team members for feedback

### Future Considerations

- [ ] Mobile app (React Native)
- [ ] Calendar integration for scheduling practice
- [ ] Custom rubrics for scoring
- [ ] Export to PDF/video
- [ ] Webhooks for external integrations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Use TypeScript for all new code
- Follow the existing code style (Prettier handles formatting)
- Write meaningful commit messages
- Add tests for new features when applicable
- Update documentation as needed

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ for interviewers and traders who want to level up their game.
</p>
