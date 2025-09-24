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

import { getOrders, updateOrderStatus } from "./fetch";
import type { OrderItem, OrderListResponse, OrderRecord, OrderStatus } from "./types";
import { OrderTableSkeleton } from "./order-table-skeleton";

const STATUS_META: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  PENDING: { label: "Chờ xử lý", className: "bg-yellow-light-4 text-yellow-dark" },
  CONFIRMED: { label: "Đã xác nhận", className: "bg-green-light-7 text-green-dark" },
  PROCESSING: { label: "Đang xử lý", className: "bg-blue-light-5 text-blue-dark" },
  PACKING: { label: "Đang đóng gói", className: "bg-blue-light-5 text-blue-dark" },
  SHIPPING: { label: "Đang giao", className: "bg-blue-light-5 text-blue-dark" },
  DELIVERED: { label: "Đã giao", className: "bg-green-light-7 text-green-dark" },
  COMPLETED: { label: "Hoàn tất", className: "bg-green-light-7 text-green-dark" },
  CANCELLED: { label: "Đã huỷ", className: "bg-red-light-5 text-red-dark" },
  FAILED: { label: "Thất bại", className: "bg-red-light-5 text-red-dark" },
  REFUNDED: { label: "Hoàn tiền", className: "bg-primary/10 text-primary" },
};

const DEFAULT_STATUS_META = {
  label: "Không xác định",
  className: "bg-gray-3 text-dark-6 dark:bg-dark-3 dark:text-dark-6",
};

const ITEMS_PREVIEW_LIMIT = 3;

const ORDER_STATUS_OPTIONS = (
  Object.entries(STATUS_META) as Array<[
    OrderStatus,
    {
      label: string;
      className: string;
    },
  ]>
).map(([value, meta]) => ({
  value,
  label: meta.label,
})) as Array<{ value: OrderStatus; label: string }>;

function parseAmount(amount: string | null | undefined) {
  if (!amount) return null;
  const parsed = Number.parseFloat(amount);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCurrency(amount: string | null | undefined, currency: string) {
  const parsed = parseAmount(amount);
  if (parsed === null) {
    if (!amount) {
      return "--";
    }

    const normalizedCurrency = currency?.toUpperCase() || "VND";
    if (normalizedCurrency === "VND") {
      return `${amount} ₫`;
    }

    return amount;
  }

  const normalizedCurrency = currency?.toUpperCase() || "VND";
  const fractionDigits = normalizedCurrency === "VND" ? 0 : 2;

  try {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: normalizedCurrency,
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }).format(parsed);
  } catch (error) {
    console.error("Currency format error", error);
    return parsed.toLocaleString("vi-VN", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });
  }
}

type OrderTableClientProps = {
  initialData: OrderListResponse;
  pageSize: number;
};

