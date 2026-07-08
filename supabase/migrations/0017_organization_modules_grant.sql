-- 0017_organization_modules_grant.sql
-- Se me paso el GRANT en 0016 (RLS sola no alcanza, ver 0005_grants.sql) --
-- causaba "permission denied for table organization_modules" para
-- authenticated. Esta migracion solo agrega el grant que falta; 0016 ya
-- quedo corregido para el caso de un `supabase db reset` desde cero.

grant select on organization_modules to authenticated, service_role;
