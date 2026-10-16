-- ============================================================================
-- Hulum Ticket — Attendance Management System
-- Part 04: Row Level Security
-- ============================================================================
-- Run after part_03_indexes.sql.
--
-- WHY THIS FILE MATTERS
-- ----------------------------------------------------------------------------
-- In the original app, every screen (public kiosk AND both admin dashboards)
-- called Supabase through the *same* anon key, using plain REST calls
-- (sbFetch). "Login" only gated the UI — a valid-looking admin session was
-- never verified by the database. Nothing stopped a request that skipped the
-- UI and called the REST API directly with the anon key from approving
-- attendance, deleting employees, or creating branches, whatever the actual
-- RLS configuration on the live project turns out to be.
--
-- This file makes the database itself the authorization boundary:
--   * the public kiosk (anon key, no login) can only do what a kiosk should:
--     read branches/shifts/active employees/settings, and file a *pending*
--     check-in or check-out request.
--   * approving, rejecting, editing employees, managing branches/admins,
--     etc. all require a real Supabase Auth session tied to a profile with
--     the right role and branch — enforced here, not just in the UI.
-- ============================================================================

-- Helper functions used by the policies below. SECURITY DEFINER so they can
-- read public.profiles regardless of the caller's own row-level access,
-- which avoids infinite recursion when profiles' own policies call them too.
create or replace function public.my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.my_branch_id()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select branch_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function public.is_branch_staff(target_branch_id bigint)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or (public.my_role() = 'branch_admin' and public.my_branch_id() = target_branch_id);
$$;

grant execute on function public.my_role() to anon, authenticated;
grant execute on function public.my_branch_id() to anon, authenticated;
grant execute on function public.is_super_admin() to anon, authenticated;
grant execute on function public.is_branch_staff(bigint) to anon, authenticated;

-- ── ENABLE RLS ───────────────────────────────────────────────────────────────
alter table public.branches      enable row level security;
alter table public.profiles      enable row level security;
alter table public.employees     enable row level security;
alter table public.shifts        enable row level security;
alter table public.attendance    enable row level security;
alter table public.settings      enable row level security;
alter table public.holidays      enable row level security;
alter table public.announcements enable row level security;
alter table public.audit_logs    enable row level security;

grant usage on schema public to anon, authenticated;

-- ── BRANCHES ─────────────────────────────────────────────────────────────────
-- Every station picker (kiosk) and every dashboard needs the branch list.
grant select on public.branches to anon, authenticated;
grant insert, update, delete on public.branches to authenticated;

create policy "branches_select_all" on public.branches
  for select to anon, authenticated using (true);

create policy "branches_write_super_admin" on public.branches
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ── PROFILES ─────────────────────────────────────────────────────────────────
grant select, insert, update, delete on public.profiles to authenticated;

create policy "profiles_select_own_or_super" on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_super_admin());

create policy "profiles_update_own_or_super" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.is_super_admin())
  with check (id = auth.uid() or public.is_super_admin());

create policy "profiles_insert_super_admin" on public.profiles
  for insert to authenticated
  with check (public.is_super_admin());

create policy "profiles_delete_super_admin" on public.profiles
  for delete to authenticated
  using (public.is_super_admin() and id <> auth.uid());

-- ── EMPLOYEES ────────────────────────────────────────────────────────────────
grant select on public.employees to anon, authenticated;
grant insert, update, delete on public.employees to authenticated;

-- Kiosk only ever needs active staff for its name dropdown.
create policy "employees_select_active_public" on public.employees
  for select to anon using (active = true);

-- Staff (branch admin for their branch, or super admin anywhere) can see
-- inactive employees too, e.g. the "Inactive" section in the employees tab.
create policy "employees_select_staff" on public.employees
  for select to authenticated using (public.is_branch_staff(branch_id));

create policy "employees_write_staff" on public.employees
  for all to authenticated
  using (public.is_branch_staff(branch_id))
  with check (public.is_branch_staff(branch_id));

-- ── SHIFTS ───────────────────────────────────────────────────────────────────
grant select on public.shifts to anon, authenticated;
grant insert, update, delete on public.shifts to authenticated;

create policy "shifts_select_all" on public.shifts
  for select to anon, authenticated using (true);

create policy "shifts_write_staff" on public.shifts
  for all to authenticated
  using (public.is_branch_staff(branch_id))
  with check (public.is_branch_staff(branch_id));

-- ── ATTENDANCE ───────────────────────────────────────────────────────────────
-- Reads stay open to anon: with no individual employee login, the kiosk
-- itself is what shows "you already checked in today" / history, exactly as
-- in the original. Writes are where the original had no real boundary —
-- that's tightened below.
grant select on public.attendance to anon, authenticated;
grant insert on public.attendance to anon, authenticated;
grant update, delete on public.attendance to authenticated;

create policy "attendance_select_all" on public.attendance
  for select to anon, authenticated using (true);

-- Kiosk self-service: only a *pending* in/out request, never a pre-approved
-- record and never a "permission" (excused absence) entry.
create policy "attendance_insert_kiosk" on public.attendance
  for insert to anon
  with check (status = 'pending' and type in ('in', 'out'));

-- Staff can insert on behalf of their branch too (covers "Grant Permission",
-- which the original wrote directly as status = 'done').
create policy "attendance_insert_staff" on public.attendance
  for insert to authenticated
  with check (public.is_branch_staff(branch_id));

-- Approve / reject / edit / bulk-delete all require a real staff session
-- scoped to the record's branch — this is the fix for the anon-can-approve
-- gap described at the top of this file.
create policy "attendance_update_staff" on public.attendance
  for update to authenticated
  using (public.is_branch_staff(branch_id))
  with check (public.is_branch_staff(branch_id));

create policy "attendance_delete_staff" on public.attendance
  for delete to authenticated
  using (public.is_branch_staff(branch_id));

-- ── SETTINGS ─────────────────────────────────────────────────────────────────
grant select on public.settings to anon, authenticated;
grant insert, update, delete on public.settings to authenticated;

create policy "settings_select_all" on public.settings
  for select to anon, authenticated using (true);

create policy "settings_write_staff" on public.settings
  for all to authenticated
  using (public.is_branch_staff(branch_id))
  with check (public.is_branch_staff(branch_id));

-- ── HOLIDAYS (global, super admin managed) ──────────────────────────────────
grant select on public.holidays to authenticated;
grant insert, update, delete on public.holidays to authenticated;

create policy "holidays_select_staff" on public.holidays
  for select to authenticated using (true);

create policy "holidays_write_super_admin" on public.holidays
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ── ANNOUNCEMENTS (global, super admin managed) ─────────────────────────────
grant select on public.announcements to authenticated;
grant insert, update, delete on public.announcements to authenticated;

create policy "announcements_select_staff" on public.announcements
  for select to authenticated using (true);

create policy "announcements_write_super_admin" on public.announcements
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ── AUDIT LOGS (super admin only, append-only) ──────────────────────────────
grant select, insert on public.audit_logs to authenticated;

create policy "audit_logs_select_super_admin" on public.audit_logs
  for select to authenticated using (public.is_super_admin());

create policy "audit_logs_insert_super_admin" on public.audit_logs
  for insert to authenticated with check (public.is_super_admin());

-- Deliberately no update/delete policy on audit_logs: the trail is
-- append-only for everyone, including super admins, once RLS is enabled.
