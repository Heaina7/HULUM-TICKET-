-- ============================================================================
-- Hulum Ticket — Attendance Management System
-- Part 02: Tables
-- ============================================================================
-- Run after part_01_extensions.sql.
--
-- Notes on decisions made while porting the original schema (inferred from
-- the vanilla-JS client code — you know your real Supabase schema best, so
-- treat this as a clean-room rebuild and diff it against what you actually
-- have before running it against a database with existing data):
--
--   * profiles (new) replaces the old "admins" table. It is a 1:1 extension
--     of Supabase's built-in auth.users, storing username/role/branch_id.
--     Passwords are handled entirely by Supabase Auth now — nothing here
--     stores a password hash, which removes the client-side SHA-256 check
--     that shipped in the original admin.js / super.js.
--   * attendance now has both `employee_id` (a real foreign key) and
--     `employee_name` (a point-in-time snapshot). The original only had the
--     name string, so a rename could silently orphan history. We keep the
--     snapshot for display/CSV continuity but add the FK for integrity.
--   * `grp` (branch admin's "Group / Role" field) and `position` (referenced
--     only in the super admin employee table) were two names for what looks
--     like the same concept in the original app. They're unified here as
--     a single `position` column.
--   * settings is keyed by (branch_id, key) as a composite primary key,
--     which makes the "insert, or update if it already exists" pattern the
--     client used (POST, fall back to PATCH) a plain upsert.
-- ============================================================================

-- ── BRANCHES ────────────────────────────────────────────────────────────────
create table if not exists public.branches (
  id         bigint generated always as identity primary key,
  name       text not null,
  country    text,
  timezone   text not null default 'Africa/Addis_Ababa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.branches is 'A physical station / office. Employees, shifts and attendance all belong to one branch.';

-- ── PROFILES (branch_admin / super_admin accounts) ──────────────────────────
-- One row per Supabase Auth user who is staff (never created for employees —
-- employees are not Supabase Auth users, matching the original kiosk design
-- where staff pick their name from a list rather than logging in).
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  username   citext not null unique,
  full_name  text,
  role       text not null check (role in ('super_admin', 'branch_admin')),
  branch_id  bigint references public.branches (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_branch_admin_has_branch
    check (role = 'super_admin' or branch_id is not null)
);
comment on table public.profiles is 'Staff accounts. Extends auth.users with a username, role and branch assignment.';

-- ── EMPLOYEES ────────────────────────────────────────────────────────────────
create table if not exists public.employees (
  id         bigint generated always as identity primary key,
  branch_id  bigint not null references public.branches (id) on delete cascade,
  name       text not null,
  position   text default 'Staff',
  active     boolean not null default true,
  hire_date  date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.employees is 'Staff who clock in/out at a kiosk. Not Supabase Auth users — selected by name at the station.';

-- ── SHIFTS ───────────────────────────────────────────────────────────────────
create table if not exists public.shifts (
  id            bigint generated always as identity primary key,
  branch_id     bigint not null references public.branches (id) on delete cascade,
  name          text not null,
  start_time    time not null,
  end_time      time not null,
  grace_minutes integer not null default 120 check (grace_minutes >= 0 and grace_minutes <= 1440),
  created_at    timestamptz not null default now()
);
comment on table public.shifts is 'Working hours for a branch. end_time < start_time means an overnight shift.';

-- ── ATTENDANCE ───────────────────────────────────────────────────────────────
create table if not exists public.attendance (
  id            bigint generated always as identity primary key,
  branch_id     bigint not null references public.branches (id) on delete cascade,
  employee_id   bigint references public.employees (id) on delete set null,
  employee_name text not null,
  type          text not null check (type in ('in', 'out', 'permission')),
  status        text not null default 'pending' check (status in ('pending', 'done')),
  eth_date      text not null,
  eth_time      text,
  is_late       boolean not null default false,
  note          text,
  created_at    timestamptz not null default now()
);
comment on table public.attendance is 'Check-in / check-out / permission records. eth_date and eth_time are Ethiopian-calendar strings, kept as text to match how the kiosk renders and sorts them.';

-- ── SETTINGS (per-branch key/value) ─────────────────────────────────────────
create table if not exists public.settings (
  branch_id  bigint not null references public.branches (id) on delete cascade,
  key        text not null,
  value      text,
  updated_at timestamptz not null default now(),
  primary key (branch_id, key)
);
comment on table public.settings is 'Per-branch key/value config, e.g. checkout_enabled.';

-- ── HOLIDAYS (global) ────────────────────────────────────────────────────────
create table if not exists public.holidays (
  id         bigint generated always as identity primary key,
  name       text not null,
  eth_date   text,
  greg_date  date,
  created_at timestamptz not null default now()
);
comment on table public.holidays is 'Company-wide holidays, applies to every branch.';

-- ── ANNOUNCEMENTS (global) ───────────────────────────────────────────────────
create table if not exists public.announcements (
  id         bigint generated always as identity primary key,
  title      text not null,
  message    text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
comment on table public.announcements is 'Broadcast messages from a super admin, visible to all branch admins.';

-- ── AUDIT LOGS ────────────────────────────────────────────────────────────────
-- Renamed from the original "super_audit_logs". Rows are written by a
-- database trigger (see part_06_triggers.sql) rather than only by the
-- client, so an action taken directly against the API still gets logged.
create table if not exists public.audit_logs (
  id             bigint generated always as identity primary key,
  admin_id       uuid references public.profiles (id) on delete set null,
  admin_username text,
  action         text not null,
  details        text,
  created_at     timestamptz not null default now()
);
comment on table public.audit_logs is 'Security trail of admin actions: branch/admin CRUD and holiday/announcement changes (all super-admin-only tables, logged automatically by trigger), plus self-logged events like a password change from either role (via the log_audit_event RPC).';
