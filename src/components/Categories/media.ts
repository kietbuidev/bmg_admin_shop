import { sanitizeRemoteImageSrc } from "@/utils/safe-image";

export type UploadResult = {
  name: string;
  storedUrl: string;
  previewUrl: string;
};

const DEFAULT_UPLOAD_ENDPOINT =
  "https://bmgshop-production.up.railway.app/api/system/upload-image";

export async function uploadImage(file: File): Promise<UploadResult> {
  const endpoint =
    process.env.NEXT_PUBLIC_UPLOAD_ENDPOINT ?? DEFAULT_UPLOAD_ENDPOINT;

  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", "categories");

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Tải ảnh thất bại, vui lòng thử lại.");
  }

  const payload = await response.json();

  if (!payload || payload.code !== 201 || !payload.data?.name) {
    throw new Error(payload?.message ?? "Phản hồi tải ảnh không hợp lệ.");
  }

  const webViewLink = payload.data.webViewLink as string | undefined;
  const downloadLink = payload.data.downloadLink as string | undefined;
  const storedUrl = webViewLink ?? downloadLink ?? "";

  return {
    name: payload.data.name as string,
    storedUrl,
    previewUrl: getPreviewUrl(storedUrl || downloadLink || ""),
  };
}

export function deriveFileName(link: string) {
  try {
    const url = new URL(link);
    const parts = url.pathname.split("/").filter(Boolean);

    if (parts.includes("file") && parts.includes("d")) {
      const fileIndex = parts.findIndex((part) => part === "d");
      const id = parts[fileIndex + 1];
      if (id) return decodeURIComponent(id);
    }

    const lastSegment = parts.at(-1);
    if (lastSegment) {
      return decodeURIComponent(lastSegment.split(".")[0] || lastSegment);
    }
  } catch (err) {
    // ignore parsing error
  }

  return link;
}

export function getPreviewUrl(link: string | null | undefined) {
  if (!link) return "";

  let finalLink = link;
  try {
    const url = new URL(link);
    const parts = url.pathname.split("/").filter(Boolean);

    if (parts.includes("file") && parts.includes("d")) {
      const fileIndex = parts.findIndex((part) => part === "d");
      const id = parts[fileIndex + 1];
      if (id) {
        finalLink = `https://drive.google.com/uc?export=view&id=${id}`;
        return sanitizeRemoteImageSrc(finalLink) ?? "";
      }
    }

    if (url.hostname.includes("drive.google.com")) {
      const id = url.searchParams.get("id");
      if (id) {
        finalLink = `https://drive.google.com/uc?export=view&id=${id}`;
        return sanitizeRemoteImageSrc(finalLink) ?? "";
      }
    }
  } catch (err) {
    // ignore parsing error
  }

  return sanitizeRemoteImageSrc(finalLink) ?? "";
}

export function fromExistingLink(link: string): UploadResult {
  return {
    name: deriveFileName(link),
    storedUrl: link,
    previewUrl: getPreviewUrl(link),
  };
}
