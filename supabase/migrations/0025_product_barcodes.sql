-- 0025_product_barcodes.sql
-- Un producto puede tener N codigos de barras (ej. el mismo alimento con
-- codigo de distinto proveedor, o presentacion vieja y nueva). Se pasa de
-- products.barcode (text, uno solo -- 0023_product_barcode.sql) a
-- products.barcodes (text[]), mismo patron que tags (0013_product_tags.sql).
--
-- NO se borra ningun codigo: el que tenia cada producto se copia al array.
-- La columna vieja `barcode` queda en la tabla sin usar (deprecada) en vez
-- de dropearla: durante el deploy puede haber unos minutos con la version
-- anterior de la app corriendo, que la sigue leyendo/escribiendo. Se puede
-- eliminar en una migracion futura.

alter table products add column barcodes text[] not null default '{}';

update products
set barcodes = array[barcode]
where barcode is not null and length(trim(barcode)) > 0;

-- Busqueda por codigo (buscador y pantalla Vender): barcodes @> '{codigo}'.
create index products_barcodes_idx on products using gin (barcodes);

-- import_items: mismo cambio. barcodes ya viene resuelto desde la app
-- (computeImportDiff: codigos que ya tenia el producto + los nuevos del
-- Excel); previous_barcodes solo cuando agrega alguno, para la revision.
alter table import_items add column barcodes text[] not null default '{}';
alter table import_items add column previous_barcodes text[];

-- Importaciones que quedaron pendientes de revision con la version anterior.
update import_items
set barcodes = array[barcode],
    previous_barcodes = case when previous_barcode is not null then array[previous_barcode] end
where barcode is not null and length(trim(barcode)) > 0;

-- apply_import (ultima version en 0023_product_barcode.sql): copia barcodes.
-- En update se UNE con los codigos actuales del producto en vez de pisarlos:
-- una importacion nunca saca un codigo de barras ya asociado.
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
  v_category_id uuid;
  v_category_name text;
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

  -- Categoria por defecto para productos nuevos que no traigan categoria en
  -- el Excel.
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

    v_category_id := null;
    v_category_name := nullif(trim(coalesce(item.category_name, '')), '');
    if v_category_name is not null then
      insert into categories (organization_id, name, icon)
      values (v_org, v_category_name, 'package')
      on conflict (organization_id, name) do nothing;

      select id into v_category_id from categories
        where organization_id = v_org and name = v_category_name;
    end if;

    if item.action = 'create' then
      insert into products (
        organization_id, supplier_id, category_id, brand, description,
        price_per_kilo, unit_price, tags, barcodes, is_active, updated_by
      ) values (
        v_org, v_supplier_id, coalesce(v_category_id, v_default_category_id), item.brand, item.description,
        item.price_per_kilo, item.unit_price, item.tags, item.barcodes, true, v_user
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
      -- category_id solo se pisa si el Excel trajo categoria para esta fila.
      -- tags ya viene resuelto desde la app (computeImportDiff); barcodes se
      -- une con los existentes (sin duplicados) para no perder ninguno.
      update products set
        supplier_id = coalesce(v_supplier_id, supplier_id),
        category_id = coalesce(v_category_id, category_id),
        brand = item.brand,
        price_per_kilo = item.price_per_kilo,
        unit_price = item.unit_price,
        tags = item.tags,
        barcodes = array(select distinct unnest(products.barcodes || item.barcodes)),
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
