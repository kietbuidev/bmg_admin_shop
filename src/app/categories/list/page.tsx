import type { Metadata } from "next";
import { Suspense } from "react";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { CategoryTable } from "@/components/Categories/category-table";
import { CategoryTableSkeleton } from "@/components/Categories/category-table-skeleton";

export const metadata: Metadata = {
  title: "Categories - List",
};

export default function CategoryListPage() {
  return (
    <>
      <Breadcrumb pageName="Danh mục sản phẩm" />

      <Suspense fallback={<CategoryTableSkeleton />}>
        <CategoryTable />
      </Suspense>
    </>
  );
}
