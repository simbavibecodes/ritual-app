-- ─────────────────────────────────────────────────────────────
-- Ritual — onboarding migration
-- Creates user-defined categories and user onboarding/profile state.
-- Safe to re-run: uses IF NOT EXISTS and idempotent policy drops.
-- ─────────────────────────────────────────────────────────────

-- Enable pgcrypto for gen_random_uuid (Supabase projects already have this,
-- but keeping the extension line here makes the migration portable).
create extension if not exists "pgcrypto";

-- ── user_categories ──────────────────────────────────────────
-- One row per category a user defines during onboarding.
create table if not exists public.user_categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  order_index int  not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists user_categories_user_idx
  on public.user_categories(user_id, order_index);

-- Prevent duplicate category names per user (names are normalized to lowercase).
create unique index if not exists user_categories_user_name_uq
  on public.user_categories(user_id, name);

-- ── user_profile ─────────────────────────────────────────────
-- One row per user, holds onboarding answers + completion flag.
create table if not exists public.user_profile (
  user_id              uuid primary key references auth.users(id) on delete cascade,
  age_range            text,
  biological_sex       text,
  sensitivities        text,
  check_in_frequency   text, -- "daily" | "few_times" | "when_i_feel"
  suggestion_level     text, -- "gently" | "actively" | "fully" | "custom"
  suggestion_custom    text,
  onboarding_complete  boolean not null default false,
  created_at           timestamptz not null default now()
);

-- ── RLS ──────────────────────────────────────────────────────
alter table public.user_categories enable row level security;
alter table public.user_profile    enable row level security;

-- user_categories policies
drop policy if exists "user_categories_select_own" on public.user_categories;
create policy "user_categories_select_own"
  on public.user_categories for select
  using (auth.uid() = user_id);

drop policy if exists "user_categories_insert_own" on public.user_categories;
create policy "user_categories_insert_own"
  on public.user_categories for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_categories_update_own" on public.user_categories;
create policy "user_categories_update_own"
  on public.user_categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "user_categories_delete_own" on public.user_categories;
create policy "user_categories_delete_own"
  on public.user_categories for delete
  using (auth.uid() = user_id);

-- user_profile policies
drop policy if exists "user_profile_select_own" on public.user_profile;
create policy "user_profile_select_own"
  on public.user_profile for select
  using (auth.uid() = user_id);

drop policy if exists "user_profile_insert_own" on public.user_profile;
create policy "user_profile_insert_own"
  on public.user_profile for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_profile_update_own" on public.user_profile;
create policy "user_profile_update_own"
  on public.user_profile for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
