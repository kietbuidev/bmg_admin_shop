"use client";

import dayjs from "dayjs";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { BellIcon } from "./icons";
import {
  fetchNotifications,
  markNotificationsRead,
  type NotificationItem,
} from "./api";

export function Notification() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNew, setHasNew] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const isMobile = useIsMobile();

  const showDot = useMemo(
    () => hasNew || unreadCount > 0,
    [hasNew, unreadCount],
  );

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchNotifications(1, 10);
      setNotifications(result.rows);
      setUnreadCount(result.summary.unread_count);
      setHasNew(result.summary.has_new);
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Failed to load notifications";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = useCallback(async () => {
    if (isMarkingRead || (!hasNew && unreadCount === 0)) return;

    try {
      setIsMarkingRead(true);
      await markNotificationsRead();
      setUnreadCount(0);
      setHasNew(false);
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, is_read: true, is_new: false })),
      );
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to update notifications",
      );
    } finally {
      setIsMarkingRead(false);
    }
  }, [hasNew, isMarkingRead, unreadCount]);

  return (
    <Dropdown
      isOpen={isOpen}
      setIsOpen={(open) => {
        setIsOpen(open);
      }}
    >
      <DropdownTrigger
        className="grid size-12 place-items-center rounded-full border bg-gray-2 text-dark outline-none hover:text-primary focus-visible:border-primary focus-visible:text-primary dark:border-dark-4 dark:bg-dark-3 dark:text-white dark:focus-visible:border-primary"
        aria-label="View Notifications"
      >
        <span className="relative">
          <BellIcon />

          {showDot && (
            <span
              className={cn(
                "absolute right-0 top-0 z-1 size-2 rounded-full bg-red-light ring-2 ring-gray-2 dark:ring-dark-3",
              )}
            >
              <span className="absolute inset-0 -z-1 animate-ping rounded-full bg-red-light opacity-75" />
            </span>
          )}
        </span>
      </DropdownTrigger>

      <DropdownContent
        align={isMobile ? "end" : "center"}
        className="border border-stroke bg-white px-3.5 py-3 shadow-md dark:border-dark-3 dark:bg-gray-dark min-[350px]:min-w-[20rem]"
      >
        <div className="mb-1 flex items-center justify-between px-2 py-1.5">
          <span className="text-lg font-medium text-dark dark:text-white">
            Notifications
          </span>
          <span className="rounded-md bg-primary px-[9px] py-0.5 text-xs font-medium text-white">
            {unreadCount > 0 ? `${unreadCount} new` : hasNew ? "New" : "No new"}
          </span>
        </div>

        <div className="mb-3 max-h-[23rem] space-y-1.5 overflow-y-auto">
          {isLoading ? (
            <LoadingList />
          ) : error ? (
            <ErrorState message={error} onRetry={loadNotifications} isRetrying={isLoading} />
          ) : notifications.length > 0 ? (
            <ul className="space-y-1.5">
              {notifications.map((item) => (
                <li key={item.id} role="menuitem">
                  <Link
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      void handleMarkRead();
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex items-center gap-4 rounded-lg px-2 py-1.5 outline-none transition hover:bg-gray-2 focus-visible:bg-gray-2 dark:hover:bg-dark-3 dark:focus-visible:bg-dark-3",
                      !item.is_read && "bg-blue-light-5/40 dark:bg-dark-3/70",
                    )}
                  >
                    <AvatarPlaceholder title={item.title} />

                    <div>
                      <strong className="block text-sm font-medium text-dark dark:text-white">
                        {item.title}
                      </strong>

                      <span className="block truncate text-xs font-medium text-dark-5 dark:text-dark-6">
                        {item.message}
                      </span>

                      <span className="mt-1 block text-[11px] font-semibold uppercase tracking-wide text-dark-5 dark:text-dark-6">
                        {dayjs(item.created_at).format("DD/MM/YYYY HH:mm")}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState onSync={loadNotifications} isSyncing={isLoading} />
          )}
        </div>

        <Link
          href="#"
          onClick={(event) => {
            event.preventDefault();
            void handleMarkRead();
            setIsOpen(false);
          }}
          className="block rounded-lg border border-primary p-2 text-center text-sm font-medium tracking-wide text-primary outline-none transition-colors hover:bg-blue-light-5 focus:bg-blue-light-5 focus:text-primary focus-visible:border-primary dark:border-dark-3 dark:text-dark-6 dark:hover:border-dark-5 dark:hover:bg-dark-3 dark:hover:text-dark-7 dark:focus-visible:border-dark-5 dark:focus-visible:bg-dark-3 dark:focus-visible:text-dark-7"
        >
          See all notifications
        </Link>
      </DropdownContent>
    </Dropdown>
  );
}

function AvatarPlaceholder({ title }: { title: string }) {
  const initial = title?.charAt(0)?.toUpperCase() || "!";

  return (
    <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-base font-semibold uppercase text-primary">
      {initial}
    </div>
  );
}

function LoadingList() {
  return (
    <ul className="space-y-1.5">
      {Array.from({ length: 4 }).map((_, index) => (
        <li key={`notification-skeleton-${index}`} className="flex items-center gap-4 rounded-lg px-2 py-1.5">
          <Skeleton className="size-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({
  onSync,
  isSyncing,
}: {
  onSync: () => void;
  isSyncing: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-stroke px-4 py-10 text-center text-sm text-dark-5 dark:border-dark-3 dark:text-dark-6">
      <span>No notifications yet.</span>
      <button
        type="button"
        onClick={() => onSync()}
        disabled={isSyncing}
        className="rounded-full border border-primary px-4 py-1 text-xs font-semibold uppercase tracking-wide text-primary transition hover:bg-blue-light-5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSyncing ? "Refreshing..." : "Refresh"}
      </button>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
  isRetrying,
}: {
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-red/40 bg-red-light-6/20 px-4 py-8 text-center text-sm text-red dark:border-red/60 dark:bg-red/10">
      <span>{message}</span>
      <button
        type="button"
        onClick={() => onRetry()}
        disabled={isRetrying}
        className="rounded-full border border-red px-4 py-1 text-xs font-semibold uppercase tracking-wide text-red transition hover:bg-red/10 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isRetrying ? "Retrying..." : "Try again"}
      </button>
    </div>
  );
}
