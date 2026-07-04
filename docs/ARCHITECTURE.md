# Arquitectura — Asistente de Precios

## 1. Filosofía

Este producto lo mantiene una sola persona. Cada decisión técnica prioriza en este orden:

1. Simplicidad de mantenimiento por encima de "pureza" arquitectónica.
2. Velocidad para agregar/cambiar features.
3. Costo operativo bajo (idealmente free-tier de Supabase + Vercel para los primeros clientes).
4. Escalar razonablemente (decenas de miles de productos por comercio, no millones).

Explícitamente NO se usa: Clean Architecture en capas, CQRS, Event Sourcing, microservicios,
colas de mensajes, ni contenedores de inyección de dependencias. Todo es un monolito
Next.js + Postgres (Supabase). Eso es suficiente para 1-5 empleados por comercio y para
cientos de comercios como tenants.

## 2. Vista general

```
┌─────────────────────────────┐
│           Vercel            │
│  Next.js (App Router, RSC)  │
│  - Server Components: leen  │
│    datos directo de Supabase│
│  - Server Actions: mutan    │
│    datos (import, ajustes)  │
└──────────────┬──────────────┘
               │ supabase-js (con JWT del usuario)
               ▼
┌─────────────────────────────┐
│           Supabase          │
│  - Postgres (RLS)           │
│  - Auth (email/password)    │
│  - Storage (fotos faltantes)│
└─────────────────────────────┘
```

No hay backend propio (no Express/Nest/API Gateway). La "API" es Postgres + RLS,
consumida directamente desde Server Components y Server Actions de Next.js. Esto elimina
una capa entera de mantenimiento (no hay contratos REST/GraphQL que versionar).

Las únicas rutas de API (`route.ts`) que existen son las estrictamente necesarias:
webhook-like endpoints (ninguno en el MVP) y el endpoint de subida/parseo de Excel
(porque necesita correr librerías Node de parseo en el servidor).

## 3. Por qué Supabase

- Postgres administrado + RLS resuelve multi-tenancy sin escribir capa de autorización
  a mano en cada query.
- Auth incluido (evita reinventar sesiones, reseteo de contraseña, etc).
- Storage incluido para las fotos de reportes de faltantes.
- Tiene un tier gratuito/barato razonable para validar el negocio con clientes reales
  antes de invertir en infraestructura propia.

## 4. Por qué estructura "feature-based" y no por capas técnicas

Una estructura como `/controllers /services /repositories` obliga a saltar entre 4-5
carpetas para entender un flujo completo (ej: "ajuste masivo de precios"). Con
feature-based, todo lo relacionado a una funcionalidad vive junto:

```
/src
  /app                    → rutas (App Router), casi sin lógica, delega a /features
  /features
    /auth
    /products
    /imports
    /price-adjustments
    /missing-products
    /dashboard
    /settings
  /components/ui          → primitives estilo shadcn/ui (botón, input, tabla, etc)
  /lib
    /supabase             → clientes (browser/server) + tipos generados
    utils.ts
```

Cada feature tiene, cuando aplica:

```
/features/products
  actions.ts        → Server Actions (mutaciones: crear, editar, eliminar producto)
  queries.ts        → funciones de lectura (búsqueda, listado, detalle)
  components/       → componentes de UI específicos de la feature
  types.ts          → tipos específicos de la feature
```

No hay "repository pattern" ni interfaces abstractas sobre Supabase: `queries.ts` y
`actions.ts` llaman directamente al cliente de Supabase. Si en el futuro hiciera falta
cambiar de proveedor de base de datos, se reescriben esos archivos — es un costo
aceptable comparado con mantener una capa de abstracción "por las dudas" desde el día 1.

## 5. Multi-tenancy

Cada comercio es una fila en `organizations`. Todas las tablas de negocio tienen
`organization_id`. La pertenencia de un usuario a una organización se resuelve con la
tabla `profiles` (1 a 1 con `auth.users`), que guarda `organization_id` y `role`.

La autorización entre organizaciones se garantiza con RLS en Postgres (no confiamos en
que el código de la aplicación filtre correctamente — es defensa en profundidad). Ver
`docs/DATA_MODEL.md` y las migraciones de RLS.

## 6. Búsqueda de productos

Requisito: búsqueda parcial por descripción/marca/proveedor, <300ms, hasta ~100.000
productos por organización.

Solución elegida para el MVP: índices `pg_trgm` (trigram) de Postgres sobre
`descripcion`, `marca` y el nombre del proveedor (vía join), combinados con `ILIKE` /
`similarity()`. Esto da búsqueda "parcial" y tolerante a orden de palabras sin necesitar
un motor de búsqueda externo (Elasticsearch/Algolia), que sería sobre-ingeniería para
este volumen de datos y este tipo de cliente.

Ruta de evolución (NO en el MVP): agregar columna `embedding vector(1536)` con `pgvector`
y una búsqueda híbrida (trigram + semántica) para resolver casos como "tornillo para
chapa" ≈ "tornillo autoperforante". El modelo de datos ya deja lugar para esto sin
migraciones destructivas (ver DATA_MODEL.md, sección "Futuro").

## 7. Importación de Excel

El archivo se sube desde el cliente a un route handler (`/app/api/imports/route.ts`) que:

1. Lee el archivo con la librería `xlsx` (SheetJS).
2. Normaliza filas a `{marca, descripcion, proveedor, precio_kilo, precio_unitario}`.
3. Compara contra el estado actual de `products` de la organización (por una clave de
   matching: `marca + descripcion + proveedor` normalizada) para calcular el diff:
   nuevos, modificados, eliminados (presentes en la BD pero ausentes en el archivo).
4. Guarda el diff en `imports` + `import_items` con estado `pending_review` — **no
   toca `products` todavía**.
5. El dueño ve la vista previa (`/imports/[id]`) y confirma. Recién ahí un Server Action
   aplica los cambios en una transacción (Postgres function `apply_import`), registrando
   cada cambio de precio en `price_changes`.

Este flujo evita el riesgo #1 de este tipo de producto: pisar precios por accidente.

## 8. Ajuste masivo de precios

Mismo principio de "vista previa antes de aplicar": se calcula el precio propuesto en
el servidor (Server Action, sin tocar la BD), se muestra la lista completa con
actual/propuesto/diferencia, y solo al confirmar se corre una función Postgres
(`apply_bulk_price_adjustment`) que actualiza `products` y escribe `price_changes` en
una sola transacción.

## 9. Auditoría

`price_changes` es la fuente de verdad de auditoría de precios (incluye motivo:
`import`, `bulk_adjustment`, `manual`). `imports` guarda cada importación con su estado
y usuario. No se implementa un sistema de audit log genérico — son solo estas dos
tablas, que ya cubren el requisito.

## 10. Lo que deliberadamente NO se construye en el MVP

- Búsqueda semántica (pgvector) — queda preparada, no implementada.
- Integración con WhatsApp / alertas de precios anómalos.
- Multi-idioma, multi-moneda.
- Roles más granulares que owner/employee.
- Tests unitarios exhaustivos (se prioriza velocidad de entrega; se agregan tests
  puntuales solo en la lógica de cálculo de precios/redondeo, por ser la más riesgosa).
