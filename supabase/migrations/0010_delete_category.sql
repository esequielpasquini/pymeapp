-- 0010_delete_category.sql
-- Permite borrar una categoria. products.category_id es NOT NULL y la FK no
-- tiene ON DELETE (osea NO ACTION por default) -- un DELETE directo sobre
-- categories fallaria con violacion de FK si algun producto la usa. Esta
-- funcion, en la misma transaccion: reasigna los productos de la categoria
-- borrada a "Sin categoria" (creandola si hace falta, mismo patron que
-- apply_import) y recien despues borra la fila. No se puede borrar la
-- categoria "Sin categoria" en si misma -- es el fallback, borrarla dejaria
-- sin destino a futuras reasignaciones.
create or replace function delete_category(p_category_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_role text;
  v_category_name text;
  v_default_category_id uuid;
begin
  select organization_id, role into v_org, v_role from profiles where id = auth.uid();

  if v_role is distinct from 'owner' then
    raise exception 'Solo el dueño puede eliminar categorias';
  end if;

  select name into v_category_name from categories
    where id = p_category_id and organization_id = v_org;

  if v_category_name is null then
    raise exception 'Categoria no encontrada';
  end if;

  if v_category_name = 'Sin categoria' then
    raise exception 'No se puede eliminar la categoria "Sin categoria"';
  end if;

  insert into categories (organization_id, name, icon)
  values (v_org, 'Sin categoria', 'package')
  on conflict (organization_id, name) do nothing;

  select id into v_default_category_id from categories
    where organization_id = v_org and name = 'Sin categoria';

  update products set category_id = v_default_category_id
    where organization_id = v_org and category_id = p_category_id;

  delete from categories where id = p_category_id and organization_id = v_org;
end;
$$;
