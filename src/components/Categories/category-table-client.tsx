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
  CategoriesResponse,
  deleteCategory,
  getCategories,
} from "./fetch";
import { CategoryActions } from "./category-actions";
import type { CategoryRecord } from "./types";
import { getPreviewUrl } from "./media";
import { CategoryTableSkeleton } from "./category-table-skeleton";
import Image from "next/image";

const DESCRIPTION_LIMIT = 110;

const BADGE_STYLES = {
  active: "bg-green-light-7 text-green-dark",
  inactive: "bg-gray-3 text-dark-5 dark:bg-dark-3 dark:text-dark-6",
  popular: "bg-orange-light-4 text-orange-dark",
  default: "bg-gray-2 text-dark-5 dark:bg-dark-3 dark:text-dark-6",
} as const;

type BadgeVariant = keyof typeof BADGE_STYLES;

type CategoryTableClientProps = {
  initialData: CategoriesResponse;
  pageSize: number;
};

export function CategoryTableClient({
  initialData,
  pageSize,
}: CategoryTableClientProps) {
  const [data, setData] = useState<CategoriesResponse>(initialData);
  const [isFetching, setIsFetching] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { pagination } = data;
  const categories = data.rows;
  const totalPages = Math.max(1, pagination.total_page || 1);
  const currentPage = pagination.current_page || 1;

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  const loadPage = useCallback(
    async (page: number) => {
      try {
        setIsFetching(true);
        setError(null);
        const res = await getCategories({ page, limit: pageSize });
        setData(res);
      } catch (err) {
        console.error(err);
        setError("Không thể tải danh sách danh mục.");
      } finally {
        setIsFetching(false);
      }
    },
    [pageSize],
  );

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  async function handleDelete(id: string, name: string) {
    if (deletingId) return;

    try {
      setDeletingId(id);
      await deleteCategory(id);
      toast.success(`Đã xóa danh mục "${name}"`);

      const shouldGoPrev = categories.length === 1 && currentPage > 1;
      const nextPage = shouldGoPrev ? currentPage - 1 : currentPage;
      await loadPage(nextPage);
    } catch (err) {
      console.error(err);
      toast.error("Không thể xóa danh mục, vui lòng thử lại.");
    } finally {
      setDeletingId(null);
    }
  }

  if (isFetching && categories.length === 0) {
    return <CategoryTableSkeleton />;
  }

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-dark dark:text-white">
          Danh sách danh mục
        </h2>
        <p className="text-sm text-dark-6 dark:text-dark-6">
          Tổng cộng {pagination.count ?? categories.length} danh mục
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-light-3 bg-red-light-6/60 px-4 py-3 text-sm text-red">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="border-none bg-gray-1 uppercase text-sm font-medium text-dark-6 dark:bg-dark-2 dark:text-dark-7 [&>th]:py-4">
              <TableHead className="w-[28%] !text-left">Danh mục</TableHead>
              <TableHead className="w-[24%] !text-left">Meta</TableHead>
              <TableHead className="w-[13%] text-center">Thư viện</TableHead>
              <TableHead className="w-[11%]">Phổ biến</TableHead>
              <TableHead className="w-[11%]">Hoạt động</TableHead>
              <TableHead className="w-[7%]">Ưu tiên</TableHead>
              <TableHead className="w-[12%]">Ngày tạo</TableHead>
              <TableHead className="w-[6%]">&nbsp;</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id} className="border-stroke/60 dark:border-dark-3">
                <TableCell className="!pl-0 align-top">
                  <div className="space-y-1 max-w-prose">
                    <div className="text-base font-semibold text-dark dark:text-white">
                      {category.name}
                    </div>

                    <div className="text-xs uppercase tracking-wide text-dark-6 dark:text-dark-6">
                      {category.slug}
                    </div>

                    <p
                      className="line-clamp-3 text-sm text-dark-5 dark:text-dark-6"
                      title={category.description}
                    >
                      {truncateDescription(category.description)}
                    </p>
                  </div>
                </TableCell>

                <TableCell className="align-top max-w-[260px]">
                  <div className="space-y-1">
                    <p className="font-medium text-dark dark:text-white">
                      {category.meta_title}
                    </p>
                    <p className="text-xs leading-5 text-dark-6 dark:text-dark-6">
                      {category.meta_keyword}
                    </p>
                    <p className="text-xs text-dark-6 dark:text-dark-6">
                      {category.meta_description}
                    </p>
                  </div>
                </TableCell>

                <TableCell className="align-top">
                  <GalleryPreview
                    name={category.name}
                    thumbnail={category.thumbnail}
                    count={category.gallery.length}
                  />
                </TableCell>

                <TableCell className="align-top pt-1">
                  <StatusBadge
                    label={category.is_popular ? "Nổi bật" : "Thông thường"}
                    variant={category.is_popular ? "popular" : "default"}
                  />
                </TableCell>

                <TableCell className="align-top pt-1">
                  <StatusBadge
                    label={category.is_active ? "Đang bán" : "Tạm ẩn"}
                    variant={category.is_active ? "active" : "inactive"}
                  />
                </TableCell>

                <TableCell className="align-top pt-1">
                  <span className="inline-flex items-center justify-center rounded-md bg-gray-2 px-3 py-1 text-sm font-semibold text-dark dark:bg-dark-3 dark:text-dark-7">
                    {category.priority}
                  </span>
                </TableCell>

                <TableCell className="align-top pt-1">
                  <div className="text-sm text-dark dark:text-white">
                    {dayjs(category.created_at).format("DD/MM/YYYY HH:mm")}
                  </div>
                </TableCell>

                <TableCell className="align-top pt-1 text-right">
                  <CategoryActions
                    categoryId={category.id}
                    categoryName={category.name}
                    onDelete={() => handleDelete(category.id, category.name)}
                    isDeleting={deletingId === category.id}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-dark-6 dark:text-dark-6">
        <p>
          Hiển thị {categories.length} / {pagination.count ?? categories.length} danh mục
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

function truncateDescription(text: string) {
  if (text.length <= DESCRIPTION_LIMIT) return text;
  return `${text.slice(0, DESCRIPTION_LIMIT).trimEnd()}…`;
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
        "inline-flex min-w-[94px] justify-center rounded-full px-3 py-1 text-sm font-medium",
        BADGE_STYLES[variant],
      )}
    >
      {label}
    </span>
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
