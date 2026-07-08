/**
 * Filtros combinables del buscador/catalogo (SearchHomeView). Antes cada
 * dimension (categoria/marca/proveedor/tag) vivia en su propia ruta anidada
 * y se pisaban entre si al navegar; ahora todo vive en un solo lugar como
 * query params de la misma pantalla, asi que agregar/sacar un filtro nunca
 * hace perder los demas y el boton "atras" del navegador funciona solo (es
 * historial de URL comun).
 */

export type BrowseDimension = "category" | "brand" | "supplier" | "tag";

export type ProductFilters = {
  q?: string;
  category?: string;
  brand?: string;
  supplier?: string;
  tag?: string;
  /** Que selector de tiles esta abierto ahora mismo (independiente de que
   * filtros ya esten aplicados). */
  browse?: BrowseDimension;
};

const FILTER_KEYS = ["q", "category", "brand", "supplier", "tag", "browse"] as const;

/**
 * Arma un href combinando los filtros ya aplicados (`current`) con cambios
 * puntuales (`overrides`) -- nunca pisa lo que no se toca explicitamente.
 * `page` es un caso especial: nunca se hereda de `current`, cualquier
 * cambio de filtro vuelve a la pagina 1 salvo que `overrides.page` lo pida
 * a proposito (los links de paginado).
 */
export function buildFilterHref(
  basePath: string,
  current: ProductFilters,
  overrides: Partial<ProductFilters> & { page?: string }
): string {
  const merged: Partial<ProductFilters> = { ...current, ...overrides };
  const params = new URLSearchParams();

  for (const key of FILTER_KEYS) {
    const value = merged[key];
    if (value) params.set(key, value);
  }
  if (overrides.page) params.set("page", overrides.page);

  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Href para sacar un unico filtro (usado por las chips), sin tocar los
 * demas, y cerrando cualquier selector de tiles que estuviera abierto. */
export function buildRemoveFilterHref(
  basePath: string,
  current: ProductFilters,
  key: "category" | "brand" | "supplier" | "tag"
): string {
  const overrides: Partial<ProductFilters> = { browse: undefined };
  overrides[key] = undefined;
  return buildFilterHref(basePath, current, overrides);
}

export function hasActiveFilters(filters: ProductFilters): boolean {
  return Boolean(filters.q || filters.category || filters.brand || filters.supplier || filters.tag);
}
