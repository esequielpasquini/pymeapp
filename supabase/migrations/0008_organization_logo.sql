-- 0008_organization_logo.sql
-- Logo del negocio: se guarda la URL publica en organizations.logo_url y el
-- archivo en si en un bucket de storage propio ("org-logos"). A diferencia
-- del bucket de fotos de missing-reports (privado, cada foto solo la ve la
-- organizacion), el logo se muestra en el nav y potencialmente en el
-- favicon -- no es informacion sensible, asi que el bucket es publico para
-- que se pueda servir directo por URL sin generar signed URLs.

alter table organizations add column logo_url text;

-- 0003_rls.sql solo dejo una policy de SELECT para organizations (no hacia
-- falta escribir desde el cliente hasta ahora). El formulario de logo
-- actualiza organizations.logo_url con el cliente autenticado normal (no
-- service role), asi que hace falta esta policy de UPDATE, restringida al
-- dueño de la propia organizacion.
create policy organizations_update on organizations
  for update using (id = auth_org_id() and is_owner())
  with check (id = auth_org_id() and is_owner());

insert into storage.buckets (id, name, public)
values ('org-logos', 'org-logos', true)
on conflict (id) do nothing;

-- Cualquiera puede leer (bucket publico).
create policy org_logos_select on storage.objects
  for select using (bucket_id = 'org-logos');

-- Solo el dueño puede subir/actualizar/borrar, y solo dentro de la carpeta
-- de su propia organizacion ({organization_id}/...), mismo patron que
-- missing-reports.
create policy org_logos_insert on storage.objects
  for insert with check (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = auth_org_id()::text
    and is_owner()
  );

create policy org_logos_update on storage.objects
  for update using (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = auth_org_id()::text
    and is_owner()
  );

create policy org_logos_delete on storage.objects
  for delete using (
    bucket_id = 'org-logos'
    and (storage.foldername(name))[1] = auth_org_id()::text
    and is_owner()
  );
