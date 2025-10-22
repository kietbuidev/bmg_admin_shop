"use client";

import { DotsVerticalIcon } from "@/assets/icons";
import { buildApiUrl } from "@/lib/env";
import {
  Dropdown,
  DropdownClose,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { toast } from "react-hot-toast";
import { useState } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_CATEGORIES_ENDPOINT = buildApiUrl("api/categories");

type CategoryActionsProps = {
  categoryId: string;
  categoryName: string;
  onDelete?: () => Promise<void> | void;
  isDeleting?: boolean;
};

export function CategoryActions({
  categoryId,
  categoryName,
  onDelete,
  isDeleting,
}: CategoryActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalDeleting, setInternalDeleting] = useState(false);
  const router = useRouter();

  const deleteInProgress = onDelete ? Boolean(isDeleting) : internalDeleting;

  function handleUpdate() {
    setIsOpen(false);
    router.push(`/categories/${categoryId}/edit`);
  }

  async function handleDelete() {
    if (deleteInProgress) return;

    setIsOpen(false);

    if (onDelete) {
      await onDelete();
      return;
    }

    const endpoint =
      process.env.NEXT_PUBLIC_CATEGORIES_ENDPOINT ??
      DEFAULT_CATEGORIES_ENDPOINT;

    const deleteUrl = `${endpoint}/${categoryId}`;

    try {
      setInternalDeleting(true);
      const response = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Xóa danh mục thất bại.");
      }

      const result = await response.json();

      if (result?.code !== 200) {
        throw new Error(result?.message ?? "Máy chủ trả về lỗi.");
      }

      toast.success(`Đã xóa danh mục "${categoryName}"`);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Không thể xóa danh mục.",
      );
    } finally {
      setInternalDeleting(false);
    }
  }

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger
        type="button"
        className="flex size-8 items-center justify-center rounded-full border border-transparent text-dark-5 transition hover:border-stroke hover:text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-white dark:text-dark-6 dark:hover:border-dark-3 dark:focus:ring-offset-gray-dark"
        aria-label={`Tùy chọn cho danh mục ${categoryName}`}
      >
        <DotsVerticalIcon className="size-5" />
      </DropdownTrigger>

      <DropdownContent
        align="end"
        className="pointer-events-auto w-36 rounded-lg border border-stroke bg-white p-1 shadow-card dark:border-dark-3 dark:bg-dark-2"
      >
        <div className="flex flex-col text-left text-sm font-medium text-dark dark:text-dark-6">
          <DropdownClose>
            <button
              type="button"
              onClick={handleUpdate}
              disabled={isDeleting}
              className="w-full rounded-md px-3 py-2 text-left transition hover:bg-gray-2 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-dark-3"
            >
              Cập nhật
            </button>
          </DropdownClose>

          <DropdownClose>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteInProgress}
              className="w-full rounded-md px-3 py-2 text-left text-red transition hover:bg-red/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleteInProgress ? "Đang xóa..." : "Xóa"}
            </button>
          </DropdownClose>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
