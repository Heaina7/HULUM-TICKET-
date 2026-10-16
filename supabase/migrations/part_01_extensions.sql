-- ============================================================================
-- Hulum Ticket — Attendance Management System
-- Part 01: Extensions
-- ============================================================================
-- Run this first. Safe to re-run (all statements are idempotent).
-- ============================================================================

-- UUID generation (used for gen_random_uuid() defaults, though most primary
-- keys in this schema use bigint identity columns — uuid is needed for a
-- couple of surrogate values and for parity with auth.users.id).
create extension if not exists "pgcrypto";

-- citext gives us case-insensitive text, which we use for usernames so that
-- "Admin" and "admin" are treated as the same login.
create extension if not exists "citext";
