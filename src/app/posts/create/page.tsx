import type { Metadata } from "next";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { PostCreateForm } from "@/components/Posts/post-create-form";

export const metadata: Metadata = {
  title: "Posts - Create",
};

export default function PostCreatePage() {
  return (
    <>
      <Breadcrumb pageName="Tạo bài viết" />
      <PostCreateForm />
    </>
  );
}
