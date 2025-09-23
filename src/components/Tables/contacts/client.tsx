"use client";

import { ChevronUpIcon } from "@/assets/icons";
import {
  Dropdown,
  DropdownClose,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import {
  ContactRecord,
  ContactsPagination,
  getContacts,
  updateContact,
} from "../fetch";
import {
  useEffect,
  useRef,
  useState,
} from "react";

const STATUS_OPTIONS: ContactRecord["status"][] = [
  "New",
  "In Progress",
  "Resolved",
];

const STATUS_VARIANTS: Record<ContactRecord["status"], string> = {
  New: "bg-blue-light-5 text-blue-dark",
  "In Progress": "bg-yellow-light-4 text-yellow-dark-2",
  Resolved: "bg-green-light-7 text-green-dark",
};

const NOTE_POPOVER_ESTIMATED_HEIGHT = 260;

type ContactsTableClientProps = {
  initialData: {
    rows: ContactRecord[];
    pagination: ContactsPagination;
  };
  pageSize: number;
  className?: string;
};

export function ContactsTableClient({
  initialData,
  pageSize,
  className,
}: ContactsTableClientProps) {
  const [rows, setRows] = useState(initialData.rows);
  const [pagination, setPagination] = useState(initialData.pagination);
  const [page, setPage] = useState(initialData.pagination.current_page || 1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [noteUpdatingId, setNoteUpdatingId] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const effectivePageSize = pagination.per_page || pageSize;
  const totalPages = Math.max(1, pagination.total_page || 1);
  const totalCount = pagination.count ?? rows.length;

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function loadPage(targetPage: number) {
    if (targetPage === page) return;
    if (targetPage < 1 || targetPage > totalPages) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setIsLoading(true);
      setError(null);

      const data = await getContacts({
        page: targetPage,
        limit: effectivePageSize,
        signal: controller.signal,
      });

      setRows(data.rows);
      setPagination(data.pagination);
      setPage(data.pagination.current_page || targetPage);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError("Không thể tải dữ liệu, vui lòng thử lại.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStatusChange(id: string, status: ContactRecord["status"]) {
    const current = rows.find((item) => item.id === id);
    if (!current || current.status === status) return;

    const previousRows = rows.map((item) => ({ ...item }));

    setRows((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status, updated_at: new Date().toISOString() }
          : item,
      ),
    );

    setStatusUpdatingId(id);
    setError(null);

    try {
      await updateContact(id, { status });
    } catch (err) {
      console.error(err);
      setRows(previousRows);
      setError("Không thể cập nhật trạng thái, vui lòng thử lại.");
    } finally {
      setStatusUpdatingId(null);
    }
  }

  async function handleNoteChange(id: string, note: string) {
    const current = rows.find((item) => item.id === id);
    if (!current || current.note === note) return;

    const previousRows = rows.map((item) => ({ ...item }));

    setRows((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, note, updated_at: new Date().toISOString() }
          : item,
      ),
    );

    setNoteUpdatingId(id);
    setError(null);

    try {
      await updateContact(id, { note });
    } catch (err) {
      console.error(err);
      setRows(previousRows);
      setError("Không thể cập nhật ghi chú, vui lòng thử lại.");
    } finally {
      setNoteUpdatingId(null);
    }
  }

  return (
    <div
      className={cn(
        "grid rounded-[10px] bg-white px-7.5 pb-6 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}
    >
      <h2 className="mb-4 text-body-2xlg font-bold text-dark dark:text-white">
        Liên hệ gần đây
      </h2>

      {error && (
        <div className="mb-4 rounded-lg border border-red-light-3 bg-red-light-6/60 px-4 py-3 text-sm text-red">
          {error}
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow className="border-none bg-gray-1 uppercase text-sm font-medium text-dark-6 dark:bg-dark-2 dark:text-dark-7 [&>th]:py-4">
            <TableHead className="min-w-[220px] !text-left">Khách hàng</TableHead>
            <TableHead className="min-w-[160px]">Chủ đề</TableHead>
            <TableHead className="min-w-[220px] !text-left">Tin nhắn</TableHead>
            <TableHead className="min-w-[150px]">Điện thoại</TableHead>
            <TableHead className="min-w-[140px]">File đính kèm</TableHead>
            <TableHead className="min-w-[130px]">Trạng thái</TableHead>
            <TableHead className="min-w-[160px]">Ngày tạo</TableHead>
            <TableHead className="min-w-[220px] !text-left">Ghi chú</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading && rows.length === 0 ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell colSpan={8}>
                  <Skeleton className="h-12 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : rows.length > 0 ? (
            rows.map((contact) => (
              <TableRow
                key={contact.id}
                className="border-[#eee] text-sm text-dark dark:border-dark-3 dark:text-white"
              >
                <TableCell className="!text-left">
                  <div className="flex flex-col gap-1">
                    <span className="text-base font-semibold text-dark dark:text-white">
                      {contact.full_name}
                    </span>
                    <span className="text-sm font-medium text-dark-6 dark:text-dark-6">
                      {contact.email}
                    </span>
                    <span className="text-sm font-medium text-dark-6 dark:text-dark-6">
                      {contact.address}
                    </span>
                  </div>
                </TableCell>

                <TableCell>{contact.subject}</TableCell>

                <TableCell className="max-w-[260px] !text-left">
                  <p className="truncate" title={contact.message}>
                    {contact.message}
                  </p>
                </TableCell>

                <TableCell>{contact.phone}</TableCell>

                <TableCell>
                  {contact.attachment ? (
                    <a
                      href={contact.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary underline-offset-2 hover:underline"
                    >
                      Tệp đính kèm
                    </a>
                  ) : (
                    <span className="text-dark-6">Không có</span>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex flex-col gap-1">
                    <StatusDropdown
                      status={contact.status}
                      onChange={(status) =>
                        handleStatusChange(contact.id, status)
                      }
                      disabled={
                        isLoading || statusUpdatingId === contact.id
                      }
                    />
                    {statusUpdatingId === contact.id && (
                      <span className="text-xs text-dark-6 dark:text-dark-6">
                        Đang lưu trạng thái...
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  {dayjs(contact.created_at).format("DD/MM/YYYY HH:mm")}
                </TableCell>

                <TableCell className="max-w-[240px] !text-left">
                  <div className="flex flex-col gap-1">
                    <NoteEditor
                      note={contact.note}
                      onSave={(note) => handleNoteChange(contact.id, note)}
                      disabled={isLoading || noteUpdatingId === contact.id}
                    />
                    {noteUpdatingId === contact.id && (
                      <span className="text-xs text-dark-6 dark:text-dark-6">
                        Đang lưu ghi chú...
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={8}
                className="py-10 text-center text-sm text-dark-6 dark:text-dark-6"
              >
                Không có liên hệ nào.
              </TableCell>
            </TableRow>
          )}

          {isLoading && rows.length > 0 && (
            <TableRow>
              <TableCell
                colSpan={8}
                className="py-6 text-center text-sm text-dark-6 dark:text-dark-6"
              >
                Đang tải dữ liệu...
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <PaginationFooter
        page={page}
        totalPages={totalPages}
        pageSize={effectivePageSize}
        itemsOnPage={rows.length}
        totalCount={totalCount}
        isLoading={isLoading}
        onPrev={() => loadPage(page - 1)}
        onNext={() => loadPage(page + 1)}
      />
    </div>
  );
}

function NoteEditor({
  note,
  onSave,
  disabled,
}: {
  note: string;
  onSave: (note: string) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(note);
  const [side, setSide] = useState<"top" | "bottom">("bottom");
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setValue(note);
    }
  }, [note, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setSide(determineSide());
    }
  }, [isOpen]);

  function handleSave() {
    const trimmed = value.trim();
    if (trimmed === note) return;
    onSave(trimmed);
  }

  function determineSide() {
    if (typeof window === "undefined") return "bottom";
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return "bottom";

    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < NOTE_POPOVER_ESTIMATED_HEIGHT && spaceAbove > spaceBelow) {
      return "top";
    }

    return "bottom";
  }

  return (
    <div className="flex flex-col gap-2">
      <p
        className={cn(
          "truncate text-sm",
          disabled && "text-dark-6 dark:text-dark-6",
        )}
        title={note}
      >
        {note || "Chưa có ghi chú"}
      </p>

      <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
        <DropdownTrigger
          type="button"
          disabled={disabled}
          ref={triggerRef}
          className={cn(
            "inline-flex items-center gap-2 text-xs font-semibold uppercase text-primary transition hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-60",
          )}
          onClick={() => {
            setSide(determineSide());
          }}
        >
          Chỉnh sửa ghi chú
        </DropdownTrigger>

        <DropdownContent
          align="end"
          side={side}
          className="pointer-events-auto w-[320px] rounded-lg border border-stroke bg-white p-4 text-left shadow-card dark:border-dark-3 dark:bg-dark-2"
        >
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-dark-6 dark:text-dark-6">
              Nội dung ghi chú
            </label>
            <textarea
              value={value}
              onChange={(event) => setValue(event.target.value)}
              rows={4}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary"
              placeholder="Nhập ghi chú..."
              disabled={disabled}
            />

            <div className="flex justify-end gap-2">
              <DropdownClose>
                <button
                  type="button"
                  onClick={() => setValue(note)}
                  className="rounded-full border border-stroke px-3 py-1 text-xs font-semibold uppercase tracking-wide text-dark transition hover:bg-gray-2 dark:border-dark-3 dark:text-dark-6 dark:hover:bg-dark-3"
                  disabled={disabled}
                >
                  Hủy
                </button>
              </DropdownClose>

              <DropdownClose>
                <button
                  type="button"
                  onClick={handleSave}
                  className="rounded-full bg-primary px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-primary/90"
                  disabled={disabled}
                >
                  Lưu
                </button>
              </DropdownClose>
            </div>
          </div>
        </DropdownContent>
      </Dropdown>
    </div>
  );
}

function StatusDropdown({
  status,
  onChange,
  disabled,
}: {
  status: ContactRecord["status"];
  onChange: (status: ContactRecord["status"]) => void;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dropdown isOpen={isOpen} setIsOpen={setIsOpen}>
      <DropdownTrigger
        type="button"
        disabled={disabled}
        className={cn(
          "inline-flex min-w-[150px] items-center justify-between gap-2 rounded-full px-3 py-1 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-dark",
          STATUS_VARIANTS[status],
        )}
      >
        <span>{status}</span>
        <ChevronUpIcon className="size-4 -rotate-180" />
      </DropdownTrigger>

      <DropdownContent
        align="end"
        className="pointer-events-auto w-44 rounded-lg border border-stroke bg-white p-1.5 shadow-card dark:border-dark-3 dark:bg-dark-2"
      >
        <ul className="space-y-1">
          {STATUS_OPTIONS.map((option) => (
            <li key={option}>
              <DropdownClose>
                <button
                  type="button"
                  onClick={() => onChange(option)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm font-medium transition hover:bg-gray-2 dark:hover:bg-dark-3",
                    option === status
                      ? "text-primary"
                      : "text-dark dark:text-dark-6",
                  )}
                >
                  <span>{option}</span>
                </button>
              </DropdownClose>
            </li>
          ))}
        </ul>
      </DropdownContent>
    </Dropdown>
  );
}

function PaginationFooter({
  page,
  totalPages,
  pageSize,
  itemsOnPage,
  totalCount,
  isLoading,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  pageSize: number;
  itemsOnPage: number;
  totalCount: number;
  isLoading: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const start = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = totalCount === 0 ? 0 : Math.min(start + itemsOnPage - 1, totalCount);

  return (
    <div className="mt-6 flex flex-col gap-4 text-sm text-dark-6 dark:text-dark-6 md:flex-row md:items-center md:justify-between">
      <div>
        {totalCount > 0 ? (
          <span>
            Hiển thị {start}-{end} trong tổng số {totalCount} liên hệ
          </span>
        ) : (
          <span>Chưa có dữ liệu liên hệ</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={page === 1 || isLoading || totalCount === 0}
          className="rounded-full border border-stroke px-4 py-1 text-sm font-medium text-dark transition hover:bg-gray-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:text-dark-6 dark:hover:bg-dark-3"
        >
          Trước
        </button>
        <span className="text-sm font-semibold text-dark dark:text-white">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={page === totalPages || isLoading || totalCount === 0}
          className="rounded-full border border-stroke px-4 py-1 text-sm font-medium text-dark transition hover:bg-gray-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:text-dark-6 dark:hover:bg-dark-3"
        >
          Sau
        </button>
      </div>
    </div>
  );
}
