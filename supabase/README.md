# Database setup

This folder contains the full schema as **seven** SQL files, meant to be run
once, in order, against a fresh Supabase project. Each file is idempotent on
its own except for `part_07_seed_data.sql` (seed data is meant to run once —
see the note at the top of that file).

| # | File | What it does |
|---|------|---------------|
| 1 | `part_01_extensions.sql` | Enables `pgcrypto` and `citext`. |
| 2 | `part_02_tables.sql` | Creates all tables (`branches`, `profiles`, `employees`, `shifts`, `attendance`, `settings`, `holidays`, `announcements`, `audit_logs`). |
| 3 | `part_03_indexes.sql` | Adds indexes for the query patterns the app actually uses. |
| 4 | `part_04_rls.sql` | Enables Row Level Security everywhere and defines every policy, plus the helper functions (`is_super_admin()`, `my_branch_id()`, etc.) the policies call. **This is the file that makes authorization real** — see the comment at its top for why that matters. |
| 5 | `part_05_functions.sql` | RPCs the app calls directly: `username_to_email()` (login), `branch_today_summary()` (dashboard KPIs), `log_audit_event()` (self-logged security events like a password change). |
| 6 | `part_06_triggers.sql` | Auto-creates a `profiles` row when an admin account is created in Supabase Auth, keeps `updated_at` columns current, and writes to `audit_logs` automatically on branch/admin/holiday/announcement changes. |
| 7 | `part_07_seed_data.sql` | Optional. Sample branches, employees, shifts, holidays, and one super admin login (`owner` / `ChangeMe123!`) so there's something to click through locally. **Skip this against a real/production project.** |

## How to run these

**Option A — Supabase Dashboard**
Open your project → SQL Editor → paste and run each file in order, 1 through
7 (or 1–6 if you don't want the sample data).

**Option B — Supabase CLI**
```bash
supabase link --project-ref <your-project-ref>
for f in supabase/migrations/part_0*.sql; do
  supabase db execute --file "$f"
done
```
(Or copy these into a normal `supabase/migrations` timestamped-migration
workflow with `supabase migration new` if you want them tracked by the CLI's
own migration history — the SQL itself doesn't need to change either way.)

## After running the migrations

1. In **Project Settings → API**, copy your Project URL and anon/publishable
   key into `.env.local` (see `.env.example` at the project root).
2. If you ran `part_07_seed_data.sql`, sign in at `/login` with
   `owner` / `ChangeMe123!` and change the password immediately
   (Settings → Security once you're in, or Supabase Dashboard →
   Authentication → Users in the meantime).
3. If you skipped the seed file, create your first super admin from
   **Authentication → Add User** in the dashboard, then give them a
   `role: "super_admin"` entry in **User Metadata** — the
   `on_auth_user_created` trigger reads that to create their profile. From
   there, that person can create every other admin account from inside the
   app (Admins tab).

## A note on the two Supabase key names

Supabase is in the middle of renaming `anon key` → `publishable key` (and
`service_role key` → `secret key`); both the legacy `eyJ...` keys and the new
`sb_publishable_...` / `sb_secret_...` keys work as drop-in values for the
`NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` variables this
project uses — use whichever your project currently issues under
**Settings → API Keys**.
