export type SiteBannerSlot = "left" | "right";

export type SiteSideBanner = {
  id: string;
  slot: SiteBannerSlot;
  title: string;
  image_url: string;
  href: string;
  enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type SiteSideBannerInput = {
  slot: SiteBannerSlot;
  title: string;
  image_url: string;
  href: string;
  enabled?: boolean;
  sort_order?: number;
};
