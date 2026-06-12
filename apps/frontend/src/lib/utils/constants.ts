// App constants

import { BRAND } from "./brand-config";

// Site URL — re-exported from brand-config so both sources stay aligned.
export const BASE_URL = BRAND.url;

// Pagination
export const DEFAULT_PAGE_SIZE = 24;
export const PRODUCTS_PER_LOAD = 12;
export const SEARCH_DEBOUNCE_MS = 300;

// Homepage query limits
export const HOME_QUERY_LIMITS = {
  HERO: 3,
  SALE: 7,
  NEW: 7,
  TIMED_SALE: 6,
  DISCOUNTED: 7,
  BEST_SELLING: 10,
  FEATURED: 7,
  RECOMMENDED: 7,
  TRENDING: 7,
  POPULAR: 7,
  TOP_RATED: 7,
  BRAND: 20,
} as const;

// Animation durations (ms)
export const ANIMATION_DURATION = {
  MODAL_CLOSE: 200,
  TRANSITION: 200,
} as const;

// Cache TTLs (in seconds)
export const CACHE_TTL = {
  PRODUCTS_LIST: 60, // 1 minute
  PRODUCT_DETAIL: 120, // 2 minutes
  CATEGORIES: 3600, // 1 hour
  HOMEPAGE: 60, // 1 minute
  SEARCH_SUGGESTIONS: 3600, // 1 hour
} as const;

// ISR revalidation times (in seconds)
export const REVALIDATE = {
  HOMEPAGE: 60,
  PRODUCT: 300,
  CATEGORY: 300,
  STATIC_PAGE: 3600,
} as const;

// Image sizes for responsive loading
export const IMAGE_SIZES = {
  THUMBNAIL: 200,
  CARD: 400,
  PRODUCT: 800,
  GALLERY: 1200,
} as const;

// Payment methods
export const STOREPAY_MIN_AMOUNT = 100_000;

export const PAYMENT_METHODS = [
  {
    id: "qpay" as const,
    name: "QPay",
    icon: "/icons/qpay.svg",
    description: "QPay апп-аар төлөх",
  },
  {
    id: "storepay" as const,
    name: "StorePay",
    icon: "/storepay.png",
    description: "StorePay хуваарь төлөлт",
  },
  {
    id: "pocket" as const,
    name: "Pocket",
    icon: "/icons/pocket.svg",
    description: "Pocket апп-аар төлөх",
  },
  {
    id: "bonum" as const,
    name: "BONUM",
    icon: "/icons/bonum.svg",
    description: "BONUM оноогоор төлөх",
  },
] as const;

// Order statuses with labels
export const ORDER_STATUS_LABELS = {
  pending: { label: "Хүлээгдэж байна", color: "yellow" },
  confirmed: { label: "Баталгаажсан", color: "blue" },
  processing: { label: "Бэлтгэж байна", color: "blue" },
  shipped: { label: "Хүргэлтэнд гарсан", color: "purple" },
  delivered: { label: "Хүргэгдсэн", color: "green" },
  cancelled: { label: "Цуцлагдсан", color: "red" },
} as const;

// Payment status labels
export const PAYMENT_STATUS_LABELS = {
  pending: { label: "Төлөгдөөгүй", color: "yellow" },
  paid: { label: "Төлөгдсөн", color: "green" },
  failed: { label: "Амжилтгүй", color: "red" },
  refunded: { label: "Буцаагдсан", color: "gray" },
} as const;

// Sort options
export const SORT_OPTIONS = [
  { value: "", label: "Санал болгох" },
  { value: "newest", label: "Шинэ нь эхэнд" },
  { value: "popular", label: "Их зарагдсан" },
  { value: "price_asc", label: "Үнэ өсөхөөр" },
  { value: "price_desc", label: "Үнэ буурахаар" },
] as const;

// Routes
export const ROUTES = {
  HOME: "/",
  PRODUCTS: "/products",
  // eslint-disable-next-line no-restricted-syntax -- the ROUTES factory IS the single source of truth the rule points to
  PRODUCT: (slug: string) => `/products/${slug}`,
  CATEGORIES: "/products",
  // eslint-disable-next-line no-restricted-syntax -- the ROUTES factory IS the single source of truth the rule points to
  CATEGORY: (slug: string) => `/products?category=${slug}`,
  SEARCH: "/search",
  CART: "/cart",
  CHECKOUT: "/checkout",
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  ACCOUNT: "/account",
  ORDERS: "/account/orders",
  ORDER: (id: string) => `/orders/${id}`,
  ADDRESSES: "/account/addresses",
  WISHLIST: "/wishlist",
  BEST_SELLERS: "/best-sellers",
  NEW_ARRIVALS: "/new-arrivals",
  BRANDS: "/brands",
  BRAND: (slug: string) => `/brands/${slug}`,
  EVENTS: "/events",
  EVENT: (slug: string) => `/events/${slug}`,
} as const;
