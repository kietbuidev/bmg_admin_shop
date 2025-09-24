"use client";

import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import {
  deleteProduct,
  getProducts,
} from "./fetch";
import type { ProductListResponse, ProductRecord } from "./types";
import { getPreviewUrl } from "./media";
import { ProductActions } from "./product-actions";
import { ProductTableSkeleton } from "./product-table-skeleton";
import Image from "next/image";

const BADGE_STYLES = {
  active: "bg-green-light-7 text-green-dark",
  inactive: "bg-gray-3 text-dark-5 dark:bg-dark-3 dark:text-dark-6",
  popular: "bg-orange-light-4 text-orange-dark",
  default: "bg-gray-2 text-dark-5 dark:bg-dark-3 dark:text-dark-6",
} as const;

type BadgeVariant = keyof typeof BADGE_STYLES;

const DESCRIPTION_LIMIT = 100;

function truncate(text: string, limit = DESCRIPTION_LIMIT) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trimEnd()}…`;
}

type ProductTableClientProps = {
  initialData: ProductListResponse;
  pageSize: number;
};

export function ProductTableClient({
  initialData,
  pageSize,
}: ProductTableClientProps) {
  const [data, setData] = useState<ProductListResponse>(initialData);
  const [pageSizeState, setPageSizeState] = useState(pageSize);
  const [isFetching, setIsFetching] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { pagination } = data;
  const products = data.rows;
  const totalPages = Math.max(1, pagination.total_page || 1);
  const currentPage = pagination.current_page || 1;

  const loadPage = useCallback(
    async (page: number) => {
      try {
        setIsFetching(true);
        setError(null);
        const res = await getProducts({ page, limit: pageSizeState });
        setData(res);
        setPageSizeState(res.pagination.per_page || pageSizeState);
      } catch (err) {
        console.error(err);
        setError("Không thể tải danh sách sản phẩm.");
      } finally {
        setIsFetching(false);
      }
    },
    [pageSizeState],
  );

  useEffect(() => {
    setData(initialData);
    setPageSizeState(pageSize);
  }, [initialData, pageSize]);

  async function handleDelete(id: string, name: string) {
    if (deletingId) return;

    try {
      setDeletingId(id);
      await deleteProduct(id);
      toast.success(`Đã xoá sản phẩm "${name}"`);

      const shouldGoPrev = products.length === 1 && currentPage > 1;
      await loadPage(shouldGoPrev ? currentPage - 1 : currentPage);
    } catch (error) {
      console.error(error);
      toast.error("Không thể xoá sản phẩm, vui lòng thử lại.");
    } finally {
      setDeletingId(null);
    }
  }

  if (isFetching && products.length === 0) {
    return <ProductTableSkeleton />;
  }

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-dark dark:text-white">
            Danh sách sản phẩm
          </h2>
          <p className="text-sm text-dark-6 dark:text-dark-6">
            Tổng cộng {pagination.count ?? products.length} sản phẩm
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-light-3 bg-red-light-6/60 px-4 py-2 text-sm text-red">
            {error}
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="border-none bg-gray-1 uppercase text-sm font-medium text-dark-6 dark:bg-dark-2 dark:text-dark-7 [&>th]:py-4">
              <TableHead className="w-[32%] !text-left">Sản phẩm</TableHead>
              <TableHead className="w-[18%] !text-left">Giá</TableHead>
              <TableHead className="w-[16%] !text-left">Danh mục</TableHead>
              <TableHead className="w-[12%] text-center">Hình ảnh</TableHead>
              <TableHead className="w-[10%]">Kích thước</TableHead>
              <TableHead className="w-[8%]">Màu sắc</TableHead>
              <TableHead className="w-[8%]">Trạng thái</TableHead>
              <TableHead className="w-[8%]">Ngày tạo</TableHead>
              <TableHead className="w-[6%]">&nbsp;</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id} className="border-stroke/60 dark:border-dark-3">
                <TableCell className="!pl-0 align-top">
                  <div className="flex gap-4">
                    <div className="space-y-1">
                      <div className="text-base font-semibold text-dark dark:text-white">
                        {product.name}
                      </div>
                      <div className="text-xs uppercase tracking-wide text-dark-6 dark:text-dark-6">
                        Mã: {product.code}
                      </div>
                      <p
                        className="text-sm text-dark-5 dark:text-dark-6"
                        title={product.short_description || product.description}
                      >
                        {truncate(product.short_description || product.description)}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="align-top">
                  <div className="space-y-1 text-sm text-dark dark:text-white">
                    <p>
                      <span className="font-semibold">Giá gốc:</span> {product.regular_price}
                    </p>
                    {product.sale_price && (
                      <p>
                        <span className="font-semibold">Giá sale:</span> {product.sale_price}
                      </p>
                    )}
                    {product.percent && (
                      <p className="text-xs uppercase text-orange-dark">
                        Giảm {product.percent}%
                      </p>
                    )}
                  </div>
                </TableCell>

                <TableCell className="align-top">
                  {product.category ? (
                    <div className="space-y-1 text-sm text-dark dark:text-white">
                      <p className="font-semibold">{product.category.name}</p>
                      <p className="text-xs uppercase text-dark-6 dark:text-dark-6">
                        {product.category.slug}
                      </p>
                    </div>
                  ) : (
                    <span className="text-sm text-dark-5 dark:text-dark-6">
                      Chưa có danh mục
                    </span>
                  )}
                </TableCell>

                <TableCell className="align-top">
                  <GalleryPreview
                    thumbnail={product.thumbnail}
                    count={product.gallery.length}
                    name={product.name}
                  />
                </TableCell>

                <TableCell className="align-top">
                  {product.sizes.length ? (
                    <TagList items={product.sizes} />
                  ) : (
                    <span className="text-xs text-dark-5 dark:text-dark-6">
                      --
                    </span>
                  )}
                </TableCell>

                <TableCell className="align-top">
                  {product.colors.length ? (
                    <TagList items={product.colors} colorVariant="color" />
                  ) : (
                    <span className="text-xs text-dark-5 dark:text-dark-6">
                      --
                    </span>
                  )}
                </TableCell>

                <TableCell className="align-top">
                  <div className="space-y-2">
                    <StatusBadge
                      label={product.is_active ? "Đang bán" : "Tạm ẩn"}
                      variant={product.is_active ? "active" : "inactive"}
                    />
                    <StatusBadge
                      label={product.is_popular ? "Nổi bật" : "Thông thường"}
                      variant={product.is_popular ? "popular" : "default"}
                    />
                  </div>
                </TableCell>

                <TableCell className="align-top">
                  <div className="text-sm text-dark dark:text-white">
                    {dayjs(product.created_at).format("DD/MM/YYYY HH:mm")}
                  </div>
                </TableCell>

                <TableCell className="align-top text-right">
                <ProductActions
                  productId={product.id}
                  productName={product.name}
                  onDeleted={() => handleDelete(product.id, product.name)}
                  isDeleting={deletingId === product.id}
                />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-dark-6 dark:text-dark-6">
        <p>
          Hiển thị {products.length} / {pagination.count ?? products.length} sản phẩm
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadPage(currentPage - 1)}
            disabled={isFirstPage || isFetching}
            className="rounded-md border border-stroke px-3 py-1.5 transition hover:bg-gray-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-3 dark:hover:bg-dark-3"
          >
            Trước
          </button>

          <span className="min-w-[120px] text-center font-semibold">
            Trang {currentPage} / {totalPages}
          </span>

          <button
            type="button"
            onClick={() => loadPage(currentPage + 1)}
            disabled={isLastPage || isFetching}
            className="rounded-md border border-stroke px-3 py-1.5 transition hover:bg-gray-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-dark-3 dark:hover:bg-dark-3"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: BadgeVariant;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-w-[94px] justify-center rounded-full px-3 py-1 text-xs font-semibold",
        BADGE_STYLES[variant],
      )}
    >
      {label}
    </span>
  );
}

function TagList({
  items,
  colorVariant,
}: {
  items: string[];
  colorVariant?: "color";
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className={cn(
            "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold",
            colorVariant === "color"
              ? "bg-green-light-7 text-green-dark"
              : "bg-primary/10 text-primary",
          )}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function ProductPreviewImage({
  thumbnail,
  name,
  count,
}: {
  thumbnail: string | null;
  name: string;
  count: number;
}) {
  if (!thumbnail) {
    return (
      <div className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-stroke text-xs uppercase text-dark-5">
        No image
      </div>
    );
  }

  const preview = getPreviewUrl(thumbnail);

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="h-20 w-20 overflow-hidden rounded-md border border-stroke bg-gray-1 dark:border-dark-3 dark:bg-dark-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={preview}
          alt={`${name} thumbnail`}
          className="h-full w-full object-cover"
        />
      </div>
      <span className="text-xs text-dark-5 dark:text-dark-6">
        {count} ảnh thư viện
      </span>
    </div>
  );
}

function GalleryPreview({
  thumbnail,
  count,
  name,
}: {
  thumbnail: string | null;
  count: number;
  name: string;
}) {
  if (!thumbnail) {
    return (
      <span className="text-sm text-dark-5 dark:text-dark-6">
        Chưa có ảnh
      </span>
    );
  }

  const preview = getPreviewUrl(thumbnail);

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="h-16 w-24 overflow-hidden rounded-md border border-stroke bg-gray-1 dark:border-dark-3 dark:bg-dark-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <Image
          src={preview}
          alt={`${name} gallery thumbnail`}
          width={96}
          height={64}
          className="h-full w-full object-cover"
        />
      </div>
      <span className="text-xs font-semibold uppercase text-dark-5 dark:text-dark-6">
        {count} ảnh
      </span>
    </div>
  );
}
