const SAFE_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * Returns a string that can be used with next/image for remote sources.
 * Falls back to null when the input is missing or uses an unsupported protocol.
 */
export function sanitizeRemoteImageSrc(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("data:image/")) {
    return trimmed;
  }

  if (trimmed.startsWith("//")) {
    // Protocol-relative URLs are ambiguous; treat them as https for safety.
    return `https:${trimmed}`;
  }

  if (trimmed.startsWith("/")) {
    // Allow relative paths (served from the same origin / public folder)
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (!SAFE_PROTOCOLS.has(url.protocol)) {
      return null;
    }

    if (!url.hostname) {
      return null;
    }

    return url.href;
  } catch (error) {
    return null;
  }
}

export function isBlobUrl(value: string | null | undefined): value is string {
  return Boolean(value && value.trim().startsWith("blob:"));
}

export function isDataUrl(value: string | null | undefined): value is string {
  return Boolean(value && value.trim().startsWith("data:"));
}
