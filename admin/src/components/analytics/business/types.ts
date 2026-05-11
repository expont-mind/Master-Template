// ── Raw DB row types ──────────────────────────────────────────

export interface OrderRow {
  id: string;
  total_amount: number;
  status: string;
  delivery_status: string;
  payment_status: string;
  payment_method: string;
  created_at: string;
}

export interface UserRow {
  id: string;
  status: string;
  created_at: string;
}

export interface OrderItemRow {
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  products: {
    id: string;
    name: string;
    price: number;
    category_id: string | null;
    brand_id: string | null;
    status: string;
    product_images: { url: string; is_primary: boolean }[];
  } | null;
}

export interface ProductRow {
  id: string;
  name: string;
  price: number;
  discount_price: number | null;
  stock_quantity: number;
  status: string;
  category_id: string | null;
  brand_id: string | null;
  created_at: string;
  product_variants: { id: string; stock_quantity: number }[] | null;
}

export interface InventoryRow {
  product_id: string;
  stock_quantity: number;
  reserved_quantity: number;
}

export interface ReviewRow {
  product_id: string;
  rating: number;
  status: string;
}

export interface CategoryRow {
  id: string;
  name: string;
}

// ── Computed analytics types ──────────────────────────────────

export interface ProductPerfData {
  qtySold: number;
  revenue: number;
  imageUrl: string | null;
  avgRating: number | null;
  reviewCount: number;
}

export interface DayValue {
  date: string;
  value: number;
}

export interface ProductPerformance {
  id: string;
  name: string;
  price: number;
  discountPrice: number | null;
  status: string;
  categoryId: string | null;
  imageUrl: string | null;
  qtySold: number;
  revenue: number;
  stock: number;
  reserved: number;
  avgRating: number | null;
  reviewCount: number;
  variantCount: number;
}

export interface InventoryAlert {
  productId: string;
  name: string;
  imageUrl: string | null;
  stock: number;
  reserved: number;
}

export interface AnalyticsData {
  // KPI
  totalRevenue: number;
  prevRevenue: number;
  totalOrders: number;
  prevOrders: number;
  newUsers: number;
  prevNewUsers: number;
  averageOrderValue: number;
  cancellationRate: number;
  avgRating: number;

  // Charts
  revenueByDay: DayValue[];
  ordersByDay: DayValue[];
  ordersByStatus: Record<string, number>;
  deliveryFunnel: Record<string, number>;
  paymentMethodBreakdown: Record<string, number>;
  usersByDay: DayValue[];
  totalUsers: number;
  activeUsers: number;

  // Product analytics
  allProducts: ProductPerformance[];
  categoryBreakdown: { name: string; revenue: number }[];
  inventoryAlerts: InventoryAlert[];

  // Loading
  isLoading: boolean;
}

// ── Product analytics types ───────────────────────────────────

export interface ProductOrderRow {
  itemId: string;
  orderId: string;
  date: string;
  qty: number;
  unitPrice: number;
  total: number;
  paymentStatus: string;
  deliveryStatus: string;
}

export interface ProductAnalyticsData {
  product: {
    id: string;
    name: string;
    price: number;
    discountPrice: number | null;
    status: string;
    imageUrl: string | null;
  };
  totalQtySold: number;
  totalRevenue: number;
  prevQtySold: number;
  prevRevenue: number;
  avgUnitPrice: number;
  avgRating: number | null;
  reviewCount: number;
  salesByDay: DayValue[];
  qtyByDay: DayValue[];
  recentOrders: ProductOrderRow[];
  stock: number;
  reserved: number;
}

// ── Period options ─────────────────────────────────────────────

// ── Analytics tab types ──────────────────────────────────────

export interface HeatmapCell {
  day_of_week: number;
  hour_of_day: number;
  order_count: number;
}

export interface ReturningVsNew {
  new_buyers: number;
  returning_buyers: number;
}

export interface TopSpender {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  primary_phone: string | null;
  total_spent: number;
  order_count: number;
}

export interface CouponAnalyticsData {
  total_usages: number;
  total_discount: number;
  top_coupons: { code: string; type: string; usage_count: number; total_discount: number }[];
  usage_by_day: { date: string; count: number }[];
}

export interface KpiItem {
  title: string;
  value: string;
  change?: number;
  icon: import("lucide-react").LucideIcon;
  iconColor: string;
}

export const PERIOD_OPTIONS = [
  { value: "custom", label: "Өөр хугацаа" },
] as const;

// ── Chart tooltip style ───────────────────────────────────────

export const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: "hsl(var(--card))",
    color: "hsl(var(--card-foreground))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: "13px",
  },
};

export const CHART_AXIS_STYLE = {
  tick: { fill: "hsl(var(--muted-foreground))", fontSize: 12 },
};

// ── Chart colors ──────────────────────────────────────────────

export const CHART_COLORS = [
  "#10b981",
  "#6366f1",
  "#8b5cf6",
  "#f59e0b",
  "#f43f5e",
  "#06b6d4",
  "#ec4899",
  "#14b8a6",
];
