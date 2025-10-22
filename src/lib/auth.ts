const STORAGE_KEY = "auth.tokens";
export const AUTH_STORAGE_KEY = STORAGE_KEY;
export const AUTH_EVENT = "auth:changed";

type AuthPayload = {
  accessToken: string;
  refreshToken: string;
  user?: AuthUser;
};

type AuthUser = {
  userId?: string;
  fullName?: string;
  email?: string;
};

type JwtPayload = {
  userId?: string;
  full_name?: string;
  fullName?: string;
  email?: string;
  [key: string]: unknown;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function emitAuthChange(detail?: { user?: AuthUser } | null) {
  if (!isBrowser()) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(AUTH_EVENT, {
      detail: detail ?? undefined,
    }),
  );
}

export type AuthJwtPayload = JwtPayload;

export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");

  if (parts.length !== 3) {
    return null;
  }

  try {
    const base64 = parts[1]?.replace(/-/g, "+").replace(/_/g, "/");
    if (!base64) {
      return null;
    }

    const json = atob(base64);
    return JSON.parse(json);
  } catch (error) {
    console.error("Failed to decode JWT payload", error);
    return null;
  }
}

export function getUserFromToken(token: string): AuthUser | undefined {
  const payload = decodeJwtPayload(token);

  if (!payload) {
    return undefined;
  }

  return {
    userId: typeof payload.userId === "string" ? payload.userId : undefined,
    fullName:
      typeof payload.full_name === "string"
        ? payload.full_name
        : typeof payload.fullName === "string"
          ? payload.fullName
          : undefined,
    email: typeof payload.email === "string" ? payload.email : undefined,
  };
}

export function persistAuth(tokens: {
  accessToken: string;
  refreshToken: string;
}) {
  if (!isBrowser()) {
    return;
  }

  const user = getUserFromToken(tokens.accessToken);

  const payload: AuthPayload = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  emitAuthChange({ user });
}

export function getStoredAuth(): AuthPayload | null {
  if (!isBrowser()) {
    return null;
  }

  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthPayload;

    if (parsed.accessToken) {
      return {
        accessToken: parsed.accessToken,
        refreshToken: parsed.refreshToken,
        user: parsed.user ?? getUserFromToken(parsed.accessToken),
      };
    }
  } catch (error) {
    console.error("Failed to parse stored auth", error);
  }

  return null;
}

export function clearAuth() {
  if (!isBrowser()) {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
  emitAuthChange(null);
}
