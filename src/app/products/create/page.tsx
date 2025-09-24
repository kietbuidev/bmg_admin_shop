import type { Metadata } from "next";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ProductCreateForm } from "@/components/Products/product-create-form";

export const metadata: Metadata = {
  title: "Products - Create",
};

export default function ProductCreatePage() {
  return (
    <>
      <Breadcrumb pageName="Tạo sản phẩm" />
      <ProductCreateForm />
    </>
  );
}
