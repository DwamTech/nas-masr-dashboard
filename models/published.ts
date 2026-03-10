import { PendingListingsMeta } from '@/models/listings';

export interface ListingAttribute {
  id: number;
  name: string;
  value: string | number | null;
  type?: string;
}

export interface ListingImage {
  id: number;
  url: string;
  is_main: boolean;
}

export interface ListingUser {
  id: number;
  name: string;
  phone: string;
  avatar?: string;
}

export interface ListingUserExtended {
  id: number;
  name?: string | null;
  phone?: string | null;
  joined_at?: string | null;
  joined_at_human?: string | null;
  listings_count?: number | null;
  banner?: string | null;
}

export interface PublishedListing {
  id?: number | string | null;
  status?: string | null;
  category_slug?: string | null;
  category?: string | null;
  category_name?: string | null;
  published_at?: string | null;
  expire_at?: string | null;
  plan_type?: string | null;
  price?: number | string | null;
  views?: number | null;
  whatsapp_clicks?: number | null;
  call_clicks?: number | null;
  advertiser_id?: number | null;
  advertiser_phone?: string | null;
  // Extended details
  title?: string;
  description?: string;
  governorate?: string;
  city?: string;
  address?: string | null;
  lat?: string | null;
  lng?: string | null;
  currency?: string | null;
  contact_phone?: string | null;
  whatsapp_phone?: string | null;
  make_id?: number | null;
  make?: string | null;
  model_id?: number | null;
  model?: string | null;
  main_image?: string | null;
  main_image_url?: string;
  images?: ListingImage[];
  images_urls?: string[] | null;
  attributes?: ListingAttribute[] | Record<string, string> | null;
  user?: ListingUser;
  user_ext?: ListingUserExtended;
  country_code?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  isPayment?: boolean | null;
  publish_via?: string | null;
  admin_comment?: string | null;
  rejection_reason?: string;
}

export interface PublishedListingsResponse {
  meta: PendingListingsMeta;
  listings: PublishedListing[];
}
