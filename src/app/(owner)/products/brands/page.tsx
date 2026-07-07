import { BrandsBrowseView } from "@/features/products/views/brands-view";

export default async function ProductsByBrandPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <BrandsBrowseView q={q} basePath="/products" isOwner />;
}
