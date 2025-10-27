"use client";

import { useEffect, useState } from "react";
import { getOrders } from "./fetch";
import { OrderTableClient } from "./order-table-client";
import { OrderTableSkeleton } from "./order-table-skeleton";
import type { OrderListResponse } from "./types";

const DEFAULT_PAGE_SIZE = 10;

export function OrderTable() {
  const [initialData, setInitialData] = useState<OrderListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const data = await getOrders({ page: 1, limit: DEFAULT_PAGE_SIZE });
        setInitialData(data);
      } catch (err) {
        console.error("Failed to load orders:", err);
        setError(err instanceof Error ? err.message : "Không thể tải đơn hàng");
      }
    }

    loadInitialData();
  }, []);

  if (error) {
    return (
      <div className="rounded-lg border border-red-light-3 bg-red-light-6/60 px-6 py-4 text-red">
        {error}
      </div>
    );
  }

  if (!initialData) {
    return <OrderTableSkeleton />;
  }

  const initialPageSize = initialData.pagination.per_page || DEFAULT_PAGE_SIZE;

  return <OrderTableClient initialData={initialData} pageSize={initialPageSize} />;
}
