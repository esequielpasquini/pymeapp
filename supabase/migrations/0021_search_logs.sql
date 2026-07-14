-- 0021_search_logs.sql
-- Registro basico de "cuantas busquedas hace cada usuario por dia" (dueño lo
-- ve en Configuracion, ver getListDailySearchCounts en
-- features/search-logs/queries.ts). A diferencia de products.search_count
-- (0015_product_search_stats.sql, que es un contador agregado por producto
-- para el ranking de "mas buscados"), esto es un log de eventos por usuario
-- -- cada busqueda de texto no vacia queda como una fila propia.
--
-- log_search() sigue el mismo patron que bump_product_search_counts: una
-- funcion SECURITY DEFINER que resuelve organizacion y usuario a partir de
-- auth.uid(), asi el cliente no puede mandar organization_id/user_id de
-- otro. No hay policy de insert en la tabla a proposito -- la unica forma
-- de escribir es via esta funcion (corre como su dueño, bypassea RLS).

create table search_logs (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  user_id           uuid references profiles(id) on delete set null,
  query             text not null,
  created_at        timestamptz not null default now()
);

create index search_logs_org_created_idx on search_logs(organization_id, created_at desc);
create index search_logs_org_user_created_idx on search_logs(organization_id, user_id, created_at desc);

alter table search_logs enable row level security;

-- Es actividad de los empleados -- lo ve el dueño, no cada uno la suya ni
-- entre ellos.
create policy search_logs_select on search_logs
  for select using (organization_id = auth_org_id() and is_owner());

create or replace function log_search(p_query text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select organization_id into v_org from profiles where id = auth.uid();
  if v_org is null or p_query is null or length(trim(p_query)) = 0 then
    return;
  end if;

  insert into search_logs (organization_id, user_id, query)
  values (v_org, auth.uid(), trim(p_query));
end;
$$;

grant execute on function log_search(text) to authenticated;
grant select on search_logs to authenticated;
grant select, insert, update, delete on search_logs to service_role;
