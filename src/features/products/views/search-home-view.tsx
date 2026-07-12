import Link from "next/link";
import { AlertCircle, X } from "lucide-react";
import { searchProducts, getMostSearchedProducts, listBrandsWithCounts, listTagsWithCounts } from "@/features/products/queries";
import { listCategoriesWithCounts, getCategory } from "@/features/categories/queries";
import { getSupplier } from "@/features/suppliers/queries";
import { SearchBox } from "@/features/products/components/search-box";
import { ProductSearchResults } from "@/features/products/components/product-search-results";
import { CategoryGrid } from "@/features/products/components/category-grid";
import { BrowseTabs } from "@/features/products/components/browse-tabs";
import { SimpleFilterRows } from "@/features/products/components/simple-filter-rows";
import { MostSearchedRow } from "@/features/products/components/most-searched-row";
import { Button } from "@/components/ui/button";
import { getBrandColorMap } from "@/features/brands/queries";
import {
  buildFilterHref,
  buildRemoveFilterHref,
  hasActiveFilters,
  type BrowseDimension,
  type ProductFilters,
} from "@/features/products/filters";

/**
 * Pantalla principal de "buscar un producto y ver su precio", compartida
 * entre /search (empleado) y /products (dueño). Todos los filtros
 * (categoria/marca/proveedor/tag/texto) viven como query params de ESTA
 * misma pantalla y se combinan libremente entre si (ver
 * features/products/filters.ts) -- antes cada dimension tenia su propia
 * ruta anidada y aplicar una te hacia perder las demas.
 *
 * `browse` indica que selector de tiles esta abierto ahora mismo (para
 * agregar un filtro mas); si no hay ningun filtro aplicado y no se pidio
 * ningun selector puntual, por defecto se muestra el de categorias (la
 * pantalla de aterrizaje de siempre).
 */
export async function SearchHomeView({
  basePath,
  isOwner = false,
  q,
  category,
  brand,
  supplier,
  tag,
  browse,
  page,
}: {
  basePath: string;
  isOwner?: boolean;
  q?: string;
  category?: string;
  brand?: string;
  supplier?: string;
  tag?: string;
  browse?: BrowseDimension;
  page?: string;
}) {
  const filters: ProductFilters = { q, category, brand, supplier, tag, browse };
  const anyFilter = hasActiveFilters(filters);
  const isPristineLanding = !anyFilter && !browse;
  const effectiveBrowse: BrowseDimension | undefined = browse ?? (!anyFilter ? "category" : undefined);

  // Nombres legibles para las chips de categoria/proveedor -- marca y tag ya
  // son el nombre en si (texto libre), no hace falta resolverlos.
  const [categoryObj, supplierObj] = await Promise.all([
    category ? getCategory(category) : Promise.resolve(null),
    supplier ? getSupplier(supplier) : Promise.resolve(null),
  ]);

  const chips: { key: "category" | "brand" | "supplier" | "tag"; label: string }[] = [];
  if (category) chips.push({ key: "category", label: categoryObj?.name ?? "Categoria" });
  if (brand) chips.push({ key: "brand", label: brand });
  if (supplier) chips.push({ key: "supplier", label: supplierObj?.name ?? "Proveedor" });
  if (tag) chips.push({ key: "tag", label: `#${tag}` });

  let pickerOrResults: React.ReactNode;
  let pagination: React.ReactNode = null;

  if (effectiveBrowse) {
    if (effectiveBrowse === "category") {
      const categories = await listCategoriesWithCounts();
      pickerOrResults = <CategoryGrid categories={categories} basePath={basePath} filters={filters} />;
    } else if (effectiveBrowse === "brand") {
      // Si ya hay una categoria elegida, solo mostramos las marcas que
      // tienen productos en ESA categoria -- entrar a "Marcas" desde
      // "Alimentacion" no tiene que listar marcas de Limpieza que no
      // vendo en Alimentacion.
      const brands = await listBrandsWithCounts(category);
      pickerOrResults = (
        <SimpleFilterRows
          items={brands.map((b) => ({ id: b.brand, name: b.brand, count: b.count }))}
          basePath={basePath}
          filters={filters}
          filterKey="brand"
          emptyLabel={
            category
              ? "Todavia no hay productos con marca cargada en esta categoria."
              : "Todavia no hay productos con marca cargada."
          }
        />
      );
    } else if (effectiveBrowse === "tag") {
      const tags = await listTagsWithCounts();
      pickerOrResults = (
        <SimpleFilterRows
          items={tags.map((t) => ({ id: t.tag, name: `#${t.tag}`, count: t.count }))}
          basePath={basePath}
          filters={filters}
          filterKey="tag"
          emptyLabel="Todavia no hay productos con etiquetas cargadas."
        />
      );
    } else {
      // "supplier" ya no tiene tab/selector propio en la UI (se saco a
      // pedido) -- si se llega igual por un link viejo con ?browse=supplier,
      // mostramos categorias en vez de romper.
      const categories = await listCategoriesWithCounts();
      pickerOrResults = <CategoryGrid categories={categories} basePath={basePath} filters={filters} />;
    }
  } else {
    const [{ products, total, pageSize }, brandColorMap] = await Promise.all([
      searchProducts({
        query: q,
        categoryId: category,
        brand,
        supplierId: supplier,
        tag,
        page: page ? Number(page) : 1,
      }),
      getBrandColorMap(),
    ]);

    const currentPage = page ? Number(page) : 1;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    pickerOrResults = (
      <ProductSearchResults
        products={products}
        q={q}
        basePath={basePath}
        isOwner={isOwner}
        brandColorMap={brandColorMap}
      />
    );

    if (totalPages > 1) {
      pagination = (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              asChild
              variant={p === currentPage ? "default" : "outline"}
              size="default"
              className="h-11 w-11 md:h-12 md:w-12 md:text-base"
            >
              <Link href={buildFilterHref(basePath, filters, { page: String(p) })}>{p}</Link>
            </Button>
          ))}
        </div>
      );
    }
  }

  const mostSearched = isPristineLanding ? await getMostSearchedProducts() : [];

  return (
    <div className="mx-auto max-w-2xl space-y-4 md:max-w-4xl lg:max-w-5xl">
      <SearchBox placeholder="Que estas buscando?" />

      {isPristineLanding && <MostSearchedRow products={mostSearched} />}

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <Link
              key={chip.key}
              href={buildRemoveFilterHref(basePath, filters, chip.key)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm text-primary hover:bg-primary/20"
            >
              {chip.label}
              <X className="h-3.5 w-3.5" />
            </Link>
          ))}
        </div>
      )}

      <BrowseTabs basePath={basePath} filters={filters} />

      {pickerOrResults}

      {isPristineLanding && (
        <div className="pt-2 text-center">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-auto w-full whitespace-normal py-3 sm:w-auto md:h-12 md:px-6 md:text-base"
          >
            <Link href={`${basePath}/report`}>
              <AlertCircle className="mr-2 h-4 w-4 shrink-0" />
              Reportar un producto faltante
            </Link>
          </Button>
        </div>
      )}

      {pagination}
    </div>
  );
}
