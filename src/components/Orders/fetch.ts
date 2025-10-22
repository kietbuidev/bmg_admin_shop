import { buildApiUrl } from "@/lib/env";

import {
  OrderCustomer,
  OrderItem,
  OrderListResponse,
  OrderPagination,
  OrderRecord,
  OrderStatus,
} from "./types";

const DEFAULT_ORDERS_ENDPOINT = buildApiUrl("api/orders");

type OrderListApiResponse = {
  code?: number;
  message?: string;
  rows?: unknown;
  pagination?: unknown;
  data?: {
    rows?: unknown;
    pagination?: unknown;
  };
};

type OrderApiRecord = Record<string, unknown>;

type OrdersApiPagination = Record<string, unknown>;

type OrderStatusUpdateApiResponse = {
  code?: number;
  message?: string;
  data?: unknown;
  order?: unknown;
};

export type GetOrdersParams = {
  page?: number;
  limit?: number;
  status?: OrderStatus | "ALL" | null;
  search?: string | null;
  signal?: AbortSignal;
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

function toOrderStatus(value: unknown, fallback: OrderStatus = "PENDING"): OrderStatus {
  if (typeof value === "string" && value.trim()) {
    return value.trim().toUpperCase() as OrderStatus;
  }
  return fallback;
}

function normalizeCustomer(customer: unknown): OrderCustomer | null {
  if (!customer || typeof customer !== "object") return null;

  const raw = customer as Record<string, unknown>;
  const id = toNullableString(raw.id);

  if (!id) return null;

  return {
    id,
    full_name: toStringValue(raw.full_name),
    email: toStringValue(raw.email),
    phone: toStringValue(raw.phone),
    address: toStringValue(raw.address),
    note: toNullableString(raw.note),
    created_at: toStringValue(raw.created_at),
    updated_at: toStringValue(raw.updated_at),
  };
}

function normalizeItem(item: unknown): OrderItem {
  const raw = item && typeof item === "object" ? (item as Record<string, unknown>) : {};

  return {
    id: toStringValue(raw.id),
    order_id: toStringValue(raw.order_id),
    product_id: toStringValue(raw.product_id),
    product_code: toStringValue(raw.product_code),
    product_name: toStringValue(raw.product_name),
    product_thumbnail: toNullableString(raw.product_thumbnail),
    selected_size: toNullableString(raw.selected_size),
    selected_color: toNullableString(raw.selected_color),
    unit_currency: toStringValue(raw.unit_currency, "VND"),
    unit_price: toStringValue(raw.unit_price, "0"),
    unit_discount_value: toNullableString(raw.unit_discount_value),
    unit_discounted_price: toNullableString(raw.unit_discounted_price),
    quantity: Math.max(1, toNumber(raw.quantity, 1)),
    created_at: toStringValue(raw.created_at),
    updated_at: toStringValue(raw.updated_at),
  };
}

function normalizeOrder(record: unknown): OrderRecord {
  const raw: OrderApiRecord =
    record && typeof record === "object" ? (record as OrderApiRecord) : {};

  const rawItems = Array.isArray(raw.items) ? raw.items : [];
  const items = rawItems.map((item) => normalizeItem(item));
  const itemsCount = items.reduce((total, item) => total + item.quantity, 0);

  return {
    id: toStringValue(raw.id),
    order_code: toStringValue(raw.order_code),
    customer_id: toStringValue(raw.customer_id),
    status: toOrderStatus(raw.status),
    currency: toStringValue(raw.currency, "VND"),
    total_items: Math.max(itemsCount, toNumber(raw.total_items, itemsCount)),
    subtotal_amount: toStringValue(raw.subtotal_amount, "0"),
    discount_amount: toStringValue(raw.discount_amount, "0"),
    total_amount: toStringValue(raw.total_amount, "0"),
    created_at: toStringValue(raw.created_at),
    updated_at: toStringValue(raw.updated_at),
    customer: normalizeCustomer(raw.customer),
    items,
  };
}

function normalizePagination(
  pagination: unknown,
  fallback: {
    perPage: number;
    currentPage: number;
    count: number;
  },
): OrderPagination {
  const raw: OrdersApiPagination =
    pagination && typeof pagination === "object"
      ? (pagination as OrdersApiPagination)
      : {};

  const count = toNumber(raw.count, fallback.count);
  const perPage = Math.max(1, toNumber(raw.per_page, fallback.perPage || 1));
  const currentPage = Math.max(1, toNumber(raw.current_page, fallback.currentPage));
  const totalPageFallback = perPage > 0 ? Math.max(1, Math.ceil(count / perPage)) : 1;
  const totalPage = Math.max(1, toNumber(raw.total_page, totalPageFallback));

  return {
    total_page: totalPage,
    per_page: perPage,
    current_page: currentPage,
    count,
  };
}

function resolveOrdersEndpoint() {
  return process.env.NEXT_PUBLIC_ORDERS_ENDPOINT ?? DEFAULT_ORDERS_ENDPOINT;
}

export async function getOrders({
  page = 1,
  limit = 10,
  status,
  search,
  signal,
}: GetOrdersParams = {}): Promise<OrderListResponse> {
  const endpoint = resolveOrdersEndpoint();
  const url = new URL(endpoint);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("per_page", String(limit));

  if (status && status !== "ALL") {
    url.searchParams.set("status", status);
  }

  const normalizedSearch = search?.trim();
  if (normalizedSearch) {
    url.searchParams.set("search", normalizedSearch);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error("Không thể tải danh sách đơn hàng.");
  }

  const data = (await response.json()) as OrderListApiResponse | null;

  if (!data) {
    throw new Error("Phản hồi đơn hàng không hợp lệ.");
  }

  if (
    data.code !== undefined &&
    data.code !== 200 &&
    data.code !== 201
  ) {
    throw new Error(data.message ?? "Máy chủ trả về lỗi khi tải đơn hàng.");
  }

  const rawRows: unknown[] = Array.isArray(data.rows)
    ? data.rows
    : Array.isArray(data.data?.rows)
      ? data.data?.rows ?? []
      : [];

  if (!Array.isArray(rawRows)) {
    throw new Error("Dữ liệu danh sách đơn hàng không hợp lệ.");
  }

  const rows = rawRows.map((row) => normalizeOrder(row));

  const paginationSource =
    (data.pagination as OrdersApiPagination | undefined) ??
    (data.data?.pagination as OrdersApiPagination | undefined);

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

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<OrderRecord | null> {
  const endpoint = resolveOrdersEndpoint();
  const statusUrl = `${endpoint}/${id}/status`;

  const response = await fetch(statusUrl, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error("Không thể cập nhật trạng thái đơn hàng.");
  }

  const data = (await response.json()) as OrderStatusUpdateApiResponse | null;

  if (!data) {
    throw new Error("Phản hồi cập nhật đơn hàng không hợp lệ.");
  }

  if (
    data.code !== undefined &&
    data.code !== 200 &&
    data.code !== 201
  ) {
    throw new Error(data.message ?? "Máy chủ trả về lỗi khi cập nhật đơn hàng.");
  }

  const payload = data.data ?? data.order;

  if (!payload || typeof payload !== "object") {
    return null;
  }

  return normalizeOrder(payload);
}
