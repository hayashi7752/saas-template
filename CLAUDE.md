# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview
This is a Next.js 14 SaaS starter template with authentication (Supabase), payments (Stripe), and PostgreSQL database (Drizzle ORM).

## Key Commands

### Development
```bash
# Start development server
pnpm run dev

# Run linting
pnpm run lint

# Format code
pnpm run format

# Check formatting without writing
pnpm run format:check
```

### Database
```bash
# Generate migration files from schema changes
pnpm run db:generate

# Apply migrations to database
pnpm run db:migrate

# Push schema changes directly (dev only)
pnpm run db:push

# Open Drizzle Studio for database exploration
pnpm run db:studio
```

### Build & Deploy
```bash
# Build for production (runs migrations first)
pnpm run build

# Start production server
pnpm run start
```

### Stripe Setup
```bash
# Initial Stripe products/prices setup
pnpm run stripe:setup

# Listen to Stripe webhooks locally
pnpm run stripe:listen
```

## Architecture

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Auth**: Supabase (OAuth + Email)
- **Database**: PostgreSQL + Drizzle ORM
- **Payments**: Stripe
- **UI**: Tailwind CSS + shadcn/ui
- **Language**: TypeScript (strict mode)

### Project Structure
- `/app` - Next.js App Router pages and API routes
  - `/auth` - Authentication actions (server-side)
  - `/dashboard` - Protected user area
  - `/webhook/stripe` - Stripe webhook handler
- `/components` - React components
  - `/ui` - shadcn/ui base components
- `/utils` - Core utilities
  - `/db` - Database schema and config
  - `/stripe` - Stripe API utilities
  - `/supabase` - Supabase client configs (server/client/middleware)

### Key Patterns
1. **Authentication**: Handled via Supabase middleware in `middleware.ts`. Protected routes under `/dashboard`.
2. **Database Schema**: Simple user table with Stripe integration. Schema in `/utils/db/schema.ts`.
3. **Environment Variables**: Use `.env.local` for development, `.env` for production.
4. **Server Components**: Default to server components, use `"use client"` only when needed.
5. **Type Safety**: Full TypeScript with path aliases (`@/*` maps to root).

### Testing
No testing framework is currently configured. Consider adding Vitest or Jest if tests are needed.

### Important Notes
- Always run migrations before building: `pnpm run db:migrate`
- Stripe webhook endpoint: `/webhook/stripe` (must be configured in Stripe dashboard)
- Supabase auth cookies are handled automatically via middleware
- UI components use CSS variables for theming (configured in globals.css)