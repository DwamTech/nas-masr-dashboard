export interface UsersMeta {
  page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface UserSummary {
  id: number;
  name: string | null;
  phone: string;
  address: string | null;
  user_code: string;
  delegate_code: string | null;
  status: string;
  registered_at: string;
  listings_count: number;
  role: string;
  phone_verified: boolean;
}

export interface UsersSummaryResponse {
  meta: UsersMeta;
  users: UserSummary[];
}

export interface UpdateUserPayload {
  name?: string;
  phone?: string;
  role?: string;
  status?: string;
  delegate_code?: string;
}

export interface UpdateUserResponse {
  message: string;
  user: UserSummary;
}

export interface BlockUserResponse {
  message: string;
}

export interface DeleteUserResponse {
  message: string;
}

export interface CreateUserPayload {
  name?: string;
  phone: string;
  role?: string;
  status?: string;
  delegate_code?: string;
  password?: string;
}

export interface CreateUserResponse {
  message: string;
  user: UserSummary;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface CreateOtpResponse {
  message: string;
  otp: number;
}

export interface ListingAttributes {
  property_type?: string;
  contract_type?: string;
  main_category?: string;
  sub_category?: string;
}

export interface UserListing {
  attributes: ListingAttributes;
  governorate: string | null;
  city: string | null;
  price: string | null;
  contact_phone: string | null;
  whatsapp_phone: string | null;
  main_image_url: string | null;
  created_at: string;
  plan_type: string;
  id: number;
  lat: string;
  lng: string;
  rank: number;
  views: number;
  category: string;
  category_name: string;
}

export interface SingleUserListingsResponse {
  listings: UserListing[];
  meta: { total: number };
}

export interface CategoryItem {
  slug: string;
}

export interface CategoriesResponse {
  data: CategoryItem[];
}

export interface AssignUserPackagePayload {
  user_id: number;
  featured_ads: number;
  featured_days: number;
  start_featured_now?: boolean;
  featured_start_date?: string | null;
  featured_expire_date?: string | null;
  standard_ads: number;
  standard_days: number;
  start_standard_now?: boolean;
  standard_start_date?: string | null;
  standard_expire_date?: string | null;
}

export interface UserPackageData {
  id: number;
  user_id: number;
  featured_ads: number;
  standard_ads: number;
  featured_ads_used: number;
  standard_ads_used: number;
  featured_days: number;
  featured_start_date: string | null;
  featured_expire_date: string | null;
  standard_days: number;
  standard_start_date: string | null;
  standard_expire_date: string | null;
  days: number;
  start_date: string | null;
  expire_date: string | null;
  created_at: string;
  updated_at: string;
  featured_ads_remaining: number;
  standard_ads_remaining: number;
  featured_active: boolean;
  standard_active: boolean;
}

export interface AssignUserPackageResponse {
  success: boolean;
  message: string;
  data: UserPackageData;
}

export interface SetFeaturedPayload {
  user_id: number;
  category_ids: number[];
}

export interface SetFeaturedResponse {
  success?: boolean;
  message?: string;
  data?: { id?: number; user_id?: number; category_ids?: number[] };
  id?: number;
  best_advertiser_id?: number;
}

export interface DisableFeaturedResponse {
  success?: boolean;
  message?: string;
}

export interface DelegateClient {
  id: number;
  name: string | null;
  phone: string;
  address: string | null;
  lat: string | null;
  lng: string | null;
  status: string;
  role: string;
  user_code: string;
  registered_at: string;
  listings_count: number;
  phone_verified: boolean;
}

export interface DelegateClientsResponse {
  success: boolean;
  message: string;
  data: DelegateClient[];
}
