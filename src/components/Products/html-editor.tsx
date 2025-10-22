"use client";

import { sanitizeRemoteImageSrc } from "@/utils/safe-image";
import { buildApiUrl } from "@/lib/env";
import { Editor } from "@tinymce/tinymce-react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { Editor as TinyMCEEditorType } from "tinymce";

interface TinyMCEBlobInfo {
  blob: () => Blob;
  filename: () => string;
}

type UploadApiResponse = {
  location?: string;
  url?: string;
  width?: number;
  height?: number;
  secure_url?: string;
  downloadLink?: string;
  previewUrl?: string;
  storedUrl?: string;
  data?: {
    webViewLink?: string;
    url?: string;
    location?: string;
    secure_url?: string;
    downloadLink?: string;
    previewUrl?: string;
    storedUrl?: string;
    width?: number;
    height?: number;
    metadata?: {
      width?: number;
      height?: number;
      [key: string]: unknown;
    };
    size?: {
      width?: number;
      height?: number;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type UploadedImage = {
  url: string;
  width?: number;
  height?: number;
  name?: string;
};

type HtmlEditorProps = {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  onChange?: (value: string) => void;
};

const DEFAULT_UPLOAD_ENDPOINT = buildApiUrl("api/system/upload-image");

function resolveUploadEndpoint() {
  return (
    process.env.NEXT_PUBLIC_PRODUCTS_UPLOAD_ENDPOINT ??
    process.env.NEXT_PUBLIC_UPLOAD_ENDPOINT ??
    DEFAULT_UPLOAD_ENDPOINT
  );
}

function resolveImageUrl(raw?: string): string | undefined {
  if (!raw) return undefined;

  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  try {
    // Đảm bảo URL hợp lệ; Cloudinary trả về https nên sẽ đi qua bước này.
    // eslint-disable-next-line no-new
    new URL(trimmed);
  } catch (error) {
    console.error("Failed to resolve image URL", error);
    return sanitizeRemoteImageSrc(trimmed) ?? trimmed;
  }

  const sanitized = sanitizeRemoteImageSrc(trimmed);
  return sanitized ?? trimmed;
}

function extractDimensions(payload: UploadApiResponse): {
  width?: number;
  height?: number;
} {
  const candidates = [
    payload?.data && (payload.data as { width?: number; height?: number }),
    payload?.data?.metadata,
    payload?.data?.size,
    payload,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const width = Number((candidate as { width?: number }).width ?? NaN);
    const height = Number((candidate as { height?: number }).height ?? NaN);
    const validWidth = Number.isFinite(width) ? width : undefined;
    const validHeight = Number.isFinite(height) ? height : undefined;
    if (validWidth || validHeight) {
      return { width: validWidth, height: validHeight };
    }
  }

  return {};
}

async function getImageDimensions(url: string): Promise<{ width?: number; height?: number }> {
  if (typeof window === "undefined") return {};

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous"; 
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        console.warn("Failed to load image for dimension check:", url);
        resolve({});
      };
      img.src = url;
    } catch (error) {
      console.warn("Failed to get image dimensions for:", url, error);
      resolve({});
    }
  });
}

