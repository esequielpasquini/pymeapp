-- 0019_orders.sql
-- Modulo "pedidos": el dueño arma un pedido de compra a un proveedor
-- (que productos y en que cantidad), lo guarda, lo puede mandar por
-- WhatsApp y despues consultarlo o usarlo como base para el proximo. Mismo
-- patron de modulo togglable que "compras" (ver 0016_organization_modules.sql)
-- -- se habilita/deshabilita por organizacion escribiendo directo en
-- organization_modules, no hay UI de administracion.

insert into organization_modules (organization_id, module_key, enabled)
select id, 'pedidos', true from organizations
on conflict (organization_id, module_key) do nothing;

create table orders (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  -- Nullable + on delete set null (igual que products.supplier_id): si se
  -- borra el proveedor, el pedido tiene que sobrevivir como registro
  -- historico. supplier_name es la copia fija de "a quien se le pidio esto"
  -- independiente de que pase despues con la fila de suppliers.
  supplier_id       uuid references suppliers(id) on delete set null,
  supplier_name     text not null,
  status            text not null default 'pendiente' check (status in ('pendiente', 'enviado')),
  created_by        uuid references profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  sent_at           timestamptz
);

create index orders_org_idx on orders(organization_id, created_at desc);

create table order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid not null references orders(id) on delete cascade,
  -- Mismo criterio que sale_items: copia de marca/descripcion para que el
  -- pedido siga siendo legible aunque el producto se borre o se edite
  -- despues.
  product_id    uuid references products(id) on delete set null,
  brand         text,
  description   text not null,
  quantity      numeric(12,2) not null
);

create index order_items_order_idx on order_items(order_id);

alter table orders enable row level security;
alter table order_items enable row level security;

-- Pedidos: exclusivo del dueño (a diferencia de compras/missing_reports,
-- que cualquier miembro de la organizacion puede usar). Gestionar pedidos a
-- proveedores es una decision de compra del negocio, no algo que un
-- empleado deberia armar o ver.
create policy orders_select on orders
  for select using (organization_id = auth_org_id() and is_owner());

create policy orders_insert on orders
  for insert with check (organization_id = auth_org_id() and is_owner());

create policy orders_update on orders
  for update using (organization_id = auth_org_id() and is_owner());

create policy order_items_select on order_items
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_id and o.organization_id = auth_org_id() and is_owner()
    )
  );

create policy order_items_insert on order_items
  for insert with check (
    exists (
      select 1 from orders o
      where o.id = order_id and o.organization_id = auth_org_id() and is_owner()
    )
  );

-- No hay policy de update: editar un pedido pendiente reemplaza sus items
-- (delete + insert), no los actualiza fila por fila -- ver updateOrderItems
-- en features/orders/actions.ts.
create policy order_items_delete on order_items
  for delete using (
    exists (
      select 1 from orders o
      where o.id = order_id and o.organization_id = auth_org_id() and is_owner()
    )
  );

-- GRANT explicito (RLS no alcanza -- ver 0005_grants.sql).
grant select, insert, update on orders to authenticated;
grant select, insert, delete on order_items to authenticated;
grant select, insert, update, delete on orders, order_items to service_role;
