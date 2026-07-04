-- 0003_rls.sql
-- Row Level Security por organización. Principio: TODA tabla de negocio filtra por
-- organization_id = auth_org_id(). Los helpers son SECURITY DEFINER + STABLE para
-- evitar recursión al consultar `profiles` desde su propia policy.

create or replace function auth_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from profiles where id = auth.uid()
$$;

create or replace function auth_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth_role() = 'owner'
$$;

-- ─────────────────────────────────────────────────────────────
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table suppliers enable row level security;
alter table products enable row level security;
alter table imports enable row level security;
alter table import_items enable row level security;
alter table price_changes enable row level security;
alter table missing_reports enable row level security;

-- organizations: solo lectura de la propia organización.
create policy organizations_select on organizations
  for select using (id = auth_org_id());

-- profiles: ver a los compañeros de la misma organización; editar solo el propio perfil.
-- Inserts/deletes de usuarios se hacen con la service role (alta de empleados), no
-- desde el cliente autenticado — por eso no hay policy de insert/delete aquí.
create policy profiles_select on profiles
  for select using (organization_id = auth_org_id());

create policy profiles_update_self on profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- suppliers: todos en la organización pueden leer; solo el dueño puede escribir.
create policy suppliers_select on suppliers
  for select using (organization_id = auth_org_id());

create policy suppliers_write on suppliers
  for insert with check (organization_id = auth_org_id() and is_owner());

create policy suppliers_update on suppliers
  for update using (organization_id = auth_org_id() and is_owner());

create policy suppliers_delete on suppliers
  for delete using (organization_id = auth_org_id() and is_owner());

-- products: todos en la organización pueden leer (empleados buscan/consultan);
-- solo el dueño crea/edita directamente. Los flujos de import/ajuste masivo pasan
-- por funciones SECURITY DEFINER (apply_import / apply_bulk_price_adjustment) que
-- validan el rol internamente y no dependen de estas policies.
create policy products_select on products
  for select using (organization_id = auth_org_id());

create policy products_insert on products
  for insert with check (organization_id = auth_org_id() and is_owner());

create policy products_update on products
  for update using (organization_id = auth_org_id() and is_owner());

-- imports: visibles y creables solo por el dueño.
create policy imports_select on imports
  for select using (organization_id = auth_org_id() and is_owner());

create policy imports_insert on imports
  for insert with check (organization_id = auth_org_id() and is_owner());

create policy imports_update on imports
  for update using (organization_id = auth_org_id() and is_owner());

create policy import_items_select on import_items
  for select using (organization_id = auth_org_id() and is_owner());

create policy import_items_insert on import_items
  for insert with check (organization_id = auth_org_id() and is_owner());

-- price_changes: visibles para toda la organización (historial de precios lo puede
-- ver un empleado en la ficha de producto); solo el dueño puede insertar filas
-- manualmente (los flujos de import/ajuste masivo insertan vía función SECURITY DEFINER).
create policy price_changes_select on price_changes
  for select using (organization_id = auth_org_id());

create policy price_changes_insert on price_changes
  for insert with check (organization_id = auth_org_id() and is_owner());

-- missing_reports: cualquier miembro de la organización puede crear un reporte;
-- todos pueden verlos; solo el dueño puede marcarlos como resueltos.
create policy missing_reports_select on missing_reports
  for select using (organization_id = auth_org_id());

create policy missing_reports_insert on missing_reports
  for insert with check (organization_id = auth_org_id());

create policy missing_reports_update on missing_reports
  for update using (organization_id = auth_org_id() and is_owner());
