import { BrandProductsView } from "@/features/products/views/brand-view";

export default async function ProductsByBrandDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ brand: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { brand: encodedBrand } = await params;
  const brand = decodeURIComponent(encodedBrand);
  const { q, page } = await searchParams;
  return <BrandProductsView brand={brand} q={q} page={page} basePath="/products" canEdit />;
}
