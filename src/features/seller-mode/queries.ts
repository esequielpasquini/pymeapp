import "server-only";
import { cookies } from "next/headers";
import { SELLER_MODE_COOKIE } from "@/features/seller-mode/constants";

/** Ver enterSellerMode en actions.ts. */
export async function isSellerMode(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(SELLER_MODE_COOKIE)?.value === "1";
}
