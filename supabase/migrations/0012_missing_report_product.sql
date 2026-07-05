-- 0012_missing_report_product.sql
-- Los reportes de faltantes ahora pueden asociarse a un producto puntual del
-- catalogo (para "sin stock" de algo que ya existe) ademas de seguir
-- permitiendo texto libre (producto que todavia no esta cargado). product_id
-- queda nullable a proposito: cubre ambos casos con la misma tabla.

alter table missing_reports add column product_id uuid references products(id) on delete set null;

create index missing_reports_product_idx on missing_reports(product_id);
