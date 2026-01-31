import {
  UsersSummaryResponse,
  LoginStatsResponse,
  ActiveUsersResponse,
  BlockedUsersResponse,
  RegistrationsResponse,
  UsersByRoleResponse,
  AdsStatsResponse,
  PublishedListingsResponse,
  RejectedListingsResponse,
  PendingListingsResponse,
  UnpaidListingsResponse,
  AdsByCategoryResponse,
  AdsTimelineResponse,
  MostViewedAdsResponse,
  AdsByPlanResponse,
  AdvertisersSummaryResponse,
  AdvertisersSpendingResponse,
  AdvertisersListResponse,
  TopAdvertisersResponse,
  AdvertisersPackagesResponse,
  TransactionsResponse,
  FinancialRevenueResponse,
  FinancialPaymentMethodsResponse,
  RecentActivitiesResponse,
  ListingReportsResponse,
  AdminActionsResponse,
  PaginationParams,
  DateRangeParams
} from '@/models/dashboardReports';

const BASE_URL = 'https://back.nasmasr.app/api/admin';

async function fetchWithAuth<T>(endpoint: string, params: Record<string, any> = {}, token?: string): Promise<T> {
  const t = token ?? (typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined);
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  if (t) {
    headers['Authorization'] = `Bearer ${t}`;
  }

  const url = new URL(`${BASE_URL}${endpoint}`);

  // Append query parameters
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      url.searchParams.append(key, String(params[key]));
    }
  });

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers,
  });

  const raw = await res.json().catch(() => null);

  if (!res.ok) {
    const message = raw?.error || raw?.message || `Error fetching ${endpoint}`;
    throw new Error(message);
  }

  return raw as T;
}

// ==========================================
// 1. Users Reports
// ==========================================

export async function fetchUsersSummary(
  params: PaginationParams & { role?: string; status?: string; q?: string } = {},
  token?: string
): Promise<UsersSummaryResponse> {
  return fetchWithAuth<UsersSummaryResponse>('/users-summary', params, token);
}

export async function fetchLoginStats(
  params: { year?: number; month?: number } = {},
  token?: string
): Promise<LoginStatsResponse> {
  return fetchWithAuth<LoginStatsResponse>('/reports/users/login-stats', params, token);
}

export async function fetchActiveUsers(
  params: PaginationParams & { days?: number; activity_type?: string } = {},
  token?: string
): Promise<ActiveUsersResponse> {
  return fetchWithAuth<ActiveUsersResponse>('/reports/users/active', params, token);
}

export async function fetchBlockedUsers(
  params: PaginationParams & { blocked_after?: string; blocked_before?: string } = {},
  token?: string
): Promise<BlockedUsersResponse> {
  return fetchWithAuth<BlockedUsersResponse>('/reports/users/blocked', params, token);
}

export async function fetchRegistrationsStats(
  params: DateRangeParams & { period?: 'daily' | 'weekly' | 'monthly' | 'yearly' } = {},
  token?: string
): Promise<RegistrationsResponse> {
  return fetchWithAuth<RegistrationsResponse>('/reports/users/registrations', params, token);
}

export async function fetchUsersByRole(token?: string): Promise<UsersByRoleResponse> {
  return fetchWithAuth<UsersByRoleResponse>('/reports/users/by-role', {}, token);
}

// ==========================================
// 2. Ads Reports
// ==========================================

export async function fetchAdsStats(token?: string): Promise<AdsStatsResponse> {
  return fetchWithAuth<AdsStatsResponse>('/stats', {}, token);
}

export async function fetchPublishedListings(
  params: PaginationParams = {},
  token?: string
): Promise<PublishedListingsResponse> {
  return fetchWithAuth<PublishedListingsResponse>('/published-listings', params, token);
}

export async function fetchRejectedListings(
  params: PaginationParams = {},
  token?: string
): Promise<RejectedListingsResponse> {
  return fetchWithAuth<RejectedListingsResponse>('/rejected-listings', params, token);
}

export async function fetchPendingListings(
  params: PaginationParams = {},
  token?: string
): Promise<PendingListingsResponse> {
  return fetchWithAuth<PendingListingsResponse>('/pending-listings', params, token);
}

