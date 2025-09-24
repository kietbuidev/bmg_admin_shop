import type { Metadata } from "next";
import { notFound } from "next/navigation";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { getPostDetail } from "@/components/Posts/fetch";
import { PostUpdateForm } from "@/components/Posts/post-update-form";
import type { PostRecord } from "@/components/Posts/types";

type PostEditPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const metadata: Metadata = {
  title: "Posts - Edit",
};

export default async function PostEditPage({ params }: PostEditPageProps) {
  const { id } = await params;

  let post: PostRecord;
  try {
    post = await getPostDetail(id);
  } catch (error) {
    console.error(error);
    notFound();
  }

  return (
    <>
      <Breadcrumb pageName="Cập nhật bài viết" />
      <PostUpdateForm post={post} />
    </>
  );
}
