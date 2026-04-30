-- ──────────────────────────────────────────────────────────────
-- Ritual — phase-3 migration
-- Adds support for item types (product / practice / treatment / other)
-- on the products table. Additive only — safe to re-run and safe to
-- roll back.
--
-- "Product Library" in the UI shows ALL rows here, active + inactive.
-- "Currently Tracking" is derived from routines (as before) and is
-- independent of is_active on products.
-- ──────────────────────────────────────────────────────────────

begin;

-- ── products: add type and type-specific columns ─────────────
-- type = 'product' | 'practice' | 'treatment' | 'other'
-- type_name: only populated when type='other' (user-defined label)
-- provider / location: only relevant for type='treatment'
-- is_active: true by default; false when user marks inactive
alter table public.products
  add column if not exists type        text     not null default 'product',
  add column if not exists type_name   text,
  add column if not exists provider    text,
  add column if not exists location    text,
  add column if not exists is_active   boolean  not null default true;

-- Constrain type to the four known values. Dropped first so the
-- migration is re-runnable if the set of types changes later.
alter table public.products
  drop constraint if exists products_type_check;
alter table public.products
  add  constraint products_type_check
       check (type in ('product','practice','treatment','other'));

-- Backfill: any existing rows are treated as products (default covers
-- new columns; this is just explicit).
update public.products
set type = 'product'
where type is null;

commit;

-- ── Rollback notes ───────────────────────────────────────────
-- To undo:
--   alter table public.products drop constraint if exists products_type_check;
--   alter table public.products drop column if exists type;
--   alter table public.products drop column if exists type_name;
--   alter table public.products drop column if exists provider;
--   alter table public.products drop column if exists location;
--   alter table public.products drop column if exists is_active;
