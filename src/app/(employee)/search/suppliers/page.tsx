import { SuppliersBrowseView } from "@/features/products/views/suppliers-view";

export default async function SuppliersBrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <SuppliersBrowseView q={q} basePath="/search" />;
}
