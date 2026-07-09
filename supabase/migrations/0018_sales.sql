-- 0018_sales.sql
-- Registro de ventas confirmadas desde el modulo "compras" (ver
-- features/cart). Antes el carrito era puro scratchpad de localStorage sin
-- persistir nada -- esto agrega un boton "Confirmar" que guarda un snapshot
-- de lo vendido y limpia el carrito. No toca stock/inventario (no existe
-- ese concepto en el sistema todavia), es solo un registro para poder
-- reportar despues.

create table sales (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  total             numeric(12,2) not null,
  created_by        uuid references profiles(id) on delete set null,
  created_at        timestamptz not null default now()
);

create index sales_org_idx on sales(organization_id, created_at desc);

create table sale_items (
  id                uuid primary key default gen_random_uuid(),
  sale_id           uuid not null references sales(id) on delete cascade,
  -- on delete set null: si el producto se borra del catalogo despues, el
  -- registro historico de la venta tiene que sobrevivir igual (por eso
  -- ademas se guarda una copia de marca/descripcion/precio, no solo el id).
  product_id        uuid references products(id) on delete set null,
  brand             text,
  description       text not null,
  -- true = se cobro por kilo (cantidad en kg, pasos de 0.5); false = por
  -- unidad (cantidad entera). Ver features/cart/context.tsx.
  fractioned        boolean not null default false,
  unit_price        numeric(12,2) not null,
  quantity          numeric(12,2) not null,
  line_total        numeric(12,2) not null
);

create index sale_items_sale_idx on sale_items(sale_id);

alter table sales enable row level security;
alter table sale_items enable row level security;

-- Igual que missing_reports: cualquier miembro de la organizacion (dueño o
-- empleado) puede confirmar una venta y ver las de su organizacion. No hay
-- policy de update/delete -- una vez confirmada, la venta queda como
-- registro fijo.
create policy sales_select on sales
  for select using (organization_id = auth_org_id());

create policy sales_insert on sales
  for insert with check (organization_id = auth_org_id());

create policy sale_items_select on sale_items
  for select using (
    exists (select 1 from sales s where s.id = sale_id and s.organization_id = auth_org_id())
  );

create policy sale_items_insert on sale_items
  for insert with check (
    exists (select 1 from sales s where s.id = sale_id and s.organization_id = auth_org_id())
  );

-- GRANT explicito (RLS no alcanza -- ver 0005_grants.sql). service_role
-- ademas de select/insert tiene update/delete por si hace falta corregir
-- algo a mano; authenticated solo lo que las policies de arriba permiten.
grant select, insert on sales, sale_items to authenticated;
grant select, insert, update, delete on sales, sale_items to service_role;
