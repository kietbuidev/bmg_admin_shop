import {
  ProductCategorySummary,
  ProductFormPayload,
  ProductFormValues,
  ProductListResponse,
  ProductRecord,
} from "./types";

const DEFAULT_PRODUCTS_ENDPOINT =
  "https://bmgshop-production.up.railway.app/api/products";

type ProductListApiResponse = {
  code?: number;
  message?: string;
  rows?: unknown;
  pagination?: unknown;
  data?: {
    rows?: unknown;
    pagination?: unknown;
  };
};

type ProductApiRecord = Record<string, unknown>;

type ProductApiPagination = Record<string, unknown>;

export type GetProductsParams = {
  page?: number;
  limit?: number;
};

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return null;
}

function toStringValue(value: unknown, fallback = ""): string {
  const normalized = toNullableString(value);
  return normalized ?? fallback;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "yes") {
      return true;
    }
    if (normalized === "false" || normalized === "0" || normalized === "no") {
      return false;
    }
  }
  return false;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => toNullableString(item))
      .filter((item): item is string => item !== null);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => toNullableString(item))
          .filter((item): item is string => item !== null);
      }
    } catch (err) {
      // ignore JSON parse errors and fall back to splitting by comma
    }

    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeCategory(
  category: unknown,
): ProductCategorySummary | null {
  if (!category || typeof category !== "object") return null;

  const raw = category as Record<string, unknown>;
  const id = toStringValue(raw.id);

  if (!id) return null;

  return {
    id,
    name: toStringValue(raw.name),
    slug: toStringValue(raw.slug),
    description: toStringValue(raw.description),
    thumbnail: toNullableString(raw.thumbnail),
    gallery: toStringArray(raw.gallery),
    priority: toNumber(raw.priority, 0),
  };
}

function normalizeProductRecord(record: unknown): ProductRecord {
  const raw: ProductApiRecord =
    record && typeof record === "object" ? (record as ProductApiRecord) : {};

  return {
    id: toStringValue(raw.id),
    category_id: toStringValue(raw.category_id),
    name: toStringValue(raw.name),
    code: toStringValue(raw.code),
    slug: toStringValue(raw.slug),
    description: toStringValue(raw.description),
    short_description: toStringValue(raw.short_description),
    content: toStringValue(raw.content),
    thumbnail: toNullableString(raw.thumbnail),
    gallery: toStringArray(raw.gallery),
    regular_price: toStringValue(raw.regular_price),
    sale_price: toNullableString(raw.sale_price),
    percent: toNullableString(raw.percent),
    currency: toStringValue(raw.currency, "VND"),
    sizes: toStringArray(raw.sizes),
    colors: toStringArray(raw.colors),
    view_count: toStringValue(raw.view_count, "0"),
    is_active: toBoolean(raw.is_active),
    is_popular: toBoolean(raw.is_popular),
    priority: toNumber(raw.priority, 0),
    status: toNullableString(raw.status),
    meta_title: toStringValue(raw.meta_title),
    meta_keyword: toStringValue(raw.meta_keyword),
    meta_description: toStringValue(raw.meta_description),
    created_at: toStringValue(raw.created_at),
    updated_at: toStringValue(raw.updated_at),
    deleted_at: toNullableString(raw.deleted_at),
    category: normalizeCategory(raw.category),
  };
}

function normalizePagination(
  pagination: unknown,
  fallback: { perPage: number; currentPage: number; count: number },
): ProductListResponse["pagination"] {
  const raw: ProductApiPagination =
    pagination && typeof pagination === "object"
      ? (pagination as ProductApiPagination)
      : {};

  const count = toNumber(raw.count, fallback.count);
  const perPage = Math.max(1, toNumber(raw.per_page, fallback.perPage || 1));
  const currentPage = Math.max(1, toNumber(raw.current_page, fallback.currentPage));
  const totalPageFallback = perPage > 0 ? Math.ceil(count / perPage) || 1 : 1;
  const totalPage = Math.max(1, toNumber(raw.total_page, totalPageFallback));

  return {
    total_page: totalPage,
    per_page: perPage,
    current_page: currentPage,
    count,
  };
}

