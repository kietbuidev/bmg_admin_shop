export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "PACKING"
  | "SHIPPING"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED"
  | "FAILED"
  | "REFUNDED"
  | (string & {});

export type OrderCustomer = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_code: string;
  product_name: string;
  product_thumbnail: string | null;
  selected_size: string | null;
  selected_color: string | null;
  unit_currency: string;
  unit_price: string;
  unit_discount_value: string | null;
  unit_discounted_price: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
};

export type OrderRecord = {
  id: string;
  order_code: string;
  customer_id: string;
  status: OrderStatus;
  currency: string;
  total_items: number;
  subtotal_amount: string;
  discount_amount: string;
  total_amount: string;
  created_at: string;
  updated_at: string;
  customer: OrderCustomer | null;
  items: OrderItem[];
};

export type OrderPagination = {
  total_page: number;
  per_page: number;
  current_page: number;
  count: number;
};

export type OrderListResponse = {
  rows: OrderRecord[];
  pagination: OrderPagination;
};
