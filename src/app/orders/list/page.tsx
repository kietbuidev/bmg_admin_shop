import type { Metadata } from "next";
import { Suspense } from "react";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { OrderTable } from "@/components/Orders/order-table";
import { OrderTableSkeleton } from "@/components/Orders/order-table-skeleton";

export const metadata: Metadata = {
  title: "Orders - List",
};

export default function OrderListPage() {
  return (
    <>
      <Breadcrumb pageName="Đơn hàng" />

      <Suspense fallback={<OrderTableSkeleton />}>
        <OrderTable />
      </Suspense>
    </>
  );
}
