import { getStoredAuth } from "@/lib/auth";
import { buildApiUrl } from "@/lib/env";

const DEFAULT_NOTIFICATIONS_ENDPOINT = buildApiUrl(
  "api/users/notifications",
);
const DEFAULT_NOTIFICATIONS_READ_ENDPOINT = buildApiUrl(
  "api/users/notifications/read",
);

export type NotificationSummary = {
  unread_count: number;
  has_new: boolean;
  last_check: string | null;
};

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string | null;
  created_at: string;
  is_new: boolean;
  is_read: boolean;
};

export type NotificationPagination = {
  total_page: number;
  per_page: number;
  current_page: number;
  count: number;
};

export type FetchNotificationsResult = {
  rows: NotificationItem[];
  pagination: NotificationPagination;
  summary: NotificationSummary;
};

function getAuthHeaders() {
  const auth = getStoredAuth();
  if (!auth?.accessToken) {
    throw new Error("Missing authentication token");
  }

  return {
    Authorization: `Bearer ${auth.accessToken}`,
    Accept: "application/json",
  } as const;
}

function resolveNotificationsEndpoint() {
  return (
    process.env.NEXT_PUBLIC_USER_NOTIFICATIONS_ENDPOINT ??
    DEFAULT_NOTIFICATIONS_ENDPOINT
  );
}

function resolveNotificationsReadEndpoint() {
  return (
    process.env.NEXT_PUBLIC_USER_NOTIFICATIONS_READ_ENDPOINT ??
    DEFAULT_NOTIFICATIONS_READ_ENDPOINT
  );
}

export async function fetchNotifications(
  page = 1,
  limit = 10,
): Promise<FetchNotificationsResult> {
  const endpoint = new URL(resolveNotificationsEndpoint());
  endpoint.searchParams.set("page", String(page));
  endpoint.searchParams.set("limit", String(limit));

  const response = await fetch(endpoint.toString(), {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to fetch notifications");
  }

  const body = (await response.json()) as {
    code?: number;
    data?: {
      rows?: unknown;
      pagination?: unknown;
      summay_status?: unknown;
    };
    message?: string;
  } | null;

  if (!body || (body.code && body.code !== 200) || !body.data) {
    throw new Error(body?.message ?? "Invalid notification response");
  }

  const rows = Array.isArray(body.data.rows) ? body.data.rows : [];
  const normalizedRows: NotificationItem[] = rows
    .map((item) => normalizeNotificationRecord(item))
    .filter((item): item is NotificationItem => item !== null);

  const pagination = normalizePagination(body.data.pagination);
  const summary = normalizeSummary(body.data.summay_status);

  return {
    rows: normalizedRows,
    pagination,
    summary,
  };
}

export async function markNotificationsRead(): Promise<void> {
  const endpoint = resolveNotificationsReadEndpoint();

  const response = await fetch(endpoint, {
    method: "PATCH",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      (errorBody && typeof errorBody.message === "string"
        ? errorBody.message
        : null) ?? "Unable to update notifications";
    throw new Error(message);
  }
}

function normalizeNotificationRecord(record: unknown): NotificationItem | null {
  if (!record || typeof record !== "object") return null;
  const raw = record as Record<string, unknown>;
  const id = typeof raw.id === "string" ? raw.id : null;
  if (!id) return null;

  return {
    id,
    title: typeof raw.title === "string" ? raw.title : "",
    message: typeof raw.message === "string" ? raw.message : "",
    type: typeof raw.type === "string" ? raw.type : null,
    created_at: typeof raw.created_at === "string" ? raw.created_at : "",
    is_new: Boolean(raw.is_new),
    is_read: Boolean(raw.is_read),
  };
}

function normalizePagination(pagination: unknown): NotificationPagination {
  const raw =
    pagination && typeof pagination === "object"
      ? (pagination as Record<string, unknown>)
      : {};

  const perPage = toNumber(raw.per_page, 10);
  const currentPage = toNumber(raw.current_page, 1);
  const totalPage = toNumber(raw.total_page, 1);
  const count = toNumber(raw.count, 0);

  return {
    per_page: perPage,
    current_page: currentPage,
    total_page: totalPage,
    count,
  };
}

function normalizeSummary(summary: unknown): NotificationSummary {
  const raw =
    summary && typeof summary === "object"
      ? (summary as Record<string, unknown>)
      : {};

  return {
    unread_count: toNumber(raw.unread_count, 0),
    has_new: Boolean(raw.has_new),
    last_check:
      typeof raw.last_check === "string" ? raw.last_check : null,
  };
}

function toNumber(value: unknown, fallback: number): number {
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
