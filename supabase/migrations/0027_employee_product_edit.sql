-- 0027_employee_product_edit.sql
-- Los empleados tambien pueden editar productos (precio, marca, codigos,
-- foto, etc.) desde el buscador -- ver (employee)/search/[id]. Crear y
-- eliminar sigue siendo solo del dueño.
--
-- Todo lo que toca updateProduct (features/products/actions.ts) pasa a
-- estar abierto a cualquier miembro de la organizacion: el update del
-- producto, la fila de historial en price_changes, el color de una marca
-- nueva (brand_colors) y la subida de la foto al bucket product-images.

drop policy products_update on products;
create policy products_update on products
  for update using (organization_id = auth_org_id())
  with check (organization_id = auth_org_id());

-- "Eliminar" un producto es un soft-delete (update is_active = false, ver
-- deleteProduct), asi que la policy de update de arriba alcanzaria para que
-- un empleado lo haga. Este trigger lo deja solo para el dueño. apply_import
-- (SECURITY DEFINER) tambien desactiva productos, pero ya exige rol owner.
create or replace function products_guard_is_active()
returns trigger
language plpgsql
as $$
begin
  if new.is_active is distinct from old.is_active and not is_owner() then
    raise exception 'Solo el dueño puede eliminar o reactivar productos';
  end if;
  return new;
end;
$$;

create trigger products_guard_is_active
  before update on products
  for each row execute function products_guard_is_active();

drop policy price_changes_insert on price_changes;
create policy price_changes_insert on price_changes
  for insert with check (organization_id = auth_org_id());

drop policy brand_colors_insert on brand_colors;
create policy brand_colors_insert on brand_colors
  for insert with check (organization_id = auth_org_id());

drop policy product_images_insert on storage.objects;
create policy product_images_insert on storage.objects
  for insert with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth_org_id()::text
  );

drop policy product_images_update on storage.objects;
create policy product_images_update on storage.objects
  for update using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth_org_id()::text
  );
