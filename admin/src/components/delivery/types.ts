export interface DeliveryZone {
  id: string;
  name: string;
  description: string | null;
  delivery_fee: number;
  free_delivery_threshold: number | null;
  is_free_delivery_enabled: boolean;
  estimated_days_min: number;
  estimated_days_max: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
