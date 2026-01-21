# Interview Replay

Review your performance like game film. An all-in-one platform for professionals preparing for interviews and traders who want to track their performance with precision.

## Features

- **Mock Interviews** - Practice with AI-powered interview questions tailored to your target role
- **Replay Sessions** - Watch your past interviews, spot patterns, and track improvement
- **Trading Journal** - Log trades, analyze decisions, and review performance metrics

## Tech Stack

- [Next.js 16](https://nextjs.org/) - React framework with App Router
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Tailwind CSS v4](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Re-usable component library
- [Supabase](https://supabase.com/) - Backend-as-a-Service (Auth, Database)
- [ESLint](https://eslint.org/) - Code linting
- [Prettier](https://prettier.io/) - Code formatting

## Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm

## Environment Variables

Create a `.env.local` file in the root of the project with the following variables:

```bash
# Supabase Configuration
# Get these values from your Supabase project settings: https://app.supabase.com/project/_/settings/api

# Your Supabase project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Your Supabase anon/public key (safe to expose in browser)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### How to get your Supabase credentials:

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project or select an existing one
3. Navigate to **Project Settings** → **API**
4. Copy the **Project URL** for `NEXT_PUBLIC_SUPABASE_URL`
5. Copy the **anon public** key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Getting Started

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd "Interview Replay App"
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the example above and create a `.env.local` file with your Supabase credentials.

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open in browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## Project Structure

```
Interview Replay App/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page (/)
│   ├── globals.css         # Global styles + Tailwind
│   ├── auth/
│   │   ├── signin/
│   │   │   └── page.tsx    # Sign in page (/auth/signin)
│   │   ├── signup/
│   │   │   └── page.tsx    # Sign up page (/auth/signup)
│   │   ├── callback/
│   │   │   └── route.ts    # OAuth callback handler
│   │   └── signout/
│   │       └── route.ts    # Sign out handler
│   └── dashboard/
│       ├── page.tsx        # Protected dashboard (/dashboard)
│       └── dashboard-features.tsx
├── components/
│   └── ui/                 # shadcn/ui components
│       ├── button.tsx
│       └── card.tsx
├── lib/
│   ├── utils.ts            # Utility functions (cn helper)
│   └── supabase/
│       ├── client.ts       # Browser Supabase client
│       └── server.ts       # Server Supabase client + requireUser helper
├── middleware.ts           # Supabase session refresh middleware
├── types/
│   └── index.ts            # TypeScript type definitions
├── docs/                   # Documentation
├── public/                 # Static assets
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero and feature overview |
| `/auth/signin` | Sign in page |
| `/auth/signup` | Sign up page |
| `/auth/callback` | OAuth callback handler |
| `/auth/signout` | Sign out handler (POST) |
| `/dashboard` | Protected dashboard with feature cards |

## Authentication

Authentication is handled by [Supabase Auth](https://supabase.com/docs/guides/auth) using the `@supabase/ssr` package.

### Key files:

- `lib/supabase/client.ts` - Browser-side Supabase client for client components
- `lib/supabase/server.ts` - Server-side Supabase client with `requireUser` helper
- `middleware.ts` - Refreshes auth session on every request

### Protecting routes:

Use the `requireUser` helper in Server Components to protect routes:

```typescript
import { requireUser } from '@/lib/supabase/server';

export default async function ProtectedPage() {
  // Redirects to /auth/signin if not authenticated
  const user = await requireUser();
  
  return <div>Welcome, {user.email}</div>;
}
```

### Client-side auth:

For client components, use the browser client:

```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
```

## Development

### Adding shadcn/ui Components

```bash
npx shadcn@latest add <component-name>
```

### Formatting Code

```bash
npm run format
```

### Linting

```bash
npm run lint
```

## Supabase Edge Functions

This project uses Supabase Edge Functions for processing AI jobs. The `ai_run_job` function handles job execution with placeholder outputs (real AI integration coming soon).

### Prerequisites

1. **Install Supabase CLI**

   ```bash
   # macOS with Homebrew
   brew install supabase/tap/supabase

   # Windows with Scoop
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase

   # npm (all platforms)
   npm install -g supabase
   ```

   Verify installation:
   ```bash
   supabase --version
   ```

2. **Login to Supabase**

   ```bash
   supabase login
   ```

### Linking Your Project

1. **Get your project reference ID** from the Supabase Dashboard:
   - Go to [Supabase Dashboard](https://app.supabase.com/)
   - Select your project
   - Navigate to **Project Settings** → **General**
   - Copy the **Reference ID** (e.g., `abcdefghijklmnop`)

2. **Link your local project**

   ```bash
   cd "Interview Replay App"
   supabase link --project-ref YOUR_PROJECT_REF
   ```

### Deploying the ai_run_job Function

1. **Deploy the function**

   ```bash
   supabase functions deploy ai_run_job
   ```

2. **Verify deployment**

   Check the Supabase Dashboard under **Edge Functions** to confirm the function is deployed and active.

### Required Environment Variables

The Edge Function uses these environment variables (automatically set by Supabase):

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL (auto-set) |
| `SUPABASE_ANON_KEY` | Anonymous/public API key (auto-set) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for admin operations (auto-set) |

No additional configuration is required as these are automatically available in Edge Functions.

### How Next.js Calls the Function

The Edge Function is invoked from the Next.js server action in `app/actions/ai-jobs.ts`:

```typescript
// The runAIJob server action uses Supabase's functions.invoke()
const { data, error } = await supabase.functions.invoke('ai_run_job', {
  body: { job_id: jobId },
});
```

The authentication flow:
1. User is authenticated via Supabase Auth in the browser
2. Next.js server action uses `createClient()` which includes the user's session
3. The Edge Function receives the Authorization header automatically
4. Edge Function validates the JWT and extracts the user ID
5. Job ownership is verified before processing

### Local Development

To test Edge Functions locally:

```bash
# Start local Supabase services (requires Docker)
supabase start

# Serve functions locally
supabase functions serve ai_run_job --env-file .env.local
```

Add these to your `.env.local` for local function testing:
```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Function Behavior

The `ai_run_job` function:

1. **Validates authentication** - Returns 401 if no valid JWT
2. **Verifies ownership** - Returns 403 if job doesn't belong to user
3. **Updates job status** to `processing`
4. **Creates placeholder output** in `ai_outputs` table
5. **Updates job status** to `completed`
6. **Returns** `{ job_id, status: "completed" }`

Placeholder outputs are generated based on job type:
- `summary`: Includes summary text, bullet points, and confidence score
- `transcript`: Includes formatted transcript text
- `score`: Includes numeric score with rubric breakdown
- `suggest_bookmarks`: Includes array of bookmark suggestions with timestamps

## Roadmap

- [x] Integrate Supabase Auth for user authentication
- [x] Implement AI job queue with Edge Functions
- [ ] Implement mock interview functionality
- [ ] Build replay viewer for past sessions
- [ ] Create trading journal with analytics
- [ ] Add performance dashboards and metrics
- [ ] Integrate real AI providers (OpenAI, Whisper)

## License

MIT
