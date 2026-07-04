-- 0006_categories.sql
-- Categorias de producto. Cada organizacion tiene sus propias categorias
-- (nombre + icono). Todo producto pertenece a una categoria (NOT NULL) --
-- se usan para la navegacion visual del buscador del empleado (grilla de
-- iconos grandes en vez de listar todos los productos de una).

create table categories (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  name              text not null,
  icon              text not null default 'package',
  created_at        timestamptz not null default now(),
  unique (organization_id, name)
);

create index categories_org_idx on categories(organization_id);

alter table products add column category_id uuid references categories(id);

-- Backfill: toda organizacion que ya tenga productos recibe una categoria
-- "Sin categoria" y se le asignan los productos existentes que no tengan
-- una. Asi se puede agregar la restriccion NOT NULL sin romper datos
-- existentes (por ejemplo los cargados por supabase/seed.sql antes de este
-- cambio).
do $$
declare
  org record;
  v_cat_id uuid;
begin
  for org in select distinct organization_id from products loop
    insert into categories (organization_id, name, icon)
    values (org.organization_id, 'Sin categoria', 'package')
    on conflict (organization_id, name) do nothing;

    select id into v_cat_id from categories
      where organization_id = org.organization_id and name = 'Sin categoria';

    update products set category_id = v_cat_id
      where organization_id = org.organization_id and category_id is null;
  end loop;
end $$;

alter table products alter column category_id set not null;

create index products_org_category_idx on products(organization_id, category_id);

-- RLS: mismo patron que suppliers -- todos en la organizacion pueden leer,
-- solo el dueno puede escribir.
alter table categories enable row level security;

create policy categories_select on categories
  for select using (organization_id = auth_org_id());

create policy categories_insert on categories
  for insert with check (organization_id = auth_org_id() and is_owner());

create policy categories_update on categories
  for update using (organization_id = auth_org_id() and is_owner());

create policy categories_delete on categories
  for delete using (organization_id = auth_org_id() and is_owner());

-- GRANT explicito (RLS no alcanza -- ver supabase/migrations/0005_grants.sql
-- para el detalle de por que hace falta esto ademas de las policies).
grant select, insert, update, delete on categories to authenticated, service_role;
