# Roadmap de Implementación

## Fase 0 — Fundaciones (día 1-2)
- Proyecto Supabase (Postgres + Auth + Storage).
- Migraciones: esquema + RLS + seed.
- Scaffold Next.js/Tailwind/shadcn, clientes Supabase, deploy inicial a Vercel (CI verde).

## Fase 1 — MVP funcional (semana 1-2)
- Auth (login, sesión, layout por rol).
- Búsqueda y listado de productos (empleado y dueño).
- Alta/edición manual de producto + historial de precios.
- Dashboard dueño y dashboard empleado (versión simple).

## Fase 2 — Operación diaria del dueño (semana 2-3)
- Importación de Excel con diff y vista previa.
- Ajuste masivo de precios por proveedor con redondeo.
- Reporte de faltantes (empleado) + resolución (dueño).

## Fase 3 — Pulido para primeros clientes reales (semana 3-4)
- Onboarding de una organización nueva (invitar empleados).
- Manejo de errores/edge cases de importación (columnas faltantes, filas inválidas).
- Ajustes de UX mobile para el buscador del empleado (uso real en el mostrador).
- Auditoría visible (quién cambió qué y cuándo) en la ficha de producto.

## Fase 4 — Validación con clientes (mes 2)
- Instrumentar métricas de uso básicas (búsquedas sin resultado, faltantes más
  reportados) para detectar dónde el catálogo está incompleto.
- Recolectar feedback de empleados sobre la velocidad/precisión de la búsqueda.
- Ajustar límites de plan (cantidad de productos, usuarios) si se define pricing por
  tiers.

## Futuro (post-validación, NO antes)
- Búsqueda semántica con `pgvector` + embeddings ("tornillo para chapa" ≈ "tornillo
  autoperforante").
- Alertas de precio anómalo vía WhatsApp (Business API) antes de confirmar un cambio
  que se desvía mucho del precio anterior.
- Multi-sucursal por organización (si aparece esa necesidad en clientes reales).
- Exportar de vuelta a Excel / impresión de listas de precios para mostrador.

## Principio guía

No se pasa a la fase siguiente hasta tener la anterior usable por un dueño real (no
solo "completa" en código). Se prioriza que el dueño pueda reemplazar su Excel actual lo
antes posible (Fase 1 + Fase 2), incluso si el resto del pulido llega después.
