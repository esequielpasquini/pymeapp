-- 0005_grants.sql
-- RLS por si sola no alcanza: Postgres tambien exige que el rol que ejecuta
-- la query (anon/authenticated/service_role, los roles que usa la API de
-- Supabase) tenga privilegios GRANT sobre la tabla. Sin esto, cualquier query
-- desde la app devuelve "permission denied for table X" incluso con las
-- policies de RLS bien configuradas (RLS filtra filas; los GRANT habilitan
-- el acceso a la tabla en primer lugar).
--
-- service_role tiene BYPASSRLS a nivel de Postgres (por eso las Server
-- Actions que usan la service role key, como el alta de empleados, no
-- pasan por las policies), pero igual necesita el GRANT de la tabla en si
-- -- BYPASSRLS salta las policies, no los permisos base de la tabla.
--
-- No se toco esto en las migraciones anteriores porque normalmente Supabase
-- configura ALTER DEFAULT PRIVILEGES para el schema public al crear el
-- proyecto, pero no siempre queda aplicado igual segun como se haya creado
-- o vinculado el proyecto (o en instancias locales via `supabase start`).
-- Este GRANT explicito lo deja resuelto sin depender de eso.

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete on
  organizations,
  profiles,
  suppliers,
  products,
  imports,
  import_items,
  price_changes,
  missing_reports
to authenticated, service_role;

-- No se otorga nada a "anon": esta app no tiene self-signup publico ni
-- pantallas accesibles sin sesion, asi que un usuario no autenticado no
-- deberia poder leer ni escribir nada.
