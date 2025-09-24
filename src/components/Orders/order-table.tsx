import { getOrders } from "./fetch";
import { OrderTableClient } from "./order-table-client";

const DEFAULT_PAGE_SIZE = 10;

export async function OrderTable() {
  const initialData = await getOrders({ page: 1, limit: DEFAULT_PAGE_SIZE });
  const initialPageSize = initialData.pagination.per_page || DEFAULT_PAGE_SIZE;

  return <OrderTableClient initialData={initialData} pageSize={initialPageSize} />;
}
