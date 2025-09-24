export type PostRecord = {
  id: string;
  post_title: string;
  post_slug: string;
  post_description: string;
  post_content: string | null;
  post_tag: string | null;
  thumbnail: string | null;
  gallery: string[];
  is_active: boolean;
  is_popular: boolean;
  priority: number;
  meta_title: string | null;
  meta_keyword: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
};

export type PostListResponse = {
  rows: PostRecord[];
  pagination: {
    total_page: number;
    per_page: number;
    current_page: number;
    count: number;
  };
};

export type PostFormValues = {
  post_title: string;
  post_slug?: string | null;
  post_description: string;
  post_content: string | null;
  post_tag: string | null;
  thumbnail: string | null;
  gallery: string[];
  is_active: boolean;
  is_popular: boolean;
  priority: number;
  meta_title: string | null;
  meta_keyword: string | null;
  meta_description: string | null;
};

export type PostFormPayload = PostFormValues;
