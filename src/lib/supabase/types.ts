// Tipos manuales que reflejan el esquema SQL (supabase/migrations).
export type Role = "owner" | "employee";

export type Profile = {
  id: string;
  organization_id: string;
  full_name: string;
  role: Role;
  created_at: string;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type Supplier = {
  id: string;
  organization_id: string;
  name: string;
  created_at: string;
  product_count?: number;
};

export type Category = {
  id: string;
  organization_id: string;
  name: string;
  icon: string;
  created_at: string;
  product_count?: number;
};

export type Product = {
  id: string;
  organization_id: string;
  supplier_id: string | null;
  category_id: string;
  brand: string | null;
  description: string;
  price_per_kilo: number | null;
  unit_price: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
  supplier?: Pick<Supplier, "id" | "name"> | null;
  category?: Pick<Category, "id" | "name" | "icon"> | null;
};

export type ImportStatus = "pending_review" | "applied" | "cancelled";
export type ImportItemAction = "create" | "update" | "remove" | "unchanged";

export type Import = {
  id: string;
  organization_id: string;
  file_name: string;
  status: ImportStatus;
  created_by: string | null;
  created_at: string;
  applied_at: string | null;
  summary: { new?: number; modified?: number; removed?: number; unchanged?: number };
};

export type ImportItem = {
  id: string;
  import_id: string;
  organization_id: string;
  product_id: string | null;
  action: ImportItemAction;
  brand: string | null;
  description: string;
  supplier_name: string | null;
  price_per_kilo: number | null;
  unit_price: number | null;
  previous_price_per_kilo: number | null;
  previous_unit_price: number | null;
};

export type PriceChangeReason = "manual" | "import" | "bulk_adjustment";

export type PriceChange = {
  id: string;
  organization_id: string;
  product_id: string;
  previous_price_per_kilo: number | null;
  new_price_per_kilo: number | null;
  previous_unit_price: number | null;
  new_unit_price: number | null;
  reason: PriceChangeReason;
  import_id: string | null;
  changed_by: string | null;
  created_at: string;
};

export type MissingReportStatus = "open" | "resolved";

export type MissingReport = {
  id: string;
  organization_id: string;
  product_name: string;
  comment: string | null;
  photo_url: string | null;
  status: MissingReportStatus;
  reported_by: string | null;
  resolved_by: string | null;
  created_at: string;
  resolved_at: string | null;
};

export type RoundingMode =
  | "none"
  | "nearest_1"
  | "nearest_5"
  | "nearest_10"
  | "nearest_50"
  | "nearest_100";
