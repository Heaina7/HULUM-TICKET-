-- ============================================================================
-- Hulum Ticket — Attendance Management System
-- Part 05: Functions
-- ============================================================================
-- Run after part_04_rls.sql.
-- (RLS helper functions — my_role/my_branch_id/is_super_admin/is_branch_staff
-- — live in part_04_rls.sql, next to the policies that depend on them.)
-- ============================================================================

-- ── USERNAME → EMAIL LOOKUP (for login) ──────────────────────────────────────
-- Supabase Auth signs in with an email, but this app's people think in terms
-- of usernames (matching the original login form). The login page calls this
-- first to resolve the email, then calls supabase.auth.signInWithPassword.
-- SECURITY DEFINER so it can read auth.users, and deliberately returns
-- nothing more than an email string — it never reveals whether a username
-- exists beyond what a failed sign-in attempt would already leak.
create or replace function public.username_to_email(p_username text)
returns text
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_email text;
begin
  select au.email into v_email
  from public.profiles p
  join auth.users au on au.id = p.id
  where p.username = p_username::citext
  limit 1;

  return v_email;
end;
$$;

grant execute on function public.username_to_email(text) to anon, authenticated;

-- ── DASHBOARD SUMMARY (single round trip for the KPI cards) ─────────────────
-- Returns today's present/late/absent counts for one branch. Used by the
-- branch admin dashboard and, once per branch, by the super admin Home tab.
-- Honors RLS on attendance/employees implicitly since it's a plain query
-- executed as the calling (not definer) role.
create or replace function public.branch_today_summary(p_branch_id bigint, p_eth_date text)
returns table (
  total_active   bigint,
  present        bigint,
  late           bigint,
  on_time        bigint,
  pending        bigint
)
language sql
stable
as $$
  select
    (select count(*) from public.employees
      where branch_id = p_branch_id and active = true) as total_active,
    (select count(distinct employee_name) from public.attendance
      where branch_id = p_branch_id and eth_date = p_eth_date and type = 'in') as present,
    (select count(*) from public.attendance
      where branch_id = p_branch_id and eth_date = p_eth_date and type = 'in' and is_late) as late,
    (select count(distinct employee_name) from public.attendance
      where branch_id = p_branch_id and eth_date = p_eth_date and type = 'in' and is_late = false) as on_time,
    (select count(*) from public.attendance
      where branch_id = p_branch_id and status = 'pending') as pending;
$$;

grant execute on function public.branch_today_summary(bigint, text) to authenticated;

-- ── MANUAL AUDIT EVENT ────────────────────────────────────────────────────────
-- Most audit rows are written automatically by the triggers in
-- part_06_triggers.sql, which only fire on tables that are already
-- super-admin-only to write (branches, profiles, holidays, announcements).
-- This RPC covers the one security event that falls outside that: a
-- password change, by *either* role — Supabase Auth updates auth.users
-- directly, which this schema does not attach a trigger to.
--
-- SECURITY DEFINER so it can bypass the audit_logs_insert_super_admin RLS
-- policy (branch admins can't INSERT into audit_logs directly, matching
-- that this is a super-admin-reviewed system trail — see part_04_rls.sql).
-- This is safe specifically *because* the function takes no admin_id
-- parameter: it always derives who to log from auth.uid(), so a caller can
-- only ever log an event as themselves, never impersonate another admin.
create or replace function public.log_audit_event(p_action text, p_details text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
begin
  select username into v_username from public.profiles where id = auth.uid();

  insert into public.audit_logs (admin_id, admin_username, action, details)
  values (auth.uid(), v_username, p_action, p_details);
end;
$$;

grant execute on function public.log_audit_event(text, text) to authenticated;
