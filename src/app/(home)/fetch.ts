import { PRODUCT_STATUS_VALUES, type ProductStatus } from "@/components/Products/types";

const DEFAULT_ORDER_ANALYTICS_ENDPOINT =
  "https://bmgshop-production.up.railway.app/api/analytics/orders";
const DEFAULT_PRODUCT_ANALYTICS_ENDPOINT =
  "https://bmgshop-production.up.railway.app/api/analytics/products";
const DEFAULT_CONTACT_ANALYTICS_ENDPOINT =
  "https://bmgshop-production.up.railway.app/api/analytics/contacts";
const DEFAULT_POST_ANALYTICS_ENDPOINT =
  "https://bmgshop-production.up.railway.app/api/analytics/posts";

type OrderAnalyticsResponse = {
  code?: number;
  message?: string;
  data?: {
    total_orders?: unknown;
    status_breakdown?: Record<string, unknown>;
  };
};

type OrdersOverview = {
  value: number;
  growthRate: number;
  statusBreakdown: Record<string, number>;
};

type ProductAnalyticsResponse = {
  code?: number;
  message?: string;
  data?: {
    total_products?: unknown;
    status_breakdown?: Record<string, unknown>;
  };
};

type ProductsOverview = {
  value: number;
  growthRate: number;
  statusBreakdown: Record<ProductStatus, number>;
};

type ContactAnalyticsResponse = {
  code?: number;
  message?: string;
  data?: {
    total_contacts?: unknown;
    status_breakdown?: Record<string, unknown>;
  };
};

type ContactStatus = "NEW" | "INPROGRESS" | "RESOLVED";

type ContactsOverview = {
  value: number;
  growthRate: number;
  statusBreakdown: Record<ContactStatus, number>;
};

type PostAnalyticsResponse = {
  code?: number;
  message?: string;
  data?: {
    total_posts?: unknown;
    is_active_breakdown?: Record<string, unknown>;
  };
};

type PostStatus = "ACTIVE" | "INACTIVE";

type PostsOverview = {
  value: number;
  growthRate: number;
  statusBreakdown: Record<PostStatus, number>;
};

async function getOrdersOverview(): Promise<OrdersOverview> {
  const endpoint =
    process.env.NEXT_PUBLIC_ORDERS_ANALYTICS_ENDPOINT ??
    DEFAULT_ORDER_ANALYTICS_ENDPOINT;

  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to load order analytics: ${response.status}`);
    }

    const payload = (await response.json()) as OrderAnalyticsResponse | null;

    if (!payload || (payload.code && payload.code !== 200)) {
      throw new Error(payload?.message ?? "Invalid analytics response");
    }

    const data = payload.data ?? {};
    const totalOrders =
      typeof data.total_orders === "number" ? data.total_orders : 0;
    const rawBreakdown = data.status_breakdown ?? {};
    const statusBreakdown = Object.entries(rawBreakdown).reduce<
      Record<string, number>
    >((acc, [status, value]) => {
      if (typeof value === "number" && Number.isFinite(value)) {
        acc[status] = value;
      }
      return acc;
    }, {});

    const completed = statusBreakdown.COMPLETED ?? 0;
    const completionRate =
      totalOrders > 0 ? Number(((completed / totalOrders) * 100).toFixed(2)) : 0;

    return {
      value: totalOrders,
      growthRate: completionRate,
      statusBreakdown,
    };
  } catch (error) {
    console.error("Order analytics error", error);
    return {
      value: 0,
      growthRate: 0,
      statusBreakdown: {},
    };
  }
}

async function getProductsOverview(): Promise<ProductsOverview> {
  const endpoint =
    process.env.NEXT_PUBLIC_PRODUCTS_ANALYTICS_ENDPOINT ??
    DEFAULT_PRODUCT_ANALYTICS_ENDPOINT;

  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to load product analytics: ${response.status}`);
    }

    const payload = (await response.json()) as ProductAnalyticsResponse | null;

    if (!payload || (payload.code && payload.code !== 200)) {
      throw new Error(payload?.message ?? "Invalid analytics response");
    }

    const data = payload.data ?? {};
    const totalProducts =
      typeof data.total_products === "number" ? data.total_products : 0;
    const rawBreakdown = data.status_breakdown ?? {};

    const statusBreakdown = PRODUCT_STATUS_VALUES.reduce<Record<ProductStatus, number>>(
      (acc, status) => {
        const value = rawBreakdown?.[status];
        acc[status] =
          typeof value === "number" && Number.isFinite(value) ? value : 0;
        return acc;
      },
      {
        NEW: 0,
        BEST_SELLER: 0,
        SALE_OFF: 0,
        NORMAL: 0,
      },
    );

    const bestSeller = statusBreakdown.BEST_SELLER ?? 0;
    const bestSellerShare =
      totalProducts > 0
        ? Number(((bestSeller / totalProducts) * 100).toFixed(2))
        : 0;

    return {
      value: totalProducts,
      growthRate: bestSellerShare,
      statusBreakdown,
    };
  } catch (error) {
    console.error("Product analytics error", error);
    return {
      value: 0,
      growthRate: 0,
      statusBreakdown: {
        NEW: 0,
        BEST_SELLER: 0,
        SALE_OFF: 0,
        NORMAL: 0,
      },
    };
  }
}

