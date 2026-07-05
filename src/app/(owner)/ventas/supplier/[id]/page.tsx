import { SupplierProductsView } from "@/features/products/views/supplier-view";

export default async function VentasSupplierPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { id } = await params;
  const { q, page } = await searchParams;
  return <SupplierProductsView id={id} q={q} page={page} basePath="/ventas" />;
}
