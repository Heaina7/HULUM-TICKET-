-- ============================================================================
-- Hulum Ticket — Attendance Management System
-- Part 06: Triggers
-- ============================================================================
-- Run after part_05_functions.sql.
--
-- NOTE ON PERMISSIONS: the trigger on auth.users below needs to be created
-- by a role allowed to attach triggers to Supabase's auth schema. Running
-- this file through the Supabase SQL Editor (or `supabase db push`) uses a
-- role with that privilege. Running it through a restricted connection
-- string may fail on this section specifically — everything else in this
-- file does not touch the auth schema.
-- ============================================================================

-- ── AUTO-CREATE A PROFILE WHEN AN ADMIN ACCOUNT IS CREATED ──────────────────
-- Super admins create branch_admin/super_admin accounts via the Supabase
-- Auth admin API (server-side, using the service role key — see
-- lib/supabase/admin.ts) and pass username/role/branch_id as user metadata.
-- This trigger turns that into the matching public.profiles row, so the two
-- are never created out of step with each other.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, role, branch_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'branch_admin'),
    nullif(new.raw_user_meta_data ->> 'branch_id', '')::bigint
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── KEEP updated_at CURRENT ──────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.branches;
create trigger set_updated_at
  before update on public.branches
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.employees;
create trigger set_updated_at
  before update on public.employees
  for each row execute function public.set_updated_at();

-- ── AUTOMATIC AUDIT TRAIL ─────────────────────────────────────────────────────
-- Writes to audit_logs from the database itself, so a mutation made straight
-- against the REST/Data API still gets recorded even if a client skips
-- calling the app's own log_audit_event()/logAudit() helper.
create or replace function public.audit_log_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id       uuid := auth.uid();
  v_admin_username text;
  v_row            jsonb;
  v_label          text;
begin
  select username into v_admin_username from public.profiles where id = v_admin_id;

  if tg_op = 'DELETE' then
    v_row := to_jsonb(old);
  else
    v_row := to_jsonb(new);
  end if;

  v_label := coalesce(v_row ->> 'name', v_row ->> 'username', v_row ->> 'title', v_row ->> 'id');

  insert into public.audit_logs (admin_id, admin_username, action, details)
  values (
    v_admin_id,
    v_admin_username,
    upper(tg_op) || '_' || upper(tg_table_name),
    format('%s: %s', tg_table_name, coalesce(v_label, 'unknown'))
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists audit_branches on public.branches;
create trigger audit_branches
  after insert or update or delete on public.branches
  for each row execute function public.audit_log_trigger();

drop trigger if exists audit_profiles on public.profiles;
create trigger audit_profiles
  after insert or update or delete on public.profiles
  for each row execute function public.audit_log_trigger();

drop trigger if exists audit_holidays on public.holidays;
create trigger audit_holidays
  after insert or delete on public.holidays
  for each row execute function public.audit_log_trigger();

drop trigger if exists audit_announcements on public.announcements;
create trigger audit_announcements
  after insert or delete on public.announcements
  for each row execute function public.audit_log_trigger();