export async function getOverviewData() {
  const [orders, products, contacts, posts] = await Promise.all([
    getOrdersOverview(),
    getProductsOverview(),
    getContactsOverview(),
    getPostsOverview(),
  ]);

  return {
    orders,
    products,
    contacts,
    posts,
    profit: {
      value: 4220,
      growthRate: 4.35,
    },
    users: {
      value: 3456,
      growthRate: -0.95,
    },
  };
}

async function getContactsOverview(): Promise<ContactsOverview> {
  const endpoint =
    process.env.NEXT_PUBLIC_CONTACTS_ANALYTICS_ENDPOINT ??
    DEFAULT_CONTACT_ANALYTICS_ENDPOINT;

  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to load contact analytics: ${response.status}`);
    }

    const payload = (await response.json()) as ContactAnalyticsResponse | null;

    if (!payload || (payload.code && payload.code !== 200)) {
      throw new Error(payload?.message ?? "Invalid analytics response");
    }

    const data = payload.data ?? {};
    const totalContacts =
      typeof data.total_contacts === "number" ? data.total_contacts : 0;
    const rawBreakdown = data.status_breakdown ?? {};

    const statusBreakdown = {
      NEW: 0,
      INPROGRESS: 0,
      RESOLVED: 0,
    } as Record<ContactStatus, number>;

    (Object.entries(rawBreakdown) as Array<[ContactStatus, unknown]>).forEach(
      ([status, value]) => {
        if (status in statusBreakdown && typeof value === "number") {
          statusBreakdown[status] = Number.isFinite(value) ? value : 0;
        }
      },
    );

    const resolved = statusBreakdown.RESOLVED ?? 0;
    const resolutionRate =
      totalContacts > 0
        ? Number(((resolved / totalContacts) * 100).toFixed(2))
        : 0;

    return {
      value: totalContacts,
      growthRate: resolutionRate,
      statusBreakdown,
    };
  } catch (error) {
    console.error("Contact analytics error", error);
    return {
      value: 0,
      growthRate: 0,
      statusBreakdown: {
        NEW: 0,
        INPROGRESS: 0,
        RESOLVED: 0,
      },
    };
  }
}

async function getPostsOverview(): Promise<PostsOverview> {
  const endpoint =
    process.env.NEXT_PUBLIC_POSTS_ANALYTICS_ENDPOINT ??
    DEFAULT_POST_ANALYTICS_ENDPOINT;

  try {
    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to load post analytics: ${response.status}`);
    }

    const payload = (await response.json()) as PostAnalyticsResponse | null;

    if (!payload || (payload.code && payload.code !== 200)) {
      throw new Error(payload?.message ?? "Invalid analytics response");
    }

    const data = payload.data ?? {};
    const totalPosts =
      typeof data.total_posts === "number" ? data.total_posts : 0;
    const breakdown = data.is_active_breakdown ?? {};

    const statusBreakdown: Record<PostStatus, number> = {
      ACTIVE: 0,
      INACTIVE: 0,
    };

    const activeValue = breakdown.active;
    const inactiveValue = breakdown.inactive;

    statusBreakdown.ACTIVE =
      typeof activeValue === "number" && Number.isFinite(activeValue)
        ? activeValue
        : 0;
    statusBreakdown.INACTIVE =
      typeof inactiveValue === "number" && Number.isFinite(inactiveValue)
        ? inactiveValue
        : 0;

    const activeRate =
      totalPosts > 0
        ? Number(((statusBreakdown.ACTIVE / totalPosts) * 100).toFixed(2))
        : 0;

    return {
      value: totalPosts,
      growthRate: activeRate,
      statusBreakdown,
    };
  } catch (error) {
    console.error("Post analytics error", error);
    return {
      value: 0,
      growthRate: 0,
      statusBreakdown: {
        ACTIVE: 0,
        INACTIVE: 0,
      },
    };
  }
}

export async function getChatsData() {
  // Fake delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return [
    {
      name: "Jacob Jones",
      profile: "/images/user/user-02.png",
      isActive: true,
      lastMessage: {
        content: "See you tomorrow at the meeting!",
        type: "text",
        timestamp: "2024-12-19T14:30:00Z",
        isRead: false,
      },
      unreadCount: 3,
    },
    {
      name: "Wilium Smith",
      profile: "/images/user/user-03.png",
      isActive: true,
      lastMessage: {
        content: "Thanks for the update",
        type: "text",
        timestamp: "2024-12-19T10:15:00Z",
        isRead: true,
      },
      unreadCount: 0,
    },
    {
      name: "Johurul Haque",
      profile: "/images/user/user-04.png",
      isActive: false,
      lastMessage: {
        content: "What's up?",
        type: "text",
        timestamp: "2024-12-19T10:15:00Z",
        isRead: true,
      },
      unreadCount: 0,
    },
    {
      name: "M. Chowdhury",
      profile: "/images/user/user-05.png",
      isActive: false,
      lastMessage: {
        content: "Where are you now?",
        type: "text",
        timestamp: "2024-12-19T10:15:00Z",
        isRead: true,
      },
      unreadCount: 2,
    },
    {
      name: "Akagami",
      profile: "/images/user/user-07.png",
      isActive: false,
      lastMessage: {
        content: "Hey, how are you?",
        type: "text",
        timestamp: "2024-12-19T10:15:00Z",
        isRead: true,
      },
      unreadCount: 0,
    },
  ];
}
