// Status labels in Mongolian
export const ORDER_STATUS_LABELS = {
  pending: "Хүлээгдэж буй",
  confirmed: "Баталгаажсан",
  canceled: "Цуцлагдсан",
} as const;

export const DELIVERY_STATUS_LABELS = {
  pending: "Хүлээгдэж буй",
  preparing: "Бэлтгэгдэж буй",
  confirmed: "Баталгаажсан",
  shipped: "Хүр / Гарсан",
  delivered: "Хүргэгдсэн",
  canceled: "Цуцлагдсан",
} as const;

export const PAYMENT_STATUS_LABELS = {
  unpaid: "Төлөгдөөгүй",
  processing: "Хүлээгдэж байна",
  paid: "Төлөгдсөн",
  failed: "Амжилтгүй",
} as const;

export const PRODUCT_STATUS_LABELS = {
  active: "Идэвхтэй",
  inactive: "Идэвхгүй",
  draft: "Ноорог",
} as const;

export const PRODUCT_STATUS_COLORS = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  draft: "bg-yellow-100 text-yellow-800",
} as const;

export const USER_STATUS_LABELS = {
  active: "Идэвхтэй",
  inactive: "Идэвхгүй",
  banned: "Хориглосон",
} as const;

export const REVIEW_STATUS_LABELS = {
  active: "Идэвхтэй",
  hidden: "Нуусан",
  flagged: "Тэмдэглэсэн",
} as const;

export const CONTENT_STATUS_LABELS = {
  draft: "Ноорог",
  published: "Нийтлэгдсэн",
  archived: "Архивлагдсан",
} as const;

export const ADMIN_ROLE_LABELS = {
  super_admin: "Супер Админ",
  operator: "Оператор",
  content_manager: "Контент Менежер",
  support: "Дэмжлэг",
} as const;

// Status colors for badges
export const ORDER_STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  canceled: "bg-red-100 text-red-800",
} as const;

export const DELIVERY_STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  preparing: "bg-orange-100 text-orange-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  canceled: "bg-red-100 text-red-800",
} as const;

export const PAYMENT_STATUS_COLORS = {
  unpaid: "bg-gray-100 text-gray-800",
  processing: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
} as const;

export const USER_STATUS_COLORS = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  banned: "bg-red-100 text-red-800",
} as const;

export const REVIEW_STATUS_COLORS = {
  active: "bg-green-100 text-green-800",
  hidden: "bg-gray-100 text-gray-800",
  flagged: "bg-orange-100 text-orange-800",
} as const;

export const CONTENT_STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-800",
  published: "bg-green-100 text-green-800",
  archived: "bg-yellow-100 text-yellow-800",
} as const;

// FAQ Categories
export const FAQ_CATEGORIES = {
  general: "Ерөнхий",
  order: "Захиалга",
  payment: "Төлбөр",
  shipping: "Хүргэлт",
  return: "Буцаалт",
  account: "Бүртгэл",
  point: "Поинт",
} as const;

// Point Transaction Types
export const POINT_TYPE_LABELS = {
  promotional: "Урамшуулал",
  earned: "Цуглуулсан",
  used: "Ашигласан",
  refund: "Буцаалт",
} as const;

export const POINT_TYPE_COLORS = {
  promotional: "bg-purple-100 text-purple-800",
  earned: "bg-green-100 text-green-800",
  used: "bg-red-100 text-red-800",
  refund: "bg-yellow-100 text-yellow-800",
} as const;

// Transaction Status (for Payments)
export const TRANSACTION_STATUS_LABELS = {
  pending: "Хүлээгдэж буй",
  success: "Амжилттай",
  failed: "Амжилтгүй",
} as const;

export const TRANSACTION_STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  success: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
} as const;

// Payment Providers
export const PAYMENT_PROVIDER_LABELS = {
  qpay: "QPay",
  socialpay: "SocialPay",
  monpay: "MonPay",
  lendmn: "LendMN",
  storepay: "StorePay",
  card: "Карт",
  bank: "Банк",
  cash: "Бэлэн мөнгө",
} as const;

// Payment Methods (for orders)
export const PAYMENT_METHOD_LABELS = {
  qpay: "QPay",
  lendmn: "LendMN",
  storepay: "StorePay",
  transfer: "Шилжүүлэг",
  free: "Үнэгүй",
} as const;

export const PAYMENT_METHOD_COLORS = {
  qpay: "bg-blue-100 text-blue-800",
  lendmn: "bg-purple-100 text-purple-800",
  storepay: "bg-indigo-100 text-indigo-800",
  transfer: "bg-gray-100 text-gray-800",
  free: "bg-green-100 text-green-800",
} as const;

// Banner Positions
export const BANNER_POSITION_LABELS = {
  home_hero: "Нүүр хуудас (Hero)",
  home_secondary: "Нүүр хуудас (Дэд)",
  category: "Ангилал",
  product: "Бүтээгдэхүүн",
  checkout: "Төлбөр хийх",
} as const;

// Banner Link Types
export const BANNER_LINK_TYPE_LABELS = {
  product: "Бүтээгдэхүүн",
  category: "Ангилал",
  external: "Гадаад холбоос",
  none: "Холбоосгүй",
} as const;

// Coupon Types
export const COUPON_TYPE_LABELS = {
  fixed: "Тогтмол хөнгөлөлт",
  percentage: "Хувийн хөнгөлөлт",
  free_shipping: "Үнэгүй хүргэлт",
} as const;

// Coupon Scope
export const COUPON_SCOPE_LABELS = {
  all: "Бүх бүтээгдэхүүн",
  category: "Ангилал",
  product: "Бүтээгдэхүүн",
  brand: "Брэнд",
} as const;

// Notification Types
export const NOTIFICATION_TYPE_LABELS = {
  order: "Захиалга",
  payment: "Төлбөр",
  promotion: "Урамшуулал",
  system: "Систем",
} as const;

// Price Rule Types
export const PRICE_RULE_TYPE_LABELS = {
  fixed: "Тогтмол",
  percentage: "Хувь",
} as const;

// Price Rule Scope
export const PRICE_RULE_SCOPE_LABELS = {
  all: "Бүх бүтээгдэхүүн",
  category: "Ангилал",
  product: "Бүтээгдэхүүн",
  brand: "Брэнд",
} as const;

// SMS Status
export const SMS_STATUS_LABELS = {
  draft: "Ноорог",
  scheduled: "Төлөвлөсөн",
  sending: "Илгээж байна",
  sent: "Илгээсэн",
  failed: "Амжилтгүй",
} as const;

export const SMS_STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-800",
  scheduled: "bg-blue-100 text-blue-800",
  sending: "bg-yellow-100 text-yellow-800",
  sent: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
} as const;

// Product Filters
export const STOCK_FILTER_LABELS = {
  all: "Бүгд",
  out: "Дууссан",
  low: "Бага (<10)",
  in_stock: "Хангалттай",
} as const;

export const DISCOUNT_FILTER_LABELS = {
  all: "Бүгд",
  has: "Хямдралтай",
  none: "Хямдралгүй",
} as const;

// User Sort Options
export const USER_SORT_LABELS = {
  newest: "Шинэ",
  oldest: "Хуучин",
  most_orders: "Захиалга ихтэй",
  highest_points: "Point ихтэй",
  highest_spent: "Зарцуулалт ихтэй",
} as const;

// SMS Log Status
export const SMS_LOG_STATUS_LABELS = {
  pending: "Хүлээгдэж буй",
  sent: "Илгээсэн",
  failed: "Амжилтгүй",
} as const;

export const SMS_LOG_STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  sent: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
