# Systemize Frontend (Next.js)

This is the frontend web application for Systemize, built with Next.js 14, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: 
  - Server State: TanStack Query (React Query)
  - Client State: Zustand
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: Sonner

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint
pnpm lint

# Type check
pnpm type-check
```

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_AZURE_AD_B2C_TENANT=your-tenant.b2clogin.com
NEXT_PUBLIC_AZURE_AD_B2C_CLIENT_ID=your-client-id
NEXT_PUBLIC_AZURE_AD_B2C_POLICY=B2C_1_signupsignin
NEXT_PUBLIC_APPINSIGHTS_INSTRUMENTATION_KEY=your-key
```

## Project Structure

```
src/
├── app/              # App router pages and layouts
├── components/       # React components
│   ├── ui/          # shadcn/ui components
│   └── features/    # Feature-specific components
├── hooks/           # Custom React hooks
├── lib/             # Utilities and configurations
├── stores/          # Zustand stores
└── types/           # TypeScript types
```
