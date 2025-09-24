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

import { deletePost, getPosts } from "./fetch";
import { getPreviewUrl } from "./media";
import { PostActions } from "./post-actions";
import { PostTableSkeleton } from "./post-table-skeleton";
import type { PostListResponse } from "./types";
import Image from "next/image";

const BADGE_STYLES = {
  active: "bg-green-light-7 text-green-dark",
  inactive: "bg-gray-3 text-dark-5 dark:bg-dark-3 dark:text-dark-6",
  popular: "bg-orange-light-4 text-orange-dark",
  default: "bg-gray-2 text-dark-5 dark:bg-dark-3 dark:text-dark-6",
} as const;

type BadgeVariant = keyof typeof BADGE_STYLES;

const DESCRIPTION_LIMIT = 120;

function truncate(text: string, limit = DESCRIPTION_LIMIT) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit).trimEnd()}…`;
}

type PostTableClientProps = {
  initialData: PostListResponse;
  pageSize: number;
};

export function PostTableClient({
  initialData,
  pageSize,
}: PostTableClientProps) {
  const [data, setData] = useState<PostListResponse>(initialData);
  const [pageSizeState, setPageSizeState] = useState(pageSize);
  const [isFetching, setIsFetching] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { pagination } = data;
  const posts = data.rows;
  const totalPages = Math.max(1, pagination.total_page || 1);
  const currentPage = pagination.current_page || 1;

  const loadPage = useCallback(
    async (page: number) => {
      try {
        setIsFetching(true);
        setError(null);
        const res = await getPosts({ page, limit: pageSizeState });
        setData(res);
        setPageSizeState(res.pagination.per_page || pageSizeState);
      } catch (err) {
        console.error(err);
        setError("Không thể tải danh sách bài viết.");
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

  async function handleDelete(id: string, title: string) {
    if (deletingId) return;

    try {
      setDeletingId(id);
      await deletePost(id);
      toast.success(`Đã xoá bài viết "${title}"`);

      const shouldGoPrev = posts.length === 1 && currentPage > 1;
      await loadPage(shouldGoPrev ? currentPage - 1 : currentPage);
    } catch (err) {
      console.error(err);
      toast.error("Không thể xoá bài viết, vui lòng thử lại.");
    } finally {
      setDeletingId(null);
    }
  }

  if (isFetching && posts.length === 0) {
    return <PostTableSkeleton />;
  }

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  function splitTags(tagString: string | null) {
    if (!tagString) return [];
    return tagString
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-dark dark:text-white">
            Danh sách bài viết
          </h2>
          <p className="text-sm text-dark-6 dark:text-dark-6">
            Tổng cộng {pagination.count ?? posts.length} bài viết
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
            <TableRow className="border-none bg-gray-1 text-sm font-medium uppercase text-dark-6 dark:bg-dark-2 dark:text-dark-7 [&>th]:py-4">
              <TableHead className="w-[34%] !text-left md:w-[36%]">
                Bài viết
              </TableHead>
              <TableHead className="w-[16%] !text-left md:w-[18%] lg:w-[14%]">
                Tags
              </TableHead>
              <TableHead className="w-[14%] text-center">Hình ảnh</TableHead>
              <TableHead className="w-[8%] text-center">Ưu tiên</TableHead>
              <TableHead className="w-[12%] text-center">Trạng thái</TableHead>
              <TableHead className="w-[12%] text-center">Ngày tạo</TableHead>
              <TableHead className="w-[6%]">&nbsp;</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-sm text-dark-5 dark:text-dark-6"
                >
                  Chưa có bài viết nào.
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => {
                const tags = splitTags(post.post_tag);
                return (
                  <TableRow
                    key={post.id}
                    className="border-stroke/60 dark:border-dark-3"
                  >
                    <TableCell className="!pl-0 align-top">
                      <div className="space-y-1">
                        <div className="text-base font-semibold text-dark dark:text-white">
                          {post.post_title}
                        </div>
                        {post.post_slug && (
                          <div className="text-xs uppercase tracking-wide text-dark-6 dark:text-dark-6">
                            Slug: {post.post_slug}
                          </div>
                        )}
                        <p
                          className="text-sm text-dark-5 dark:text-dark-6"
                          title={post.post_description}
                        >
                          {truncate(post.post_description)}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="w-[16%] align-top md:w-[18%] lg:w-[14%]">
                      {tags.length ? (
                        <TagList items={tags} />
                      ) : (
                        <span className="text-xs text-dark-5 dark:text-dark-6">
                          --
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="align-top">
                      <GalleryInfo
                        thumbnail={post.thumbnail}
                        count={post.gallery.length}
                        name={post.post_title}
                      />
                    </TableCell>

                    <TableCell className="text-center align-top text-sm font-semibold text-dark dark:text-white">
                      {post.priority ?? 0}
                    </TableCell>

                    <TableCell className="align-top">
                      <div className="space-y-2 text-center">
                        <StatusBadge
                          label={post.is_active ? "Đang hiển thị" : "Đã ẩn"}
                          variant={post.is_active ? "active" : "inactive"}
                        />
                        <StatusBadge
                          label={post.is_popular ? "Nổi bật" : "Mặc định"}
                          variant={post.is_popular ? "popular" : "default"}
                        />
                      </div>
                    </TableCell>

                    <TableCell className="text-center align-top text-sm text-dark dark:text-white">
                      {post.created_at
                        ? dayjs(post.created_at).format("DD/MM/YYYY HH:mm")
                        : "--"}
                    </TableCell>

                    <TableCell className="text-right align-top">
                      <PostActions
                        postId={post.id}
                        postTitle={post.post_title}
                        onDeleted={() => handleDelete(post.id, post.post_title)}
                        isDeleting={deletingId === post.id}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-dark-6 dark:text-dark-6">
        <p>
          Hiển thị {posts.length} / {pagination.count ?? posts.length} bài viết
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

function TagList({ items }: { items: string[] }) {
  return (
    <div className="flex max-w-[220px] flex-wrap gap-1.5 md:max-w-[260px]">
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold uppercase text-primary"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function ThumbnailPreview({
  thumbnail,
  name,
  galleryCount,
}: {
  thumbnail: string | null;
  name: string;
  galleryCount: number;
}) {
  const preview = getPreviewUrl(thumbnail);

  if (!preview) {
    return (
      <div className="flex h-16 w-24 items-center justify-center rounded-md border border-dashed border-stroke text-xs uppercase text-dark-5">
        No image
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="h-16 w-24 overflow-hidden rounded-md border border-stroke bg-gray-1 dark:border-dark-3 dark:bg-dark-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <Image
          src={preview}
          alt={`${name} thumbnail`}
          className="h-full w-full object-cover"
          width={96}
          height={64}
        />
      </div>
      <span className="text-xs text-dark-5 dark:text-dark-6">
        {galleryCount} ảnh
      </span>
    </div>
  );
}

function GalleryInfo({
  thumbnail,
  count,
  name,
}: {
  thumbnail: string | null;
  count: number;
  name: string;
}) {
  if (!thumbnail && count === 0) {
    return (
      <span className="text-xs text-dark-5 dark:text-dark-6">Chưa có ảnh</span>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 text-xs text-dark-5 dark:text-dark-6">
      {thumbnail ? (
        <ThumbnailPreview
          thumbnail={thumbnail}
          name={name}
          galleryCount={count}
        />
      ) : (
        <span className="text-xs">{count} ảnh thư viện</span>
      )}
    </div>
  );
}
