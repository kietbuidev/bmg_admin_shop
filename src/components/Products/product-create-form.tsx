"use client";

import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import dayjs from "dayjs";
import { toast } from "react-hot-toast";

import InputGroup from "@/components/FormElements/InputGroup";
import { Switch } from "@/components/FormElements/switch";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/utils";

import { createProduct } from "./fetch";
import { UploadResult, uploadImage } from "./media";
import { ProductCategorySelect } from "./product-category-select";
import {
  PRODUCT_STATUS_VALUES,
  type ProductStatus,
  ProductFormValues,
} from "./types";
import { HtmlEditor } from "./html-editor";

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

export function ProductCreateForm() {
  const [thumbnailFile, setThumbnailFile] = useState<UploadResult | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<UploadResult[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const sizeInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const materialInputRef = useRef<HTMLInputElement>(null);
  const [regularPrice, setRegularPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);

  function addOption(type: "size" | "color" | "material", value?: string) {
    const normalized = (value ?? "").trim().replace(/\s+/g, " ");
    if (!normalized) return;

    if (type === "size") {
      setSizes((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
      if (sizeInputRef.current) sizeInputRef.current.value = "";
    } else if (type === "color") {
      setColors((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
      if (colorInputRef.current) colorInputRef.current.value = "";
    } else {
      setMaterials((prev) => (prev.includes(normalized) ? prev : [...prev, normalized]));
      if (materialInputRef.current) materialInputRef.current.value = "";
    }
  }

  function removeOption(type: "size" | "color" | "material", value: string) {
    if (type === "size") {
      setSizes((prev) => prev.filter((item) => item !== value));
    } else if (type === "color") {
      setColors((prev) => prev.filter((item) => item !== value));
    } else {
      setMaterials((prev) => prev.filter((item) => item !== value));
    }
  }

  function handleOptionKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    type: "size" | "color" | "material",
  ) {
    if (event.key === "Enter") {
      event.preventDefault();
      addOption(type, event.currentTarget.value);
    }
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

  function removeGalleryItem(target: UploadResult) {
    setGalleryFiles((prev) => prev.filter((item) => item.storedUrl !== target.storedUrl));
  }

  const computedPercent = useMemo(() => {
    const regular = Number.parseFloat(regularPrice || "0");
    const sale = Number.parseFloat(salePrice || "0");
    if (!regular || !sale || sale >= regular) return "";
    return (((regular - sale) / regular) * 100).toFixed(2);
  }, [regularPrice, salePrice]);

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

    const rawStatus = getValue("status");
    const status = PRODUCT_STATUS_VALUES.includes(rawStatus as ProductStatus)
      ? (rawStatus as ProductStatus)
      : null;

    const payload: ProductFormValues = {
      category_id: getValue("category_id"),
      name: getValue("name"),
      code: getValue("code"),
      description: getValue("description"),
      short_description: getValue("short_description"),
      content: getValue("content"),
      thumbnail: thumbnailFile?.storedUrl ?? null,
      gallery: galleryFiles.map((file) => file.storedUrl),
      regular_price: getValue("regular_price"),
      sale_price: getValue("sale_price") || null,
      percent: computedPercent || null,
      currency: getValue("currency") || "VND",
      sizes,
      colors,
      material: materials,
      is_active: formData.get("is_active") !== null,
      is_popular: formData.get("is_popular") !== null,
      priority: Number.parseInt(getValue("priority"), 10) || 0,
      status,
      meta_title: getValue("meta_title"),
      meta_keyword: getValue("meta_keyword"),
      meta_description: getValue("meta_description"),
    };

    if (!payload.category_id) {
      setResult({
        type: "error",
        message: "Vui lòng chọn danh mục sản phẩm.",
      });
      return;
    }

    if (!payload.name || !payload.code) {
      setResult({
        type: "error",
        message: "Tên và mã sản phẩm không được bỏ trống.",
      });
      return;
    }

    if (!thumbnailFile) {
      setResult({
        type: "error",
        message: "Vui lòng tải ảnh đại diện cho sản phẩm.",
      });
      return;
    }

    if (!regularPrice) {
      setResult({
        type: "error",
        message: "Giá gốc không được bỏ trống.",
      });
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const record = await createProduct(payload);
      toast.success("Đã tạo sản phẩm thành công");
      setResult({
        type: "success",
        message: `Sản phẩm được tạo lúc ${dayjs(record.created_at).format(
          "DD/MM/YYYY HH:mm",
        )}.`,
      });
      form.reset();
      setThumbnailFile(null);
      setGalleryFiles([]);
      setSizes([]);
      setColors([]);
      setMaterials([]);
      setRegularPrice("");
      setSalePrice("");
    } catch (error) {
      console.error(error);
      setResult({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Không thể tạo sản phẩm, vui lòng thử lại.",
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-dark dark:text-white">
            Tạo sản phẩm mới
          </h2>
          <p className="mt-1 text-sm text-dark-6 dark:text-dark-6">
            Điền thông tin chi tiết cho sản phẩm.
          </p>
        </div>
        <div className="text-right text-xs text-dark-6 dark:text-dark-6">
          Ngày tạo: {dayjs().format("DD/MM/YYYY HH:mm")}
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
            label="Tên sản phẩm"
            name="name"
            placeholder="Nhập tên sản phẩm"
            type="text"
            required
          />
          <ProductCategorySelect required />
          <div className="space-y-2">
            <label className="text-body-sm font-medium text-dark dark:text-white">
              Trạng thái
            </label>
            <select
              name="status"
              defaultValue=""
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
            >
              <option value="">-- Chọn trạng thái --</option>
              {PRODUCT_STATUS_VALUES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <InputGroup
            label="Mã sản phẩm"
            name="code"
            placeholder="Nhập mã sản phẩm"
            type="text"
            required
          />
          <InputGroup
            label="Giá gốc"
            name="regular_price"
            placeholder="299000"
            type="number"
            required
            value={regularPrice}
            handleChange={(event) => {
              setRegularPrice(event.target.value);
            }}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <InputGroup
            label="Giá giảm"
            name="sale_price"
            placeholder="249000"
            type="number"
            value={salePrice}
            handleChange={(event) => {
              setSalePrice(event.target.value);
            }}
            required
          />
          <InputGroup
            label="Phần trăm giảm"
            name="percent"
            placeholder="Tự động tính"
            type="text"
            value={computedPercent}
            disabled
          />
          <InputGroup
            label="Đơn vị tiền tệ"
            name="currency"
            placeholder="VND"
            type="text"
            defaultValue="VND"
          />
          <InputGroup
            label="Độ ưu tiên"
            name="priority"
            placeholder="5"
            type="number"
            defaultValue="0"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-1">
          <div className="space-y-6">
            <label className="text-body-sm font-medium text-dark dark:text-white">
              Mô tả ngắn
            </label>
            <textarea
              name="short_description"
              rows={4}
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
            />
          </div>
          <HtmlEditor
            name="content"
            label="Nội dung HTML"
            placeholder="<p>Mô tả chi tiết...</p>"
            required
          />
          <div className="space-y-6">
            <label className="text-body-sm font-medium text-dark dark:text-white">
              Mô tả chi tiết
            </label>
            <textarea
              name="description"
              rows={4}
              required
              className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
            />
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <h3 className="text-base font-semibold text-dark dark:text-white">
          Hình ảnh
        </h3>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            <label className="text-body-sm font-medium text-dark dark:text-white">
              Ảnh đại diện
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              required={!thumbnailFile}
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
                  <div className="h-20 w-20 overflow-hidden rounded-md border border-stroke bg-gray-1 dark:border-dark-3 dark:bg-dark-2">
                    <SafeImage
                      src={thumbnailFile.previewUrl || thumbnailFile.storedUrl}
                      alt="Product thumbnail preview"
                      className="h-full w-full object-cover"
                      width={80}
                      height={80}
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
                    className="flex items-center justify-between rounded-lg border border-stroke/60 px-4 py-2 text-sm dark:border-dark-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-16 w-24 overflow-hidden rounded-md border border-stroke bg-gray-1 dark:border-dark-3 dark:bg-dark-2">
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
                      <span className="text-dark dark:text-white">{file.name}</span>
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
        <h3 className="text-base font-semibold text-dark dark:text-white">
          Thuộc tính sản phẩm
        </h3>
        <div className="grid grid-cols-1 gap-5">
          <div className="space-y-3">
            <label className="text-body-sm font-medium text-dark dark:text-white">
              Kích thước
            </label>
            <div className="flex flex-wrap gap-2">
              {sizes.length ? (
                sizes.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => removeOption("size", item)}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                  >
                    {item}
                    <span aria-hidden>×</span>
                  </button>
                ))
              ) : (
                <span className="text-xs text-dark-5 dark:text-dark-6">
                  Chưa thêm kích thước.
                </span>
              )}
            </div>
            <div className="space-y-3">
              <input
                ref={sizeInputRef}
                type="text"
                placeholder="Nhập size (S, M, L...)"
                onKeyDown={(event) => handleOptionKeyDown(event, "size")}
                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
              />
              <button
                type="button"
                onClick={() => addOption("size", sizeInputRef.current?.value)}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white sm:w-auto"
              >
                Thêm
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-body-sm font-medium text-dark dark:text-white">
              Màu sắc
            </label>
            <div className="flex flex-wrap gap-2">
              {colors.length ? (
                colors.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => removeOption("color", item)}
                    className="inline-flex items-center gap-1 rounded-full bg-green-light-7 px-3 py-1 text-xs font-semibold text-green-dark"
                  >
                    {item}
                    <span aria-hidden>×</span>
                  </button>
                ))
              ) : (
                <span className="text-xs text-dark-5 dark:text-dark-6">
                  Chưa thêm màu sắc.
                </span>
              )}
            </div>
            <div className="space-y-3">
              <input
                ref={colorInputRef}
                type="text"
                placeholder="Nhập màu (Đỏ, Đen...)"
                onKeyDown={(event) => handleOptionKeyDown(event, "color")}
                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
              />
              <button
                type="button"
                onClick={() => addOption("color", colorInputRef.current?.value)}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white sm:w-auto"
              >
                Thêm
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-body-sm font-medium text-dark dark:text-white">
              Chất liệu
            </label>
            <div className="flex flex-wrap gap-2">
              {materials.length ? (
                materials.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => removeOption("material", item)}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                  >
                    {item}
                    <span aria-hidden>×</span>
                  </button>
                ))
              ) : (
                <span className="text-xs text-dark-5 dark:text-dark-6">
                  Chưa thêm chất liệu.
                </span>
              )}
            </div>
            <div className="space-y-3">
              <input
                ref={materialInputRef}
                type="text"
                placeholder="Nhập chất liệu (Cotton, Linen...)"
                onKeyDown={(event) => handleOptionKeyDown(event, "material")}
                className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
              />
              <button
                type="button"
                onClick={() => addOption("material", materialInputRef.current?.value)}
                className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white sm:w-auto"
              >
                Thêm
              </button>
            </div>
          </div>
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
            <Switch name="is_active" withIcon />
          </div>

          <div className="space-y-2">
            <span className="text-sm font-medium text-dark dark:text-white">
              Nổi bật
            </span>
            <Switch name="is_popular" withIcon />
          </div>
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
            placeholder="từ khoá, cách nhau bằng dấu phẩy"
            type="text"
          />
        </div>

        <div className="space-y-3">
          <label className="text-body-sm font-medium text-dark dark:text-white">
            Meta description
          </label>
          <textarea
            name="meta_description"
            rows={3}
            className="w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-5.5 py-3 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
          />
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <button
          type="reset"
          onClick={() => {
            setThumbnailFile(null);
            setGalleryFiles([]);
            setSizes([]);
            setColors([]);
            setMaterials([]);
            setRegularPrice("");
            setSalePrice("");
          }}
          className="rounded-lg border border-stroke px-5 py-2.5 text-sm font-medium text-dark transition hover:bg-gray-1 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
        >
          Xoá dữ liệu
        </button>
        <button
          type="submit"
          disabled={isSubmitting || thumbnailUploading || galleryUploading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-primary/60"
        >
          Lưu sản phẩm
          {(isSubmitting || thumbnailUploading || galleryUploading) && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" />
          )}
        </button>
      </div>
    </form>
  );
}
