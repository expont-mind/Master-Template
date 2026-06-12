export interface SocialLink {
  id: string;
  platform: string;
  url: string;
  icon_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
