export type ProductCategorySummary = {
  id: string;
  name: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  gallery: string[];
  priority: number;
};

export type ProductRecord = {
  id: string;
  category_id: string;
  name: string;
  code: string;
  slug: string;
  description: string;
  short_description: string;
  content: string;
  thumbnail: string | null;
  gallery: string[];
  regular_price: string;
  sale_price: string | null;
  percent: string | null;
  currency: string;
  sizes: string[];
  colors: string[];
  material: string[];
  view_count: string;
  is_active: boolean;
  is_popular: boolean;
  priority: number;
  status: string | null;
  meta_title: string;
  meta_keyword: string;
  meta_description: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  category?: ProductCategorySummary | null;
};

export type ProductFormValues = Omit<
  ProductRecord,
  | "id"
  | "slug"
  | "created_at"
  | "updated_at"
  | "deleted_at"
  | "view_count"
  | "category"
>;

export type ProductFormPayload = Omit<ProductFormValues, "percent"> & {
  percent?: string | null;
};

export type ProductListResponse = {
  rows: ProductRecord[];
  pagination: {
    total_page: number;
    per_page: number;
    current_page: number;
    count: number;
  };
};
