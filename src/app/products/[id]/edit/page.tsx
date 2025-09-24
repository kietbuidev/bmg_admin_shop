import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { getProductDetail } from "@/components/Products/fetch";
import { ProductUpdateForm } from "@/components/Products/product-update-form";
import type { ProductRecord } from "@/components/Products/types";

type ProductEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Products - Edit",
};

export default async function ProductEditPage({
  params,
}: ProductEditPageProps) {
  const { id } = await params;

  let product: ProductRecord;
  try {
    product = await getProductDetail(id);
  } catch (error) {
    console.error(error);
    notFound();
  }

  return (
    <>
      <Breadcrumb pageName="Cập nhật sản phẩm" />
      <ProductUpdateForm product={product} />
    </>
  );
}