export async function fetchUnpaidListings(
  params: PaginationParams = {},
  token?: string
): Promise<UnpaidListingsResponse> {
  return fetchWithAuth<UnpaidListingsResponse>('/ads-not-payment', params, token);
}

export async function fetchAdsByCategory(
  params: { status?: string; include_inactive?: boolean } = {},
  token?: string
): Promise<AdsByCategoryResponse> {
  return fetchWithAuth<AdsByCategoryResponse>('/reports/ads/by-category', params, token);
}

export async function fetchAdsTimeline(
  params: DateRangeParams & { period?: string; category_id?: number } = {},
  token?: string
): Promise<AdsTimelineResponse> {
  return fetchWithAuth<AdsTimelineResponse>('/reports/ads/timeline', params, token);
}

export async function fetchMostViewedAds(
  params: { limit?: number; category_id?: number; period?: string } = {},
  token?: string
): Promise<MostViewedAdsResponse> {
  return fetchWithAuth<MostViewedAdsResponse>('/reports/ads/most-viewed', params, token);
}

export async function fetchAdsByPlan(token?: string): Promise<AdsByPlanResponse> {
  return fetchWithAuth<AdsByPlanResponse>('/reports/ads/by-plan', {}, token);
}

// ==========================================
// 3. Advertisers Reports
// ==========================================

export async function fetchAdvertisersSummary(token?: string): Promise<AdvertisersSummaryResponse> {
  return fetchWithAuth<AdvertisersSummaryResponse>('/reports/advertisers/summary', {}, token);
}

export async function fetchAdvertisersSpending(
  params: DateRangeParams & { category_id?: number; plan_type?: string } = {},
  token?: string
): Promise<AdvertisersSpendingResponse> {
  return fetchWithAuth<AdvertisersSpendingResponse>('/reports/advertisers/spending', params, token);
}

export async function fetchAdvertisersList(
  params: PaginationParams & { sort_by?: string; order?: 'asc' | 'desc'; category_id?: number } = {},
  token?: string
): Promise<AdvertisersListResponse> {
  return fetchWithAuth<AdvertisersListResponse>('/reports/advertisers/list', params, token);
}

export async function fetchTopAdvertisers(
  params: { limit?: number; metric?: string; period?: string } = {},
  token?: string
): Promise<TopAdvertisersResponse> {
  return fetchWithAuth<TopAdvertisersResponse>('/reports/advertisers/top', params, token);
}

export async function fetchAdvertisersPackages(token?: string): Promise<AdvertisersPackagesResponse> {
  return fetchWithAuth<AdvertisersPackagesResponse>('/reports/advertisers/packages', {}, token);
}

// ==========================================
// 4. Financial Reports
// ==========================================

export async function fetchTransactions(
  params: PaginationParams & DateRangeParams & { user_id?: number; category_id?: number; plan_type?: string } = {},
  token?: string
): Promise<TransactionsResponse> {
  return fetchWithAuth<TransactionsResponse>('/transactions', params, token);
}

export async function fetchRevenueSummary(
  params: DateRangeParams & { period?: string } = {},
  token?: string
): Promise<FinancialRevenueResponse> {
  return fetchWithAuth<FinancialRevenueResponse>('/reports/financial/revenue', params, token);
}

export async function fetchPaymentMethods(token?: string): Promise<FinancialPaymentMethodsResponse> {
  return fetchWithAuth<FinancialPaymentMethodsResponse>('/reports/financial/payment-methods', {}, token);
}

// ==========================================
// 5. Activity Reports
// ==========================================

export async function fetchRecentActivities(
  params: { limit?: number } = {},
  token?: string
): Promise<RecentActivitiesResponse> {
  return fetchWithAuth<RecentActivitiesResponse>('/recent-activities', params, token);
}

export async function fetchListingReports(token?: string): Promise<ListingReportsResponse> {
  return fetchWithAuth<ListingReportsResponse>('/listing-reports', {}, token);
}

export async function fetchAdminActions(
  params: PaginationParams & DateRangeParams & { admin_id?: number; action_type?: string } = {},
  token?: string
): Promise<AdminActionsResponse> {
  return fetchWithAuth<AdminActionsResponse>('/reports/activity/admin-actions', params, token);
}
