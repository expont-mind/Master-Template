export interface ListParams {
  page?: number;
  search?: string;
  [key: string]: unknown;
}

export const queryKeys = {
  brands: {
    all: ["brands"] as const,
    lists: (params?: ListParams) => [...queryKeys.brands.all, "list", params ?? {}] as const,
    detail: (id: string) => [...queryKeys.brands.all, "detail", id] as const,
  },
  faqs: {
    all: ["faqs"] as const,
    lists: (params?: ListParams) => [...queryKeys.faqs.all, "list", params ?? {}] as const,
    detail: (id: string) => [...queryKeys.faqs.all, "detail", id] as const,
  },
  deliveryZones: {
    all: ["deliveryZones"] as const,
    lists: (params?: ListParams) => [...queryKeys.deliveryZones.all, "list", params ?? {}] as const,
    detail: (id: string) => [...queryKeys.deliveryZones.all, "detail", id] as const,
  },
  banners: {
    all: ["banners"] as const,
    lists: (params?: ListParams) => [...queryKeys.banners.all, "list", params ?? {}] as const,
    detail: (id: string) => [...queryKeys.banners.all, "detail", id] as const,
  },
  ads: {
    all: ["ads"] as const,
    lists: (params?: ListParams) => [...queryKeys.ads.all, "list", params ?? {}] as const,
    detail: (id: string) => [...queryKeys.ads.all, "detail", id] as const,
  },
  articles: {
    all: ["articles"] as const,
    lists: (params?: ListParams) => [...queryKeys.articles.all, "list", params ?? {}] as const,
    detail: (id: string) => [...queryKeys.articles.all, "detail", id] as const,
  },
  coupons: {
    all: ["coupons"] as const,
    lists: (params?: ListParams) => [...queryKeys.coupons.all, "list", params ?? {}] as const,
    detail: (id: string) => [...queryKeys.coupons.all, "detail", id] as const,
  },
  events: {
    all: ["events"] as const,
    lists: (params?: ListParams) => [...queryKeys.events.all, "list", params ?? {}] as const,
    detail: (id: string) => [...queryKeys.events.all, "detail", id] as const,
  },
  branches: {
    all: ["branches"] as const,
    lists: (params?: ListParams) => [...queryKeys.branches.all, "list", params ?? {}] as const,
    detail: (id: string) => [...queryKeys.branches.all, "detail", id] as const,
  },
  warehouses: {
    all: ["warehouses"] as const,
    lists: (params?: ListParams) => [...queryKeys.warehouses.all, "list", params ?? {}] as const,
    detail: (id: string) => [...queryKeys.warehouses.all, "detail", id] as const,
  },
  bankAccounts: {
    all: ["bankAccounts"] as const,
    lists: (params?: ListParams) => [...queryKeys.bankAccounts.all, "list", params ?? {}] as const,
    detail: (id: string) => [...queryKeys.bankAccounts.all, "detail", id] as const,
  },
  products: {
    all: ["products"] as const,
    lists: (params?: ListParams) => [...queryKeys.products.all, "list", params ?? {}] as const,
    detail: (id: string) => [...queryKeys.products.all, "detail", id] as const,
  },
  users: {
    all: ["users"] as const,
    lists: (params?: ListParams) => [...queryKeys.users.all, "list", params ?? {}] as const,
    detail: (id: string) => [...queryKeys.users.all, "detail", id] as const,
  },
  reviews: {
    all: ["reviews"] as const,
    lists: (params?: ListParams) => [...queryKeys.reviews.all, "list", params ?? {}] as const,
    detail: (id: string) => [...queryKeys.reviews.all, "detail", id] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    lists: (params?: ListParams) => [...queryKeys.notifications.all, "list", params ?? {}] as const,
    detail: (id: string) => [...queryKeys.notifications.all, "detail", id] as const,
    unreadCount: () => [...queryKeys.notifications.all, "unreadCount"] as const,
  },
  orders: {
    all: ["orders"] as const,
    lists: (params?: ListParams) => [...queryKeys.orders.all, "list", params ?? {}] as const,
    detail: (id: string) => [...queryKeys.orders.all, "detail", id] as const,
  },
  payments: {
    all: ["payments"] as const,
    lists: (params?: ListParams) => [...queryKeys.payments.all, "list", params ?? {}] as const,
    detail: (id: string) => [...queryKeys.payments.all, "detail", id] as const,
  },
  categories: {
    all: ["categories"] as const,
    lists: (params?: ListParams) => [...queryKeys.categories.all, "list", params ?? {}] as const,
    detail: (id: string) => [...queryKeys.categories.all, "detail", id] as const,
  },
  policies: {
    all: ["policies"] as const,
    lists: (params?: ListParams) => [...queryKeys.policies.all, "list", params ?? {}] as const,
  },
  socialLinks: {
    all: ["socialLinks"] as const,
    lists: (params?: ListParams) => [...queryKeys.socialLinks.all, "list", params ?? {}] as const,
  },
  settings: {
    all: ["settings"] as const,
    byKey: (key: string) => [...queryKeys.settings.all, "key", key] as const,
  },
  analytics: {
    all: ["analytics"] as const,
    dashboard: (from: string, to: string) =>
      [...queryKeys.analytics.all, "dashboard", from, to] as const,
    overview: (from: string, to: string) =>
      [...queryKeys.analytics.all, "overview", from, to] as const,
    sales: (from: string, to: string) => [...queryKeys.analytics.all, "sales", from, to] as const,
    salesHeatmap: (from: string, to: string) =>
      [...queryKeys.analytics.all, "salesHeatmap", from, to] as const,
    users: (from: string, to: string) => [...queryKeys.analytics.all, "users", from, to] as const,
    usersTopSpenders: (from: string, to: string) =>
      [...queryKeys.analytics.all, "usersTopSpenders", from, to] as const,
    usersReturning: (from: string, to: string) =>
      [...queryKeys.analytics.all, "usersReturning", from, to] as const,
    products: (from: string, to: string) =>
      [...queryKeys.analytics.all, "products", from, to] as const,
    marketing: (from: string, to: string) =>
      [...queryKeys.analytics.all, "marketing", from, to] as const,
    inventory: (from: string, to: string) =>
      [...queryKeys.analytics.all, "inventory", from, to] as const,
    product: (id: string, from: string, to: string) =>
      [...queryKeys.analytics.all, "product", id, from, to] as const,
    productTable: (params: ListParams) =>
      [...queryKeys.analytics.all, "productTable", params] as const,
    variantSales: (productId: string, dateFrom: string, dateTo: string) =>
      [...queryKeys.analytics.all, "variantSales", productId, dateFrom, dateTo] as const,
  },
  paymentLogs: {
    all: ["paymentLogs"] as const,
    lists: (params?: ListParams) => [...queryKeys.paymentLogs.all, "list", params ?? {}] as const,
  },
  pointTransactions: {
    all: ["pointTransactions"] as const,
    lists: (params?: ListParams) =>
      [...queryKeys.pointTransactions.all, "list", params ?? {}] as const,
    userBalance: (userId: string) =>
      [...queryKeys.pointTransactions.all, "balance", userId] as const,
  },
  pointFaqs: {
    all: ["pointFaqs"] as const,
    lists: (params?: ListParams) => [...queryKeys.pointFaqs.all, "list", params ?? {}] as const,
    detail: (id: string) => [...queryKeys.pointFaqs.all, "detail", id] as const,
  },
  smsCampaigns: {
    all: ["smsCampaigns"] as const,
    lists: (params?: ListParams) => [...queryKeys.smsCampaigns.all, "list", params ?? {}] as const,
    detail: (id: string) => [...queryKeys.smsCampaigns.all, "detail", id] as const,
  },
  userNotes: {
    all: ["userNotes"] as const,
    byUser: (userId: string) => [...queryKeys.userNotes.all, "user", userId] as const,
  },
  smsLogs: {
    all: ["smsLogs"] as const,
    byUser: (userId: string) => [...queryKeys.smsLogs.all, "user", userId] as const,
  },
  reference: {
    all: ["reference"] as const,
    brands: () => [...queryKeys.reference.all, "brands"] as const,
    categories: () => [...queryKeys.reference.all, "categories"] as const,
    attributes: () => [...queryKeys.reference.all, "attributes"] as const,
  },
};
