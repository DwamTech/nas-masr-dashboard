export interface SystemSettingsPayload {
  support_number?: string;
  sub_support_number?: string;
  emergency_number?: string;
  privacy_policy?: string;
  'terms_conditions-main_'?: string;
  facebook?: string;
  twitter?: string;
  instagram?: string;
  email?: string;
  show_phone?: boolean;
  featured_users_count?: number;
  free_ads_count?: number;
  free_ads_max_price?: number;
  free_ad_days_validity?: number;
  jobs_default_image?: string;
  doctors_default_image?: string;
  teachers_default_image?: string;
  featured_days?: number;
  standard_days?: number;
}

export interface SystemSettingsData {
  support_number: string;
  sub_support_number: string;
  emergency_number: string;
  privacy_policy: string;
  'terms_conditions-main_'?: string;
  facebook: string;
  twitter: string;
  instagram: string;
  email: string;
  show_phone: boolean;
  featured_users_count: number;
  free_ads_count?: number;
  free_ads_max_price?: number;
  free_ad_days_validity?: number;
  jobs_default_image?: string;
  doctors_default_image?: string;
  teachers_default_image?: string;
  featured_days?: number;
  standard_days?: number;
}

export interface SystemSettingsResponse {
  status?: string;
  data?: SystemSettingsData;
  free_ads_count?: number;
  free_ads_max_price?: number;
}
