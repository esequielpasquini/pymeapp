-- seed.sql
-- Datos de ejemplo para desarrollo local (supabase db reset lo corre automaticamente).
-- Crea 1 organizacion ("Ferreteria El Tornillo Feliz") con 1 dueno y 2 empleados,
-- 4 proveedores, 5 categorias y ~30 productos variados, mas algunos reportes de
-- faltantes.
--
-- Contrasena de todos los usuarios de prueba: "password123"

do $$
declare
  v_org_id uuid := '11111111-1111-1111-1111-111111111111';
  v_owner_id uuid := '22222222-2222-2222-2222-222222222222';
  v_emp1_id uuid := '22222222-2222-2222-2222-222222222223';
  v_emp2_id uuid := '22222222-2222-2222-2222-222222222224';

  v_sup_acme uuid := '33333333-3333-3333-3333-333333333331';
  v_sup_pinturas uuid := '33333333-3333-3333-3333-333333333332';
  v_sup_electro uuid := '33333333-3333-3333-3333-333333333333';
  v_sup_generico uuid := '33333333-3333-3333-3333-333333333334';

  v_cat_ferreteria uuid := '44444444-4444-4444-4444-444444444441';
  v_cat_pintura uuid := '44444444-4444-4444-4444-444444444442';
  v_cat_electricidad uuid := '44444444-4444-4444-4444-444444444443';
  v_cat_materiales uuid := '44444444-4444-4444-4444-444444444444';
  v_cat_general uuid := '44444444-4444-4444-4444-444444444445';
