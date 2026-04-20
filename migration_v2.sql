-- ──────────────────────────────────────────────────────────────
-- Ritual — phase-2 migration
-- Normalizes `entries` and `routines` so any user-defined category
-- (skin / hair / supplements / peptides / fitness / …) gets the same
-- first-class treatment as the original skin/hair pair.
--
-- Strategy: we ADD new generic columns alongside the old ones, backfill
-- existing data into them, and leave the old columns in place for two
-- deploys so a rollback is trivial. A later migration can drop the
-- legacy columns once this has soaked.
--
-- Safe to re-run.
-- ──────────────────────────────────────────────────────────────

begin;

-- ── entries: add `by_category` JSONB ─────────────────────────
-- Shape:
--   { "<categoryName>": {
--       "done":   string[],   -- item ids completed that day
--       "mood":   string,     -- optional mood label
--       "notes":  string,
--       "photos": string[]    -- image URLs
--     }, ... }
alter table public.entries
  add column if not exists by_category jsonb not null default '{}'::jsonb;

-- Backfill from the legacy skin_* / hair_* columns.
-- Only touches rows where by_category is still empty so it's idempotent
-- and safe to re-run after new data has been written.
update public.entries
set by_category = jsonb_strip_nulls(jsonb_build_object(
  'skin', jsonb_build_object(
    'done',   coalesce(to_jsonb(skin),        '[]'::jsonb),
    'mood',   coalesce(skin_mood,             ''),
    'notes',  coalesce(skin_notes,            ''),
    'photos', coalesce(to_jsonb(skin_photos), '[]'::jsonb)
  ),
  'hair', jsonb_build_object(
    'done',   coalesce(to_jsonb(hair),        '[]'::jsonb),
    'mood',   coalesce(hair_mood,             ''),
    'notes',  coalesce(hair_notes,            ''),
    'photos', coalesce(to_jsonb(hair_photos), '[]'::jsonb)
  )
))
where (by_category = '{}'::jsonb or by_category is null)
  and (
    skin is not null or hair is not null or
    skin_mood is not null or hair_mood is not null or
    skin_notes is not null or hair_notes is not null or
    skin_photos is not null or hair_photos is not null
  );

-- ── routines: add `category` column + unique index ────────────
-- The existing `type` column is constrained to 'skin'|'hair'. We add a
-- sibling `category` column that can hold any user category name, and
-- keep both in sync until the old column is dropped.
alter table public.routines
  add column if not exists category text;

update public.routines
set category = type
where category is null and type is not null;

-- New uniqueness: one routine per user per category.
-- Keep the old (user_id, type) unique constraint around so existing
-- upserts with onConflict="user_id,type" still work for skin/hair rows.
create unique index if not exists routines_user_category_uq
  on public.routines(user_id, category)
  where category is not null;

-- ── treatments: no schema change needed ──────────────────────
-- treatments.type is already free-form text (no enum constraint).
-- It's used as a category filter in the UI; the UI change alone will
-- let any category name be stored there. No DB action required.

-- ── products / purchases / wishlist / planned_purchases ──────
-- Their `category` column is already free-form text. No change needed.
-- Going forward, the client normalizes category names to lowercase
-- before writing.

commit;

-- ── Rollback notes ───────────────────────────────────────────
-- To undo this migration:
--   alter table public.entries   drop column if exists by_category;
--   alter table public.routines  drop column if exists category;
--   drop index  if exists public.routines_user_category_uq;
-- The legacy skin_* / hair_* columns on entries and the type column on
-- routines are untouched, so no data is lost.
