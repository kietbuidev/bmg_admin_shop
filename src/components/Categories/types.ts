export type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  parent_id: string | null;
  thumbnail: string | null;
  gallery: string[];
  is_active: boolean;
  is_popular: boolean;
  priority: number | string | any;
  meta_title: string;
  meta_keyword: string;
  meta_description: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CategoryFormValues = Omit<
  CategoryRecord,
  "id" | "created_at" | "updated_at" | "deleted_at" | "slug"
>;
