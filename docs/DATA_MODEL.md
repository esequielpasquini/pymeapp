# Modelo de Datos

## Diagrama (conceptual)

```
organizations 1───* profiles (usuarios)
organizations 1───* suppliers
organizations 1───* products *───1 suppliers
organizations 1───* imports 1───* import_items
organizations 1───* price_changes *───1 products
organizations 1───* missing_reports
```

## Entidades

### organizations
Un comercio = un tenant.

| campo | tipo | notas |
|---|---|---|
| id | uuid pk | |
| name | text | |
| slug | text unique | para URLs/subdominios futuros |
| created_at | timestamptz | |

### profiles
Extiende `auth.users` de Supabase (1 a 1). Es la tabla que define a qué organización
pertenece cada usuario y su rol.

| campo | tipo | notas |
|---|---|---|
| id | uuid pk | = auth.users.id |
| organization_id | uuid fk | |
| full_name | text | |
| role | text | `owner` \| `employee` |
| created_at | timestamptz | |

### suppliers
| campo | tipo | notas |
|---|---|---|
| id | uuid pk | |
| organization_id | uuid fk | |
| name | text | |
| created_at | timestamptz | |

Único por `(organization_id, lower(name))`.

### products
| campo | tipo | notas |
|---|---|---|
| id | uuid pk | |
| organization_id | uuid fk | |
| supplier_id | uuid fk null | |
| brand | text null | "Marca" |
| description | text not null | "Descripción" |
| price_per_kilo | numeric(12,2) null | |
| unit_price | numeric(12,2) null | |
| notes | text null | "Observaciones" |
| is_active | boolean default true | |
| search_text | text generated | `brand || ' ' || description` normalizado, para trigram |
| created_at | timestamptz | |
| updated_at | timestamptz | se actualiza con trigger |
| updated_by | uuid null | referencia a profiles.id |

Índices:
- GIN trigram sobre `search_text` (búsqueda parcial rápida).
- btree sobre `(organization_id, supplier_id)`.
- btree sobre `(organization_id, is_active)`.

Nota de "Futuro" (pgvector): se deja reservada la columna `embedding vector(1536)`
(comentada en la migración, no creada en el MVP) para cuando se implemente búsqueda
semántica. No requiere romper el modelo actual, solo `ALTER TABLE ... ADD COLUMN`.

### imports
Cabecera de una importación de Excel.

| campo | tipo | notas |
|---|---|---|
| id | uuid pk | |
| organization_id | uuid fk | |
| file_name | text | |
| status | text | `pending_review` \| `applied` \| `cancelled` |
| created_by | uuid fk profiles | |
| created_at | timestamptz | |
| applied_at | timestamptz null | |
| summary | jsonb | conteos: `{new, modified, removed, unchanged}` |

### import_items
Detalle fila por fila de una importación (el diff calculado).

| campo | tipo | notas |
|---|---|---|
| id | uuid pk | |
| import_id | uuid fk | |
| product_id | uuid fk null | null si es producto nuevo |
| action | text | `create` \| `update` \| `remove` \| `unchanged` |
| brand | text | valores del archivo |
| description | text | |
| supplier_name | text | |
| price_per_kilo | numeric(12,2) null | |
| unit_price | numeric(12,2) null | |
| previous_price_per_kilo | numeric(12,2) null | snapshot al momento del diff |
| previous_unit_price | numeric(12,2) null | |

### price_changes
Auditoría de todo cambio de precio, sin importar el origen.

| campo | tipo | notas |
|---|---|---|
| id | uuid pk | |
| organization_id | uuid fk | |
| product_id | uuid fk | |
| previous_price_per_kilo | numeric(12,2) null | |
| new_price_per_kilo | numeric(12,2) null | |
| previous_unit_price | numeric(12,2) null | |
| new_unit_price | numeric(12,2) null | |
| reason | text | `manual` \| `import` \| `bulk_adjustment` |
| import_id | uuid fk null | si `reason = import` |
| changed_by | uuid fk profiles | |
| created_at | timestamptz | |

### missing_reports
| campo | tipo | notas |
|---|---|---|
| id | uuid pk | |
| organization_id | uuid fk | |
| product_name | text | lo que escribió el empleado (texto libre) |
| comment | text null | |
| photo_url | text null | Supabase Storage |
| status | text | `open` \| `resolved` |
| reported_by | uuid fk profiles | |
| resolved_by | uuid fk profiles null | |
| created_at | timestamptz | |
| resolved_at | timestamptz null | |

## Reglas de integridad relevantes

- Todo registro de negocio tiene `organization_id` NOT NULL con FK a `organizations`.
- `profiles.role` restringido por CHECK a `('owner','employee')`.
- Un producto sin precio_unitario NI precio_por_kilo es válido (ej: producto nuevo
  cargado sin precio todavía), pero la UI lo marca visualmente como "sin precio".