async function uploadImage(file: Blob, filename: string): Promise<UploadedImage> {
  const formData = new FormData();
  formData.append("file", file, filename);
  formData.append("type", "products");

  const endpoint = resolveUploadEndpoint();

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Upload failed (status ${response.status})`);
  }

  const payload = (await response.json()) as UploadApiResponse;

  const candidates: Array<string | undefined> = [
    payload?.data?.secure_url as string | undefined,
    payload?.data?.url as string | undefined, 
    payload?.data?.location as string | undefined,
    payload?.data?.webViewLink as string | undefined,
    payload?.data?.downloadLink as string | undefined,
    payload?.data?.previewUrl as string | undefined,
    payload?.data?.storedUrl as string | undefined,
    payload?.secure_url as string | undefined,
    payload?.location as string | undefined,
    payload?.url as string | undefined,
    payload?.storedUrl as string | undefined,
  ];

  const imageUrl = candidates
    .map((value) => resolveImageUrl(value))
    .find((value) => typeof value === "string" && value.length > 0);

  if (!imageUrl) {
    throw new Error("Image URL not found in upload response.");
  }

  const dimensions = extractDimensions(payload);

  // Fallback: chỉ đo kích thước khi server chưa trả về width/height
  if (!dimensions.width || !dimensions.height) {
    const fallback = await getImageDimensions(imageUrl);
    if (fallback.width) dimensions.width = fallback.width;
    if (fallback.height) dimensions.height = fallback.height;
  }

  return {
    url: imageUrl,
    width: dimensions.width,
    height: dimensions.height,
    name:
      (payload?.data as { name?: string })?.name ||
      (payload as { name?: string })?.name ||
      filename,
  };
}

async function uploadFromBlobInfo(blobInfo: TinyMCEBlobInfo): Promise<UploadedImage> {
  return uploadImage(blobInfo.blob(), blobInfo.filename());
}

async function uploadFromFile(file: File): Promise<UploadedImage> {
  return uploadImage(file, file.name);
}

function sanitizeContent(raw: string): string {
  if (!raw) return "";
  const withoutEmptyParagraphs = raw.replace(/<p>(?:&nbsp;|\s|<br\s*\/?\>)*<\/p>/gi, "");
  const trimmed = withoutEmptyParagraphs.trim();
  return trimmed.length > 0 ? trimmed : "";
}

export function HtmlEditor({
  name,
  label,
  defaultValue = "",
  placeholder,
  required,
  onChange,
}: HtmlEditorProps) {
  const editorId = useId();
  const { resolvedTheme } = useTheme();
  const [value, setValue] = useState(() => sanitizeContent(defaultValue));
  const editorRef = useRef<TinyMCEEditorType | null>(null);

  const initialContent = useMemo(() => sanitizeContent(defaultValue), [defaultValue]);

  const applyImageMeta = useCallback(
    ({ url, width, height, alt }: { url?: string; width?: number; height?: number; alt?: string }) => {
      const editor = editorRef.current;
      if (!editor) return;

      const selectionNode = editor.selection.getNode();
      let node: HTMLImageElement | undefined;
      
      // 1. Ưu tiên ảnh đang được chọn
      if (selectionNode?.nodeName === "IMG") {
        node = selectionNode as HTMLImageElement;
      } else {
        // 2. Tìm ảnh được TinyMCE đánh dấu (thường là ảnh mới chèn)
        node = editor.dom.select("img[data-mce-selected]")[0] as HTMLImageElement | undefined;
        
        if (!node) {
          // 3. Fallback: tìm ảnh cuối cùng, thường là ảnh mới được chèn
          const allImages = editor.dom.select("img");
          if (allImages.length) {
              const lastImage = allImages[allImages.length - 1] as HTMLImageElement;
              
              // Kiểm tra: Ảnh đó phải là ảnh mới chèn (chưa có width/height hoặc có src là url mới)
              const isNewImage = !lastImage.width && !lastImage.height;
              const srcMatches = url && lastImage.src === url;
              
              if (isNewImage || srcMatches) {
                  node = lastImage;
              }
          }
        }
      }

      if (!node) return;

      const runUpdate = (imgNode: HTMLImageElement) => {
        if (url) {
          editor.dom.setAttrib(imgNode, "src", url);
          editor.dom.setAttrib(imgNode, "data-mce-src", url);
        }

        if (alt) {
          editor.dom.setAttrib(imgNode, "alt", alt);
          editor.dom.setAttrib(imgNode, "title", alt);
        }

        const roundedWidth = width && Number.isFinite(width) ? Math.round(width) : undefined;
        const roundedHeight = height && Number.isFinite(height) ? Math.round(height) : undefined;

        // Cập nhật width
        if (roundedWidth) {
          const widthValue = String(roundedWidth);
          editor.dom.setAttrib(imgNode, "width", widthValue);
          editor.dom.setAttrib(imgNode, "data-mce-width", widthValue);
          imgNode.width = roundedWidth;
        } else {
          editor.dom.setAttrib(imgNode, "width", null);
          editor.dom.setAttrib(imgNode, "data-mce-width", null);
          imgNode.removeAttribute("width");
        }

        // Cập nhật height
        if (roundedHeight) {
          const heightValue = String(roundedHeight);
          editor.dom.setAttrib(imgNode, "height", heightValue);
          editor.dom.setAttrib(imgNode, "data-mce-height", heightValue);
          imgNode.height = roundedHeight;
        } else {
          editor.dom.setAttrib(imgNode, "height", null);
          editor.dom.setAttrib(imgNode, "data-mce-height", null);
          imgNode.removeAttribute("height");
        }

        // Đảm bảo editor nhận biết thay đổi
        editor.selection.select(imgNode);
        editor.nodeChanged();
      };
      
      // Chạy ngay lập tức, và sau một chút delay để đảm bảo TinyMCE đã xử lý xong DOM
      runUpdate(node);
      window.setTimeout(() => runUpdate(node), 100);

    },
    [],
  );

  useEffect(() => {
    const sanitized = sanitizeContent(defaultValue);
    setValue(sanitized);

    const current = editorRef.current;
    if (current && sanitized !== current.getContent()) {
      current.setContent(sanitized);
    }
  }, [defaultValue]);

  const handleChange = useCallback(
    (content: string) => {
      const sanitized = sanitizeContent(content);
      setValue(sanitized);
      if (onChange) {
        onChange(sanitized);
      }
    },
    [onChange],
  );

  const contentStyle = useMemo(() => {
    const textColor = resolvedTheme === "dark" ? "#F9FAFB" : "#111928";
    const linkColor = resolvedTheme === "dark" ? "#93C5FD" : "#4F46E5";
    return `body { font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; color: ${textColor}; background-color: transparent; } a { color: ${linkColor}; } img { max-width: 100%; height: auto; }`;
  }, [resolvedTheme]);

  const editorInit = useMemo(
    () => ({
      height: 380,
      menubar: false,
      automatic_uploads: true,
      promotion: false,
      branding: false,
      placeholder,
      image_title: false,
      image_description: false,
      plugins: [
        "advlist",
        "lists",
        "link",
        "image",
        "lineheight",
        "charmap",
        "preview",
        "anchor",
        "searchreplace",
        "visualblocks",
        "code",
        "fullscreen",
        "insertdatetime",
        "table",
        "wordcount",
      ],
      toolbar:
        "undo redo | blocks fontsize | bold italic underline | align lineheight | numlist bullist indent outdent | image link | removeformat",
      file_picker_types: "image",
      skin: resolvedTheme === "dark" ? "oxide-dark" : "oxide",
      content_css: resolvedTheme === "dark" ? "dark" : "default",
      content_style: contentStyle,
      
      // *** 1. Xử lý Drag/Drop và Paste (images_upload_handler) ***
      images_upload_handler: async (blobInfo: unknown) => {
        const info = blobInfo as TinyMCEBlobInfo;
        try {
            const uploaded = await uploadFromBlobInfo(info);
            
            // Dùng setTimeout 0 để đảm bảo TinyMCE đã chèn placeholder
            setTimeout(() => {
              applyImageMeta({
                  url: uploaded.url,
                  width: uploaded.width,
                  height: uploaded.height,
                  alt: uploaded.name ?? info.filename(),
              });
            }, 0);
            
            return uploaded.url; 
        } catch (error) {
            console.error("Image upload failed:", error);
            throw new Error('Image upload failed: ' + (error as Error).message);
        }
      },
      
      // *** 2. Xử lý nút Image (file_picker_callback) ***
      file_picker_callback: (callback: (url: string, meta?: Record<string, unknown>) => void) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";

        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;

          try {
            const uploaded = await uploadFromFile(file);

            const widthString = typeof uploaded.width === "number" && Number.isFinite(uploaded.width)
                  ? String(Math.round(uploaded.width))
                  : undefined;
            const heightString = typeof uploaded.height === "number" && Number.isFinite(uploaded.height)
                  ? String(Math.round(uploaded.height))
                  : undefined;

            // Truyền kích thước và style ngay lập tức qua callback
            callback(uploaded.url, {
              alt: uploaded.name ?? file.name,
              title: uploaded.name ?? file.name,
              width: widthString,
              height: heightString,
              style: "max-width: 100%; height: auto;", 
            });
            
          } catch (error) {
            console.error("Image upload failed:", error);
          }
        };

        input.click();
      },
    }),
    [applyImageMeta, contentStyle, placeholder, resolvedTheme],
  );

  return (
    <div className="space-y-3">
      <label
        className="text-body-sm font-medium text-dark dark:text-white"
        htmlFor={editorId}
      >
        {label}
        {required && <span className="ml-1 text-red">*</span>}
      </label>

      <Editor
        id={editorId}
        apiKey="no-api-key"
        initialValue={initialContent}
        init={editorInit}
        onEditorChange={handleChange}
        onInit={(_evt, editor) => {
          editorRef.current = editor;
        }}
      />

      <input type="hidden" name={name} value={value} required={required} />
    </div>
  );
}
