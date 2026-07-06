-- 0014_login_branding.sql
-- Logo + descripcion del negocio en la pantalla de login. El login ocurre
-- ANTES de autenticarse, asi que el cliente todavia no tiene auth.uid() ->
-- auth_org_id() devuelve null y la policy organizations_select (0003_rls.sql)
-- no deja leer nada. En vez de abrir toda la tabla organizations a anon,
-- se expone una funcion SECURITY DEFINER que solo devuelve las 3 columnas
-- no sensibles (nombre, logo, descripcion) de la organizacion. La app es de
-- un solo negocio por deploy (no hay selector de organizacion en el login),
-- asi que alcanza con traer la primera creada.

alter table organizations add column description text;

create or replace function get_login_branding()
returns table (name text, logo_url text, description text)
language sql
stable
security definer
set search_path = public
as $$
  select name, logo_url, description
  from organizations
  order by created_at asc
  limit 1
$$;

grant execute on function get_login_branding() to anon, authenticated;
