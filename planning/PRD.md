# Product Requirements Document (PRD)
## ReplayAI - Interview & Performance Review Platform

**Version:** 1.0  
**Last Updated:** January 21, 2026  
**Status:** Active Development

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision](#2-product-vision)
3. [Target Audience](#3-target-audience)
4. [Problem Statement](#4-problem-statement)
5. [Product Goals & Success Metrics](#5-product-goals--success-metrics)
6. [Feature Requirements](#6-feature-requirements)
7. [Technical Architecture](#7-technical-architecture)
8. [Data Model](#8-data-model)
9. [User Flows](#9-user-flows)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [Future Roadmap](#11-future-roadmap)
12. [Appendix](#12-appendix)

---

## 1. Executive Summary

**ReplayAI** is a web-based platform that enables professionals to record, replay, and analyze their practice sessions—whether for job interviews or trading performance reviews. The application provides comprehensive tools for session recording (audio/video), timestamped bookmarking, note-taking, transcription, and AI-powered analysis to help users identify patterns, track improvement, and perform at their best.

### Core Value Proposition

> "Review your performance like game film."

Just as athletes review game footage to improve, ReplayAI gives professionals the tools to record practice sessions, replay them at any time, bookmark important moments, add notes, and receive AI-powered insights to continuously improve their performance.

---

## 2. Product Vision

### Mission Statement

To empower professionals preparing for high-stakes situations—job interviews, trading decisions, presentations—with the tools to systematically review, analyze, and improve their performance through deliberate practice.

### Long-term Vision

Become the go-to platform for professional performance improvement, expanding beyond interviews and trading to support presentations, sales calls, negotiations, and any scenario where recorded self-review can drive improvement.

---

## 3. Target Audience

### Primary User Personas

#### 3.1 Interview Candidate ("Alex")
- **Demographics:** 25-40 years old, job seekers or career changers
- **Goals:** 
  - Prepare effectively for technical and behavioral interviews
  - Identify speaking patterns and habits (filler words, pacing)
  - Build confidence through repeated practice
- **Pain Points:**
  - No objective way to review interview practice
  - Difficult to remember what went well or poorly
  - No structured approach to improvement

#### 3.2 Active Trader ("Jordan")
- **Demographics:** 25-55 years old, day traders or swing traders
- **Goals:**
  - Review trading decisions and thought processes
  - Identify emotional patterns affecting decisions
  - Track improvement over time
- **Pain Points:**
  - Decisions happen fast; hard to remember reasoning
  - No way to replay thought process during trades
  - Difficult to identify recurring mistakes

### Secondary Users

- **Career Coaches:** May view shared sessions to provide feedback
- **Trading Mentors:** Review student trader sessions for coaching
- **HR/Recruiting Teams:** Potential use for interview training

---

## 4. Problem Statement

### Current Challenges

1. **No Replay Mechanism:** Professionals practice interviews or review trades but cannot replay their actual performance
2. **Memory Limitations:** Key moments and insights are forgotten shortly after practice
3. **Lack of Objective Analysis:** Self-assessment is biased; no data-driven feedback
4. **Unstructured Improvement:** No systematic way to track progress over time
5. **Isolated Practice:** Difficult to share practice sessions for feedback from mentors

### Opportunity

By providing a comprehensive recording, replay, and analysis platform, ReplayAI addresses all these challenges in a single integrated solution.

---

## 5. Product Goals & Success Metrics

### Primary Goals

| Goal | Description | Metric |
|------|-------------|--------|
| **User Engagement** | Users actively record and review sessions | Sessions per user per week |
| **Feature Adoption** | Users leverage AI features for analysis | AI jobs executed per session |
| **Retention** | Users return regularly for practice | Weekly active users (WAU) |
| **Value Delivery** | Users report improvement | User satisfaction score |

### Key Performance Indicators (KPIs)

- **Session Metrics:**
  - Total sessions created
  - Sessions with recordings uploaded
  - Average session duration
  - Sessions per user per month

- **Engagement Metrics:**
  - Bookmarks created per session
  - Notes added per session
  - AI jobs executed per session
  - Share links generated

- **Retention Metrics:**
  - Daily/Weekly/Monthly active users
  - User churn rate
  - Time to first session
  - Sessions before drop-off

---

## 6. Feature Requirements

### 6.1 Core Features (Implemented)

#### 6.1.1 User Authentication
| Requirement | Priority | Status |
|-------------|----------|--------|
| Email/password signup | P0 | ✅ Complete |
| Email/password signin | P0 | ✅ Complete |
| Session management via Supabase Auth | P0 | ✅ Complete |
| Automatic profile creation on signup | P0 | ✅ Complete |
| Protected routes via middleware | P0 | ✅ Complete |

**Technical Details:**
- Supabase Auth integration with SSR
- Middleware refreshes session on every request
- Row Level Security (RLS) enforces data access

#### 6.1.2 Session Management
| Requirement | Priority | Status |
|-------------|----------|--------|
| Create new sessions | P0 | ✅ Complete |
| Session types: Interview, Trading | P0 | ✅ Complete |
| Recording types: Audio, Video | P0 | ✅ Complete |
| Session status workflow | P0 | ✅ Complete |
| Edit session metadata | P1 | ✅ Complete |
| Delete sessions | P1 | ✅ Complete |
| Session context/prompt field | P1 | ✅ Complete |

**Session Status Flow:**
```
draft → recording → recorded → processing → ready → archived
```

**Session Metadata:**
- Title (required)
- Description (optional)
- Session type (interview/trading)
- Recording type (audio/video)
- Context/prompt
- Tags (array)
- Company association (for interviews)
- Symbol association (for trading)

#### 6.1.3 Audio/Video Recording
| Requirement | Priority | Status |
|-------------|----------|--------|
| In-browser audio recording | P0 | ✅ Complete |
| In-browser video recording | P0 | ✅ Complete |
| Upload to Supabase Storage | P0 | ✅ Complete |
| Recording metadata capture | P0 | ✅ Complete |
| Secure signed URLs for playback | P0 | ✅ Complete |

**Storage Details:**
- Bucket: `replays` (private)
- Path format: `{user_id}/{session_id}/audio.webm` or `video.webm`
- File size limit: 100MB
- Supported formats: webm, mp4, wav, mpeg (audio); webm, mp4, quicktime (video)

#### 6.1.4 Session Playback
| Requirement | Priority | Status |
|-------------|----------|--------|
| Audio player with controls | P0 | ✅ Complete |
| Video player with controls | P0 | ✅ Complete |
| Seek to timestamp | P0 | ✅ Complete |
| Playback speed control | P1 | ✅ Complete |
| Waveform visualization (audio) | P2 | 🔄 Planned |

#### 6.1.5 Bookmarks
| Requirement | Priority | Status |
|-------------|----------|--------|
| Create bookmarks with timestamps | P0 | ✅ Complete |
| Bookmark labels | P0 | ✅ Complete |
| Bookmark categories | P1 | ✅ Complete |
| Jump to bookmark (seek media) | P0 | ✅ Complete |
| Edit bookmarks | P1 | ✅ Complete |
| Delete bookmarks | P1 | ✅ Complete |
| Optimistic UI updates | P1 | ✅ Complete |

**Bookmark Categories:**
- General
- Question
- Answer
- Highlight
- Issue
- Follow-up

#### 6.1.6 Notes
| Requirement | Priority | Status |
|-------------|----------|--------|
| Session-level notes (single per session) | P0 | ✅ Complete |
| Auto-save with debouncing | P1 | ✅ Complete |
| Markdown support | P2 | 🔄 Planned |
| Bookmark-level notes | P1 | ✅ Complete |

#### 6.1.7 Transcripts
| Requirement | Priority | Status |
|-------------|----------|--------|
| Manual transcript entry/paste | P0 | ✅ Complete |
| Transcript search/highlighting | P1 | ✅ Complete |
| AI-generated transcripts | P1 | 🔄 Partial |
| Speaker labels | P2 | 🔄 Planned |
| Timestamp alignment | P2 | 🔄 Planned |

#### 6.1.8 AI Actions
| Requirement | Priority | Status |
|-------------|----------|--------|
| AI job queue system | P0 | ✅ Complete |
| Generate Transcript | P1 | ✅ Complete |
| Generate Summary | P1 | ✅ Complete |
| Score Session | P1 | ✅ Complete |
| Suggest Bookmarks | P1 | ✅ Complete |
| Job status tracking | P0 | ✅ Complete |
| Cancel/Retry jobs | P1 | ✅ Complete |
| View AI outputs | P0 | ✅ Complete |

**AI Job Types:**
| Type | Description | Output |
|------|-------------|--------|
| `transcript` | Transcribe audio/video to text | Full transcript text |
| `summary` | Generate session summary | Summary + bullet points |
| `score` | Performance scoring with rubric | Score (0-100) + rubric breakdown |
| `suggest_bookmarks` | Auto-detect key moments | Array of suggested bookmarks |

**Job Status Flow:**
```
queued → processing → completed/failed/cancelled
```

#### 6.1.9 Session Sharing
| Requirement | Priority | Status |
|-------------|----------|--------|
| Generate unique share tokens | P0 | ✅ Complete |
| Secure read-only share view | P0 | ✅ Complete |
| Copy share link to clipboard | P1 | ✅ Complete |
| Revoke share links | P1 | ✅ Complete |
| View active share links | P1 | ✅ Complete |
| Expiration dates | P2 | 🔄 Planned |
| Password protection | P2 | 🔄 Planned |

**Shared View Includes:**
- Session title and metadata
- Media player (audio/video)
- Transcript (read-only)
- Bookmarks (read-only)
- Notes (read-only)

#### 6.1.10 Dashboard
| Requirement | Priority | Status |
|-------------|----------|--------|
| Sessions list with pagination | P0 | ✅ Complete |
| Stats cards (total sessions, etc.) | P1 | ✅ Complete |
| Filter by session type | P1 | ✅ Complete |
| Search sessions | P2 | 🔄 Planned |
| Sort options | P2 | 🔄 Planned |

#### 6.1.11 Grouping Entities
| Requirement | Priority | Status |
|-------------|----------|--------|
| Companies (for interview sessions) | P1 | ✅ Complete |
| Symbols (for trading sessions) | P1 | ✅ Complete |
| Associate sessions with entities | P1 | ✅ Complete |
| Create entities on-the-fly | P1 | ✅ Complete |

### 6.2 User Interface Requirements

#### 6.2.1 Design System
- **Component Library:** shadcn/ui (Radix UI primitives)
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React
- **Theme:** Light/Dark mode support via next-themes

#### 6.2.2 Key UI Components
| Component | Description |
|-----------|-------------|
| `AppShell` | Main layout with navigation |
| `PageHeader` | Consistent page headers with actions |
| `SectionCard` | Grouped content containers |
| `EmptyState` | Empty states with icons and CTAs |
| `Badge` | Status indicators (success, warning, etc.) |
| `Dialog` | Modal dialogs for confirmations/forms |
| `Tabs` | Tabbed content navigation |
| `Skeleton` | Loading state placeholders |

#### 6.2.3 Toast Notifications
- Success/error/info notifications via Sonner
- Real-time feedback for all user actions

#### 6.2.4 Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Optimized layouts for each breakpoint

---

## 7. Technical Architecture

### 7.1 Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **UI Components** | shadcn/ui (Radix primitives) |
| **State Management** | TanStack React Query |
| **Backend** | Supabase (PostgreSQL + Edge Functions) |
| **Authentication** | Supabase Auth |
| **Storage** | Supabase Storage |
| **Notifications** | Sonner |

### 7.2 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Next.js App Router                      │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │  │
│  │  │  Pages      │  │ Components  │  │ Server Actions  │  │  │
│  │  │  (RSC)      │  │ (Client)    │  │                 │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Supabase                                 │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐    │
│  │   Auth    │  │  Database │  │  Storage  │  │   Edge    │    │
│  │           │  │ (Postgres)│  │ (S3-like) │  │ Functions │    │
│  └───────────┘  └───────────┘  └───────────┘  └───────────┘    │
│                       │                              │          │
│                       ▼                              ▼          │
│              Row Level Security              AI Job Processing  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Project Structure

```
replay-ai/
├── app/                        # Next.js App Router pages
│   ├── actions/                # Server Actions for data mutations
│   │   ├── ai-jobs.ts         # AI job CRUD operations
│   │   ├── bookmarks.ts       # Bookmark CRUD operations
│   │   ├── companies.ts       # Company management
│   │   ├── notes.ts           # Notes management
│   │   ├── sessions.ts        # Session CRUD operations
│   │   ├── shares.ts          # Share link management
│   │   ├── stats.ts           # Dashboard statistics
│   │   ├── storage.ts         # File upload/download
│   │   ├── symbols.ts         # Symbol management
│   │   └── transcripts.ts     # Transcript management
│   ├── auth/                   # Authentication pages
│   │   ├── signin/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── signout/route.ts
│   │   └── callback/route.ts
│   ├── dashboard/page.tsx      # Main dashboard
│   ├── sessions/
│   │   ├── [id]/page.tsx      # Session detail view
│   │   └── new/page.tsx       # Create new session
│   ├── share/
│   │   └── [token]/page.tsx   # Public share view
│   ├── error.tsx              # Route error boundary
│   ├── global-error.tsx       # Global error boundary
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Landing page
├── components/
│   ├── auth/                   # Auth-related components
│   ├── dashboard/              # Dashboard components
│   ├── layout/                 # Layout components
│   ├── providers/              # React context providers
│   ├── sessions/               # Session-related components
│   ├── share/                  # Shared view components
│   ├── ui/                     # shadcn/ui components
│   ├── AudioPlayer.tsx
│   ├── AudioRecorder.tsx
│   ├── VideoPlayer.tsx
│   └── VideoRecorder.tsx
├── lib/
│   ├── hooks/                  # Custom React hooks
│   ├── supabase/               # Supabase client configuration
│   └── utils.ts                # Utility functions
├── supabase/
│   ├── functions/              # Edge Functions
│   │   └── ai_run_job/        # AI job processor
│   └── *.sql                   # Database migrations
├── types/
│   └── index.ts                # TypeScript definitions
└── middleware.ts               # Auth middleware
```

### 7.4 Data Flow

```
User Action → Component → Server Action → Supabase
                                ↓
                       RLS Policy Check
                                ↓
                    Database Operation
                                ↓
                       Response
                                ↓
                Component State Update / Router Refresh
                                ↓
                         UI Update
```

### 7.5 Security Model

#### Row Level Security (RLS)
All database tables have RLS enabled with policies that ensure:
- Users can only access their own data
- Shared sessions are accessible via valid share tokens
- Service role bypasses RLS for Edge Functions

#### Authentication Flow
1. User signs in/up via Supabase Auth
2. Middleware refreshes session on every request
3. Server components use `requireUser()` to protect routes
4. Client components use `createClient()` for auth state

---

## 8. Data Model

### 8.1 Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   profiles   │       │   sessions   │       │  bookmarks   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id           │       │ id           │       │ id           │
│ user_id  ────┼───┐   │ user_id  ────┼───┐   │ session_id ──┼───┐
│ email        │   │   │ title        │   │   │ user_id      │   │
│ full_name    │   │   │ status       │   │   │ timestamp_ms │   │
│ ...          │   │   │ recording_   │   │   │ label        │   │
└──────────────┘   │   │   type       │   │   │ category     │   │
                   │   │ audio_*      │   │   └──────────────┘   │
                   │   │ video_*      │   │                      │
                   │   │ metadata     │   │   ┌──────────────┐   │
                   │   │ ...          │   │   │session_notes │   │
                   │   └──────────────┘   │   ├──────────────┤   │
                   │          │           │   │ id           │   │
                   │          │           │   │ session_id ──┼───┤
                   │          ▼           │   │ user_id      │   │
                   │   ┌──────────────┐   │   │ content      │   │
                   │   │ transcripts  │   │   └──────────────┘   │
                   │   ├──────────────┤   │                      │
                   │   │ id           │   │   ┌──────────────┐   │
                   │   │ session_id ──┼───┤   │   ai_jobs    │   │
                   │   │ content      │   │   ├──────────────┤   │
                   │   │ ...          │   │   │ id           │   │
                   │   └──────────────┘   │   │ session_id ──┼───┤
                   │                      │   │ user_id      │   │
                   │   ┌──────────────┐   │   │ job_type     │   │
                   │   │session_shares│   │   │ status       │   │
                   │   ├──────────────┤   │   └──────────────┘   │
                   │   │ id           │   │          │           │
                   │   │ session_id ──┼───┤          ▼           │
                   │   │ share_token  │   │   ┌──────────────┐   │
                   │   │ ...          │   │   │  ai_outputs  │   │
                   │   └──────────────┘   │   ├──────────────┤   │
                   │                      │   │ id           │   │
                   │   ┌──────────────┐   │   │ ai_job_id    │   │
                   │   │  companies   │   │   │ session_id ──┼───┘
                   │   ├──────────────┤   │   │ content      │
                   └───┼─ user_id     │   │   └──────────────┘
                       │ name         │   │
                       └──────────────┘   │
                              ▲           │
                              │           │
                       ┌──────────────┐   │
                       │session_      │   │
                       │ companies    │   │
                       ├──────────────┤   │
                       │ session_id ──┼───┘
                       │ company_id   │
                       └──────────────┘
```

### 8.2 Table Schemas

#### profiles
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | References auth.users |
| email | TEXT | User email |
| full_name | TEXT | Display name |
| avatar_url | TEXT | Profile picture URL |
| company | TEXT | User's company |
| job_title | TEXT | User's role |
| timezone | TEXT | Preferred timezone |
| preferences | JSONB | User preferences |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

#### sessions
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Session owner |
| title | TEXT | Session title |
| description | TEXT | Optional description |
| status | TEXT | draft/recording/recorded/processing/ready/archived |
| recording_type | TEXT | audio/video |
| audio_storage_path | TEXT | Storage path for audio |
| audio_duration_seconds | INTEGER | Audio duration |
| audio_mime_type | TEXT | Audio MIME type |
| audio_file_size_bytes | BIGINT | Audio file size |
| video_storage_path | TEXT | Storage path for video |
| video_duration_seconds | INTEGER | Video duration |
| video_mime_type | TEXT | Video MIME type |
| video_file_size_bytes | BIGINT | Video file size |
| metadata | JSONB | session_type, prompt, etc. |
| tags | TEXT[] | Session tags |
| is_public | BOOLEAN | Public visibility |
| recorded_at | TIMESTAMPTZ | Recording timestamp |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

#### bookmarks
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| session_id | UUID | Parent session |
| user_id | UUID | Bookmark owner |
| timestamp_ms | INTEGER | Timestamp in milliseconds |
| label | TEXT | Bookmark label |
| category | TEXT | general/question/answer/highlight/issue/follow_up |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

#### ai_jobs
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| session_id | UUID | Target session |
| user_id | UUID | Job owner |
| job_type | TEXT | transcript/summary/score/suggest_bookmarks |
| status | TEXT | queued/processing/completed/failed/cancelled |
| provider | TEXT | AI provider used |
| model | TEXT | Model identifier |
| error_message | TEXT | Error details if failed |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

#### ai_outputs
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| ai_job_id | UUID | Parent job |
| session_id | UUID | Associated session |
| user_id | UUID | Output owner |
| output_type | TEXT | transcript/summary/score/etc. |
| content | JSONB | Structured output data |
| created_at | TIMESTAMPTZ | Creation timestamp |

---

## 9. User Flows

### 9.1 New User Onboarding

```
Landing Page → Sign Up → Dashboard (Empty State) → Create First Session
```

1. User visits landing page
2. Clicks "Get Started" / "Sign Up"
3. Fills signup form (email, password)
4. Redirected to dashboard
5. Sees empty state with "New Session" CTA
6. Creates first session

### 9.2 Recording a Session

```
Dashboard → New Session → Configure → Record → Upload → Session Ready
```

1. User clicks "New Session"
2. Fills session details:
   - Title
   - Session type (Interview/Trading)
   - Recording type (Audio/Video)
   - Company/Symbol (optional)
   - Context/Prompt (optional)
3. Clicks "Create Session"
4. Redirected to session detail page
5. Starts recording (audio/video based on type)
6. Stops recording
7. Recording uploads automatically
8. Session status updates to "ready"

### 9.3 Reviewing a Session

```
Dashboard → Session → Play → Bookmark → Note → AI Analysis
```

1. User opens session from dashboard
2. Plays recording (audio/video)
3. Creates bookmarks at key moments
4. Adds notes to session/bookmarks
5. Pastes/generates transcript
6. Queues AI jobs for analysis
7. Reviews AI outputs

### 9.4 Sharing a Session

```
Session Detail → Share → Generate Link → Copy → Share
```

1. User opens session detail
2. Clicks "Share" button
3. Clicks "Generate Share Link"
4. Copies link to clipboard
5. Shares link with reviewer
6. Reviewer opens link (no auth required)
7. Reviewer views session in read-only mode

### 9.5 AI Analysis Flow

```
Session → AI Actions → Queue Job → Processing → View Results
```

1. User opens session with recording
2. Navigates to AI Actions panel
3. Clicks desired analysis type
4. Job is created with "queued" status
5. Clicks "Run" on the job
6. Job status updates to "processing"
7. Edge Function processes the job
8. Job status updates to "completed"
9. User expands to view results

---

## 10. Non-Functional Requirements

### 10.1 Performance

| Requirement | Target |
|-------------|--------|
| Page load time | < 2 seconds |
| Time to interactive | < 3 seconds |
| Media playback start | < 1 second |
| API response time | < 500ms |
| File upload (100MB) | < 60 seconds |

### 10.2 Scalability

- Support 10,000+ concurrent users
- Handle 1TB+ of media storage
- Process 1000+ AI jobs per hour

### 10.3 Availability

- 99.9% uptime SLA (aligned with Supabase)
- Graceful degradation for non-critical features
- Error boundaries to prevent full app crashes

### 10.4 Security

| Requirement | Implementation |
|-------------|----------------|
| Authentication | Supabase Auth (email/password) |
| Authorization | Row Level Security policies |
| Data encryption | TLS in transit, encrypted at rest |
| Secure file access | Signed URLs with expiration |
| Input validation | Server-side validation on all actions |
| XSS prevention | React's built-in escaping |
| CSRF protection | Supabase Auth tokens |

### 10.5 Accessibility

- WCAG 2.1 AA compliance target
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios
- Focus indicators

### 10.6 Browser Support

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

---

## 11. Future Roadmap

### Phase 2: Enhanced AI Features

| Feature | Description |
|---------|-------------|
| Real AI Transcription | Integrate Whisper/AssemblyAI for automatic transcription |
| Advanced Scoring | Detailed rubric-based scoring with specific feedback |
| Improvement Tracking | Track scores over time, show progress charts |
| Custom Rubrics | Allow users to define their own scoring criteria |

### Phase 3: Collaboration

| Feature | Description |
|---------|-------------|
| Team Workspaces | Shared workspaces for teams |
| Comments on Shares | Allow reviewers to add comments |
| Real-time Collaboration | Multiple users viewing/annotating simultaneously |
| Feedback Requests | Send sessions to specific users for feedback |

### Phase 4: Analytics & Insights

| Feature | Description |
|---------|-------------|
| Performance Dashboard | Charts showing improvement over time |
| Pattern Detection | Identify recurring issues across sessions |
| Speaking Analytics | Filler words, pace, sentiment analysis |
| Comparison View | Compare two sessions side-by-side |

### Phase 5: Platform Expansion

| Feature | Description |
|---------|-------------|
| Mobile Apps | iOS and Android native apps |
| Calendar Integration | Schedule practice sessions |
| Export Options | PDF reports, video downloads |
| Webhooks/API | External integrations |
| Custom Domains | White-label support |

---

## 12. Appendix

### 12.1 Glossary

| Term | Definition |
|------|------------|
| **Session** | A recorded practice session (interview or trading) |
| **Bookmark** | A timestamped marker within a session |
| **AI Job** | A queued task for AI processing |
| **AI Output** | The result of a completed AI job |
| **Share Token** | A unique identifier for public session access |
| **RLS** | Row Level Security - Postgres feature for data access control |

### 12.2 Related Documents

- [Storage Setup Guide](../docs/STORAGE_SETUP.md)
- [Database Migrations](../supabase/)
- [Component Documentation](../components/)

### 12.3 Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-21 | System | Initial PRD creation |

---

*This PRD is a living document and should be updated as the product evolves.*
