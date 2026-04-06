'use client';

import { useState, useEffect, useMemo } from 'react';
import DateInput from '@/components/DateInput';
import AppOpensInsightsSection from '@/components/reports/AppOpensInsightsSection';
import {
  fetchTransactions,
} from '@/services/dashboardReports';
import type {
  TransactionsResponse,
  TransactionAdItem,
  TransactionSubscriptionItem,
} from '@/models/dashboardReports';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Lucide React Icons
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  Users,
  Calendar,
  Search,
  FileText,
  Package,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  BarChart3,
  PieChart as PieChartIcon,
  Wallet,
  Receipt,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  Settings2,
  Filter,
  Megaphone,
  Briefcase,
} from 'lucide-react';

// ==================== Helper Components ====================

function DonutChart({
  data,
  title,
  icon,
  centerValue,
  centerLabel
}: {
  data: { name: string; value: number; color: string }[];
  title: string;
  icon: React.ReactNode;
  centerValue: string;
  centerLabel: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <div className="reports-donut-card">
        <h3 className="reports-chart-title">
          <span className="reports-chart-icon">{icon}</span>
          {title}
        </h3>
        <div className="reports-chart-empty" style={{ height: 220 }}>
          <PieChartIcon size={48} strokeWidth={1} />
          <p>لا توجد بيانات</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-donut-card">
      <h3 className="reports-chart-title">
        <span className="reports-chart-icon">{icon}</span>
        {title}
      </h3>
      <div className="reports-donut-container">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [
                new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(value),
                ''
              ]}
              contentStyle={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                padding: '12px 16px',
                direction: 'rtl'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="reports-donut-center">
          <div className="reports-donut-value">{centerValue}</div>
          <div className="reports-donut-label">{centerLabel}</div>
        </div>
      </div>
      <div className="reports-donut-legend">
        {data.map((item, idx) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <div key={idx} className="reports-legend-item">
              <span className="reports-legend-dot" style={{ backgroundColor: item.color }} />
              <span className="reports-legend-text">{item.name}</span>
              <span className="reports-legend-percent">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  trend,
  trendLabel,
  color,
  delay = 0
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color: string;
  delay?: number;
}) {
  return (
    <div
      className="reports-stat-card"
      style={{
        '--card-color': color,
        '--card-delay': `${delay}ms`
      } as React.CSSProperties}
    >
      <div className="reports-stat-header">
        <div className="reports-stat-icon-wrapper" style={{ background: `linear-gradient(135deg, ${color}20, ${color}10)`, color: color }}>
          {icon}
        </div>
        {trend !== undefined && trend !== 0 && (
          <div className={`reports-stat-trend ${trend >= 0 ? 'positive' : 'negative'}`}>
            {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div className="reports-stat-content">
        <h3 className="reports-stat-title">{title}</h3>
        <p className="reports-stat-value">{value}</p>
        {trendLabel && (
          <span className="reports-stat-trend-label">{trendLabel}</span>
        )}
      </div>
      <div className="reports-stat-glow" style={{ background: color }} />
    </div>
  );
}

// ==================== Main Component ====================

export default function ReportsPage() {
  // State for Data
  const [transactionsData, setTransactionsData] = useState<TransactionsResponse | null>(null);
  const [allAdsItems, setAllAdsItems] = useState<TransactionAdItem[]>([]);
  const [allSubsItems, setAllSubsItems] = useState<TransactionSubscriptionItem[]>([]);

  // Loading States
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [activeTab, setActiveTab] = useState<'ads' | 'subscriptions'>('ads');
  const [activePeriod, setActivePeriod] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);

  // Current time for hero
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Period preset handlers
  const handlePeriodChange = (period: typeof activePeriod) => {
    setActivePeriod(period);
    const now = new Date();
    let from = '';
    let to = now.toISOString().split('T')[0];

    switch (period) {
      case 'today':
        from = to;
        break;
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        from = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        from = monthAgo.toISOString().split('T')[0];
        break;
      case 'year':
        const yearAgo = new Date(now);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        from = yearAgo.toISOString().split('T')[0];
        break;
      case 'custom':
        return;
    }

    setDateRange({ from, to });
    setPage(1);
  };

  // Fetch Data - Get all transactions to calculate stats
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch with high per_page to get all data for calculations
        const transactions = await fetchTransactions({
          per_page: 1000,
          from: dateRange.from,
          to: dateRange.to,
        });
        setTransactionsData(transactions);
        setAllAdsItems(transactions.ads?.items || []);
        setAllSubsItems(transactions.subscriptions?.items || []);
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [dateRange]);

  // Calculate stats from transactions
  const calculatedStats = useMemo(() => {
    const adsTotal = allAdsItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const subsTotal = allSubsItems.reduce((sum, item) => sum + (item.price || 0), 0);
    const totalRevenue = adsTotal + subsTotal;
    const totalTransactions = allAdsItems.length + allSubsItems.length;

    return {
      totalRevenue,
      adsRevenue: adsTotal,
      subsRevenue: subsTotal,
      adsCount: allAdsItems.length,
      subsCount: allSubsItems.length,
      totalTransactions,
    };
  }, [allAdsItems, allSubsItems]);

  // Chart data - Group transactions by date
  const chartData = useMemo(() => {
    const dateMap = new Map<string, number>();

    allAdsItems.forEach(item => {
      const date = item.paid_at ? new Date(item.paid_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) : 'غير محدد';
      dateMap.set(date, (dateMap.get(date) || 0) + (item.amount || 0));
    });

    allSubsItems.forEach(item => {
      const date = item.subscribed_at ? new Date(item.subscribed_at).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }) : 'غير محدد';
      dateMap.set(date, (dateMap.get(date) || 0) + (item.price || 0));
    });

    return Array.from(dateMap.entries())
      .map(([label, value]) => ({ label, value }))
      .slice(-12); // Last 12 data points
  }, [allAdsItems, allSubsItems]);

  // Donut chart data
  const donutData = useMemo(() => [
    { name: 'مدفوعات الإعلانات', value: calculatedStats.adsRevenue, color: '#3b82f6' },
    { name: 'الاشتراكات', value: calculatedStats.subsRevenue, color: '#8b5cf6' },
  ], [calculatedStats]);

  // Plan type breakdown
  const planBreakdownData = useMemo(() => {
    const planMap = new Map<string, number>();

    allAdsItems.forEach(item => {
      const plan = item.plan_type === 'featured' ? 'متميز' : 'ستاندرد';
      planMap.set(plan, (planMap.get(plan) || 0) + (item.amount || 0));
    });

    allSubsItems.forEach(item => {
      const plan = item.plan_type === 'featured' ? 'متميز' : 'ستاندرد';
      planMap.set(plan, (planMap.get(plan) || 0) + (item.price || 0));
    });

    const colors = ['#f59e0b', '#10b981'];
    return Array.from(planMap.entries()).map(([name, value], idx) => ({
      name,
      value,
      color: colors[idx % colors.length]
    }));
  }, [allAdsItems, allSubsItems]);

  // Filtered transactions for table
  const displayedTransactions = useMemo(() => {
    const items: (TransactionAdItem | TransactionSubscriptionItem)[] = activeTab === 'ads' ? allAdsItems : allSubsItems;

    let filtered = items;
    if (searchQuery) {
      filtered = items.filter((t: any) =>
        (t.user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(t.id).includes(searchQuery)
      );
    }

    // Paginate
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return filtered.slice(start, end);
  }, [allAdsItems, allSubsItems, activeTab, searchQuery, page, perPage]);

  const totalItems = activeTab === 'ads' ? allAdsItems.length : allSubsItems.length;
  const totalPages = Math.ceil(totalItems / perPage);

  // Helper for currency formatting
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);
  };

  const formatShortCurrency = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}م ج.م`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}ك ج.م`;
    return formatCurrency(amount);
  };

  return (
    <div className="reports-page">
      {/* Premium Hero Section */}
      <div className="reports-hero">
        <div className="reports-hero-pattern" />
        <div className="reports-hero-content">
          <div className="reports-hero-text">
            <h1 className="reports-hero-title">
              <BarChart3 size={32} style={{ marginLeft: 12 }} />
              التقارير المالية
            </h1>
            <p className="reports-hero-subtitle">
              نظرة شاملة على الإيرادات، المعاملات المالية، واشتراكات المعلنين
            </p>
          </div>
          <div className="reports-hero-time">
            <div className="reports-hero-clock">
              {currentTime.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              })}
            </div>
            <div className="reports-hero-date">
              {currentTime.toLocaleDateString('ar-EG', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>

        {/* Quick Period Filters */}
        <div className="reports-quick-filters">
          {[
            { key: 'today', label: 'اليوم', icon: <Calendar size={16} /> },
            { key: 'week', label: 'هذا الأسبوع', icon: <CalendarDays size={16} /> },
            { key: 'month', label: 'هذا الشهر', icon: <CalendarRange size={16} /> },
            { key: 'year', label: 'هذه السنة', icon: <CalendarClock size={16} /> },
            { key: 'custom', label: 'مخصص', icon: <Settings2 size={16} /> },
          ].map((period) => (
            <button
              key={period.key}
              className={`reports-filter-btn ${activePeriod === period.key ? 'active' : ''}`}
              onClick={() => handlePeriodChange(period.key as typeof activePeriod)}
            >
              {period.icon}
              <span>{period.label}</span>
            </button>
          ))}
        </div>

        {/* Custom Date Range */}
        {activePeriod === 'custom' && (
          <div className="reports-custom-range">
            <div className="reports-date-input">
              <label>من تاريخ</label>
              <DateInput
                value={dateRange.from}
                onChange={(v) => setDateRange({ ...dateRange, from: v })}
                className="reports-date-field"
              />
            </div>
            <div className="reports-date-input">
              <label>إلى تاريخ</label>
              <DateInput
                value={dateRange.to}
                onChange={(v) => setDateRange({ ...dateRange, to: v })}
                className="reports-date-field"
              />
            </div>
          </div>
        )}
      </div>

      <AppOpensInsightsSection from={dateRange.from} to={dateRange.to} />

      {/* Stats Cards Grid */}
      <div className="reports-stats-grid">
        {isLoading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="reports-stat-card skeleton">
              <div className="skeleton-icon" />
              <div className="skeleton-text" />
              <div className="skeleton-value" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              title="إجمالي الإيرادات"
              value={formatCurrency(calculatedStats.totalRevenue)}
              icon={<Wallet size={24} />}
              color="#10b981"
              delay={0}
            />
            <StatCard
              title="إيرادات الإعلانات"
              value={formatCurrency(calculatedStats.adsRevenue)}
              icon={<Megaphone size={24} />}
              trendLabel={`${calculatedStats.adsCount} معاملة`}
              color="#3b82f6"
              delay={100}
            />
            <StatCard
              title="إيرادات الاشتراكات"
              value={formatCurrency(calculatedStats.subsRevenue)}
              icon={<Briefcase size={24} />}
              trendLabel={`${calculatedStats.subsCount} اشتراك`}
              color="#8b5cf6"
              delay={200}
            />
            <StatCard
              title="إجمالي المعاملات"
              value={calculatedStats.totalTransactions.toString()}
              icon={<Receipt size={24} />}
              trendLabel="في الفترة المحددة"
              color="#f59e0b"
              delay={300}
            />
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="reports-charts-section">
        {/* Donut Charts - Side by Side */}
        <div className="reports-donuts-row">
          <DonutChart
            data={donutData}
            title="توزيع الإيرادات"
            icon={<CreditCard size={20} />}
            centerValue={formatShortCurrency(calculatedStats.totalRevenue)}
            centerLabel="الإجمالي"
          />
          <DonutChart
            data={planBreakdownData}
            title="الإيرادات حسب الباقة"
            icon={<Package size={20} />}
            centerValue={calculatedStats.totalTransactions.toString()}
            centerLabel="معاملة"
          />
        </div>

        {/* Revenue Timeline Chart - Full Width */}
        <div className="reports-chart-card reports-area-chart-full">
          <h3 className="reports-chart-title">
            <TrendingUp size={20} style={{ marginLeft: 8 }} />
            تحليل الإيرادات
          </h3>
          <div className="reports-chart-container">
            {isLoading ? (
              <div className="reports-chart-loading">
                <div className="reports-loading-spinner" />
                <span>جارٍ تحميل الرسم البياني...</span>
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis
                    dataKey="label"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#6b7280' }}
                    dy={10}
                  />
                  <YAxis
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val: number) => formatShortCurrency(val)}
                    tick={{ fill: '#6b7280' }}
                    width={80}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'الإيرادات']}
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                      padding: '16px 20px',
                      direction: 'rtl'
                    }}
                    labelStyle={{ color: '#111827', fontWeight: 'bold', marginBottom: '8px' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#10b981"
                    strokeWidth={3}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="reports-chart-empty">
                <BarChart3 size={48} strokeWidth={1} />
                <p>لا توجد بيانات للرسم البياني</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transactions Table Section */}
      <div className="reports-table-section">
        <div className="reports-table-header">
          <div className="reports-table-title-section">
            <h3 className="reports-table-title">
              <FileText size={20} style={{ marginLeft: 8 }} />
              سجل المعاملات
            </h3>
            <span className="reports-table-count">
              {totalItems} معاملة
            </span>
          </div>

          <div className="reports-table-controls">
            {/* Search */}
            <div className="reports-search-box">
              <Search size={18} className="reports-search-icon" />
              <input
                type="text"
                placeholder="بحث بالاسم أو رقم المعاملة..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="reports-search-input"
              />
            </div>

            {/* Tabs */}
            <div className="reports-tabs">
              <button
                onClick={() => { setActiveTab('ads'); setPage(1); }}
                className={`reports-tab ${activeTab === 'ads' ? 'active' : ''}`}
              >
                <Megaphone size={16} />
                مدفوعات الإعلانات
              </button>
              <button
                onClick={() => { setActiveTab('subscriptions'); setPage(1); }}
                className={`reports-tab ${activeTab === 'subscriptions' ? 'active' : ''}`}
              >
                <Briefcase size={16} />
                الاشتراكات
              </button>
            </div>
          </div>
        </div>

        <div className="reports-table-container">
          {isLoading ? (
            <div className="reports-table-loading">
              <div className="reports-loading-spinner" />
              <span>جارٍ تحميل البيانات...</span>
            </div>
          ) : (
            <table className="reports-table">
              <thead>
                <tr>
                  <th>رقم المعاملة</th>
                  <th>المستخدم/المعلن</th>
                  <th>المبلغ</th>
                  <th>التاريخ</th>
                  {activeTab === 'ads' ? (
                    <th>طريقة الدفع</th>
                  ) : (
                    <>
                      <th>نوع الباقة</th>
                      <th>تاريخ الانتهاء</th>
                    </>
                  )}
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {displayedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'ads' ? 6 : 7} className="reports-empty-row">
                      <div className="reports-empty-state">
                        <FileText size={48} strokeWidth={1} />
                        <h4>لا توجد معاملات</h4>
                        <p>لم يتم العثور على بيانات في هذه الفترة</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedTransactions.map((t: any, idx: number) => {
                    const userName = t.user_name || 'مستخدم غير معروف';
                    const amount = t.amount !== undefined ? t.amount : (t.price !== undefined ? t.price : 0);
                    const dateStr = t.paid_at || t.subscribed_at || t.created_at || new Date().toISOString();
                    const status = t.status || 'active';

                    return (
                      <tr key={t.id} style={{ animationDelay: `${idx * 30}ms` }}>
                        <td>
                          <span className="reports-id-badge">#{t.id}</span>
                        </td>
                        <td>
                          <span className="reports-user-name">{userName}</span>
                        </td>
                        <td>
                          <span className="reports-amount">{formatCurrency(Number(amount))}</span>
                        </td>
                        <td className="reports-date">
                          {new Date(dateStr).toLocaleDateString('ar-EG')}
                        </td>

                        {activeTab === 'ads' ? (
                          <td>
                            {t.payment_method ? (
                              <span className="reports-payment-method">{t.payment_method}</span>
                            ) : (
                              <span className="reports-no-data">--</span>
                            )}
                          </td>
                        ) : (
                          <>
                            <td>
                              <span className={`reports-plan-badge ${t.plan_type === 'featured' ? 'featured' : 'standard'}`}>
                                {t.plan_type === 'featured' ? 'متميز' : 'ستاندرد'}
                              </span>
                            </td>
                            <td className="reports-date">
                              {t.expires_at ? new Date(t.expires_at).toLocaleDateString('ar-EG') : '-'}
                            </td>
                          </>
                        )}

                        <td>
                          <span className={`reports-status-badge ${status === 'completed' || status === 'paid' || status === 'active'
                            ? 'success'
                            : 'pending'
                            }`}>
                            {status === 'completed' || status === 'paid' ? 'مكتمل' : (status === 'active' ? 'نشط' : status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="reports-pagination">
            <div className="reports-pagination-info">
              صفحة <strong>{page}</strong> من <strong>{totalPages}</strong>
              <span className="reports-pagination-total">• إجمالي {totalItems} معاملة</span>
            </div>
            <div className="reports-pagination-controls">
              <button
                disabled={page === 1}
                onClick={() => setPage(1)}
                className="reports-pagination-btn"
                title="الأولى"
              >
                <ChevronsRight size={16} />
              </button>
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="reports-pagination-btn"
                title="السابق"
              >
                <ChevronRight size={16} />
                السابق
              </button>

              <div className="reports-pagination-pages">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`reports-pagination-page ${page === pageNum ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="reports-pagination-btn"
                title="التالي"
              >
                التالي
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(totalPages)}
                className="reports-pagination-btn"
                title="الأخيرة"
              >
                <ChevronsLeft size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