function resolveProductsEndpoint() {
  return (
    process.env.NEXT_PUBLIC_PRODUCTS_ENDPOINT ?? DEFAULT_PRODUCTS_ENDPOINT
  );
}

export async function getProducts({
  page = 1,
  limit = 10,
}: GetProductsParams = {}): Promise<ProductListResponse> {
  const endpoint = resolveProductsEndpoint();
  const url = new URL(endpoint);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("per_page", String(limit));

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Không thể tải danh sách sản phẩm.");
  }

  const data = (await response.json()) as ProductListApiResponse;

  if (!data) {
    throw new Error("Phản hồi sản phẩm không hợp lệ.");
  }

  if (
    data.code !== undefined &&
    data.code !== 200 &&
    data.code !== 201
  ) {
    throw new Error(data.message ?? "Máy chủ trả về lỗi khi tải sản phẩm.");
  }

  const rawRows = Array.isArray(data.rows)
    ? data.rows
    : Array.isArray(data.data?.rows)
      ? data.data?.rows
      : [];

  if (!Array.isArray(rawRows)) {
    throw new Error("Dữ liệu danh sách sản phẩm không hợp lệ.");
  }

  const rows = rawRows.map((row) => normalizeProductRecord(row));

  const paginationSource =
    (data.pagination as ProductApiPagination | undefined) ??
    (data.data?.pagination as ProductApiPagination | undefined);

  const pagination = normalizePagination(paginationSource, {
    perPage: limit,
    currentPage: page,
    count: rows.length,
  });

  return {
    rows,
    pagination,
  };
}

export async function getProductDetail(id: string): Promise<ProductRecord> {
  const endpoint = resolveProductsEndpoint();

  const response = await fetch(`${endpoint}/${id}`, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Không tìm thấy sản phẩm.");
  }

  const data = await response.json();

  if (!data || (data.code !== 200 && data.code !== 201) || !data.data) {
    throw new Error(data?.message ?? "Phản hồi sản phẩm không hợp lệ.");
  }

  return data.data as ProductRecord;
}

export async function createProduct(
  payload: ProductFormValues,
): Promise<ProductRecord> {
  const endpoint = resolveProductsEndpoint();

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(normalizePayload(payload)),
  });

  if (!response.ok) {
    throw new Error("Không thể tạo sản phẩm mới.");
  }

  const data = await response.json();

  if (!data || data.code !== 201 || !data.data) {
    throw new Error(data?.message ?? "Phản hồi tạo sản phẩm không hợp lệ.");
  }

  return data.data as ProductRecord;
}

export async function updateProduct(
  id: string,
  payload: ProductFormValues,
): Promise<ProductRecord> {
  const endpoint = resolveProductsEndpoint();

  const response = await fetch(`${endpoint}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(normalizePayload(payload)),
  });

  if (!response.ok) {
    throw new Error("Không thể cập nhật sản phẩm.");
  }

  const data = await response.json();

  if (!data || (data.code !== 200 && data.code !== 201) || !data.data) {
    throw new Error(data?.message ?? "Phản hồi cập nhật sản phẩm không hợp lệ.");
  }

  return data.data as ProductRecord;
}

function normalizePayload(payload: ProductFormValues): ProductFormPayload {
  const regular = Number.parseFloat(payload.regular_price || "0");
  const sale = Number.parseFloat(payload.sale_price || "0");
  let percent: string | null = payload.percent;
  const status = payload.status?.trim() ? payload.status.trim() : null;

  if (!percent && sale > 0 && regular > 0) {
    percent = (((regular - sale) / regular) * 100).toFixed(2);
  }

  return {
    ...payload,
    status,
    percent,
  };
}

export async function deleteProduct(id: string): Promise<void> {
  const endpoint = resolveProductsEndpoint();

  const response = await fetch(`${endpoint}/${id}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Không thể xoá sản phẩm.");
  }

  const data = await response.json();

  if (!data || data.code !== 200) {
    throw new Error(data?.message ?? "Máy chủ trả về lỗi khi xoá sản phẩm.");
  }
}
