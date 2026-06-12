import type { OrderStatus, PaymentStatus } from "@/types/database";

// --- Data interfaces ---

export interface RecentOrder {
  id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total_amount: number;
  created_at: string;
  users: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  } | null;
  order_items: {
    id: string;
    quantity: number;
    products: {
      name: string;
      product_images: {
        url: string;
        is_primary: boolean;
      }[];
    } | null;
  }[];
}

export interface TodayOrder {
  id: string;
  total_amount: number;
  payment_status: PaymentStatus;
  status: OrderStatus;
}

export interface DailyRevenue {
  date: string;
  revenue: number;
}

export interface TopSellingProduct {
  productId: string;
  name: string;
  imageUrl: string | null;
  unitsSold: number;
  revenue: number;
}

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  pendingOrders: number;
  recentOrders: RecentOrder[];
  todayOrdersCount: number;
  todayRevenue: number;
  todayNewUsers: number;
  sentSmsCount: number;
  smsTotalCost: number;
  smsBalance: number;
  isFiltered: boolean;
  revenueByDay: DailyRevenue[];
  topProducts: TopSellingProduct[];
}
