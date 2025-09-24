import type { Metadata } from "next";
import { Suspense } from "react";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ProductTable } from "@/components/Products/product-table";
import { ProductTableSkeleton } from "@/components/Products/product-table-skeleton";

export const metadata: Metadata = {
  title: "Products - List",
};

export default function ProductListPage() {
  return (
    <>
      <Breadcrumb pageName="Sản phẩm" />

      <Suspense fallback={<ProductTableSkeleton />}>
        <ProductTable />
      </Suspense>
    </>
  );
}
