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
- [ESLint](https://eslint.org/) - Code linting
- [Prettier](https://prettier.io/) - Code formatting

## Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm

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

3. **Run the development server**

   ```bash
   npm run dev
   ```

4. **Open in browser**

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
│   └── dashboard/
│       └── page.tsx        # Dashboard page (/dashboard)
├── components/
│   └── ui/                 # shadcn/ui components
│       ├── button.tsx
│       └── card.tsx
├── lib/
│   └── utils.ts            # Utility functions (cn helper)
├── types/
│   └── index.ts            # TypeScript type definitions
├── docs/                   # Documentation
├── public/                 # Static assets
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero and feature overview |
| `/dashboard` | Protected dashboard with feature cards |

## Authentication

The dashboard currently uses a placeholder authentication check. This is a temporary implementation for development purposes.

**TODO:** Replace with Supabase Auth

```typescript
// Current placeholder in app/dashboard/page.tsx
const isAuthenticated = true; // Replace with actual auth check
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

- [ ] Integrate Supabase Auth for user authentication
- [ ] Implement mock interview functionality
- [ ] Build replay viewer for past sessions
- [ ] Create trading journal with analytics
- [ ] Add performance dashboards and metrics

## License

MIT
