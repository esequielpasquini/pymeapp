-- 0015_product_search_stats.sql
-- Top 5 de productos mas buscados: contador simple por producto en vez de un
-- log de eventos separado (no hace falta el historial, solo el ranking
-- actual). Se incrementa cada vez que una busqueda de texto especifica
-- devuelve pocos resultados (ver searchProducts en products/queries.ts) --
-- eso aproxima "el empleado encontro el producto puntual que buscaba" en vez
-- de sumar puntos por busquedas amplias/de categoria.
--
-- products_update (0003_rls.sql) exige is_owner(), asi que un empleado no
-- podria pisar estas columnas con un update comun -- de ahi la funcion
-- SECURITY DEFINER, que ademas evita que un usuario incremente contadores de
-- productos de otra organizacion (siempre resuelve la propia via profiles).

alter table products add column search_count integer not null default 0;
alter table products add column last_searched_at timestamptz;

create index products_org_search_count_idx on products(organization_id, search_count desc);

create or replace function bump_product_search_counts(p_product_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select organization_id into v_org from profiles where id = auth.uid();
  if v_org is null or p_product_ids is null or array_length(p_product_ids, 1) is null then
    return;
  end if;

  update products
  set search_count = search_count + 1,
      last_searched_at = now()
  where id = any(p_product_ids)
    and organization_id = v_org;
end;
$$;

grant execute on function bump_product_search_counts(uuid[]) to authenticated;
