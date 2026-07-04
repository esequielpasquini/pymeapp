-- 0002_functions.sql
-- Funciones de negocio que corren dentro de una transacción en el servidor de Postgres.
-- Se usan desde Server Actions vía supabase.rpc(...). Mantener la lógica "todo o nada"
-- (import / ajuste masivo) en el servidor de la base de datos evita estados intermedios
-- inconsistentes si el cliente se desconecta a mitad de camino.

-- Helper: organización y rol del usuario autenticado actual.
create or replace function current_profile()
returns table (organization_id uuid, role text)
language sql
stable
security definer
set search_path = public
as $$
  select p.organization_id, p.role
  from profiles p
  where p.id = auth.uid()
$$;

-- ─────────────────────────────────────────────────────────────
-- apply_import: aplica un import en estado pending_review.
-- Recorre import_items y, según action, crea/actualiza/desactiva productos,
-- registrando cada cambio de precio en price_changes.
-- ─────────────────────────────────────────────────────────────
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
        organization_id, supplier_id, brand, description,
        price_per_kilo, unit_price, is_active, updated_by
      ) values (
        v_org, v_supplier_id, item.brand, item.description,
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

-- ─────────────────────────────────────────────────────────────
-- apply_bulk_price_adjustment: aplica un ajuste porcentual + redondeo a todos los
-- productos activos de un proveedor. Devuelve la cantidad de productos afectados.
-- p_rounding: 'none' | 'nearest_1' | 'nearest_5' | 'nearest_10' | 'nearest_50' | 'nearest_100'
-- ─────────────────────────────────────────────────────────────
create or replace function round_to_multiple(p_value numeric, p_rounding text)
returns numeric
language plpgsql
immutable
as $$
declare
  v_step numeric;
begin
  if p_value is null then
    return null;
  end if;

  v_step := case p_rounding
    when 'nearest_1'   then 1
    when 'nearest_5'   then 5
    when 'nearest_10'  then 10
    when 'nearest_50'  then 50
    when 'nearest_100' then 100
    else null
  end;

  if v_step is null then
    return round(p_value, 2);
  end if;

  return round(p_value / v_step) * v_step;
end;
$$;

create or replace function apply_bulk_price_adjustment(
  p_supplier_id uuid,
  p_percent numeric,
  p_rounding text default 'none'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_role text;
  v_user uuid := auth.uid();
  prod record;
  v_new_kilo numeric;
  v_new_unit numeric;
  v_count integer := 0;
begin
  select organization_id, role into v_org, v_role from profiles where id = v_user;

  if v_role is distinct from 'owner' then
    raise exception 'Solo el dueño puede aplicar ajustes masivos de precio';
  end if;

  for prod in
    select id, price_per_kilo, unit_price
    from products
    where organization_id = v_org
      and supplier_id = p_supplier_id
      and is_active = true
  loop
    v_new_kilo := round_to_multiple(
      case when prod.price_per_kilo is not null
        then prod.price_per_kilo * (1 + p_percent / 100.0) else null end,
      p_rounding
    );
    v_new_unit := round_to_multiple(
      case when prod.unit_price is not null
        then prod.unit_price * (1 + p_percent / 100.0) else null end,
      p_rounding
    );

    update products set
      price_per_kilo = coalesce(v_new_kilo, price_per_kilo),
      unit_price = coalesce(v_new_unit, unit_price),
      updated_by = v_user
    where id = prod.id;

    insert into price_changes (
      organization_id, product_id, previous_price_per_kilo, new_price_per_kilo,
      previous_unit_price, new_unit_price, reason, changed_by
    ) values (
      v_org, prod.id, prod.price_per_kilo, v_new_kilo,
      prod.unit_price, v_new_unit, 'bulk_adjustment', v_user
    );

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;
