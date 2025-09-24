import { CategoryFormValues, CategoryRecord } from "./types";

const DEFAULT_CATEGORIES_ENDPOINT =
  "https://bmgshop-production.up.railway.app/api/categories";

export type CategoriesResponse = {
  rows: CategoryRecord[];
  pagination: {
    total_page: number;
    per_page: number;
    current_page: number;
    count: number;
  };
};

export type GetCategoriesParams = {
  page?: number;
  limit?: number;
};

export async function getCategories({
  page = 1,
  limit = 10,
}: GetCategoriesParams = {}): Promise<CategoriesResponse> {
  const endpoint =
    process.env.NEXT_PUBLIC_CATEGORIES_ENDPOINT ?? DEFAULT_CATEGORIES_ENDPOINT;

  const url = new URL(endpoint);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Không thể tải danh sách danh mục.");
  }

  const data = await response.json();

  if (!data || data.code !== 200 || !data.rows) {
    throw new Error(data?.message ?? "Phản hồi danh mục không hợp lệ.");
  }

  return {
    rows: data.rows as CategoryRecord[],
    pagination: data.pagination,
  };
}

export async function getCategoryDetail(id: string): Promise<CategoryRecord> {
  const endpoint =
    process.env.NEXT_PUBLIC_CATEGORIES_ENDPOINT ?? DEFAULT_CATEGORIES_ENDPOINT;

  const response = await fetch(`${endpoint}/${id}`, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Không tìm thấy danh mục.");
  }

  const data = await response.json();

  if (!data || (data.code !== 200 && data.code !== 201) || !data.data) {
    throw new Error(data?.message ?? "Phản hồi danh mục không hợp lệ.");
  }

  return data.data as CategoryRecord;
}

export async function createCategory(
  payload: CategoryFormValues,
): Promise<CategoryRecord> {
  const endpoint =
    process.env.NEXT_PUBLIC_CATEGORIES_ENDPOINT ?? DEFAULT_CATEGORIES_ENDPOINT;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      ...payload,
      parent_id: payload.parent_id ?? null,
    }),
  });
  if (!response.ok) {
    throw new Error("Không thể tạo danh mục, vui lòng thử lại sau.");
  }

  const result = await response.json();

  if (!result || result.code !== 201 || !result.data) {
    throw new Error(result?.message ?? "Phản hồi từ máy chủ không hợp lệ.");
  }

  return result.data as CategoryRecord;
}

export async function deleteCategory(id: string): Promise<void> {
  const endpoint =
    process.env.NEXT_PUBLIC_CATEGORIES_ENDPOINT ?? DEFAULT_CATEGORIES_ENDPOINT;

  const response = await fetch(`${endpoint}/${id}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Không thể xóa danh mục.");
  }

  const data = await response.json();
  if (!data || data.code !== 200) {
    throw new Error(data?.message ?? "Máy chủ trả về lỗi khi xóa danh mục.");
  }
}

export async function updateCategory(
  id: string,
  payload: CategoryFormValues,
): Promise<CategoryRecord> {
  const endpoint =
    process.env.NEXT_PUBLIC_CATEGORIES_ENDPOINT ?? DEFAULT_CATEGORIES_ENDPOINT;

  const response = await fetch(`${endpoint}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      ...payload,
      parent_id: payload.parent_id ?? null,
    }),
  });

  if (!response.ok) {
    throw new Error("Không thể cập nhật danh mục.");
  }

  const data = await response.json();

  if (!data || (data.code !== 200 && data.code !== 201) || !data.data) {
    throw new Error(data?.message ?? "Phản hồi cập nhật không hợp lệ.");
  }

  return data.data as CategoryRecord;
}
