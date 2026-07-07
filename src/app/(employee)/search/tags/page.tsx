import { TagsBrowseView } from "@/features/products/views/tags-view";

export default async function TagsBrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <TagsBrowseView q={q} basePath="/search" />;
}
