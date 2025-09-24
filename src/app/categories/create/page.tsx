import type { Metadata } from "next";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { CategoryCreateForm } from "@/components/Categories/category-create-form";

export const metadata: Metadata = {
  title: "Categories - Create",
};

export default function CategoryCreatePage() {
  return (
    <>
      <Breadcrumb pageName="Tạo danh mục" />

      <CategoryCreateForm />
    </>
  );
}
