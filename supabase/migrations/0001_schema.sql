-- 0001_schema.sql
-- Esquema principal: organizations, profiles, suppliers, products,
-- imports, import_items, price_changes, missing_reports.

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists pg_trgm;    -- búsqueda parcial (trigram)

-- ─────────────────────────────────────────────────────────────
-- organizations
-- ─────────────────────────────────────────────────────────────
create table organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- profiles (1 a 1 con auth.users)
-- ─────────────────────────────────────────────────────────────
create table profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  organization_id  uuid not null references organizations(id) on delete cascade,
  full_name        text not null default '',
  role             text not null check (role in ('owner','employee')),
  created_at       timestamptz not null default now()
);

create index profiles_org_idx on profiles(organization_id);

-- ─────────────────────────────────────────────────────────────
-- suppliers
-- ─────────────────────────────────────────────────────────────
create table suppliers (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  name             text not null,
  created_at       timestamptz not null default now(),
  unique (organization_id, name)
);

create index suppliers_org_idx on suppliers(organization_id);
-- unaccent_immutable: unaccent() no es IMMUTABLE por defecto (depende del diccionario
-- de configuración regional), lo cual impide usarlo en una columna generada. Se envuelve
-- en una función marcada IMMUTABLE — es seguro porque solo removemos acentos ASCII.
create extension if not exists unaccent;

create or replace function unaccent_immutable(text)
returns text
language sql
immutable
as $$
  select unaccent('unaccent', $1)
$$;
-- ─────────────────────────────────────────────────────────────
-- products
-- ─────────────────────────────────────────────────────────────
create table products (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  supplier_id       uuid references suppliers(id) on delete set null,
  brand             text,
  description       text not null,
  price_per_kilo    numeric(12,2),
  unit_price        numeric(12,2),
  notes             text,
  is_active         boolean not null default true,
  search_text       text generated always as (
                      unaccent_immutable(coalesce(brand,'') || ' ' || description)
                    ) stored,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  updated_by        uuid references profiles(id) on delete set null
  -- Reservado para futuro (NO se crea en el MVP):
  -- embedding      vector(1536)
);

create index products_org_idx on products(organization_id);
create index products_org_supplier_idx on products(organization_id, supplier_id);
create index products_org_active_idx on products(organization_id, is_active);
create index products_search_trgm_idx on products using gin (search_text gin_trgm_ops);



-- trigger updated_at
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

-- ─────────────────────────────────────────────────────────────
-- imports + import_items
-- ─────────────────────────────────────────────────────────────
create table imports (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  file_name         text not null,
  status            text not null default 'pending_review'
                     check (status in ('pending_review','applied','cancelled')),
  created_by        uuid references profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  applied_at        timestamptz,
  summary           jsonb not null default '{}'::jsonb
);

create index imports_org_idx on imports(organization_id);

create table import_items (
  id                        uuid primary key default gen_random_uuid(),
  import_id                 uuid not null references imports(id) on delete cascade,
  organization_id           uuid not null references organizations(id) on delete cascade,
  product_id                uuid references products(id) on delete set null,
  action                    text not null check (action in ('create','update','remove','unchanged')),
  brand                     text,
  description               text not null,
  supplier_name             text,
  price_per_kilo            numeric(12,2),
  unit_price                numeric(12,2),
  previous_price_per_kilo   numeric(12,2),
  previous_unit_price       numeric(12,2)
);

create index import_items_import_idx on import_items(import_id);
create index import_items_org_idx on import_items(organization_id);

-- ─────────────────────────────────────────────────────────────
-- price_changes (auditoría)
-- ─────────────────────────────────────────────────────────────
create table price_changes (
  id                        uuid primary key default gen_random_uuid(),
  organization_id           uuid not null references organizations(id) on delete cascade,
  product_id                uuid not null references products(id) on delete cascade,
  previous_price_per_kilo   numeric(12,2),
  new_price_per_kilo        numeric(12,2),
  previous_unit_price       numeric(12,2),
  new_unit_price            numeric(12,2),
  reason                    text not null check (reason in ('manual','import','bulk_adjustment')),
  import_id                 uuid references imports(id) on delete set null,
  changed_by                uuid references profiles(id) on delete set null,
  created_at                timestamptz not null default now()
);

create index price_changes_org_idx on price_changes(organization_id);
create index price_changes_product_idx on price_changes(product_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- missing_reports
-- ─────────────────────────────────────────────────────────────
create table missing_reports (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  product_name      text not null,
  comment           text,
  photo_url         text,
  status            text not null default 'open' check (status in ('open','resolved')),
  reported_by       uuid references profiles(id) on delete set null,
  resolved_by       uuid references profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  resolved_at       timestamptz
);

create index missing_reports_org_idx on missing_reports(organization_id, status);
