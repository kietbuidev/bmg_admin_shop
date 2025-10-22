import { getStoredAuth, persistAuth } from "@/lib/auth";
import { buildApiUrl } from "@/lib/env";

const DEFAULT_USER_PROFILE_ENDPOINT = buildApiUrl("api/users/me");
const DEFAULT_UPDATE_PROFILE_ENDPOINT = buildApiUrl("api/users/profile");
const DEFAULT_UPDATE_PASSWORD_ENDPOINT = buildApiUrl("api/users/password");
const DEFAULT_REFRESH_TOKEN_ENDPOINT = buildApiUrl("api/users/refresh-token");

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

function resolveRefreshEndpoint() {
  return (
    process.env.NEXT_PUBLIC_USER_REFRESH_ENDPOINT ??
    DEFAULT_REFRESH_TOKEN_ENDPOINT
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

  await refreshAuthTokens();

  return body.data;
}

async function refreshAuthTokens(): Promise<void> {
  const auth = getStoredAuth();

  if (!auth?.refreshToken) {
    throw new Error("Missing refresh token");
  }

  const endpoint = resolveRefreshEndpoint();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh_token: auth.refreshToken,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        data?: {
          access_token?: string;
          refresh_token?: string;
        };
        message?: string;
      }
    | null;

  if (!response.ok) {
    const message =
      (payload && typeof payload.message === "string"
        ? payload.message
        : null) ?? "Unable to refresh authentication";
    throw new Error(message);
  }

  const tokens = payload?.data;

  if (!tokens?.access_token || !tokens?.refresh_token) {
    throw new Error("Refresh response is missing tokens");
  }

  persistAuth({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
  });
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
