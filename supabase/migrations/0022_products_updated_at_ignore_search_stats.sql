-- 0022_products_updated_at_ignore_search_stats.sql
-- products.updated_at alimenta "Desactualizado" (> 60 dias, ver
-- ProductResultCard) y "Actualizados (7 dias)" del Panel. El trigger de
-- 0001_schema.sql lo pisaba con now() en CUALQUIER update de la fila --
-- incluido el de bump_product_search_counts (0015_product_search_stats.sql),
-- que solo suma search_count / last_searched_at cuando alguien busca. Asi un
-- producto buscado parecia "recien actualizado" sin que nadie tocara el
-- precio.
--
-- Ahora: si lo unico que cambio son las estadisticas de busqueda, se
-- conserva el updated_at anterior. Se compara la fila entera como jsonb sin
-- esas columnas (y sin search_text, que es generada y en un trigger BEFORE
-- todavia no esta calculada), asi cualquier columna nueva que se agregue a
-- products sigue contando como cambio real sin tener que tocar esto.

create or replace function products_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  if (to_jsonb(new) - 'search_count' - 'last_searched_at' - 'updated_at' - 'search_text')
     = (to_jsonb(old) - 'search_count' - 'last_searched_at' - 'updated_at' - 'search_text') then
    new.updated_at = old.updated_at;
  else
    new.updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on products;

create trigger products_set_updated_at
  before update on products
  for each row execute function products_set_updated_at();
