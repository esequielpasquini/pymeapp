-- 0016_organization_modules.sql
-- Sistema de modulos: funcionalidades que se habilitan/deshabilitan por
-- organizacion (lo que compro cada negocio). Por ahora la unica forma de
-- prender/apagar un modulo es escribiendo directo en esta tabla -- no hay
-- UI de administracion todavia, la decision la toma el desarrollador
-- conectandose a la base, no el dueño del comercio desde la app.
--
-- Ausencia de fila = modulo deshabilitado (opt-in). Asi una organizacion
-- nueva no arranca con ningun modulo prendido hasta que se le habilite a
-- mano -- coherente con que estos son features que se venden aparte.

create table organization_modules (
  organization_id uuid not null references organizations(id) on delete cascade,
  module_key text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (organization_id, module_key)
);

alter table organization_modules enable row level security;

-- Solo lectura desde el cliente autenticado (para que la app sepa que
-- mostrar). A proposito no hay policy de insert/update/delete: habilitar
-- un modulo se hace por fuera de la app.
create policy organization_modules_select on organization_modules
  for select using (organization_id = auth_org_id());

-- GRANT explicito (RLS no alcanza -- ver 0005_grants.sql). Solo select: no
-- hay policy de insert/update/delete y tampoco hace falta otorgar esos
-- privilegios a nivel de tabla.
grant select on organization_modules to authenticated, service_role;

-- Bootstrap: habilita el modulo de Compras (calculadora de venta) para las
-- organizaciones ya existentes, para no tener que hacerlo a mano apenas se
-- aplica esta migracion. Nuevas organizaciones NO lo heredan automatico.
insert into organization_modules (organization_id, module_key, enabled)
select id, 'compras', true from organizations
on conflict (organization_id, module_key) do nothing;
