# Hulum Ticket — Attendance Management System

A production-ready Next.js rebuild of the original HTML/CSS/vanilla-JS attendance kiosk and admin dashboards, backed by Supabase.

## What this is

Three surfaces, one codebase:

- **`/kiosk`** — the public, unauthenticated check-in/check-out station. An employee picks their branch, picks their name, and checks in or out. Every submission lands as a **pending** request — nothing is auto-approved.
- **`/dashboard`, `/requests`, `/attendance`, `/employees`, `/settings`** — the **branch admin** view. Approve or reject pending requests, browse the monthly attendance grid, manage employees and shifts, grant excused-permission days, toggle whether check-out is enabled, change password.
- **`/dashboard`, `/attendance`, `/employees`, `/branches`, `/admins`, `/settings`** — the **super admin** view. Everything above across every branch, plus branch management, admin account management, company-wide holidays and announcements, and a security audit log.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router), React, TypeScript (strict) |
| Styling | Tailwind CSS v4 (CSS-first `@theme`, no `tailwind.config.js` needed) |
| Components | shadcn/ui-style primitives on Radix UI, Lucide icons |
| Backend | Supabase (Postgres, Auth, Row Level Security, Realtime) |
| Forms/mutations | Server Actions (no client-side API layer to hand-write) |

## Feature parity with the original app

Every workflow from the original HTML/JS app is preserved:

- Ethiopian calendar date/time display and conversion (ported arithmetic, not rewritten)
- Shift grace-period logic, including overnight shifts that cross midnight
- Kiosk check-in/check-out → pending → admin approval flow
- Monthly attendance grid (present/late/excused/absent) with CSV export
- Grant Permission (excused absence)
- Employee management (active/inactive, position)
- Shift management, per-branch check-out toggle
- Branch and admin account management (super admin)
- Holidays, announcements, audit log (super admin)
- Password change

What changed under the hood, and why, is documented inline as comments at each decision point (search the codebase for `NOTE`-style comments in `supabase/migrations/part_04_rls.sql` and `app/kiosk/actions.ts` in particular) — in short: **authorization now lives in the database** (Row Level Security), not just in the UI, and **the attendance timestamp is computed server-side**, not trusted from the client.

## Project structure

```
app/
  (dashboard)/            Authenticated shell: sidebar + topbar layout
    dashboard/            Role-aware KPI overview
    requests/              Branch admin: pending approval queue (Realtime)
    attendance/            Monthly grid, both roles
    employees/              Employee CRUD, both roles
    branches/                Super admin: branch CRUD
    admins/                   Super admin: admin account CRUD
    settings/                  Shifts/checkout/security (branch admin);
                                holidays/announcements/audit log/security (super admin)
  kiosk/                   Public check-in/check-out station
  login/                   Username+password sign-in
components/
  ui/                      Design-system primitives (button, dialog, table, etc.)
  layout/                  Sidebar, topbar, mobile nav, nav config
  shared/                  Cross-feature pieces (page header, empty state, stat card)
hooks/                     Client-side data hooks (polling, Realtime)
lib/                       Framework-free logic: Ethiopian calendar, shift status,
                            time parsing, Supabase client factories
services/                  Server-only data-access functions (one file per entity)
types/                     Hand-written Database type + derived domain types
constants/                 Shared enums and config values
supabase/migrations/       Full SQL schema, split into 7 ordered files (see its own README)
```

Every `page.tsx` is a Server Component that fetches its own data and passes it to a small set of colocated Client Components for interactivity — there's no separate client-side API/fetch layer to keep in sync.

## Prerequisites

