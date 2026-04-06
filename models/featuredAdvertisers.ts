export interface FeaturedAdvertiserCategoryRef {
  id: number;
  name: string;
  slug: string;
}

export interface FeaturedAdvertiserSection {
  id: number;
  slug: string;
  name: string;
  icon?: string | null;
  icon_url?: string | null;
  global_image_url?: string | null;
  global_image_full_url?: string | null;
  featured_advertisers_count: number;
}

export interface FeaturedAdvertiserListItem {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  profile_image_url?: string | null;
  rank: number;
  max_listings: number;
  current_section_visible_listings_count: number;
  has_visible_listings_in_section: boolean;
  categories_count: number;
  categories: FeaturedAdvertiserCategoryRef[];
}

export interface FeaturedAdvertiserSectionsResponse {
  sections: FeaturedAdvertiserSection[];
}

export interface FeaturedAdvertisersBySectionResponse {
  section: FeaturedAdvertiserSection;
  advertisers: FeaturedAdvertiserListItem[];
}

export interface ReorderFeaturedAdvertisersResponse {
  success: boolean;
  message: string;
  data?: {
    updated_count: number;
    section: string;
  };
}
