import type { Metadata } from "next";
import { Suspense } from "react";

import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { PostTable } from "@/components/Posts/post-table";
import { PostTableSkeleton } from "@/components/Posts/post-table-skeleton";

export const metadata: Metadata = {
  title: "Posts - List",
};

export default function PostListPage() {
  return (
    <>
      <Breadcrumb pageName="Bài viết" />

      <Suspense fallback={<PostTableSkeleton />}>
        <PostTable />
      </Suspense>
    </>
  );
}
