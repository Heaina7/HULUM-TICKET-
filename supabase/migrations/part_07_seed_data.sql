-- ============================================================================
-- Hulum Ticket — Attendance Management System
-- Part 07: Seed Data
-- ============================================================================
-- Run after part_06_triggers.sql.
--
-- This file is meant for a fresh local/dev project so there's something to
-- click through immediately. It is NOT meant to run against production.
-- Branch/employee names have no unique constraint, so re-running this file
-- will create duplicates — the auth.users insert is the only part guarded
-- against re-runs (see note below).
-- ============================================================================

-- ── BRANCHES ─────────────────────────────────────────────────────────────────
insert into public.branches (name, country, timezone) values
  ('Bole Head Office', 'Ethiopia', 'Africa/Addis_Ababa'),
  ('Adama Branch',      'Ethiopia', 'Africa/Addis_Ababa'),
  ('Bahir Dar Branch',  'Ethiopia', 'Africa/Addis_Ababa');

-- ── SUPER ADMIN LOGIN ────────────────────────────────────────────────────────
-- Creates one Supabase Auth user directly via SQL, which the
-- on_auth_user_created trigger (part_06) turns into a matching
-- public.profiles row with role = super_admin.
--
-- This direct-insert approach is a common local-dev convenience, but
-- auth.users' exact required columns can shift between Supabase versions,
-- so treat it as a quick start rather than something to rely on in
-- production. For anything beyond local dev, create accounts instead via
-- Authentication → Add User in the Supabase Dashboard, or the setup script
-- described in supabase/README.md (both use the supported Auth Admin API).
--
-- Login after seeding:
--   username: owner
--   password: ChangeMe123!
-- Change this password immediately after your first sign-in.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, recovery_token
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'owner@hulum.local',
  crypt('ChangeMe123!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"username":"owner","full_name":"System Owner","role":"super_admin"}'::jsonb,
  now(), now(), '', ''
where not exists (select 1 from auth.users where email = 'owner@hulum.local');

-- ── SHIFTS ───────────────────────────────────────────────────────────────────
insert into public.shifts (branch_id, name, start_time, end_time, grace_minutes)
select b.id, s.name, s.start_time::time, s.end_time::time, s.grace_minutes
from public.branches b
cross join (
  values
    ('Morning Shift',   '08:00', '17:00', 60),
    ('Evening Shift',   '17:00', '22:00', 30)
) as s(name, start_time, end_time, grace_minutes)
where b.name = 'Bole Head Office';

insert into public.shifts (branch_id, name, start_time, end_time, grace_minutes)
select b.id, 'Day Shift', '08:30'::time, '17:30'::time, 60
from public.branches b
where b.name in ('Adama Branch', 'Bahir Dar Branch');

-- ── EMPLOYEES ────────────────────────────────────────────────────────────────
insert into public.employees (branch_id, name, position, active, hire_date)
select b.id, e.name, e.position, true, current_date - (e.days_ago || ' days')::interval
from public.branches b
join (
  values
    ('Bole Head Office', 'Amanuel Tesfaye',   'Senior', 400),
    ('Bole Head Office', 'Sara Getachew',      'Staff',  200),
    ('Bole Head Office', 'Bereket Alemu',      'Manager', 700),
    ('Adama Branch',     'Meron Wolde',        'Staff',  150),
    ('Adama Branch',     'Yonas Kebede',       'Staff',  90),
    ('Bahir Dar Branch', 'Selamawit Fikru',    'Staff',  300)
) as e(branch_name, name, position, days_ago) on e.branch_name = b.name;

-- ── SETTINGS ─────────────────────────────────────────────────────────────────
insert into public.settings (branch_id, key, value)
select id, 'checkout_enabled', 'true' from public.branches;

-- ── HOLIDAYS (global) ────────────────────────────────────────────────────────
insert into public.holidays (name, eth_date, greg_date) values
  ('Enkutatash (Ethiopian New Year)', '1 መስከረም 2018', '2025-09-11'),
  ('Meskel',                          '17 መስከረም 2018', '2025-09-27'),
  ('Ethiopian Christmas (Gena)',      '29 ታህሳስ 2018',  '2026-01-07'),
  ('Timkat (Epiphany)',               '11 ጥር 2018',    '2026-01-19');

-- ── ANNOUNCEMENTS ────────────────────────────────────────────────────────────
insert into public.announcements (title, message, created_by)
select
  'Welcome to the new dashboard',
  'Attendance is now managed here. Reach out to your branch admin with any questions.',
  p.id
from public.profiles p
where p.username = 'owner';
