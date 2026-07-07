import { BrandsBrowseView } from "@/features/products/views/brands-view";

export default async function BrandsBrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <BrandsBrowseView q={q} basePath="/search" />;
}
