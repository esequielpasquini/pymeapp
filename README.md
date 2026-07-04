# Asistente de Precios

SaaS simple para que pequeños comercios (ferreterías, corralones, pinturerías, casas de
electricidad, dietéticas, etc.) reemplacen su lista de precios en Excel por algo que
los empleados puedan consultar y el dueño pueda mantener al día, sin ser un ERP, un
sistema de facturación ni un POS.

## Documentación

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — decisiones técnicas y por qué.
- [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) — entidades y esquema.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — plan de implementación por fases.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — cómo correrlo local y desplegarlo.

## Stack

Next.js (App Router) + TypeScript + TailwindCSS + shadcn/ui · Supabase (Postgres +
Auth + Storage) · Vercel · GitHub Actions.

## Estructura

```
/src
  /app          rutas (App Router), casi sin lógica propia
  /features     lógica de negocio por funcionalidad (auth, products, imports,
                price-adjustments, missing-products, dashboard, settings)
  /components/ui  primitives de UI estilo shadcn
  /lib          clientes de Supabase, tipos, utils
/supabase
  /migrations   esquema, funciones, RLS, storage
  seed.sql      datos de ejemplo para desarrollo
```

## Quickstart

```bash
npm install
cp .env.example .env.local   # completar con los datos de tu proyecto Supabase
npm run dev
```

Ver [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) para el detalle de cómo crear el
proyecto de Supabase, aplicar migraciones y desplegar a Vercel.

## Usuarios de ejemplo (con `supabase/seed.sql` cargado)

| Rol | Email | Contraseña |
|---|---|---|
| Dueño | dueno@eltornillofeliz.test | password123 |
| Empleado | empleado1@eltornillofeliz.test | password123 |
