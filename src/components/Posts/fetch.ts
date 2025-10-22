import { buildApiUrl } from "@/lib/env";

import {
  PostFormPayload,
  PostFormValues,
  PostListResponse,
  PostRecord,
} from "./types";

const DEFAULT_POSTS_ENDPOINT = buildApiUrl("api/posts");

type PostListApiResponse = {
  code?: number;
  message?: string;
  rows?: unknown;
  pagination?: unknown;
  data?: {
    rows?: unknown;
    pagination?: unknown;
    data?: unknown;
  };
};

type PostApiRecord = Record<string, unknown>;

type PostApiPagination = Record<string, unknown>;

export type GetPostsParams = {
  page?: number;
  limit?: number;
  search?: string;
};

function toNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
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
    if (["true", "1", "yes"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
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
    } catch (error) {
      // ignore JSON parsing errors, fall back to comma separated string
    }
    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizePostRecord(record: unknown): PostRecord {
  const raw: PostApiRecord =
    record && typeof record === "object" ? (record as PostApiRecord) : {};

  return {
    id: toStringValue(raw.id),
    post_title: toStringValue(raw.post_title),
    post_slug: toStringValue(raw.post_slug),
    post_description: toStringValue(raw.post_description),
    post_content: toNullableString(raw.post_content),
    post_tag: toNullableString(raw.post_tag),
    thumbnail: toNullableString(raw.thumbnail),
    gallery: toStringArray(raw.gallery),
    is_active: toBoolean(raw.is_active ?? true),
    is_popular: toBoolean(raw.is_popular),
    priority: toNumber(raw.priority, 0),
    meta_title: toNullableString(raw.meta_title),
    meta_keyword: toNullableString(raw.meta_keyword),
    meta_description: toNullableString(raw.meta_description),
    created_at: toStringValue(raw.created_at),
    updated_at: toNullableString(raw.updated_at),
    deleted_at: toNullableString(raw.deleted_at),
  };
}

function normalizePagination(
  pagination: unknown,
  fallback: { perPage: number; currentPage: number; count: number },
): PostListResponse["pagination"] {
  const raw: PostApiPagination =
    pagination && typeof pagination === "object"
      ? (pagination as PostApiPagination)
      : {};

  const perPage = Math.max(1, toNumber(raw.per_page, fallback.perPage || 10));
  const count = toNumber(raw.count, fallback.count);
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

function resolvePostsEndpoint() {
  return process.env.NEXT_PUBLIC_POSTS_ENDPOINT ?? DEFAULT_POSTS_ENDPOINT;
}

export async function getPosts({
  page = 1,
  limit = 10,
  search,
}: GetPostsParams = {}): Promise<PostListResponse> {
  const endpoint = resolvePostsEndpoint();
  const url = new URL(endpoint);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("per_page", String(limit));
  if (search) {
    url.searchParams.set("search", search);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Không thể tải danh sách bài viết.");
  }

  const data = (await response.json()) as PostListApiResponse;

  if (!data) {
    throw new Error("Phản hồi bài viết không hợp lệ.");
  }

  if (data.code !== undefined && data.code !== 200 && data.code !== 201) {
    throw new Error(data.message ?? "Máy chủ trả về lỗi khi tải bài viết.");
  }

  const rawRows = Array.isArray(data.rows)
    ? data.rows
    : Array.isArray(data.data?.rows)
      ? data.data?.rows
      : [];

  if (!Array.isArray(rawRows)) {
    throw new Error("Dữ liệu danh sách bài viết không hợp lệ.");
  }

  const rows = rawRows.map((row) => normalizePostRecord(row));

  const paginationSource =
    (data.pagination as PostApiPagination | undefined) ??
    (data.data?.pagination as PostApiPagination | undefined);

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

export async function getPostDetail(id: string): Promise<PostRecord> {
  const endpoint = resolvePostsEndpoint();

  const response = await fetch(`${endpoint}/${id}`, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Không tìm thấy bài viết.");
  }

  const data = (await response.json()) as PostListApiResponse & {
    data?: unknown;
  };

  if (!data) {
    throw new Error("Phản hồi bài viết không hợp lệ.");
  }

  if (data.code !== undefined && data.code !== 200 && data.code !== 201) {
    throw new Error(data.message ?? "Máy chủ trả về lỗi khi tải bài viết.");
  }

  const recordCandidate =
    (data.data && typeof data.data === "object"
      ? ("data" in (data.data as Record<string, unknown>)
          ? (data.data as { data?: unknown }).data
          : data.data)
      : undefined) ?? data.rows ?? data;

  const record = Array.isArray(recordCandidate)
    ? recordCandidate[0]
    : recordCandidate;

  return normalizePostRecord(record);
}

function stripNullableFields<T extends Record<string, unknown>>(input: T): T {
  const entries = Object.entries(input).filter(([, value]) => {
    if (value === null || value === undefined) {
      return false;
    }

    if (typeof value === "string" && value.trim().length === 0) {
      return false;
    }

    return true;
  });

  return Object.fromEntries(entries) as T;
}

function normalizePayload(payload: PostFormValues): PostFormPayload {
  const sanitize = (value: string | null | undefined) =>
    value !== null && value !== undefined && value.trim().length
      ? value.trim()
      : null;

  const gallery = payload.gallery
    .map((item) => item.trim())
    .filter(Boolean);

  return stripNullableFields({
    ...payload,
    post_title: payload.post_title.trim(),
    post_slug: sanitize(payload.post_slug ?? null),
    post_description: payload.post_description.trim(),
    post_content: payload.post_content ?? null,
    post_tag: sanitize(payload.post_tag),
    thumbnail: sanitize(payload.thumbnail),
    gallery,
    meta_title: sanitize(payload.meta_title),
    meta_keyword: sanitize(payload.meta_keyword),
    meta_description: sanitize(payload.meta_description),
    priority: Number.isFinite(payload.priority) ? payload.priority : 0,
    is_active: Boolean(payload.is_active),
    is_popular: Boolean(payload.is_popular),
  });
}

export async function createPost(payload: PostFormValues): Promise<PostRecord> {
  const endpoint = resolvePostsEndpoint();

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(normalizePayload(payload)),
  });

  if (!response.ok) {
    throw new Error("Không thể tạo bài viết mới.");
  }

  const data = (await response.json()) as PostListApiResponse & {
    data?: unknown;
  };

  if (!data || data.code !== 201 || !data.data) {
    throw new Error(data?.message ?? "Phản hồi tạo bài viết không hợp lệ.");
  }

  return normalizePostRecord(data.data);
}

export async function updatePost(
  id: string,
  payload: PostFormValues,
): Promise<PostRecord> {
  const endpoint = resolvePostsEndpoint();

  const response = await fetch(`${endpoint}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(normalizePayload(payload)),
  });

  if (!response.ok) {
    throw new Error("Không thể cập nhật bài viết.");
  }

  const data = (await response.json()) as PostListApiResponse & {
    data?: unknown;
  };

  if (!data || (data.code !== 200 && data.code !== 201) || !data.data) {
    throw new Error(data?.message ?? "Phản hồi cập nhật bài viết không hợp lệ.");
  }

  return normalizePostRecord(data.data);
}

export async function deletePost(id: string): Promise<void> {
  const endpoint = resolvePostsEndpoint();

  const response = await fetch(`${endpoint}/${id}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Không thể xoá bài viết.");
  }

  const data = (await response.json()) as PostListApiResponse;

  if (!data || data.code !== 200) {
    throw new Error(data?.message ?? "Máy chủ trả về lỗi khi xoá bài viết.");
  }
}
