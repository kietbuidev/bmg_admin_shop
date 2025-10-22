import * as logos from "@/assets/logos";
import { buildApiUrl } from "@/lib/env";

export async function getTopProducts() {
  // Fake delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return [
    {
      image: "/images/product/product-01.png",
      name: "Apple Watch Series 7",
      category: "Electronics",
      price: 296,
      sold: 22,
      profit: 45,
    },
    {
      image: "/images/product/product-02.png",
      name: "Macbook Pro M1",
      category: "Electronics",
      price: 546,
      sold: 12,
      profit: 125,
    },
    {
      image: "/images/product/product-03.png",
      name: "Dell Inspiron 15",
      category: "Electronics",
      price: 443,
      sold: 64,
      profit: 247,
    },
    {
      image: "/images/product/product-04.png",
      name: "HP Probook 450",
      category: "Electronics",
      price: 499,
      sold: 72,
      profit: 103,
    },
  ];
}

export async function getInvoiceTableData() {
  // Fake delay
  await new Promise((resolve) => setTimeout(resolve, 1400));

  return [
    {
      name: "Free package",
      price: 0.0,
      date: "2023-01-13T18:00:00.000Z",
      status: "Paid",
    },
    {
      name: "Standard Package",
      price: 59.0,
      date: "2023-01-13T18:00:00.000Z",
      status: "Paid",
    },
    {
      name: "Business Package",
      price: 99.0,
      date: "2023-01-13T18:00:00.000Z",
      status: "Unpaid",
    },
    {
      name: "Standard Package",
      price: 59.0,
      date: "2023-01-13T18:00:00.000Z",
      status: "Pending",
    },
  ];
}

export async function getTopChannels() {
  // Fake delay
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return [
    {
      name: "Google",
      visitors: 3456,
      revenues: 4220,
      sales: 3456,
      conversion: 2.59,
      logo: logos.google,
    },
    {
      name: "X.com",
      visitors: 3456,
      revenues: 4220,
      sales: 3456,
      conversion: 2.59,
      logo: logos.x,
    },
    {
      name: "Github",
      visitors: 3456,
      revenues: 4220,
      sales: 3456,
      conversion: 2.59,
      logo: logos.github,
    },
    {
      name: "Vimeo",
      visitors: 3456,
      revenues: 4220,
      sales: 3456,
      conversion: 2.59,
      logo: logos.vimeo,
    },
    {
      name: "Facebook",
      visitors: 3456,
      revenues: 4220,
      sales: 3456,
      conversion: 2.59,
      logo: logos.facebook,
    },
  ];
}

export type ContactStatus = "New" | "In Progress" | "Resolved";

export type ContactRecord = {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  email: string;
  subject: string;
  message: string;
  attachment: string | null;
  status: ContactStatus;
  note: string;
  created_at: string;
  updated_at: string;
};

export type ContactsPagination = {
  total_page: number;
  per_page: number;
  current_page: number;
  count: number;
};

type ContactsApiRow = {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  email: string;
  subject: string;
  message: string | null;
  attachment: string | null;
  status: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type ContactsApiResponse = {
  code: number;
  message: string;
  pagination: ContactsPagination;
  rows: ContactsApiRow[];
};

export type GetContactsParams = {
  page?: number;
  limit?: number;
  signal?: AbortSignal;
};

type UpdateContactPayload = {
  status?: ContactStatus;
  note?: string;
};

const DEFAULT_CONTACTS_API_BASE_URL = buildApiUrl("api");

function normalizeBaseUrl(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

const CONTACTS_API_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_CONTACTS_API_URL ?? DEFAULT_CONTACTS_API_BASE_URL,
);

const CONTACTS_API_RESOURCE = `${CONTACTS_API_BASE_URL}/contacts`;

const STATUS_API_TO_APP: Record<string, ContactStatus> = {
  NEW: "New",
  INPROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

const STATUS_APP_TO_API: Record<ContactStatus, string> = {
  New: "NEW",
  "In Progress": "INPROGRESS",
  Resolved: "RESOLVED",
};

function normalizeStatus(input: string | null): ContactStatus {
  if (!input) return "New";
  return STATUS_API_TO_APP[input.toUpperCase()] ?? "New";
}

function mapContactRow(row: ContactsApiRow): ContactRecord {
  return {
    id: row.id,
    full_name: row.full_name,
    phone: row.phone,
    address: row.address,
    email: row.email,
    subject: row.subject,
    message: row.message ?? "",
    attachment: row.attachment,
    status: normalizeStatus(row.status),
    note: row.note ?? "",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getContacts({
  page = 1,
  limit = 10,
  signal,
}: GetContactsParams = {}): Promise<{
  rows: ContactRecord[];
  pagination: ContactsPagination;
}> {
  const url = new URL(CONTACTS_API_RESOURCE);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));

  const response = await fetch(url.toString(), {
    cache: "no-store",
    signal,
  });

  if (!response.ok) {
    throw new Error("Không thể tải danh sách liên hệ");
  }

  const data = (await response.json()) as ContactsApiResponse;

  return {
    rows: data.rows.map(mapContactRow),
    pagination: data.pagination,
  };
}

function toApiPayload(payload: UpdateContactPayload) {
  const body: Record<string, unknown> = {};

  if (payload.status) {
    body.status = STATUS_APP_TO_API[payload.status];
  }

  if (typeof payload.note === "string") {
    body.note = payload.note;
  }

  return body;
}

export async function updateContact(
  id: string,
  payload: UpdateContactPayload,
): Promise<void> {
  const body = toApiPayload(payload);

  const response = await fetch(`${CONTACTS_API_RESOURCE}/${id}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Không thể cập nhật liên hệ");
  }
}
