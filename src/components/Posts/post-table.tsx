import { PostTableClient } from "./post-table-client";
import { getPosts } from "./fetch";

const PAGE_SIZE = 10;

export async function PostTable() {
  const initialData = await getPosts({ page: 1, limit: PAGE_SIZE });
  const initialPageSize = initialData.pagination.per_page || PAGE_SIZE;

  return (
    <PostTableClient initialData={initialData} pageSize={initialPageSize} />
  );
}
