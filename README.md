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

## Roadmap

- [x] Integrate Supabase Auth for user authentication
- [ ] Implement mock interview functionality
- [ ] Build replay viewer for past sessions
- [ ] Create trading journal with analytics
- [ ] Add performance dashboards and metrics

## License

MIT
