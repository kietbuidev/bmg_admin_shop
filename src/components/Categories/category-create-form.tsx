"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import dayjs from "dayjs";

import InputGroup from "@/components/FormElements/InputGroup";
import { Switch } from "@/components/FormElements/switch";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/utils";

import { createCategory } from "./fetch";
import { CategoryFormValues } from "./types";
import { UploadResult, uploadImage } from "./media";

function applyDefaults(form: HTMLFormElement | null) {
  if (!form) return;

  const priorityInput = form.elements.namedItem("priority") as
    | HTMLInputElement
    | null;
  if (priorityInput) {
    priorityInput.value = "1";
  }

  const activeInput = form.elements.namedItem("is_active") as
    | HTMLInputElement
    | null;
  if (activeInput) {
    activeInput.checked = true;
  }
}

type ResultState = {
  type: "success" | "error";
  message: string;
};

const messageStyles: Record<ResultState["type"], string> = {
  success:
    "border-green-light-4 bg-green-light-7/80 text-green-dark dark:border-green-dark/60 dark:bg-green-dark/10 dark:text-green-light-7",
  error:
    "border-red-light-3 bg-red-light-6/80 text-red dark:border-red/60 dark:bg-red/10 dark:text-red",
};

export function CategoryCreateForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<UploadResult | null>(null);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState<UploadResult[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);

  useEffect(() => {
    applyDefaults(formRef.current);
    setThumbnailFile(null);
    setGalleryFiles([]);
  }, []);

  function handleFormReset() {
    window.requestAnimationFrame(() => {
      applyDefaults(formRef.current);
      setThumbnailFile(null);
      setGalleryFiles([]);
    });
  }

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
      setResult({
        type: "error",
        message: "Không thể tải ảnh đại diện, vui lòng thử lại.",
      });
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
      const newUploads: UploadResult[] = [];
      for (const file of Array.from(files)) {
        const upload = await uploadImage(file);
        newUploads.push(upload);
      }

      setGalleryFiles((prev) => [...prev, ...newUploads]);
    } catch (error) {
      console.error(error);
      setResult({
        type: "error",
        message: "Không thể tải thư viện ảnh, vui lòng thử lại.",
      });
    } finally {
      setGalleryUploading(false);
      event.target.value = "";
    }
  }

  function removeGalleryItem(target: UploadResult) {
    setGalleryFiles((prev) =>
      prev.filter((item) => item.storedUrl !== target.storedUrl),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (thumbnailUploading || galleryUploading) {
      setResult({
        type: "error",
        message: "Vui lòng chờ tải ảnh hoàn tất trước khi lưu.",
      });
      return;
    }

    const formData = new FormData(form);
    const getValue = (key: string) => (formData.get(key) ?? "").toString().trim();

    const payload: CategoryFormValues = {
      name: getValue("name"),
      description: getValue("description"),
      parent_id: null,
      thumbnail: thumbnailFile?.storedUrl ?? null,
      gallery: galleryFiles.map((item) => item.storedUrl),
      is_active: formData.get("is_active") !== null,
      is_popular: formData.get("is_popular") !== null,
      priority: Number.parseInt(getValue("priority"), 10) || 0,
      meta_title: getValue("meta_title"),
      meta_keyword: getValue("meta_keyword"),
      meta_description: getValue("meta_description"),
    };

    if (!payload.name) {
      setResult({
        type: "error",
        message: "Vui lòng nhập tên danh mục.",
      });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const record = await createCategory(payload);

      setResult({
        type: "success",
        message: `Tạo danh mục "${record.name}" thành công vào ${dayjs(record.created_at).format("DD/MM/YYYY HH:mm")}.`,
      });

      form.reset();
      applyDefaults(form);
      setThumbnailFile(null);
      setGalleryFiles([]);
    } catch (error) {
      console.error(error);
      setResult({
        type: "error",
        message: "Không thể tạo danh mục, vui lòng thử lại sau.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      onReset={handleFormReset}
      className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dark dark:text-white">
            Tạo danh mục mới
          </h2>
          <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">
            Điền thông tin chi tiết cho danh mục sản phẩm.
          </p>
        </div>
        <div className="text-right text-xs text-dark-6 dark:text-dark-6">
          Ngày tạo dự kiến:
          <br />
          {dayjs().format("DD/MM/YYYY HH:mm")}
        </div>
      </div>

      {result && (
        <div
          className={cn(
            "mt-6 rounded-lg border px-4 py-3 text-sm",
            messageStyles[result.type],
          )}
        >
          {result.message}
        </div>
      )}

      <div className="mt-8 space-y-10">
        <section className="space-y-5">
          <div>
            <h3 className="text-base font-semibold text-dark dark:text-white">
              Thông tin cơ bản
            </h3>
            <p className="text-sm text-dark-6 dark:text-dark-6">
              Các trường bắt buộc cho danh mục hiển thị trên website.
            </p>
          </div>

          <div className="space-y-5">
            <InputGroup
              label="Tên danh mục"
              name="name"
              placeholder="Ví dụ: Trái cây nhiệt đới"
              type="text"
              required
            />
            <p className="text-sm text-dark-6 dark:text-dark-6">
              Slug sẽ được tạo tự động dựa trên tên danh mục.
            </p>
            <div className="space-y-3">
              <label className="text-body-sm font-medium text-dark dark:text-white">
                Mô tả
              </label>
              <textarea
                name="description"
                placeholder="Mô tả ngắn gọn về danh mục."
                rows={5}
                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
                required
              />
            </div>

            <InputGroup
              label="Độ ưu tiên"
              name="priority"
              placeholder="1"
              type="number"
            />

          </div>
        </section>

        <section className="space-y-5">
          <div>
            <h3 className="text-base font-semibold text-dark dark:text-white">
              Hình ảnh
            </h3>
            <p className="text-sm text-dark-6 dark:text-dark-6">
              Tải ảnh lên hệ thống, chúng sẽ được lưu lại dưới dạng URL.
            </p>
          </div>

          <div className="space-y-6">
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
                  Đang tải ảnh lên...
                </p>
              )}
              {thumbnailFile ? (
                <div className="flex items-center justify-between rounded-lg border border-stroke/60 px-4 py-3 text-sm dark:border-dark-3">
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-24 overflow-hidden rounded-md border border-stroke bg-gray-1 dark:border-dark-3 dark:bg-dark-2">
                      <SafeImage
                        src={thumbnailFile.previewUrl || thumbnailFile.storedUrl}
                        alt="Category thumbnail preview"
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
                    Gỡ ảnh này
                  </button>
                </div>
              ) : (
                <p className="text-xs text-dark-5 dark:text-dark-6">
                  Chưa có ảnh đại diện nào được chọn.
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
                      className="flex items-center justify-between rounded-lg border border-stroke/60 px-4 py-2 text-sm dark:border-dark-3"
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
                        <span className="text-dark dark:text-white">
                          {file.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeGalleryItem(file)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Gỡ ảnh
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-dark-5 dark:text-dark-6">
                  Chưa có ảnh trong thư viện.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <h3 className="text-base font-semibold text-dark dark:text-white">
              Cài đặt hiển thị
            </h3>
            <p className="text-sm text-dark-6 dark:text-dark-6">
              Điều chỉnh trạng thái hoạt động và nổi bật của danh mục.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-8">
            <div className="space-y-2">
              <span className="text-sm font-medium text-dark dark:text-white">
                Hoạt động
              </span>
              <Switch name="is_active" withIcon />
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-dark dark:text-white">
                Đánh dấu nổi bật
              </span>
              <Switch name="is_popular" withIcon />
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div>
            <h3 className="text-base font-semibold text-dark dark:text-white">
              Thông tin SEO
            </h3>
            <p className="text-sm text-dark-6 dark:text-dark-6">
              Nhập các thẻ meta để tối ưu khả năng tìm kiếm.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <InputGroup
              label="Meta title"
              name="meta_title"
              placeholder="Tiêu đề SEO"
              type="text"
              required
            />

            <InputGroup
              label="Meta keywords"
              name="meta_keyword"
              placeholder="từ khóa, cách nhau, bằng dấu phẩy"
              type="text"
            />
          </div>

          <div className="space-y-3">
            <label className="text-body-sm font-medium text-dark dark:text-white">
              Meta description
            </label>
            <textarea
              name="meta_description"
              placeholder="Mô tả ngắn cho công cụ tìm kiếm."
              rows={4}
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
            />
          </div>
        </section>
      </div>

      <div className="mt-10 flex items-center justify-end gap-3">
        <button
          type="reset"
          className="rounded-lg border border-stroke px-5 py-2.5 text-sm font-medium text-dark transition hover:bg-gray-1 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
        >
          Xóa dữ liệu
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/60"
          disabled={
            isSubmitting || thumbnailUploading || galleryUploading
          }
        >
          Lưu danh mục
          {(isSubmitting || thumbnailUploading || galleryUploading) && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" />
          )}
        </button>
      </div>
    </form>
  );
}
