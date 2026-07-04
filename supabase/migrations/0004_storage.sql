-- 0004_storage.sql
-- Bucket privado para las fotos adjuntas a reportes de faltantes.
-- Estructura de paths: {organization_id}/{filename} — así las policies de
-- storage pueden filtrar por organización igual que en las tablas normales.

insert into storage.buckets (id, name, public)
values ('missing-reports', 'missing-reports', false)
on conflict (id) do nothing;

create policy missing_reports_photos_select on storage.objects
  for select using (
    bucket_id = 'missing-reports'
    and (storage.foldername(name))[1] = auth_org_id()::text
  );

create policy missing_reports_photos_insert on storage.objects
  for insert with check (
    bucket_id = 'missing-reports'
    and (storage.foldername(name))[1] = auth_org_id()::text
  );
