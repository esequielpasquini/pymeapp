import { SuppliersBrowseView } from "@/features/products/views/suppliers-view";

export default async function ProductsBySupplierPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <SuppliersBrowseView q={q} basePath="/products" isOwner />;
}
