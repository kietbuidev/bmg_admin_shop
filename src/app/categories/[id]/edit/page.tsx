import { notFound } from "next/navigation";
import type { Metadata } from "next";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { CategoryUpdateForm } from "@/components/Categories/category-update-form";
import { getCategoryDetail } from "@/components/Categories/fetch";
import type { CategoryRecord } from "@/components/Categories/types";

type CategoryEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Categories - Edit",
};

export default async function CategoryEditPage({
  params,
}: CategoryEditPageProps) {
  const { id } = await params;
  
  let category: CategoryRecord;
  try {
    category = await getCategoryDetail(id);
  } catch (error) {
    console.error(error);
    notFound();
  }

  return (
    <>
      <Breadcrumb pageName="Cập nhật danh mục" />

      <CategoryUpdateForm category={category} />
    </>
  );
}
