
// Common Types
export interface Meta {
  page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface DateRangeParams {
  from?: string;
  to?: string;
}

export interface AppOpensTotals {
  unique_openers: number;
  total_opens: number;
  unique_users: number;
  unique_guests: number;
  user_opens: number;
  guest_opens: number;
}

export interface AppOpensTimelinePoint extends AppOpensTotals {
  date: string;
}

export interface AppOpensSummaryResponse {
  period: {
    from: string;
    to: string;
  };
  totals: AppOpensTotals;
  timeline: AppOpensTimelinePoint[];
}

export interface PaginationParams {
  per_page?: number;
  page?: number;
}

// 1. Users Reports
export interface UserSummary {
  id: number;
  name: string;
  phone: string;
  user_code: string;
  status: 'active' | 'blocked' | 'pending';
  registered_at: string;
  listings_count: number;
  role: string;
}

export interface UsersSummaryResponse {
  meta: Meta;
  users: UserSummary[];
}

export interface LoginStatsMonth {
  month: number;
  month_name: string;
  total_logins: number;
  unique_users: number;
  avg_logins_per_user: number;
}

export interface LoginStatsResponse {
  year: number;
  monthly_stats: LoginStatsMonth[];
  total_year_logins: number;
  growth_rate: number;
}

export interface ActiveUser {
  id: number;
  name: string;
  phone: string;
  last_activity_at: string;
  activity_type: string;
  total_activities: number;
  listings_count: number;
}

export interface ActiveUsersSummary {
  total_active_users: number;
  total_users: number;
  activity_rate: number;
  comparison_previous_period: {
    count: number;
    percent_change: number;
    direction: 'up' | 'down' | 'flat';
  };
}

export interface ActiveUsersResponse {
  meta: Meta;
  summary: ActiveUsersSummary;
  users: ActiveUser[];
}

export interface BlockedUser {
  id: number;
  name: string;
  phone: string;
  status: string;
  blocked_at: string;
  block_reason: string;
  listings_count: number;
  reported_count: number;
}

export interface BlockedUsersSummary {
  total_blocked: number;
  blocked_this_month: number;
  blocked_rate: number;
}

export interface BlockedUsersResponse {
  meta: Meta;
  summary: BlockedUsersSummary;
  users: BlockedUser[];
}

export interface RegistrationData {
  date: string;
  label: string;
  registrations: number;
  verified: number;
  verification_rate: number;
}

export interface RegistrationsTotals {
  total_registrations: number;
  total_verified: number;
  avg_monthly: number;
  growth_rate: number;
}

export interface RegistrationsResponse {
  period: string;
  data: RegistrationData[];
  totals: RegistrationsTotals;
}

export interface UserRoleDistribution {
  role: string;
  role_name: string;
  count: number;
  percentage: number;
}

export interface UsersByRoleResponse {
  total_users: number;
  by_role: UserRoleDistribution[];
}

// 2. Ads Reports
export interface StatsCard {
  count: number;
  percent: number;
  direction: 'up' | 'down' | 'flat';
}

export interface AdsStatsResponse {
  cards: {
    rejected: StatsCard;
    pending: StatsCard;
    active: StatsCard;
    total: StatsCard;
  };
  periods: {
    current_month: { start: string; end: string };
    previous_month: { start: string; end: string };
  };
}

export interface PublishedListing {
  status: string;
  id: number;
  category_slug: string;
  category_name: string;
  published_at: string;
  expire_at: string;
  plan_type: string;
  price: number;
  views: number;
  advertiser_id: number;
  advertiser_phone: string;
}

export interface PublishedListingsResponse {
  meta: Meta;
  listings: PublishedListing[];
}

export interface RejectedListing {
  status: string;
  id: number;
  category_name: string;
  category_slug: string;
  created_at: string;
  expire_at: string | null;
  rejected_by: string;
  rejection_reason: string;
  advertiser_id: number;
  advertiser_phone: string;
  views: number;
}

export interface RejectedListingsResponse {
  meta: Meta;
  listings: RejectedListing[];
}

export interface PendingListing {
  id: number;
  title: string;
  category_id: number;
  status: string;
  created_at: string;
  user: {
    id: number;
    name: string;
    phone: string;
  };
  governorate: {
    id: number;
    name: string;
  };
  city: {
    id: number;
    name: string;
  };
}

export interface PendingListingsResponse {
  meta: Meta;
  listings: PendingListing[];
}

export interface UnpaidListing {
  id: number;
  title: string;
  status: string;
  isPayment: boolean;
  created_at: string;
  user: {
    id: number;
    name: string;
  };
}

export interface UnpaidListingsResponse {
  meta: Meta;
  listings: UnpaidListing[];
}

export interface CategoryAdsBreakdown {
  active: number;
  pending: number;
  rejected: number;
  expired: number;
}

export interface CategoryAdsStats {
  category_id: number;
  category_slug: string;
  category_name: string;
  icon_url: string;
  total_ads: number;
  percentage: number;
  breakdown: CategoryAdsBreakdown;
}

export interface AdsByCategoryResponse {
  total_ads: number;
  total_categories: number;
  categories: CategoryAdsStats[];
}

export interface AdTimelineData {
  date: string;
  created: number;
  approved: number;
  rejected: number;
  expired: number;
}

export interface AdTimelineTotals {
  total_created: number;
  total_approved: number;
  total_rejected: number;
  total_expired: number;
  approval_rate: number;
}

export interface AdsTimelineResponse {
  period: string;
  from: string;
  to: string;
  data: AdTimelineData[];
  totals: AdTimelineTotals;
}

export interface MostViewedAd {
  id: number;
  title: string;
  category_name: string;
  views: number;
  price: number;
  advertiser_name: string;
  published_at: string;
  engagement_rate: number;
}

export interface MostViewedAdsResponse {
  period: string;
  listings: MostViewedAd[];
  total_views: number;
  avg_views_per_ad: number;
}

export interface AdsPlanStats {
  plan_type: string;
  plan_name: string;
  count: number;
  percentage: number;
  total_revenue: number;
  avg_views: number;
}

export interface AdsByPlanResponse {
  total_ads: number;
  by_plan: AdsPlanStats[];
}

// 3. Advertisers Reports
export interface AdvertisersSummaryResponse {
  total_advertisers: number;
  new_this_month: number;
  growth_rate: number;
  total_ads: number;
  total_spending: number;
  currency: string;
  avg_ads_per_advertiser: number;
  avg_spending_per_advertiser: number;
  top_category: {
    name: string;
    percentage: number;
  };
}

export interface SpendingSummary {
  total_spending: number;
  total_transactions: number;
  avg_transaction: number;
  currency: string;
}

export interface SpendingByType {
  ad_payments: { count: number; total: number };
  subscriptions: { count: number; total: number };
}

export interface SpendingByPlan {
  plan_type: string;
  total: number;
  count: number;
  percentage: number;
}

export interface SpendingByCategory {
  category_id: number;
  category_name: string;
  total: number;
  count: number;
  percentage: number;
}

export interface SpendingTrend {
  date: string;
  amount: number;
}

export interface AdvertisersSpendingResponse {
  period: { from: string; to: string };
  summary: SpendingSummary;
  by_type: SpendingByType;
  by_plan: SpendingByPlan[];
  by_category: SpendingByCategory[];
  trend: SpendingTrend[];
}

export interface AdvertiserStats {
  total_ads: number;
  active_ads: number;
  pending_ads: number;
  rejected_ads: number;
  total_views: number;
  total_spending: number;
}

export interface AdvertiserPackage {
  featured_remaining: number;
  standard_remaining: number;
  expires_at: string;
}

export interface Advertiser {
  id: number;
  name: string;
  phone: string;
  email: string;
  registered_at: string;
  status: string;
  stats: AdvertiserStats;
  package: AdvertiserPackage;
}

export interface AdvertisersListResponse {
  meta: Meta;
  advertisers: Advertiser[];
}

export interface TopAdvertiser {
  rank: number;
  id: number;
  name: string;
  phone: string;
  total_spending?: number;
  ads_count?: number;
  total_views?: number;
  avg_views_per_ad?: number;
  badge?: string;
}

export interface TopAdvertisersResponse {
  metric: string;
  period: string;
  advertisers: TopAdvertiser[];
}

export interface PackageUsageStats {
  total_allocated: number;
  total_used: number;
  usage_rate: number;
}

export interface AdvertisersPackagesResponse {
  total_packages: number;
  active_packages: number;
  expired_packages: number;
  usage_stats: {
    featured: PackageUsageStats;
    standard: PackageUsageStats;
  };
  expiring_soon: {
    in_7_days: number;
    in_30_days: number;
  };
}

// 4. Financial Reports
export interface TransactionAdItem {
  type: 'ad_payment';
  id: number;
  user_id: number;
  user_name: string;
  listing_id: number;
  listing_title: string;
  category_id: number;
  plan_type: string;
  amount: number;
  currency: string;
  paid_at: string;
  created_at: string;
  payment_method: string;
  payment_reference: string;
  status: string;
}

export interface TransactionSubscriptionItem {
  type: 'subscription';
  id: number;
  user_id: number;
  user_name: string;
  category_id: number;
  plan_type: string;
  price: number;
  ad_price: number;
  payment_method: string;
  payment_reference: string;
  subscribed_at: string;
  created_at: string;
  expires_at: string;
}

export interface TransactionsResponse {
  ads: {
    meta: Meta;
    items: TransactionAdItem[];
  };
  subscriptions: {
    meta: Meta;
    items: TransactionSubscriptionItem[];
  };
}

export interface RevenueSummary {
  total_revenue: number;
  previous_period: number;
  growth_rate: number;
  direction: 'up' | 'down' | 'flat';
}

export interface RevenueBreakdown {
  ad_payments: number;
  subscriptions: number;
}

export interface RevenueByCategory {
  category_name: string;
  revenue: number;
  percentage: number;
}

export interface RevenueChartData {
  label: string;
  value: number;
}

export interface FinancialRevenueResponse {
  period: string;
  currency: string;
  summary: RevenueSummary;
  breakdown: RevenueBreakdown;
  by_plan: Record<string, number>;
  by_category: RevenueByCategory[];
  chart_data: RevenueChartData[];
}

export interface PaymentMethodStat {
  method: string;
  method_name: string;
  count: number;
  amount: number;
  percentage: number;
}

export interface FinancialPaymentMethodsResponse {
  total_transactions: number;
  total_amount: number;
  methods: PaymentMethodStat[];
}

// 5. Activity Reports
export interface RecentActivity {
  type: string;
  message: string;
  entity: string;
  id: number;
  status?: string;
  admin_approved?: boolean;
  timestamp: string;
  ago: string;
}

export interface RecentActivitiesResponse {
  count: number;
  activities: RecentActivity[];
}

export interface ListingReportItem {
  id: number;
  listing_id: number;
  listing_title: string;
  reporter_id: number;
  reporter_name: string;
  reason: string;
  status: string;
  created_at: string;
}

export interface ListingReportsResponse {
  reports: ListingReportItem[];
}

export interface AdminAction {
  id: number;
  admin_id: number;
  admin_name: string;
  action_type: string;
  action_label: string;
  target_type: string;
  target_id: number;
  target_title: string;
  details: any;
  ip_address: string;
  created_at: string;
}

export interface AdminActionsResponse {
  meta: Meta;
  actions: AdminAction[];
}
