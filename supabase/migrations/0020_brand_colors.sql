-- 0020_brand_colors.sql
-- Color de fondo persistido por marca (por organizacion), para pintar la
-- "marca" en el listado de productos con un color estable que no dependa de
-- un hash ni se corra al sumar marcas nuevas (ver conversacion: se probo
-- primero un hash del nombre y despues un color por posicion en la lista
-- ordenada, y ninguno de los dos anduvo -- el hash podia colisionar y el
-- color por posicion se corria al agregar marcas). Se asigna una sola vez,
-- la primera vez que se ve esa marca (ensureBrandColor en
-- features/brands/ensure-brand-color.ts, llamado desde
-- createProduct/updateProduct) y no vuelve a cambiar.
--
-- El color de texto (blanco o negro) NO se persiste -- se deriva siempre al
-- vuelo del color de fondo por contraste (ver getContrastTextColor en
-- src/lib/brand-colors.ts), asi no hay que mantener dos valores en sync.

create table brand_colors (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  brand             text not null,
  color             text not null, -- hex de fondo, ej '#f43f5e'
  created_at        timestamptz not null default now()
);

-- Case-insensitive: "Fischer" y "fischer" son la misma marca.
create unique index brand_colors_org_brand_key on brand_colors (organization_id, lower(brand));

alter table brand_colors enable row level security;

create policy brand_colors_select on brand_colors
  for select using (organization_id = auth_org_id());

-- El insert lo dispara automaticamente crear/editar un producto (hoy solo
-- el dueño puede hacer eso -- ver (owner)/products), asi que se exige
-- is_owner() igual que en el resto de esa superficie. No hay policy de
-- update/delete: el color de una marca no se reasigna desde la app.
create policy brand_colors_insert on brand_colors
  for insert with check (organization_id = auth_org_id() and is_owner());

grant select, insert on brand_colors to authenticated;
grant select, insert, update, delete on brand_colors to service_role;
