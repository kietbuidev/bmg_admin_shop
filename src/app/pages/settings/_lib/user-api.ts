import { getStoredAuth } from "@/lib/auth";

const DEFAULT_USER_PROFILE_ENDPOINT =
  "https://bmgshop-production.up.railway.app/api/users/me";
const DEFAULT_UPDATE_PROFILE_ENDPOINT =
  "https://bmgshop-production.up.railway.app/api/users/profile";
const DEFAULT_UPDATE_PASSWORD_ENDPOINT =
  "http://localhost:5001/v1/api/users/password";

export type UserProfile = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  phone_code?: string | null;
  birthday?: string | null;
  title?: string | null;
  gender?: string | null;
  country?: string | null;
  address?: string | null;
  avatar?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type UpdateUserPayload = {
  first_name: string;
  last_name: string;
  phone: string;
  phone_code: string;
  country: string | null;
  address: string | null;
};

export type UpdatePasswordPayload = {
  password: string;
  new_password: string;
  new_confirm_password: string;
};

function resolveProfileEndpoint() {
  return (
    process.env.NEXT_PUBLIC_USER_PROFILE_ENDPOINT ??
    DEFAULT_USER_PROFILE_ENDPOINT
  );
}

function resolveUpdateEndpoint() {
  return (
    process.env.NEXT_PUBLIC_USER_UPDATE_ENDPOINT ??
    DEFAULT_UPDATE_PROFILE_ENDPOINT
  );
}

function resolvePasswordEndpoint() {
  return (
    process.env.NEXT_PUBLIC_USER_PASSWORD_ENDPOINT ??
    DEFAULT_UPDATE_PASSWORD_ENDPOINT
  );
}

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

export async function fetchCurrentUser(): Promise<UserProfile> {
  const endpoint = resolveProfileEndpoint();
  const headers = getAuthHeaders();

  const response = await fetch(endpoint, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to fetch user profile");
  }

  const payload = (await response.json()) as {
    code?: number;
    data?: UserProfile;
    message?: string;
  } | null;

  if (!payload || (payload.code && payload.code !== 200) || !payload.data) {
    throw new Error(payload?.message ?? "Invalid user profile response");
  }

  return payload.data;
}

export async function updateCurrentUser(payload: UpdateUserPayload): Promise<UserProfile> {
  const endpoint = resolveUpdateEndpoint();
  const headers = {
    ...getAuthHeaders(),
    "Content-Type": "application/json",
  };

  const response = await fetch(endpoint, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      (errorBody && typeof errorBody.message === "string"
        ? errorBody.message
        : null) ?? "Unable to update profile";
    throw new Error(message);
  }

  const body = (await response.json()) as {
    code?: number;
    data?: UserProfile;
    message?: string;
  } | null;

  if (!body || (body.code && body.code !== 200) || !body.data) {
    throw new Error(body?.message ?? "Invalid update response");
  }

  return body.data;
}

export async function updateUserPassword(payload: UpdatePasswordPayload): Promise<void> {
  const endpoint = resolvePasswordEndpoint();
  const headers = {
    ...getAuthHeaders(),
    "Content-Type": "application/json",
  };

  const response = await fetch(endpoint, {
    method: "PUT",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      (errorBody && typeof errorBody.message === "string"
        ? errorBody.message
        : null) ?? "Unable to update password";
    throw new Error(message);
  }

  const result = (await response.json().catch(() => null)) as
    | {
        code?: number;
        message?: string;
      }
    | null;

  if (result && result.code && result.code !== 200) {
    throw new Error(result.message ?? "Password update failed");
  }
}
