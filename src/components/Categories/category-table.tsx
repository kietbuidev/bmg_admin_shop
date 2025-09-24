import { CategoryTableClient } from "./category-table-client";
import { getCategories } from "./fetch";

const PAGE_SIZE = 10;

export async function CategoryTable() {
  const initialData = await getCategories({ page: 1, limit: PAGE_SIZE });

  return <CategoryTableClient initialData={initialData} pageSize={PAGE_SIZE} />;
}
