# TalentFlow — Full Build Plan

> B2B SaaS platform for consulting/staffing companies to automate social media recruiting.
> Recruiters are assigned open roles, use AI to generate LinkedIn posts, and control posting frequency + expiry.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 15 (App Router) | Already in project |
| Database | Neon (Serverless PostgreSQL) | Free tier, serverless, great DX, no cold starts |
| ORM | Drizzle ORM | Lightweight, type-safe, native Neon support |
| Auth | NextAuth.js v5 (Auth.js) | Sessions, JWT, middleware, credentials + OAuth |
| LLM | Claude API (Anthropic) | Post generation |
| Social | LinkedIn API | OAuth per recruiter, publishing |
| Hosting | Vercel | Next.js native, cron jobs |
| Styling | Tailwind CSS v4 + shadcn/ui | Already in project |

---

## Hierarchy / Data Model

```
Platform (Super Admin — future)
└── Company / Workspace
    ├── ATS Connection(s) [1 company → many ATS]
    │   └── Synced Jobs → assigned to recruiters
    ├── Company Admin
    │   ├── Creates recruiter accounts (invite by email)
    │   ├── Assigns jobs to recruiters
    │   └── Sees all analytics
    └── Recruiters
        ├── See only their assigned open roles
        ├── AI generates LinkedIn post drafts per role
        ├── Manage multiple post versions per role
        ├── Control: which version posts, frequency, expiry
        └── Posts to their personal LinkedIn account
```

---

## Database Schema

### companies
```sql
id uuid PRIMARY KEY
name text NOT NULL
logo_url text
website text
industry text
brand_color text
subscription_plan text DEFAULT 'free'
created_at timestamptz DEFAULT now()
```

### users
```sql
id uuid PRIMARY KEY
email text UNIQUE NOT NULL
name text
password_hash text
avatar_url text
company_id uuid FK → companies
role text CHECK (role IN ('company_admin', 'recruiter'))
is_active boolean DEFAULT true
created_by uuid FK → users (who invited them)
created_at timestamptz DEFAULT now()
```

### invitations
```sql
id uuid PRIMARY KEY
email text NOT NULL
company_id uuid FK → companies
role text DEFAULT 'recruiter'
token text UNIQUE NOT NULL
expires_at timestamptz NOT NULL
accepted_at timestamptz
invited_by uuid FK → users
created_at timestamptz DEFAULT now()
```

### ats_connections
```sql
id uuid PRIMARY KEY
company_id uuid FK → companies
provider text CHECK (provider IN ('greenhouse', 'lever', 'workday', 'smartrecruiters', 'custom_url'))
api_key text (encrypted)
oauth_token text (encrypted)
webhook_url text
last_synced_at timestamptz
status text DEFAULT 'active' CHECK (status IN ('active', 'error', 'paused'))
config jsonb (provider-specific settings)
created_at timestamptz DEFAULT now()
```

### jobs
```sql
id uuid PRIMARY KEY
company_id uuid FK → companies
ats_connection_id uuid FK → ats_connections
external_id text (ATS-side job ID)
assigned_recruiter_id uuid FK → users
title text NOT NULL
description text
location text
department text
job_type text CHECK (job_type IN ('full_time', 'part_time', 'contract', 'internship'))
salary_min integer
salary_max integer
currency text DEFAULT 'USD'
apply_url text
status text DEFAULT 'open' CHECK (status IN ('open', 'closed', 'filled'))
is_priority boolean DEFAULT false
posted_date date
expires_at date
synced_at timestamptz
created_at timestamptz DEFAULT now()
```

### posts
```sql
id uuid PRIMARY KEY
company_id uuid FK → companies
job_id uuid FK → jobs
created_by uuid FK → users (recruiter)
platform text CHECK (platform IN ('linkedin', 'facebook', 'twitter'))
status text DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'scheduled', 'published', 'expired', 'paused'))
active_version_id uuid FK → post_versions (set after version created)
created_at timestamptz DEFAULT now()
updated_at timestamptz DEFAULT now()
```

