export interface CategoryPlanPrice {
  category_id: number;
  category_name: string;
  category_slug: string;
  price_featured: number;
  featured_ad_price: number;
  featured_days: number;
  featured_ads_count: number;
  price_standard: number;
  standard_ad_price: number;
  standard_days: number;
  standard_ads_count: number;
  free_ad_max_price: number;
}

export interface CategoryPlanPriceUpdateItem {
  category_id: number;
  price_featured: number;
  featured_ad_price: number;
  featured_days?: number;
  featured_ads_count?: number;
  price_standard: number;
  standard_ad_price: number;
  standard_days?: number;
  standard_ads_count?: number;
  free_ad_max_price: number;
}

export interface CategoryPlanPriceUpdateRequest {
  items: CategoryPlanPriceUpdateItem[];
}
