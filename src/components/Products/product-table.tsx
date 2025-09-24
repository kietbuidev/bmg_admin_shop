import { ProductTableClient } from "./product-table-client";
import { getProducts } from "./fetch";

const PAGE_SIZE = 10;

export async function ProductTable() {
  const initialData = await getProducts({ page: 1, limit: PAGE_SIZE });
  const initialPageSize = initialData.pagination.per_page || PAGE_SIZE;

  return (
    <ProductTableClient
      initialData={initialData}
      pageSize={initialPageSize}
    />
  );
}
