import { CategoryProductsView } from "@/features/products/views/category-view";

export default async function VentasCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { id } = await params;
  const { q, page } = await searchParams;
  return <CategoryProductsView id={id} q={q} page={page} basePath="/ventas" />;
}
