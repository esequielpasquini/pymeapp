-- 0026_finanzas.sql
-- Modulo "finanzas": el dueño carga lo que entra y lo que sale para estimar
-- la ganancia del negocio. SOLO el dueño ve y escribe estas tablas (a
-- diferencia de sales/missing_reports, aca los empleados no tienen acceso
-- ni de lectura): todas las policies piden organization_id = auth_org_id()
-- Y is_owner().
--
-- Fuentes de datos:
--   * daily_sheets + daily_sheet_entries: la hoja del cuaderno donde los
--     empleados anotan las ventas del dia (efectivo y transferencias). El
--     dueño sube la foto, la IA propone los montos (borrador) y el dueño los
--     revisa y confirma. Solo las hojas confirmadas cuentan en los
--     resultados.
--   * card_payments: cobros con tarjeta (debito/credito), cargados a mano.
--     Puede haber varios por dia.
--   * supplier_invoices: facturas de proveedores (total con IVA + fecha).
--   * expenses: otros gastos (alquiler, sueldos, luz, etc.).
--
-- Es independiente de la tabla sales (pantalla Vender): por ahora el
-- negocio solo usa el cuaderno, y mezclar ambas fuentes contaria dos veces
-- las ventas que se registren en los dos lados.

insert into organization_modules (organization_id, module_key, enabled)
select id, 'finanzas', true from organizations
on conflict (organization_id, module_key) do nothing;

