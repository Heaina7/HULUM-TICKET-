-- ============================================================================
-- Hulum Ticket — Attendance Management System
-- Part 03: Indexes
-- ============================================================================
-- Run after part_02_tables.sql.
--
-- These mirror the query patterns in the app: everything is filtered by
-- branch_id first, attendance is filtered by (employee, date) for the grid
-- and by status for the requests queue, and profiles are looked up by
-- username during login.
-- ============================================================================

create index if not exists idx_profiles_branch_id       on public.profiles (branch_id);
create index if not exists idx_profiles_role             on public.profiles (role);

create index if not exists idx_employees_branch_id       on public.employees (branch_id);
create index if not exists idx_employees_branch_active    on public.employees (branch_id, active);

create index if not exists idx_shifts_branch_id          on public.shifts (branch_id);

create index if not exists idx_attendance_branch_id      on public.attendance (branch_id);
create index if not exists idx_attendance_employee_id    on public.attendance (employee_id);
create index if not exists idx_attendance_status         on public.attendance (branch_id, status);
create index if not exists idx_attendance_eth_date       on public.attendance (branch_id, eth_date);
create index if not exists idx_attendance_emp_date       on public.attendance (employee_name, eth_date);
create index if not exists idx_attendance_created_at     on public.attendance (created_at desc);

create index if not exists idx_announcements_created_at  on public.announcements (created_at desc);
create index if not exists idx_audit_logs_created_at     on public.audit_logs (created_at desc);