export function OrderTableClient({
  initialData,
  pageSize,
}: OrderTableClientProps) {
  const [data, setData] = useState<OrderListResponse>(initialData);
  const [pageSizeState, setPageSizeState] = useState(pageSize);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const { pagination } = data;
  const orders = data.rows;
  const totalPages = Math.max(1, pagination.total_page || 1);
  const currentPage = Math.max(1, pagination.current_page || 1);

  const loadPage = useCallback(
    async (pageNumber: number) => {
      try {
        setIsFetching(true);
        setError(null);
        const res = await getOrders({ page: pageNumber, limit: pageSizeState });
        setData(res);
        setPageSizeState(res.pagination.per_page || pageSizeState);
      } catch (err) {
        console.error(err);
        setError("Không thể tải danh sách đơn hàng.");
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

  if (isFetching && orders.length === 0) {
    return <OrderTableSkeleton />;
  }

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  async function handleStatusChange(order: OrderRecord, nextStatus: OrderStatus) {
    if (order.status === nextStatus) return;
    if (updatingOrderId) return;

    try {
      setUpdatingOrderId(order.id);
      setError(null);

      const updated = await updateOrderStatus(order.id, nextStatus);
      const effectiveOrder = updated ?? order;
      const effectiveStatus = updated?.status ?? nextStatus;
      const statusLabel = STATUS_META[effectiveStatus]?.label ?? effectiveStatus;

      toast.success(
        `Đã cập nhật đơn hàng "${effectiveOrder.order_code || effectiveOrder.id}" sang trạng thái ${statusLabel}.`,
      );

      const targetPage = pagination.current_page || 1;
      await loadPage(targetPage);
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Không thể cập nhật trạng thái đơn hàng.",
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-dark dark:text-white">
            Danh sách đơn hàng
          </h2>
          <p className="text-sm text-dark-6 dark:text-dark-6">
            Tổng cộng {pagination.count ?? orders.length} đơn hàng
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
              <TableHead className="w-[32%] !text-left">Đơn hàng</TableHead>
              <TableHead className="w-[24%] !text-left">Khách hàng</TableHead>
              <TableHead className="w-[20%] !text-left">Sản phẩm</TableHead>
              <TableHead className="w-[12%] !text-left">Tổng tiền</TableHead>
              <TableHead className="w-[12%]">Trạng thái</TableHead>
              <TableHead className="w-[10%]">Ngày tạo</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="border-stroke/60 dark:border-dark-3">
                <TableCell className="!pl-0 align-top">
                  <OrderSummary order={order} />
                </TableCell>

                <TableCell className="align-top">
                  <CustomerSummary order={order} />
                </TableCell>

                <TableCell className="align-top">
                  <OrderItemsList items={order.items} currency={order.currency} />
                </TableCell>

                <TableCell className="align-top">
                  <AmountSummary order={order} />
                </TableCell>

                <TableCell className="align-top">
                  <div className="space-y-2">
                    <StatusBadge status={order.status} />
                    <OrderStatusSelect
                      orderId={order.id}
                      status={order.status}
                      disabled={Boolean(updatingOrderId) && updatingOrderId !== order.id}
                      isUpdating={updatingOrderId === order.id}
                      onStatusChange={(next) => handleStatusChange(order, next)}
                    />
                  </div>
                </TableCell>

                <TableCell className="align-top">
                  <div className="text-sm text-dark dark:text-white">
                    {order.created_at
                      ? dayjs(order.created_at).format("DD/MM/YYYY HH:mm")
                      : "--"}
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {orders.length === 0 && !isFetching && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-dark-6 dark:text-dark-6">
                  Không có đơn hàng nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-dark-6 dark:text-dark-6">
        <p>
          Hiển thị {orders.length} / {pagination.count ?? orders.length} đơn
          hàng
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

function OrderSummary({ order }: { order: OrderRecord }) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <div className="text-base font-semibold text-dark dark:text-white">
          {order.order_code || "Chưa có mã"}
        </div>
        <div className="text-xs text-dark-6 dark:text-dark-6">
          ID: {order.id || "--"}
        </div>
      </div>

      <div className="inline-flex items-center gap-2 rounded-md bg-gray-2 px-3 py-1 text-xs font-semibold text-dark-6 dark:bg-dark-3 dark:text-dark-6">
        <span>{order.total_items} sản phẩm</span>
        <span className="h-1 w-1 rounded-full bg-dark-6/40" />
        <span>{order.currency}</span>
      </div>

      {order.updated_at && (
        <div className="text-xs text-dark-6 dark:text-dark-6">
          Cập nhật: {dayjs(order.updated_at).format("DD/MM/YYYY HH:mm")}
        </div>
      )}
    </div>
  );
}

function CustomerSummary({ order }: { order: OrderRecord }) {
  if (!order.customer) {
    return (
      <div className="text-sm text-dark-6 dark:text-dark-6">
        Khách vãng lai
      </div>
    );
  }

  const { full_name, email, phone, address, note } = order.customer;

  return (
    <div className="space-y-1 text-sm">
      <div className="font-semibold text-dark dark:text-white">
        {full_name || "Khách hàng"}
      </div>
      <div className="text-xs text-dark-6 dark:text-dark-6">
        {email || "--"}
      </div>
      <div className="text-xs text-dark-6 dark:text-dark-6">
        {phone || "--"}
      </div>
      {address && (
        <div className="text-xs text-dark-6 dark:text-dark-6">
          {address}
        </div>
      )}
      {note && (
        <div className="text-xs italic text-dark-6 dark:text-dark-6">
          Ghi chú: {note}
        </div>
      )}
    </div>
  );
}

function OrderItemsList({
  items,
  currency,
}: {
  items: OrderItem[];
  currency: string;
}) {
  if (!items.length) {
    return (
      <span className="text-xs text-dark-6 dark:text-dark-6">
        Chưa có sản phẩm
      </span>
    );
  }

  const previewItems = items.slice(0, ITEMS_PREVIEW_LIMIT);
  const extraCount = Math.max(0, items.length - ITEMS_PREVIEW_LIMIT);

  return (
    <div className="space-y-2">
      {previewItems.map((item) => (
        <div key={item.id} className="rounded-md border border-stroke/60 px-3 py-2 text-xs text-dark-6 dark:border-dark-3 dark:text-dark-6">
          <div className="font-semibold text-dark dark:text-white">
            {item.product_name}
          </div>
          <div>
            {item.quantity} x {formatCurrency(item.unit_discounted_price ?? item.unit_price, item.unit_currency || currency)}
          </div>
          {(item.selected_size || item.selected_color) && (
            <div className="flex flex-wrap gap-2 pt-1 text-[11px] uppercase tracking-wide text-dark-6 dark:text-dark-6">
              {item.selected_size && <span>Size: {item.selected_size}</span>}
              {item.selected_color && <span>Màu: {item.selected_color}</span>}
            </div>
          )}
        </div>
      ))}

      {extraCount > 0 && (
        <div className="text-xs text-dark-6 dark:text-dark-6">
          +{extraCount} sản phẩm khác
        </div>
      )}
    </div>
  );
}

function AmountSummary({ order }: { order: OrderRecord }) {
  const discountValue = parseAmount(order.discount_amount);

  return (
    <div className="space-y-1 text-sm text-dark dark:text-white">
      <p>
        <span className="font-semibold">Tạm tính:</span>
        <span className="ml-2">
          {formatCurrency(order.subtotal_amount, order.currency)}
        </span>
      </p>

      {discountValue && discountValue > 0 ? (
        <p className="text-xs text-red-dark">
          Giảm: -{formatCurrency(order.discount_amount, order.currency)}
        </p>
      ) : null}

      <p className="text-base font-semibold">
        Tổng: {formatCurrency(order.total_amount, order.currency)}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const meta = STATUS_META[status] ?? DEFAULT_STATUS_META;

  return (
    <span
      className={cn(
        "inline-flex min-w-[110px] justify-center rounded-full px-3 py-1 text-xs font-semibold",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}

function OrderStatusSelect({
  orderId,
  status,
  disabled,
  isUpdating,
  onStatusChange,
}: {
  orderId: string;
  status: OrderStatus;
  disabled: boolean;
  isUpdating: boolean;
  onStatusChange: (status: OrderStatus) => void;
}) {
  const baseOptions = ORDER_STATUS_OPTIONS.some((option) => option.value === status)
    ? ORDER_STATUS_OPTIONS
    : [
        ...ORDER_STATUS_OPTIONS,
        {
          value: status,
          label: STATUS_META[status]?.label ?? status,
        },
      ];

  return (
    <div className="space-y-1 text-xs text-dark-6 dark:text-dark-6">
      <label className="font-medium" htmlFor={`order-status-${orderId}`}>
        Cập nhật trạng thái
      </label>
      <select
        id={`order-status-${orderId}`}
        className="w-full rounded-md border border-stroke bg-white px-2 py-1 text-xs font-medium text-dark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-dark-3 dark:bg-dark-2 dark:text-dark-6 dark:focus:border-primary dark:focus:ring-primary/40"
        value={status}
        onChange={(event) => onStatusChange(event.target.value as OrderStatus)}
        disabled={disabled || isUpdating}
      >
        {baseOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {isUpdating && <span className="text-[11px] italic">Đang cập nhật…</span>}
    </div>
  );
}
