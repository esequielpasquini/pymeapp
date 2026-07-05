import { TagProductsView } from "@/features/products/views/tag-view";

export default async function VentasTagPage({
  params,
  searchParams,
}: {
  params: Promise<{ tag: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { tag: encodedTag } = await params;
  const tag = decodeURIComponent(encodedTag);
  const { q, page } = await searchParams;
  return <TagProductsView tag={tag} q={q} page={page} basePath="/ventas" />;
}
