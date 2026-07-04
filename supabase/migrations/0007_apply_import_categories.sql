-- 0007_apply_import_categories.sql
-- Actualiza apply_import (definida en 0002_functions.sql) para que los
-- productos nuevos creados via importacion de Excel tengan category_id,
-- que ahora es NOT NULL (ver 0006_categories.sql). El Excel no tiene columna
-- de categoria, asi que los productos nuevos importados caen en una
-- categoria "Sin categoria" (se resuelve o se crea, igual que se hace con
-- el proveedor) y el dueno los puede reclasificar despues desde la ficha
-- del producto.

create or replace function apply_import(p_import_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_user uuid := auth.uid();
  v_role text;
  item record;
  v_product_id uuid;
  v_supplier_id uuid;
  v_default_category_id uuid;
begin
  select organization_id, role into v_org, v_role from profiles where id = v_user;

  if v_role is distinct from 'owner' then
    raise exception 'Solo el dueño puede aplicar importaciones';
  end if;

  perform 1 from imports
    where id = p_import_id and organization_id = v_org and status = 'pending_review'
    for update;
  if not found then
    raise exception 'Importación no encontrada o ya procesada';
  end if;

  -- Categoria por defecto para productos nuevos (el Excel no trae categoria).
  insert into categories (organization_id, name, icon)
  values (v_org, 'Sin categoria', 'package')
  on conflict (organization_id, name) do nothing;

  select id into v_default_category_id from categories
    where organization_id = v_org and name = 'Sin categoria';

  for item in
    select * from import_items where import_id = p_import_id
  loop
    if item.action = 'unchanged' then
      continue;
    end if;

    v_supplier_id := null;
    if item.supplier_name is not null and length(trim(item.supplier_name)) > 0 then
      insert into suppliers (organization_id, name)
      values (v_org, trim(item.supplier_name))
      on conflict (organization_id, name) do nothing;

      select id into v_supplier_id from suppliers
        where organization_id = v_org and name = trim(item.supplier_name);
    end if;

    if item.action = 'create' then
      insert into products (
        organization_id, supplier_id, category_id, brand, description,
        price_per_kilo, unit_price, is_active, updated_by
      ) values (
        v_org, v_supplier_id, v_default_category_id, item.brand, item.description,
        item.price_per_kilo, item.unit_price, true, v_user
      )
      returning id into v_product_id;

      insert into price_changes (
        organization_id, product_id, previous_price_per_kilo, new_price_per_kilo,
        previous_unit_price, new_unit_price, reason, import_id, changed_by
      ) values (
        v_org, v_product_id, null, item.price_per_kilo,
        null, item.unit_price, 'import', p_import_id, v_user
      );

    elsif item.action = 'update' then
      -- No se toca category_id: el Excel no trae categoria, se preserva la
      -- que el producto ya tenia.
      update products set
        supplier_id = coalesce(v_supplier_id, supplier_id),
        brand = item.brand,
        price_per_kilo = item.price_per_kilo,
        unit_price = item.unit_price,
        is_active = true,
        updated_by = v_user
      where id = item.product_id and organization_id = v_org;

      insert into price_changes (
        organization_id, product_id, previous_price_per_kilo, new_price_per_kilo,
        previous_unit_price, new_unit_price, reason, import_id, changed_by
      ) values (
        v_org, item.product_id, item.previous_price_per_kilo, item.price_per_kilo,
        item.previous_unit_price, item.unit_price, 'import', p_import_id, v_user
      );

    elsif item.action = 'remove' then
      update products set is_active = false, updated_by = v_user
      where id = item.product_id and organization_id = v_org;
    end if;
  end loop;

  update imports set status = 'applied', applied_at = now()
  where id = p_import_id;
end;
$$;
