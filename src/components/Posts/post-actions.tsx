"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { DotsVerticalIcon } from "@/assets/icons";
import {
  Dropdown,
  DropdownClose,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";

import { deletePost } from "./fetch";

const PAGE_ROUTE_PREFIX = "/posts";

type PostActionsProps = {
  postId: string;
  postTitle: string;
  onDeleted?: () => Promise<void> | void;
  isDeleting?: boolean;
};

export function PostActions({
  postId,
  postTitle,
  onDeleted,
  isDeleting,
}: PostActionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalDeleting, setInternalDeleting] = useState(false);
  const router = useRouter();

  const deleteInProgress = onDeleted ? Boolean(isDeleting) : internalDeleting;

  function handleUpdate() {
    setIsOpen(false);
    router.push(`${PAGE_ROUTE_PREFIX}/${postId}/edit`);
  }

  async function handleDelete() {
    if (deleteInProgress) return;

    setIsOpen(false);

    if (onDeleted) {
      await onDeleted();
      return;
    }

    try {
      setInternalDeleting(true);
      await deletePost(postId);
      toast.success(`Đã xoá bài viết "${postTitle}"`);
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Không thể xoá bài viết, vui lòng thử lại.");
    } finally {
      setInternalDeleting(false);
    }
  }

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger
        type="button"
        className="flex size-8 items-center justify-center rounded-full border border-transparent text-dark-5 transition hover:border-stroke hover:text-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-white dark:text-dark-6 dark:hover:border-dark-3 dark:focus:ring-offset-gray-dark"
        aria-label={`Tùy chọn cho bài viết ${postTitle}`}
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
              disabled={deleteInProgress}
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
              {deleteInProgress ? "Đang xoá..." : "Xoá"}
            </button>
          </DropdownClose>
        </div>
      </DropdownContent>
    </Dropdown>
  );
}
