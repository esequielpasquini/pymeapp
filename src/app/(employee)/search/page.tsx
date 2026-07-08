import { SearchHomeView } from "@/features/products/views/search-home-view";
import type { BrowseDimension } from "@/features/products/filters";

export default async function EmployeeSearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    category?: string;
    brand?: string;
    supplier?: string;
    tag?: string;
    browse?: BrowseDimension;
    page?: string;
  }>;
}) {
  const { q, category, brand, supplier, tag, browse, page } = await searchParams;
  return (
    <SearchHomeView
      q={q}
      category={category}
      brand={brand}
      supplier={supplier}
      tag={tag}
      browse={browse}
      page={page}
      basePath="/search"
    />
  );
}