- Node.js 20.9 or later
- A Supabase project ([supabase.com](https://supabase.com), free tier is enough to develop against)

## Installation guide

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up the database.** Follow `supabase/README.md` — it walks through running the 7 SQL files in order (via the Supabase Dashboard's SQL Editor or the CLI) and includes an optional seed script with sample data and a working super admin login.

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Fill in the three values from your Supabase project's **Settings → API** page. `.env.example` explains what each one is for and notes that Supabase's key names are mid-rename (`anon key` → `publishable key`, `service_role key` → `secret key`) — either generation works.

4. **Run it**
   ```bash
   npm run dev
   ```
   Visit `http://localhost:3000` — you'll land on `/kiosk` if signed out, `/dashboard` if signed in.

## Development guide

**Scripts**
```bash
npm run dev          # local dev server
npm run build         # production build
npm run start          # serve a production build locally
npm run lint            # ESLint
npm run lint:fix         # ESLint, auto-fix
npm run format             # Prettier, write
npm run format:check        # Prettier, check only
npm run typecheck             # tsc --noEmit
```

**Adding a page.** Create `app/(dashboard)/your-feature/page.tsx` as a Server Component; it'll automatically get the sidebar/topbar shell from the `(dashboard)` route group's `layout.tsx`. Add an entry to `components/layout/nav-items.tsx` (optionally scoped to a role via `roles: ["super_admin"]`).

**Adding a mutation.** Add an async function to a colocated `actions.ts` with `"use server"` at the top. Every action in this codebase re-checks the caller's role/branch itself — it does not trust that the UI that called it already checked, since Server Actions are directly callable endpoints once shipped to the client.

**Data access.** Server Components read through `services/*.ts` (server-only, thin wrappers around Supabase queries). Client Components that need to poll or subscribe use the hooks in `hooks/*.ts`, which call `lib/supabase/client.ts` directly.

**Design tokens.** All colors/spacing/radius live as CSS custom properties in `app/globals.css` under `@theme inline`. There is deliberately no `tailwind.config.js` — Tailwind v4's content detection is automatic, and the CSS-first `@theme` block *is* the config.

**Code style.** No `any` (ESLint error), no unused imports/vars (ESLint error), strict TypeScript including `noUncheckedIndexedAccess`. Run `npm run lint && npm run typecheck` before committing.

## Production deployment guide

### Option A — Vercel (recommended, zero extra config)

1. Push this repo to GitHub/GitLab/Bitbucket.
2. Import it in Vercel. Framework preset auto-detects as Next.js.
3. Add the three environment variables from `.env.example` in **Project Settings → Environment Variables** (for Production, and Preview if you want preview deployments to work against the same or a separate Supabase project).
4. Deploy. Vercel runs `npm run build` automatically.

### Option B — Any Node host (Docker, a VM, etc.)

```bash
npm ci
npm run build
npm run start   # listens on port 3000 by default; set PORT to override
```
Provide the same three environment variables at runtime. A minimal `Dockerfile` would build with `npm ci && npm run build` and run `npm run start` — this repo doesn't ship one since hosting setups vary, but the app itself has no assumptions beyond "Node 20.9+ and those three env vars."

### Post-deploy checklist

- [ ] Ran all 7 SQL migrations against the **production** Supabase project (skip `part_07_seed_data.sql` — that's for local dev only)
- [ ] Created a real first super admin (see `supabase/README.md`'s "After running the migrations" section) and confirmed you can sign in
- [ ] Changed any seed-data password if you did use the seed file somewhere reachable
- [ ] Confirmed `/kiosk` loads signed-out and `/dashboard` redirects to `/login` signed-out
- [ ] Spot-checked that a branch admin genuinely cannot see another branch's data (this is enforced by Row Level Security in the database itself, not just hidden in the UI — see `supabase/migrations/part_04_rls.sql`)

## Verification performed

This project was built in a sandboxed environment without outbound network access, so `npm install` / `npm run build` / `npm run lint` could not be executed against the real toolchain as a final gate. In their place, every file was checked with the locally-available TypeScript compiler run in a strict, `noUncheckedIndexedAccess`-enabled mode against the whole source tree, plus purpose-built static analysis confirming: every import resolves to a real export, every used package is declared in `package.json`, no `"use client"` file pulls in a server-only module across the boundary, every Server Action file exports only async functions, and there are no unused imports. Two genuine bugs turned up this way and were fixed (an RLS/security-definer mismatch that would have silently dropped a branch admin's own audit-log entry, and a couple of array-indexing spots that needed explicit bounds-safe fallbacks under strict mode). **Please still run `npm install && npm run build && npm run lint` yourself before deploying** — that remains the authoritative check.