### post_versions
```sql
id uuid PRIMARY KEY
post_id uuid FK → posts
version_number integer NOT NULL
caption text NOT NULL
hashtags text[]
image_url text
ai_generated boolean DEFAULT true
created_by uuid FK → users
created_at timestamptz DEFAULT now()
```

### post_schedules
```sql
id uuid PRIMARY KEY
post_id uuid FK → posts
post_version_id uuid FK → post_versions
scheduled_at timestamptz NOT NULL
posted_at timestamptz
frequency text DEFAULT 'once' CHECK (frequency IN ('once', 'daily', 'weekly', 'biweekly', 'custom'))
repeat_interval_days integer
repeat_until timestamptz (expiry)
status text DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'failed', 'expired', 'cancelled'))
linkedin_post_id text (returned by LinkedIn API after publishing)
error_message text
created_at timestamptz DEFAULT now()
```

### post_analytics
```sql
id uuid PRIMARY KEY
post_schedule_id uuid FK → post_schedules
impressions integer DEFAULT 0
clicks integer DEFAULT 0
likes integer DEFAULT 0
shares integer DEFAULT 0
comments integer DEFAULT 0
applications_attributed integer DEFAULT 0
pulled_at timestamptz DEFAULT now()
```

### social_connections
```sql
id uuid PRIMARY KEY
user_id uuid FK → users
company_id uuid FK → companies
platform text CHECK (platform IN ('linkedin', 'facebook', 'twitter'))
connection_type text CHECK (connection_type IN ('personal', 'company_page'))
platform_user_id text
platform_username text
access_token text (encrypted)
refresh_token text (encrypted)
token_expires_at timestamptz
is_active boolean DEFAULT true
connected_at timestamptz DEFAULT now()
```

---

## Phase 1: Auth + Workspace / Tenant Model
**Goal:** Working login, registration, invite flow, role-based access

### Files to Create
```
src/
├── lib/
│   ├── db/
│   │   ├── index.ts          ← Neon + Drizzle client
│   │   └── schema.ts         ← All table definitions
│   ├── auth.ts               ← NextAuth config
│   └── auth-utils.ts         ← password hash helpers
├── middleware.ts              ← Route protection
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx    ← Replace 404
│   │   ├── register/page.tsx ← Company admin self-signup
│   │   └── invite/[token]/page.tsx ← Recruiter accept invite
│   └── (dashboard)/
│       └── settings/
│           ├── team/page.tsx ← Admin: list + invite recruiters
│           └── workspace/page.tsx ← Company info + logo
```

### New Dependencies
```
@neondatabase/serverless
drizzle-orm
drizzle-kit
next-auth@beta
bcryptjs
@types/bcryptjs
```

### Role-Based Access Rules
| Route | company_admin | recruiter |
|-------|---------------|-----------|
| /dashboard | ✅ full view | ✅ limited (own stats only) |
| /dashboard/jobs | ✅ all jobs | ✅ assigned jobs only |
| /dashboard/ats-connection | ✅ | ❌ redirect |
| /dashboard/settings/team | ✅ | ❌ redirect |
| /dashboard/analytics | ✅ all | ✅ own posts only |

---

## Phase 2: ATS Connection (Real)
**Goal:** Connect Greenhouse (first), sync real jobs, assign to recruiters

### New API Routes
```
POST /api/ats/connect          ← store credentials, test, first sync
POST /api/ats/sync/[id]        ← manual sync trigger
GET  /api/jobs                 ← list (scoped by role)
PATCH /api/jobs/[id]/assign    ← admin assigns job to recruiter
POST /api/webhooks/ats/[provider] ← real-time job updates
```

### ATS Providers — Implementation Order
1. **Greenhouse** — REST API + API key (simplest)
2. **Lever** — REST API + OAuth
3. **Custom URL** — scraper / RSS fallback
4. **Workday / SmartRecruiters** — Phase 3+

### New Pages
```
/dashboard/jobs               ← new: full jobs list
/dashboard/jobs/[id]          ← new: job detail + assigned recruiter + posts
```

---