begin

  insert into organizations (id, name, slug) values
    (v_org_id, 'Ferreteria El Tornillo Feliz', 'el-tornillo-feliz');

  -- Usuarios de auth (patron estandar para seeds locales de Supabase).
  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_sso_user
  ) values
    (v_owner_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'dueno@eltornillofeliz.test', crypt('password123', gen_salt('bf')),
     now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false),
    (v_emp1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'empleado1@eltornillofeliz.test', crypt('password123', gen_salt('bf')),
     now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false),
    (v_emp2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'empleado2@eltornillofeliz.test', crypt('password123', gen_salt('bf')),
     now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false);

  insert into profiles (id, organization_id, full_name, role) values
    (v_owner_id, v_org_id, 'Marcela (Duena)', 'owner'),
    (v_emp1_id, v_org_id, 'Juan (Empleado)', 'employee'),
    (v_emp2_id, v_org_id, 'Sofia (Empleada)', 'employee');

  insert into suppliers (id, organization_id, name) values
    (v_sup_acme, v_org_id, 'Acme Ferretera SA'),
    (v_sup_pinturas, v_org_id, 'Pinturerias del Sur'),
    (v_sup_electro, v_org_id, 'Electro Insumos SRL'),
    (v_sup_generico, v_org_id, 'Distribuidora General');

  insert into categories (id, organization_id, name, icon) values
    (v_cat_ferreteria, v_org_id, 'Ferreteria', 'wrench'),
    (v_cat_pintura, v_org_id, 'Pintureria', 'paint-bucket'),
    (v_cat_electricidad, v_org_id, 'Electricidad', 'zap'),
    (v_cat_materiales, v_org_id, 'Materiales', 'package'),
    (v_cat_general, v_org_id, 'General', 'shopping-basket');

  insert into products (
    organization_id, supplier_id, category_id, brand, description, price_per_kilo, unit_price, notes, updated_by
  ) values
    (v_org_id, v_sup_acme, v_cat_ferreteria, 'Fischer', 'Tornillo autoperforante 8x1" caja x100', null, 3200, null, v_owner_id),
    (v_org_id, v_sup_acme, v_cat_ferreteria, 'Fischer', 'Tornillo galvanizado 6x1/2" caja x100', null, 1850, null, v_owner_id),
    (v_org_id, v_sup_acme, v_cat_ferreteria, 'Generico', 'Tornillo para chapa 10x2"', null, 45, null, v_owner_id),
    (v_org_id, v_sup_acme, v_cat_ferreteria, 'Generico', 'Arandela chica galvanizada', null, 12, null, v_owner_id),
    (v_org_id, v_sup_acme, v_cat_ferreteria, 'Generico', 'Arandela grande galvanizada', null, 22, null, v_owner_id),
    (v_org_id, v_sup_acme, v_cat_ferreteria, 'Stanley', 'Martillo carpintero 20oz', null, 8900, null, v_owner_id),
    (v_org_id, v_sup_acme, v_cat_ferreteria, 'Stanley', 'Destornillador phillips n2', null, 2100, null, v_owner_id),
    (v_org_id, v_sup_acme, v_cat_ferreteria, 'Truper', 'Pala punta redonda', null, 7600, null, v_owner_id),
    (v_org_id, v_sup_acme, v_cat_ferreteria, 'Truper', 'Pico de punta', null, 8200, null, v_owner_id),
    (v_org_id, v_sup_generico, v_cat_materiales, 'Generico', 'Clavo punta paris 2" (kg)', 2400, null, 'se vende por kilo', v_owner_id),
    (v_org_id, v_sup_generico, v_cat_materiales, 'Generico', 'Alambre negro n17 (kg)', 3100, null, 'se vende por kilo', v_owner_id),
    (v_org_id, v_sup_generico, v_cat_materiales, 'Generico', 'Cemento portland x50kg', null, 9800, null, v_owner_id),
    (v_org_id, v_sup_generico, v_cat_materiales, 'Generico', 'Cal hidratada x25kg', null, 4200, null, v_owner_id),
    (v_org_id, v_sup_generico, v_cat_materiales, 'Generico', 'Arena gruesa (kg)', 180, null, null, v_owner_id),
    (v_org_id, v_sup_generico, v_cat_materiales, 'Generico', 'Piedra partida (kg)', 150, null, null, v_owner_id),
    (v_org_id, v_sup_pinturas, v_cat_pintura, 'Alba', 'Latex interior blanco 20L', null, 45000, null, v_owner_id),
    (v_org_id, v_sup_pinturas, v_cat_pintura, 'Alba', 'Latex interior blanco 4L', null, 11500, null, v_owner_id),
    (v_org_id, v_sup_pinturas, v_cat_pintura, 'Sherwin Williams', 'Esmalte sintetico brillante 1L blanco', null, 8900, null, v_owner_id),
    (v_org_id, v_sup_pinturas, v_cat_pintura, 'Sherwin Williams', 'Esmalte sintetico brillante 1L negro', null, 8900, null, v_owner_id),
    (v_org_id, v_sup_pinturas, v_cat_pintura, 'Generico', 'Rodillo lana 22cm', null, 3400, null, v_owner_id),
    (v_org_id, v_sup_pinturas, v_cat_pintura, 'Generico', 'Pincel 1"', null, 1200, null, v_owner_id),
    (v_org_id, v_sup_pinturas, v_cat_pintura, 'Generico', 'Pincel 2"', null, 1900, null, v_owner_id),
    (v_org_id, v_sup_pinturas, v_cat_pintura, 'Generico', 'Bandeja para pintura', null, 2500, null, v_owner_id),
    (v_org_id, v_sup_pinturas, v_cat_pintura, 'Generico', 'Lija al agua grano 120', null, 350, null, v_owner_id),
    (v_org_id, v_sup_electro, v_cat_electricidad, 'Philips', 'Lampara led 9w luz calida', null, 1450, null, v_owner_id),
    (v_org_id, v_sup_electro, v_cat_electricidad, 'Philips', 'Lampara led 12w luz fria', null, 1800, null, v_owner_id),
    (v_org_id, v_sup_electro, v_cat_electricidad, 'Generico', 'Cable unipolar 2.5mm (metro)', 950, null, 'se vende por metro (usamos precio_kilo como precio_unidad_medida)', v_owner_id),
    (v_org_id, v_sup_electro, v_cat_electricidad, 'Generico', 'Cable unipolar 1.5mm (metro)', 650, null, 'se vende por metro', v_owner_id),
    (v_org_id, v_sup_electro, v_cat_electricidad, 'Generico', 'Llave termica 16A', null, 6200, null, v_owner_id),
    (v_org_id, v_sup_electro, v_cat_electricidad, 'Generico', 'Toma corriente doble', null, 2100, null, v_owner_id),
    (v_org_id, null, v_cat_general, 'Sin proveedor asignado', 'Producto cargado sin precio (ejemplo)', null, null, 'pendiente de cotizar', v_owner_id);

  -- Historial de precio de ejemplo para el primer producto.
  insert into price_changes (
    organization_id, product_id, previous_unit_price, new_unit_price, reason, changed_by, created_at
  )
  select v_org_id, id, 2900, 3200, 'manual', v_owner_id, now() - interval '10 days'
  from products where organization_id = v_org_id and description like 'Tornillo autoperforante%';

  -- Reportes de faltantes de ejemplo.
  insert into missing_reports (organization_id, product_name, comment, status, reported_by, created_at) values
    (v_org_id, 'Bulon 1/4 x 3" con tuerca', 'Cliente pidio 20 unidades, no lo encontre en el sistema', 'open', v_emp1_id, now() - interval '2 days'),
    (v_org_id, 'Pintura para pizarron', null, 'open', v_emp2_id, now() - interval '1 days'),
    (v_org_id, 'Silicona transparente', 'Se pregunta seguido y no tenemos precio cargado', 'resolved', v_emp1_id, now() - interval '5 days');

  update missing_reports set resolved_by = v_owner_id, resolved_at = now() - interval '4 days'
  where organization_id = v_org_id and status = 'resolved';

end $$;
