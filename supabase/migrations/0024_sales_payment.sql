-- 0024_sales_payment.sql
-- Modulo "ventas" (pantalla Vender, ver features/sales): ventas armadas
-- escaneando productos, con metodo de pago y vuelto. Reusa las tablas
-- sales / sale_items de 0018_sales.sql (las mismas que usa el carrito del
-- modulo "compras").

-- Productos fraccionados se venden por peso exacto (ej. 0,375 kg) -- con
-- 2 decimales se redondeaba a 0,38.
alter table sale_items alter column quantity type numeric(12,3);

-- Nullable: las ventas confirmadas desde el carrito (modulo "compras") no
-- registran pago.
alter table sales add column payment_method text
  check (payment_method in ('efectivo', 'debito', 'credito', 'transferencia'));
-- Solo efectivo: con cuanto pago el cliente y cuanto vuelto se le dio.
alter table sales add column amount_paid numeric(12,2);
alter table sales add column change_given numeric(12,2);

-- Mismo bootstrap que "compras" en 0016_organization_modules.sql: se
-- habilita para las organizaciones existentes, las nuevas no lo heredan.
insert into organization_modules (organization_id, module_key, enabled)
select id, 'ventas', true from organizations
on conflict (organization_id, module_key) do nothing;