## Phase 3: LLM Post Generation
**Goal:** AI generates LinkedIn post drafts per job, recruiter edits + manages versions

### API Routes
```
POST /api/posts/generate       ← call Claude API with job data
POST /api/posts                ← save post + version
PATCH /api/posts/[id]          ← update status
POST /api/posts/[id]/versions  ← add new version
PATCH /api/posts/[id]/active-version ← set active version
```

### LLM Prompt Strategy
- Input: job title, description, location, company name, industry, tone (professional/casual)
- Output: 3 variations × per platform (LinkedIn character limit: 3000)
- Each variation: caption + hashtag set + suggested image concept

### New / Updated UI
```
/dashboard/posts/create       ← update: job selector → generate → version manager
/dashboard/posts/[id]         ← new: post detail with version tabs
/dashboard/my-posts           ← new: recruiter view of their posts
```

---

## Phase 4: LinkedIn Publishing
**Goal:** Recruiter connects personal LinkedIn, posts publish on schedule with frequency + expiry

### OAuth Flow
- Each recruiter: connect personal LinkedIn (r_liteprofile + w_member_social scopes)
- Company admin: optionally connect company page (w_organization_social)

### Publishing Engine (Vercel Cron)
```
/api/cron/publish              ← runs every 15min, checks post_schedules
                                  where scheduled_at <= now AND status = 'pending'
```

### Frequency + Expiry Logic
- "Post once" → single schedule entry
- "Post weekly until filled" → recurring entries created on each post success
- Job marked `filled` → all pending schedules auto-cancelled
- Recruiter can pause/expire manually

### New Pages
```
/dashboard/social-profiles    ← update: real LinkedIn OAuth connect
/dashboard/posts/[id]/schedule ← new: set frequency, pick version, set expiry
```

---

## Phase 5: Analytics
**Goal:** Real metrics pulled from LinkedIn API, displayed per recruiter and admin

### Cron Job
```
/api/cron/analytics            ← runs daily, pulls metrics for posts published last 48h
```

### Updated Pages
```
/dashboard/analytics          ← update: real data, filter by recruiter (admin) or own (recruiter)
/dashboard/jobs/[id]          ← update: show social performance per job
```

---

## Build Order

| Week | Phase | Deliverable |
|------|-------|-------------|
| 1 | 1A | Neon + Drizzle setup, schema, migrations |
| 1 | 1B | Login + Register pages wired to DB |
| 2 | 1C | Invite flow, middleware, role guards, sidebar per role |
| 2 | 1D | Team management page (admin), Workspace settings |
| 3 | 2A | Greenhouse API connection + job sync |
| 4 | 2B | Jobs list/detail UI, job assignment to recruiters |
| 5 | 3A | Claude API integration, post generation |
| 5 | 3B | Post version manager UI |
| 6 | 3C | Schedule UI, frequency + expiry controls |
| 7 | 4A | LinkedIn OAuth per recruiter |
| 7 | 4B | Publishing cron engine |
| 8 | 5 | Analytics cron + real dashboard data |

---

## Environment Variables Needed

```env
# Database
DATABASE_URL=                  # Neon connection string

# Auth
NEXTAUTH_SECRET=               # random 32-char string
NEXTAUTH_URL=                  # http://localhost:3000

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

# Claude API
ANTHROPIC_API_KEY=

# ATS
GREENHOUSE_WEBHOOK_SECRET=
```

---

## Current Status

- [x] Landing page (UI only)
- [x] Dashboard layout — Sidebar + Header (hardcoded user)
- [x] ATS Connection page (UI only, mock data)
- [x] Posts / Content Calendar page (shell)
- [x] Post Create page (shell)
- [x] Job Maps page (shell)
- [x] Social Profiles page (shell)
- [x] Analytics page (shell)
- [x] Onboarding page (shell, no backend)
- [ ] **Phase 1: Auth + Workspace** ← STARTING NOW
- [ ] Phase 2: Real ATS Connection
- [ ] Phase 3: LLM Post Generation
- [ ] Phase 4: LinkedIn Publishing
- [ ] Phase 5: Analytics