-- ─────────────────────────────────────────────────────────────
-- Hojas del cuaderno de ventas
-- ─────────────────────────────────────────────────────────────
create table daily_sheets (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  -- Nullable mientras es borrador: la IA puede no poder leer la fecha. Al
  -- confirmar se exige (ver confirmDailySheet).
  sheet_date        date,
  -- "Inicio $30.000": plata en la caja al abrir. Informativo, NO es venta.
  opening_cash      numeric(12,2),
  status            text not null default 'borrador' check (status in ('borrador', 'confirmada')),
  -- Path dentro del bucket privado sales-sheets (no URL: se firma al mostrar).
  photo_path        text,
  -- Respuesta cruda de la IA, para poder auditar/comparar lo que leyo
  -- contra lo que termino confirmando el dueño.
  ai_result         jsonb,
  created_by        uuid references profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index daily_sheets_org_date_idx on daily_sheets(organization_id, sheet_date desc);

-- Una sola hoja confirmada por dia: evita contar dos veces el mismo dia si
-- se sube la misma foto dos veces. Los borradores pueden repetirse.
create unique index daily_sheets_one_confirmed_per_day
  on daily_sheets(organization_id, sheet_date)
  where status = 'confirmada';

create trigger daily_sheets_set_updated_at
  before update on daily_sheets
  for each row execute function set_updated_at();

create table daily_sheet_entries (
  id                uuid primary key default gen_random_uuid(),
  sheet_id          uuid not null references daily_sheets(id) on delete cascade,
  amount            numeric(12,2) not null check (amount > 0),
  -- En el cuaderno: monto encerrado (recuadro o circulo) = transferencia;
  -- sin encerrar = efectivo.
  payment_method    text not null check (payment_method in ('efectivo', 'transferencia')),
  -- La IA marco el numero como dificil de leer: se resalta en la revision.
  -- Se apaga al confirmar la hoja (el dueño ya lo reviso).
  needs_review      boolean not null default false,
  -- Orden de lectura en la hoja (columna por columna, de arriba a abajo),
  -- para poder comparar facil contra la foto.
  position          integer not null default 0
);

create index daily_sheet_entries_sheet_idx on daily_sheet_entries(sheet_id, position);

-- ─────────────────────────────────────────────────────────────
-- Cobros con tarjeta
-- ─────────────────────────────────────────────────────────────
create table card_payments (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  payment_date      date not null,
  method            text not null check (method in ('debito', 'credito')),
  amount            numeric(12,2) not null check (amount > 0),
  note              text,
  created_by        uuid references profiles(id) on delete set null,
  created_at        timestamptz not null default now()
);

create index card_payments_org_date_idx on card_payments(organization_id, payment_date desc);

-- ─────────────────────────────────────────────────────────────
-- Facturas de proveedores
-- ─────────────────────────────────────────────────────────────
create table supplier_invoices (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  invoice_date      date not null,
  -- Mismo criterio que orders: id nullable + copia del nombre, para que la
  -- factura siga siendo legible aunque se borre el proveedor.
  supplier_id       uuid references suppliers(id) on delete set null,
  supplier_name     text not null,
  invoice_number    text,
  -- Total con IVA incluido.
  total             numeric(12,2) not null check (total > 0),
  created_by        uuid references profiles(id) on delete set null,
  created_at        timestamptz not null default now()
);

create index supplier_invoices_org_date_idx on supplier_invoices(organization_id, invoice_date desc);

-- ─────────────────────────────────────────────────────────────
-- Otros gastos
-- ─────────────────────────────────────────────────────────────
create table expenses (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  expense_date      date not null,
  -- Texto libre (alquiler, sueldos, luz...) con sugerencias en la UI, no
  -- enum: cada negocio tiene sus rubros.
  category          text not null,
  description       text,
  amount            numeric(12,2) not null check (amount > 0),
  created_by        uuid references profiles(id) on delete set null,
  created_at        timestamptz not null default now()
);

create index expenses_org_date_idx on expenses(organization_id, expense_date desc);

-- ─────────────────────────────────────────────────────────────
-- RLS: solo el dueño de la organizacion
-- ─────────────────────────────────────────────────────────────
alter table daily_sheets enable row level security;
alter table daily_sheet_entries enable row level security;
alter table card_payments enable row level security;
alter table supplier_invoices enable row level security;
alter table expenses enable row level security;

create policy daily_sheets_owner on daily_sheets
  for all
  using (organization_id = auth_org_id() and is_owner())
  with check (organization_id = auth_org_id() and is_owner());

create policy daily_sheet_entries_owner on daily_sheet_entries
  for all
  using (
    is_owner() and exists (
      select 1 from daily_sheets s where s.id = sheet_id and s.organization_id = auth_org_id()
    )
  )
  with check (
    is_owner() and exists (
      select 1 from daily_sheets s where s.id = sheet_id and s.organization_id = auth_org_id()
    )
  );

create policy card_payments_owner on card_payments
  for all
  using (organization_id = auth_org_id() and is_owner())
  with check (organization_id = auth_org_id() and is_owner());

create policy supplier_invoices_owner on supplier_invoices
  for all
  using (organization_id = auth_org_id() and is_owner())
  with check (organization_id = auth_org_id() and is_owner());

create policy expenses_owner on expenses
  for all
  using (organization_id = auth_org_id() and is_owner())
  with check (organization_id = auth_org_id() and is_owner());

-- GRANT explicito (RLS no alcanza -- ver 0005_grants.sql).
grant select, insert, update, delete on
  daily_sheets, daily_sheet_entries, card_payments, supplier_invoices, expenses
to authenticated, service_role;

-- ─────────────────────────────────────────────────────────────
-- Storage: fotos del cuaderno. Bucket PRIVADO (son numeros de caja del
-- negocio): se muestran con URLs firmadas de corta duracion. Paths
-- {organization_id}/{timestamp}.jpg.
-- ─────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('sales-sheets', 'sales-sheets', false)
on conflict (id) do nothing;

create policy sales_sheets_select on storage.objects
  for select using (
    bucket_id = 'sales-sheets'
    and (storage.foldername(name))[1] = auth_org_id()::text
    and is_owner()
  );

create policy sales_sheets_insert on storage.objects
  for insert with check (
    bucket_id = 'sales-sheets'
    and (storage.foldername(name))[1] = auth_org_id()::text
    and is_owner()
  );

create policy sales_sheets_delete on storage.objects
  for delete using (
    bucket_id = 'sales-sheets'
    and (storage.foldername(name))[1] = auth_org_id()::text
    and is_owner()
  );
