import { PRODUCT_STATUS_VALUES } from "@/components/Products/types";
import { compactFormat } from "@/lib/format-number";
import { getOverviewData } from "../../fetch";
import { OverviewCard } from "./card";
import * as icons from "./icons";

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
};

const PRODUCT_STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  BEST_SELLER: "Best Seller",
  SALE_OFF: "Sale Off",
  NORMAL: "Normal",
};

const CONTACT_STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  INPROGRESS: "In Progress",
  RESOLVED: "Resolved",
};

const POST_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

export async function OverviewCardsGroup() {
  const { orders, products, contacts, posts, profit, users } = await getOverviewData();

  const orderDetails = Object.entries(orders.statusBreakdown)
    .filter(([, value]) => value > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([status, value]) => ({
      label: ORDER_STATUS_LABELS[status] ?? status,
      value,
    }));

  const productDetails = PRODUCT_STATUS_VALUES.map((status) => ({
    label: PRODUCT_STATUS_LABELS[status] ?? status,
    value: products.statusBreakdown[status] ?? 0,
  })).filter((item) => item.value > 0);

  const contactDetails = Object.entries(contacts.statusBreakdown)
    .filter(([, value]) => value > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([status, value]) => ({
      label: CONTACT_STATUS_LABELS[status] ?? status,
      value,
    }));

  const postDetails = Object.entries(posts.statusBreakdown)
    .filter(([, value]) => value > 0)
    .map(([status, value]) => ({
      label: POST_STATUS_LABELS[status] ?? status,
      value,
    }));

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
      <OverviewCard
        label="Total Orders"
        data={{
          ...orders,
          value: compactFormat(orders.value),
          trendLabel: "Completion rate",
        }}
        details={orderDetails}
        Icon={icons.Orders}
      />

      <OverviewCard
        label="Total Products"
        data={{
          ...products,
          value: compactFormat(products.value),
          trendLabel: "Best seller share",
        }}
        details={productDetails}
        Icon={icons.Product}
      />

      <OverviewCard
        label="Total Contacts"
        data={{
          ...contacts,
          value: compactFormat(contacts.value),
          trendLabel: "Resolution rate",
        }}
        details={contactDetails}
        Icon={icons.Contacts}
      />

      <OverviewCard
        label="Total Posts"
        data={{
          ...posts,
          value: compactFormat(posts.value),
          trendLabel: "Active share",
        }}
        details={postDetails}
        Icon={icons.Posts}
      />

    </div>
  );
}
