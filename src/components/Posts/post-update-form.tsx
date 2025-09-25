"use client";

import dayjs from "dayjs";
import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import InputGroup from "@/components/FormElements/InputGroup";
import { Switch } from "@/components/FormElements/switch";
import { HtmlEditor } from "@/components/Products/html-editor";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/utils";

import { updatePost } from "./fetch";
import { fromExistingLink, uploadImage, type UploadResult } from "./media";
import type { PostFormValues, PostRecord } from "./types";

const messageStyles = {
  success:
    "border-green-light-4 bg-green-light-7/80 text-green-dark dark:border-green-dark/60 dark:bg-green-dark/10 dark:text-green-light-7",
  error:
    "border-red-light-3 bg-red-light-6/80 text-red dark:border-red/60 dark:bg-red/10 dark:text-red",
} as const;

type ResultState = {
  type: keyof typeof messageStyles;
  message: string;
};

type PostUpdateFormProps = {
  post: PostRecord;
};

export function PostUpdateForm({ post }: PostUpdateFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<UploadResult | null>(
    post.thumbnail ? fromExistingLink(post.thumbnail) : null,
  );
  const [galleryFiles, setGalleryFiles] = useState<UploadResult[]>(
    post.gallery.map((item) => fromExistingLink(item)),
  );
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const galleryLinkInputRef = useRef<HTMLInputElement>(null);

  const createdAtLabel = useMemo(() => {
    if (!post.created_at) return "--";
    return dayjs(post.created_at).format("DD/MM/YYYY HH:mm");
  }, [post.created_at]);

  async function handleThumbnailChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setThumbnailUploading(true);
    setResult(null);

    try {
      const upload = await uploadImage(file);
      setThumbnailFile(upload);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải ảnh đại diện.");
    } finally {
      setThumbnailUploading(false);
      event.target.value = "";
    }
  }

  async function handleGalleryChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files?.length) return;

    setGalleryUploading(true);
    setResult(null);

    try {
      const uploads: UploadResult[] = [];
      for (const file of Array.from(files)) {
        const upload = await uploadImage(file);
        uploads.push(upload);
      }
      setGalleryFiles((prev) => [...prev, ...uploads]);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải thư viện ảnh.");
    } finally {
      setGalleryUploading(false);
      event.target.value = "";
    }
  }

  function addGalleryLink(raw?: string | null) {
    const value = (raw ?? galleryLinkInputRef.current?.value ?? "").trim();
    if (!value) return;
    setGalleryFiles((prev) => {
      if (prev.some((item) => item.storedUrl === value)) {
        return prev;
      }
      return [...prev, fromExistingLink(value)];
    });
    if (galleryLinkInputRef.current) {
      galleryLinkInputRef.current.value = "";
    }
  }

  function removeGalleryItem(target: UploadResult) {
    setGalleryFiles((prev) =>
      prev.filter((item) => item.storedUrl !== target.storedUrl),
    );
  }

  function handleGalleryLinkKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      addGalleryLink(event.currentTarget.value);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    if (thumbnailUploading || galleryUploading) {
      setResult({
        type: "error",
        message: "Vui lòng chờ tải ảnh hoàn tất trước khi lưu.",
      });
      return;
    }

    if (!thumbnailFile) {
      setResult({
        type: "error",
        message: "Vui lòng chọn ảnh đại diện cho bài viết.",
      });
      return;
    }

    const getValue = (key: string) =>
      (formData.get(key) ?? "").toString().trim();

    const payload: PostFormValues = {
      post_title: getValue("post_title"),
      post_description: getValue("post_description"),
      post_content: (formData.get("content") ?? "").toString().trim() || null,
      post_tag: getValue("post_tag") || null,
      thumbnail: thumbnailFile.storedUrl,
      gallery: galleryFiles.map((file) => file.storedUrl),
      is_active: formData.get("is_active") !== null,
      is_popular: formData.get("is_popular") !== null,
      priority: Number.parseInt(getValue("priority"), 10) || 0,
      meta_title: getValue("meta_title") || null,
      meta_keyword: getValue("meta_keyword") || null,
      meta_description: getValue("meta_description") || null,
    };

    if (!payload.post_title) {
      setResult({ type: "error", message: "Vui lòng nhập tiêu đề bài viết." });
      return;
    }

    if (!payload.post_description) {
      setResult({ type: "error", message: "Vui lòng nhập mô tả ngắn." });
      return;
    }

    if (!payload.post_content) {
      setResult({
        type: "error",
        message: "Vui lòng nhập nội dung chi tiết cho bài viết.",
      });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      await updatePost(post.id, payload);
      toast.success(`Đã cập nhật bài viết "${payload.post_title}"`);
      router.push("/posts/list");
      router.refresh();
    } catch (error) {
      console.error(error);
      setResult({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Không thể cập nhật bài viết, vui lòng thử lại.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-10 rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-dark dark:text-white">
            Cập nhật bài viết
          </h2>
          <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">
            Chỉnh sửa nội dung và thông tin hiển thị.
          </p>
        </div>
        <div className="text-right text-xs text-dark-6 dark:text-dark-6">
          Tạo ngày: {createdAtLabel}
        </div>
      </div>

      {result && (
        <div
          className={cn(
            "rounded-lg border px-4 py-3 text-sm",
            messageStyles[result.type],
          )}
        >
          {result.message}
        </div>
      )}

      <section className="space-y-5">
        <h3 className="text-base font-semibold text-dark dark:text-white">
          Thông tin cơ bản
        </h3>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <InputGroup
            label="Tiêu đề bài viết"
            name="post_title"
            placeholder="Nhập tiêu đề"
            type="text"
            defaultValue={post.post_title}
            required
          />
          <InputGroup
            label="Tags"
            name="post_tag"
            placeholder="fashion,summer,style"
            type="text"
            defaultValue={post.post_tag ?? ""}
          />
          <InputGroup
            label="Độ ưu tiên"
            name="priority"
            placeholder="0"
            type="number"
            defaultValue={String(post.priority ?? 0)}
          />
        </div>

        <div className="space-y-3">
          <label className="text-body-sm font-medium text-dark dark:text-white">
            Mô tả ngắn
          </label>
          <textarea
            name="post_description"
            rows={4}
            required
            defaultValue={post.post_description}
            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
            placeholder="Mô tả tóm tắt nội dung bài viết"
          />
        </div>
      </section>

      <section className="space-y-5">
        <h3 className="text-base font-semibold text-dark dark:text-white">
          Nội dung chi tiết
        </h3>
        <HtmlEditor
          name="content"
          label="Nội dung HTML"
          placeholder="<p>Nội dung bài viết...</p>"
          defaultValue={post.post_content ?? ""}
          required
        />
      </section>

      <section className="space-y-5">
        <h3 className="text-base font-semibold text-dark dark:text-white">
          Hình ảnh & Thư viện
        </h3>

        <div className="space-y-3">
          <label className="text-body-sm font-medium text-dark dark:text-white">
            Ảnh đại diện
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleThumbnailChange}
            className="block w-full cursor-pointer rounded-lg border-[1.5px] border-dashed border-stroke bg-transparent px-5.5 py-4 text-sm text-dark outline-none transition file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-primary focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:file:bg-primary"
          />
          {thumbnailUploading && (
            <p className="text-xs text-dark-6 dark:text-dark-6">
              Đang tải ảnh đại diện...
            </p>
          )}
          {thumbnailFile ? (
            <div className="flex items-center justify-between rounded-lg border border-stroke/60 px-4 py-3 text-sm dark:border-dark-3">
              <div className="flex items-center gap-3">
                <div className="h-16 w-24 overflow-hidden rounded-md border border-stroke bg-gray-1 dark:border-dark-3 dark:bg-dark-2">
                  <SafeImage
                    src={thumbnailFile.previewUrl || thumbnailFile.storedUrl}
                    alt="Thumbnail preview"
                    className="h-full w-full object-cover"
                    width={96}
                    height={64}
                    fallback={
                      <div className="grid h-full w-full place-items-center text-[10px] font-semibold uppercase text-dark-5">
                        Ảnh lỗi
                      </div>
                    }
                  />
                </div>
                <span className="font-medium text-dark dark:text-white">
                  {thumbnailFile.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setThumbnailFile(null)}
                className="text-xs font-medium text-primary hover:underline"
              >
                Gỡ ảnh
              </button>
            </div>
          ) : (
            <p className="text-xs text-dark-5 dark:text-dark-6">
              Chưa có ảnh đại diện.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <label className="text-body-sm font-medium text-dark dark:text-white">
            Thư viện ảnh
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleGalleryChange}
            className="block w-full cursor-pointer rounded-lg border-[1.5px] border-dashed border-stroke bg-transparent px-5.5 py-4 text-sm text-dark outline-none transition file:mr-4 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:border-primary focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:file:bg-primary"
          />
          {galleryUploading && (
            <p className="text-xs text-dark-6 dark:text-dark-6">
              Đang tải thư viện ảnh...
            </p>
          )}

          {galleryFiles.length ? (
            <ul className="space-y-2">
              {galleryFiles.map((file) => (
                <li
                  key={file.storedUrl}
                  className="flex items-center justify-between rounded-lg border border-stroke/60 px-4 py-3 text-sm dark:border-dark-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-16 overflow-hidden rounded-md border border-stroke bg-gray-1 dark:border-dark-3 dark:bg-dark-2">
                      <SafeImage
                        src={file.previewUrl || file.storedUrl}
                        alt={file.name}
                        className="h-full w-full object-cover"
                        width={96}
                        height={64}
                        fallback={
                          <div className="grid h-full w-full place-items-center text-[10px] font-semibold uppercase text-dark-5">
                            Ảnh lỗi
                          </div>
                        }
                      />
                    </div>
                    <span className="text-sm text-dark dark:text-white">
                      {file.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeGalleryItem(file)}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Gỡ
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-dark-5 dark:text-dark-6">
              Chưa có ảnh thư viện.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-5">
        <h3 className="text-base font-semibold text-dark dark:text-white">
          Cài đặt hiển thị & SEO
        </h3>
        <div className="flex flex-wrap items-center gap-8">
          <div className="space-y-2">
            <span className="text-sm font-medium text-dark dark:text-white">
              Hoạt động
            </span>
            <Switch name="is_active" withIcon defaultChecked={post.is_active} />
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium text-dark dark:text-white">
              Nổi bật
            </span>
            <Switch
              name="is_popular"
              withIcon
              defaultChecked={post.is_popular}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <InputGroup
            label="Meta title"
            name="meta_title"
            placeholder="Tiêu đề SEO"
            type="text"
            defaultValue={post.meta_title ?? ""}
          />
          <InputGroup
            label="Meta keywords"
            name="meta_keyword"
            placeholder="fashion,summer,style"
            type="text"
            defaultValue={post.meta_keyword ?? ""}
          />
        </div>
        <div className="space-y-3">
          <label className="text-body-sm font-medium text-dark dark:text-white">
            Meta description
          </label>
          <textarea
            name="meta_description"
            rows={3}
            defaultValue={post.meta_description ?? ""}
            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
            placeholder="Mô tả SEO cho bài viết"
          />
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/posts/list")}
          className="rounded-md border border-stroke px-6 py-2 text-sm font-medium text-dark transition hover:bg-gray-1 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3"
          disabled={isSubmitting || thumbnailUploading || galleryUploading}
        >
          Huỷ
        </button>
        <button
          type="submit"
          disabled={isSubmitting || thumbnailUploading || galleryUploading}
          className="rounded-md bg-primary px-6 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Đang lưu..." : "Cập nhật bài viết"}
        </button>
      </div>
    </form>
  );
}
