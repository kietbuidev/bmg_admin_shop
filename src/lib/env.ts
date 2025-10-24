const FALLBACK_API_BASE_URL = "https://bmgshop-production.up.railway.app";

function normalizeBaseUrl(url: string) {
  try {
    const normalized = url.trim();
    if (!normalized) return null;

    const parsed = new URL(normalized);
    // Remove trailing slash to avoid duplications when joining paths.
    parsed.pathname = parsed.pathname.replace(/\/+$/, "");
    parsed.search = "";
    parsed.hash = "";

    return parsed.toString();
  } catch {
    return null;
  }
}

const resolvedBaseUrl =
  normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://yodelling-fly-kietbuidev-3aa551d1.koyeb.app") ??
  FALLBACK_API_BASE_URL;

export const API_BASE_URL = resolvedBaseUrl;

export function buildApiUrl(path: string) {
  const trimmedPath = path.trim();
  if (!trimmedPath) {
    return API_BASE_URL;
  }

  // Ensure we only have a single slash between base URL and path segment.
  const normalizedPath = trimmedPath.startsWith("/")
    ? trimmedPath
    : `/${trimmedPath}`;

  try {
    // Using the URL constructor avoids double slashes or duplicate segments.
    const url = new URL(normalizedPath, `${API_BASE_URL}/`);
    return url.toString();
  } catch {
    // Fallback to manual joining if URL construction fails for any reason.
    return `${API_BASE_URL}${normalizedPath}`;
  }
}
