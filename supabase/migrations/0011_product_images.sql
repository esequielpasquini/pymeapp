-- 0011_product_images.sql
-- Imagen opcional por producto. Mismo patron que el logo de la organizacion
-- (0008): columna de URL publica + bucket de storage propio, publico (no es
-- informacion sensible, se muestra en el buscador del empleado). Paths
-- {organization_id}/{product_id}-{timestamp}.{ext} para que las policies
-- puedan filtrar por organizacion y para poder reemplazar la imagen sin
-- colisionar nombres.

alter table products add column image_url text;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy product_images_select on storage.objects
  for select using (bucket_id = 'product-images');

create policy product_images_insert on storage.objects
  for insert with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth_org_id()::text
    and is_owner()
  );

create policy product_images_update on storage.objects
  for update using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth_org_id()::text
    and is_owner()
  );

create policy product_images_delete on storage.objects
  for delete using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth_org_id()::text
    and is_owner()
  );
