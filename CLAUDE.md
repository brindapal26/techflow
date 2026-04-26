# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start dev server with Turbopack on http://localhost:3000

# Build & lint
npm run build
npm run lint

# Database (Drizzle ORM + Neon)
npm run db:generate  # Generate migration files from schema changes
npm run db:push      # Push schema directly to DB (no migration file)
npm run db:studio    # Open Drizzle Studio GUI
```

**Schema changes with existing data:** `db:push` will prompt interactively and cannot be piped. For destructive changes on a live DB, patch directly via a Node script (`node -e "..."`) using the `DATABASE_URL` from `.env.local`.

**Environment:** Use `npm` (not bun). Credentials live in `.env.local` (gitignored). The `drizzle.config.ts` uses `loadEnvConfig` from `@next/env` to pick up `.env.local` automatically.

## Architecture

### Project type
B2B SaaS — Social Recruiting Automation. Companies connect their ATS, sync jobs, assign jobs to recruiters, and recruiters use AI to generate + schedule LinkedIn posts.

### Route groups
- `src/app/(auth)/` — public pages: `/login`, `/login/[slug]`, `/register`, `/invite/[token]`, `/onboarding`
- `src/app/(dashboard)/` — all protected pages under `/dashboard/...`
- `src/app/api/` — all API routes (not covered by middleware matcher, so auth is checked manually inside each route)

### Auth (NextAuth v5 / Auth.js beta)
- Config: `src/lib/auth.ts` — credentials provider only, JWT strategy
- JWT stores: `id`, `role`, `companyId`
- Session user shape: `{ id, email, name, image, role, companyId }`
- Access in API routes: `const session = await auth(); const user = session.user as any;`
- Access in server components: same `auth()` import
- Access in client components: `useSession()` from `next-auth/react`
- The sidebar always fetches `/api/profile` on mount to get the live DB name (JWT name can be stale)

### Middleware (`src/middleware.ts`)
- Applies to all routes except `/api`, `_next/*`, `favicon.ico`
- `ADMIN_ONLY_ROUTES` list blocks `recruiter` role (redirects to `/dashboard`)
- API routes are NOT protected by middleware — each API route must call `auth()` itself

### Database (`src/lib/db/`)
- `index.ts` — Neon HTTP client + Drizzle instance with full schema
- `schema.ts` — all 11 table definitions + Drizzle relations

**Key tables and relationships:**
- `companies` → has many `users`, `ats_connections`, `jobs`, `posts`
- `company_employees` — synced from ATS; used for slug-login recruiter lookup (email → find employee → set password)
- `ats_connections` — one per provider per company; stores `api_key`, `status`, `last_synced_at`, `config` (jsonb)
- `jobs` — synced from ATS; has `assigned_recruiter_id`, `external_id` (ATS-side), `ats_connection_id`
- `posts` → `post_versions` (many versions per post) → `post_schedules` → `post_analytics`

### Role-based access
- `company_admin` — full access to all pages and data
- `recruiter` — sees only assigned jobs and their own posts; blocked from ATS connection, team management, workspace settings pages

### Sidebar nav
`src/components/dashboard/Sidebar.tsx` — `roles` array on each nav item controls what each role sees. Update this array when adding new pages.

### Company workspace login
`/login/[slug]` — 3-step flow: enter email → system finds employee in `company_employees` roster → set password + activate account. API: `POST /api/auth/lookup` then `POST /api/auth/register-employee`.

### ATS providers supported
Schema enum: `['greenhouse', 'lever', 'workday', 'smartrecruiters', 'bamboohr', 'ceipal', 'custom_url']`

### API route conventions
- All routes call `auth()` at the top; return 401 if no session
- Admin-only actions check `currentUser.role !== 'company_admin'` and return 403
- All DB queries are scoped by `companyId` from session to enforce tenant isolation
- Params in Next.js 15: `{ params }: { params: Promise<{ id: string }> }` — must `await params`

### UI stack
- Tailwind CSS v4 + shadcn/ui components in `src/components/ui/`
- `cn()` utility from `src/lib/utils.ts` for conditional classnames
- `lucide-react` for icons
- `recharts` for charts, `@fullcalendar/*` for the content calendar, `mapbox-gl` for job maps
- Animations: `animate-in fade-in` (Tailwind animate classes from `tw-animate-css`)
