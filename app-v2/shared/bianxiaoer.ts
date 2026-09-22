export const SERVICE_CATEGORIES = [
  "accommodation",
  "transport",
  "dining",
  "delivery",
  "shopping",
  "carRepair",
  "beauty",
  "entertainment",
  "logistics",
  "trade",
  "hotel",
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
export type SupportedLocale = "zh" | "ru" | "en";

export type LocalizedText = Record<SupportedLocale, string>;

export interface MerchantSummary {
  // 统一使用后台字符串 id（如 "m1790064991250"），本地 mock 的 "m1".."m9" 同样适用
  id: string;
  slug: string;
  category: ServiceCategory;
  name: LocalizedText;
  shortDescription: LocalizedText;
  coverImageUrl: string | null;
  rating: number;
  reviewCount: number;
  distanceKm: number | null;
  isOpen: boolean;
  tags: string[];
}

export interface DealSummary {
  id: number;
  merchantId: number;
  merchantName: LocalizedText;
  category: ServiceCategory;
  title: LocalizedText;
  coverImageUrl: string | null;
  currentPriceCents: number;
  originalPriceCents: number | null;
  soldCount: number;
  expiresAt: string | null;
}

export interface MerchantDetail extends MerchantSummary {
  description: LocalizedText;
  address: string | null;
  phone: string | null;
  businessHours: string | null;
  latitude: number | null;
  longitude: number | null;
  menuCategories: Array<{
    id: number;
    name: LocalizedText;
    items: Array<{
      id: number;
      name: LocalizedText;
      description: LocalizedText;
      imageUrl: string | null;
      priceCents: number;
      unit: LocalizedText;
    }>;
  }>;
  reviews: Array<{
    id: number;
    userDisplayName: string;
    rating: number;
    content: string;
    createdAt: string;
  }>;
}

export interface DealDetail extends DealSummary {
  description: LocalizedText;
  rules: LocalizedText;
  options: Array<{ id: number; name: LocalizedText; priceCents: number }>;
}

export interface HomeFeed {
  city: LocalizedText;
  featuredMerchants: MerchantSummary[];
  nearbyMerchants: MerchantSummary[];
  featuredDeals: DealSummary[];
}
