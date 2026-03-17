'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BellRing,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  Megaphone,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserCog,
  Users,
  XCircle,
} from 'lucide-react';
import { fetchAdminStats, fetchRecentActivities } from '@/services/adminStats';
import type { AdminStatsResponse } from '@/models/stats';

type DonutSegment = { label: string; value: number; color: string };
type ActivityType = 'approve' | 'reject' | 'user';

type DashboardActivity = {
  action: string;
  time: string;
  type: ActivityType;
  ts: number;
};

type QuickAction = {
  title: string;
  description: string;
  href: string;
  icon: typeof LayoutDashboard;
  tone: 'teal' | 'amber' | 'blue' | 'rose';
};

const quickActions: QuickAction[] = [
  {
    title: 'مراجعة الإعلانات',
    description: 'الوصول السريع إلى طلبات الموافقة والإعلانات التي تنتظر الإجراء.',
    href: '/moderation',
    icon: ShieldAlert,
    tone: 'amber',
  },
  {
    title: 'إدارة الأقسام',
    description: 'تنظيم الأقسام والظهور الرئيسي والفلاتر من مكان واحد.',
    href: '/categories',
    icon: LayoutDashboard,
    tone: 'teal',
  },
  {
    title: 'المستخدمون والموظفون',
    description: 'إدارة الحسابات والصلاحيات والمتابعة التشغيلية اليومية.',
    href: '/users',
    icon: Users,
    tone: 'blue',
  },
  {
    title: 'الإشعارات والرسائل',
    description: 'الوصول السريع إلى رسائل المنصة والإعلانات التوعوية.',
    href: '/notifications',
    icon: Megaphone,
    tone: 'rose',
  },
];

function formatCompactNumber(value: number): string {
  return value.toLocaleString('en-US');
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function formatArabicDate(value?: string): string {
  if (!value) return 'غير متاح';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'غير متاح';
  return new Intl.DateTimeFormat('ar-EG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatHeroDate(value: Date): string {
  return new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(value);
}

function formatHeroTime(value: Date): string {
  return new Intl.DateTimeFormat('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(value);
}

function getTrendLabel(percent: number, direction: 'up' | 'down'): string {
  const prefix = direction === 'up' ? '+' : '-';
  return `${prefix}${Math.abs(percent)}% مقارنة بالشهر السابق`;
}

function getActivityMeta(type: ActivityType) {
  switch (type) {
    case 'approve':
      return {
        title: 'موافقة',
        icon: CheckCircle2,
        accent: '#0f9d7a',
        soft: 'rgba(15, 157, 122, 0.12)',
      };
    case 'reject':
      return {
        title: 'رفض',
        icon: XCircle,
        accent: '#dc5b4b',
        soft: 'rgba(220, 91, 75, 0.12)',
      };
    default:
      return {
        title: 'نشاط إداري',
        icon: UserCog,
        accent: '#345eea',
        soft: 'rgba(52, 94, 234, 0.12)',
      };
  }
}

function DonutChart({
  segments,
  centerTitle,
  centerValue,
}: {
  segments: DonutSegment[];
  centerTitle: string;
  centerValue: string;
}) {
  const total = segments.reduce((sum, segment) => sum + (Number.isFinite(segment.value) ? segment.value : 0), 0);

  const chartBackground = useMemo(() => {
    let offset = 0;
    const parts: string[] = [];
    for (const segment of segments) {
      const slice = total > 0 ? (segment.value / total) * 360 : 0;
      const start = offset;
      const end = offset + slice;
      parts.push(`${segment.color} ${start}deg ${end}deg`);
      offset = end;
    }
    return `conic-gradient(${parts.join(', ')})`;
  }, [segments, total]);

  return (
    <div className="distribution-visual">
      <div className="donut-shell">
        <div className="donut-ring" style={{ background: chartBackground }} />
        <div className="donut-core">
          <span className="donut-value">{centerValue}</span>
          <span className="donut-title">{centerTitle}</span>
        </div>
      </div>
      <div className="distribution-legend">
        {segments.map((segment) => {
          const share = total > 0 ? Math.round((segment.value / total) * 100) : 0;
          return (
            <div key={segment.label} className="legend-row">
              <div className="legend-label-group">
                <span className="legend-dot" style={{ backgroundColor: segment.color }} />
                <span className="legend-label">{segment.label}</span>
              </div>
              <div className="legend-stats">
                <span className="legend-number">{formatCompactNumber(segment.value)}</span>
                <span className="legend-share">{share}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DistributionBars({
  items,
}: {
  items: Array<{ label: string; value: number; color: string }>;
}) {
  const max = items.reduce((highest, item) => Math.max(highest, item.value), 0) || 1;

  return (
    <div className="distribution-bars">
      {items.map((item) => {
        const width = `${Math.max((item.value / max) * 100, item.value > 0 ? 8 : 0)}%`;
        return (
          <div key={item.label} className="distribution-row">
            <div className="distribution-row-head">
              <span>{item.label}</span>
              <strong>{formatCompactNumber(item.value)}</strong>
            </div>
            <div className="distribution-track">
              <div
                className="distribution-fill"
                style={{
                  width,
                  background: item.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ActivitySparkline({ series }: { series: number[] }) {
  const max = series.reduce((highest, value) => Math.max(highest, value), 0) || 1;

  return (
    <div className="sparkline">
      {series.map((value, index) => (
        <span
          key={`${index}-${value}`}
          className="sparkline-bar"
          style={{ height: `${Math.max((value / max) * 100, value > 0 ? 10 : 5)}%` }}
        />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [statsData, setStatsData] = useState<AdminStatsResponse | null>(null);
  const [recentActivities, setRecentActivities] = useState<DashboardActivity[]>([]);
  const [activityPage, setActivityPage] = useState(0);
  const [activityFilter, setActivityFilter] = useState<'all' | ActivityType>('all');
  const activityPageSize = 5;
  const [isAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('isAuthenticated') === 'true';
    } catch {
      return false;
    }
  });

  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    const timer = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const token = localStorage.getItem('authToken') ?? undefined;

    fetchAdminStats(token)
      .then((data) => setStatsData(data))
      .catch(() => undefined);

    fetchRecentActivities(20, token)
      .then((response) => {
        const items = Array.isArray(response.activities) ? response.activities : [];
        const mapped = items.map((item) => {
          const normalized = String(item.type || '').toLowerCase();
          const type: ActivityType = normalized.includes('approved')
            ? 'approve'
            : normalized.includes('reject') || normalized.includes('rejected')
              ? 'reject'
              : 'user';

          return {
            action: item.message || 'تم تنفيذ إجراء جديد',
            time: item.ago || 'الآن',
            type,
            ts: Date.parse(item.timestamp || '') || Date.now(),
          };
        });

        setRecentActivities(mapped);
      })
      .catch(() => undefined);
  }, [isAuthenticated]);

  useEffect(() => {
    setActivityPage(0);
  }, [activityFilter, recentActivities]);

  const cards = statsData?.cards;
  const periods = statsData?.periods;

  const totalAds = typeof cards?.total?.count === 'number' ? cards.total.count : 0;
  const activeAds = typeof cards?.active?.count === 'number' ? cards.active.count : 0;
  const pendingAds = typeof cards?.pending?.count === 'number' ? cards.pending.count : 0;
  const rejectedAds = typeof cards?.rejected?.count === 'number' ? cards.rejected.count : 0;
  const othersAds = Math.max(totalAds - activeAds - pendingAds - rejectedAds, 0);

  const activeRate = totalAds > 0 ? (activeAds / totalAds) * 100 : 0;
  const pendingRate = totalAds > 0 ? (pendingAds / totalAds) * 100 : 0;
  const rejectionRate = totalAds > 0 ? (rejectedAds / totalAds) * 100 : 0;
  const approvalShare = totalAds > 0 ? ((activeAds + pendingAds) / totalAds) * 100 : 0;

  const donutSegments: DonutSegment[] = [
    { label: 'الإعلانات النشطة', value: activeAds, color: '#139c80' },
    { label: 'قيد المراجعة', value: pendingAds, color: '#dca73f' },
    { label: 'المرفوضة', value: rejectedAds, color: '#dc5b4b' },
    ...(othersAds > 0 ? [{ label: 'أخرى', value: othersAds, color: '#4569f6' }] : []),
  ];

  const metricCards = [
    {
      label: 'إجمالي الإعلانات',
      value: totalAds,
      note: 'الصورة الكاملة لحركة المنصة',
      percent: cards?.total?.percent ?? 0,
      direction: cards?.total?.direction ?? 'up',
      icon: LayoutDashboard,
      tone: 'blue',
    },
    {
      label: 'الإعلانات النشطة',
      value: activeAds,
      note: `${formatPercent(activeRate)} من إجمالي المعروض`,
      percent: cards?.active?.percent ?? 0,
      direction: cards?.active?.direction ?? 'up',
      icon: CheckCircle2,
      tone: 'teal',
    },
    {
      label: 'بانتظار الإجراء',
      value: pendingAds,
      note: `${formatPercent(pendingRate)} تحتاج مراجعة`,
      percent: cards?.pending?.percent ?? 0,
      direction: cards?.pending?.direction ?? 'up',
      icon: Clock3,
      tone: 'amber',
    },
    {
      label: 'الإعلانات المرفوضة',
      value: rejectedAds,
      note: `${formatPercent(rejectionRate)} من الإجمالي`,
      percent: cards?.rejected?.percent ?? 0,
      direction: cards?.rejected?.direction ?? 'down',
      icon: XCircle,
      tone: 'rose',
    },
  ] as const;

  const operationalHighlights = [
    {
      label: 'جاهزية التشغيل',
      value: formatPercent(approvalShare),
      helper: 'نسبة الحالات التي تم التعامل معها أو تفعيلها',
    },
    {
      label: 'فترة التقرير',
      value: periods?.current_month
        ? `${formatArabicDate(periods.current_month.start)} - ${formatArabicDate(periods.current_month.end)}`
        : 'لا توجد بيانات بعد',
      helper: 'الفترة الحالية المستخدمة في المقارنة',
    },
    {
      label: 'مستوى الضغط',
      value: pendingAds > 0 ? `${formatCompactNumber(pendingAds)} عنصر يحتاج متابعة` : 'لا يوجد تراكم حاليًا',
      helper: 'تعكس حجم العمل الحالي على الفريق',
    },
  ];

  const activityCounts = useMemo(() => {
    return recentActivities.reduce(
      (acc, item) => {
        acc[item.type] += 1;
        return acc;
      },
      { approve: 0, reject: 0, user: 0 }
    );
  }, [recentActivities]);

  const filteredActivities = useMemo(() => {
    return activityFilter === 'all'
      ? recentActivities
      : recentActivities.filter((activity) => activity.type === activityFilter);
  }, [activityFilter, recentActivities]);

  const totalActivityPages = Math.max(1, Math.ceil(filteredActivities.length / activityPageSize));

  const currentActivities = useMemo(() => {
    const start = activityPage * activityPageSize;
    return filteredActivities.slice(start, start + activityPageSize);
  }, [activityPage, activityPageSize, filteredActivities]);

  const sparkSeries = useMemo(() => {
    const now = Date.now();
    const buckets = new Array(14).fill(0);

    recentActivities.forEach((activity) => {
      const hoursDiff = (now - activity.ts) / 3600000;
      const bucketIndex = Math.floor(hoursDiff / 2);
      if (bucketIndex >= 0 && bucketIndex < buckets.length) {
        buckets[buckets.length - 1 - bucketIndex] += 1;
      }
    });

    return buckets;
  }, [recentActivities]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="dashboard-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <div className="hero-tag">
            <Sparkles size={16} />
            <span>مركز قيادة لوحة التحكم</span>
          </div>
          <h1 className="hero-title">واجهة متابعة تنفيذية أكثر وضوحًا وسرعة في اتخاذ القرار</h1>
          <p className="hero-subtitle">
            نظرة واحدة على الأداء الحالي، الإعلانات التي تحتاج تدخلاً، والنشاطات الإدارية الأخيرة
            مع وصول مباشر للمهام الأكثر استخدامًا.
          </p>

          <div className="hero-insights">
            <div className="hero-insight-card">
              <span className="hero-insight-label">نسبة التفعيل</span>
              <strong>{formatPercent(activeRate)}</strong>
              <small>من إجمالي الإعلانات الحالية</small>
            </div>
            <div className="hero-insight-card">
              <span className="hero-insight-label">طلبات المراجعة</span>
              <strong>{formatCompactNumber(pendingAds)}</strong>
              <small>يمكن البدء بها فورًا من إجراءات سريعة</small>
            </div>
            <div className="hero-insight-card">
              <span className="hero-insight-label">النشاط اليومي</span>
              <strong>{formatCompactNumber(recentActivities.length)}</strong>
              <small>آخر العمليات التي تمت على المنصة</small>
            </div>
          </div>
        </div>

        <div className="hero-aside">
          <div className="time-card glass-card">
            <div className="time-card-head">
              <Clock3 size={18} />
              <span>الوقت الحالي</span>
            </div>
            <div className="time-card-value">{formatHeroTime(currentTime)}</div>
            <div className="time-card-date">{formatHeroDate(currentTime)}</div>
          </div>

          <div className="month-card glass-card">
            <div className="month-card-head">
              <TrendingUp size={18} />
              <span>ملخص الفترة الحالية</span>
            </div>
            <strong className="month-card-range">
              {periods?.current_month
                ? `${formatArabicDate(periods.current_month.start)} - ${formatArabicDate(periods.current_month.end)}`
                : 'لا توجد بيانات متاحة'}
            </strong>
            <p className="month-card-note">
              المقارنات الظاهرة بالأسفل مبنية على هذه الفترة مقابل الشهر السابق.
            </p>
          </div>
        </div>
      </section>

      <section className="metrics-grid">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className={`metric-card tone-${card.tone}`}>
              <div className="metric-card-head">
                <div className="metric-icon-wrap">
                  <Icon size={20} />
                </div>
                <span className={`metric-trend ${card.direction === 'up' ? 'trend-up' : 'trend-down'}`}>
                  {getTrendLabel(card.percent, card.direction)}
                </span>
              </div>
              <div className="metric-value">{formatCompactNumber(card.value)}</div>
              <div className="metric-label">{card.label}</div>
              <p className="metric-note">{card.note}</p>
            </article>
          );
        })}
      </section>

      <section className="dashboard-main-grid">
        <div className="panel-card analytics-panel">
          <div className="panel-head">
            <div>
              <span className="eyebrow">تحليل سريع</span>
              <h2>توزيع حالة الإعلانات</h2>
            </div>
            <p>لوحة مركزة لتوزيع الحالات الحالية وأين يوجد الحمل التشغيلي الأكبر.</p>
          </div>

          <div className="analytics-layout">
            <DonutChart
              segments={donutSegments}
              centerTitle="إجمالي الإعلانات"
              centerValue={formatCompactNumber(totalAds)}
            />

            <div className="analytics-side">
              <div className="mini-stat-grid">
                <div className="mini-stat-card">
                  <span>معدل التفعيل</span>
                  <strong>{formatPercent(activeRate)}</strong>
                  <small>نشطة الآن</small>
                </div>
                <div className="mini-stat-card">
                  <span>نسبة الانتظار</span>
                  <strong>{formatPercent(pendingRate)}</strong>
                  <small>تحتاج تدخل</small>
                </div>
                <div className="mini-stat-card">
                  <span>نسبة الرفض</span>
                  <strong>{formatPercent(rejectionRate)}</strong>
                  <small>تحتاج مراجعة أعمق</small>
                </div>
              </div>

              <DistributionBars items={donutSegments} />
            </div>
          </div>
        </div>

        <div className="panel-card actions-panel">
          <div className="panel-head compact">
            <div>
              <span className="eyebrow">اختصارات العمل</span>
              <h2>إجراءات سريعة</h2>
            </div>
            <p>مسارات مختصرة لأكثر الصفحات استخدامًا داخل الداشبورد.</p>
          </div>

          <div className="actions-list">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.title}
                  type="button"
                  className={`action-card tone-${action.tone}`}
                  onClick={() => router.push(action.href)}
                >
                  <span className="action-icon">
                    <Icon size={18} />
                  </span>
                  <span className="action-copy">
                    <strong>{action.title}</strong>
                    <small>{action.description}</small>
                  </span>
                  <ArrowLeft size={17} className="action-arrow" />
                </button>
              );
            })}
          </div>
        </div>

        <section className="panel-card activities-panel">
        <div className="panel-head">
          <div>
            <span className="eyebrow">حركة العمليات</span>
            <h2>النشاطات الأخيرة</h2>
          </div>
          <p>آخر الإجراءات الإدارية المسجلة، مع فلاتر سريعة ومؤشر مرئي لكثافة النشاط.</p>
        </div>

        <div className="activities-topbar">
          <div className="activity-summary-cards">
            <div className="activity-summary-card">
              <span>إجمالي النشاطات</span>
              <strong>{formatCompactNumber(recentActivities.length)}</strong>
            </div>
            <div className="activity-summary-card">
              <span>الموافقات</span>
              <strong>{formatCompactNumber(activityCounts.approve)}</strong>
            </div>
            <div className="activity-summary-card">
              <span>الرفض</span>
              <strong>{formatCompactNumber(activityCounts.reject)}</strong>
            </div>
            <div className="activity-summary-card">
              <span>إداري/مستخدم</span>
              <strong>{formatCompactNumber(activityCounts.user)}</strong>
            </div>
          </div>

          <div className="activity-density-card">
            <div className="activity-density-head">
              <Activity size={16} />
              <span>كثافة آخر 24 ساعة تقريبًا</span>
            </div>
            <ActivitySparkline series={sparkSeries} />
          </div>
        </div>

        <div className="activity-toolbar">
          <div className="filter-group">
            {[
              { key: 'all', label: 'الكل' },
              { key: 'approve', label: 'موافقات' },
              { key: 'reject', label: 'رفض' },
              { key: 'user', label: 'إداري/مستخدم' },
            ].map((filter) => (
              <button
                key={filter.key}
                type="button"
                className={`filter-chip ${activityFilter === filter.key ? 'active' : ''}`}
                onClick={() => setActivityFilter(filter.key as 'all' | ActivityType)}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="activity-pagination">
            <span className="pagination-status">
              صفحة {activityPage + 1} من {totalActivityPages}
            </span>
            <div className="pagination-buttons">
              <button
                type="button"
                className="pagination-btn"
                disabled={activityPage <= 0}
                onClick={() => setActivityPage((page) => Math.max(0, page - 1))}
              >
                <ArrowRight size={16} />
                السابق
              </button>
              <button
                type="button"
                className="pagination-btn"
                disabled={activityPage >= totalActivityPages - 1}
                onClick={() => setActivityPage((page) => Math.min(totalActivityPages - 1, page + 1))}
              >
                التالي
                <ArrowLeft size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="activity-list">
          {currentActivities.length === 0 ? (
            <div className="empty-state">
              <BellRing size={26} />
              <strong>لا توجد نشاطات مطابقة لهذا الفلتر حاليًا</strong>
              <span>جرّب تغيير نوع النشاط أو العودة إلى عرض الكل.</span>
            </div>
          ) : (
            currentActivities.map((activity, index) => {
              const meta = getActivityMeta(activity.type);
              const Icon = meta.icon;
              const cardStyle = {
                '--activity-accent': meta.accent,
                '--activity-soft': meta.soft,
              } as CSSProperties;

              return (
                <article key={`${activity.ts}-${index}`} className="activity-card" style={cardStyle}>
                  <div className="activity-card-icon">
                    <Icon size={18} />
                  </div>
                  <div className="activity-card-body">
                    <div className="activity-card-top">
                      <span className="activity-type-pill">{meta.title}</span>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                    <p className="activity-action">{activity.action}</p>
                  </div>
                </article>
              );
            })
          )}
        </div>
        </section>

        <div className="panel-card highlights-panel">
          <div className="panel-head compact">
            <div>
              <span className="eyebrow">مؤشرات تشغيلية</span>
              <h2>الصورة التنفيذية</h2>
            </div>
            <p>نقاط مختصرة تساعدك على قراءة الوضع الحالي بسرعة.</p>
          </div>

          <div className="highlights-list">
            {operationalHighlights.map((item) => (
              <div key={item.label} className="highlight-item">
                <span className="highlight-label">{item.label}</span>
                <strong className="highlight-value">{item.value}</strong>
                <small className="highlight-helper">{item.helper}</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        .dashboard-shell {
          display: grid;
          gap: 22px;
          padding: 26px;
          background:
            radial-gradient(circle at top right, rgba(18, 140, 126, 0.13), transparent 28%),
            radial-gradient(circle at left top, rgba(61, 104, 236, 0.12), transparent 25%),
            linear-gradient(180deg, #f8fafc 0%, #eef4f7 100%);
          min-height: 100vh;
        }

        .hero-panel {
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1.7fr) minmax(300px, 0.9fr);
          gap: 18px;
          padding: 28px;
          border-radius: 28px;
          background:
            linear-gradient(135deg, rgba(8, 32, 45, 0.96), rgba(12, 63, 78, 0.92)),
            linear-gradient(180deg, #0e2733, #144054);
          color: #f8fcff;
          overflow: hidden;
          box-shadow: 0 24px 60px rgba(17, 34, 52, 0.14);
        }

        .hero-panel::before {
          content: '';
          position: absolute;
          inset: auto auto -120px -70px;
          width: 260px;
          height: 260px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(80, 221, 188, 0.25), transparent 65%);
          pointer-events: none;
        }

        .hero-panel::after {
          content: '';
          position: absolute;
          top: -120px;
          right: -70px;
          width: 280px;
          height: 280px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(91, 141, 255, 0.24), transparent 65%);
          pointer-events: none;
        }

        .hero-copy,
        .hero-aside {
          position: relative;
          z-index: 1;
        }

        .hero-copy {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .hero-tag {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          width: fit-content;
          padding: 9px 14px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #d7f5ee;
          font-size: 13px;
          font-weight: 700;
        }

        .hero-title {
          margin: 0;
          font-size: clamp(30px, 4vw, 44px);
          line-height: 1.15;
          font-weight: 900;
          max-width: 760px;
          letter-spacing: -0.03em;
        }

        .hero-subtitle {
          margin: 0;
          max-width: 760px;
          color: rgba(232, 244, 248, 0.82);
          font-size: 16px;
          line-height: 1.9;
        }

        .hero-insights {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .hero-insight-card {
          padding: 18px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(8px);
          display: grid;
          gap: 6px;
        }

        .hero-insight-label {
          color: rgba(227, 240, 245, 0.78);
          font-size: 13px;
        }

        .hero-insight-card strong {
          font-size: 30px;
          line-height: 1;
          font-weight: 800;
        }

        .hero-insight-card small {
          color: rgba(223, 239, 244, 0.74);
          font-size: 12px;
          line-height: 1.6;
        }

        .hero-aside {
          display: grid;
          gap: 14px;
          align-content: start;
        }

        .glass-card {
          padding: 20px;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }

        .time-card-head,
        .month-card-head {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(224, 239, 244, 0.8);
          font-size: 13px;
          font-weight: 700;
        }

        .time-card-value {
          margin-top: 12px;
          font-size: clamp(30px, 4vw, 42px);
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -0.04em;
        }

        .time-card-date,
        .month-card-note {
          margin-top: 8px;
          color: rgba(225, 240, 245, 0.78);
          font-size: 14px;
          line-height: 1.8;
        }

        .month-card-range {
          display: block;
          margin-top: 12px;
          font-size: 18px;
          line-height: 1.7;
          color: #ffffff;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .metric-card {
          position: relative;
          overflow: hidden;
          padding: 20px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(18, 28, 45, 0.06);
          box-shadow: 0 14px 36px rgba(15, 23, 42, 0.06);
          display: grid;
          gap: 10px;
        }

        .metric-card::before {
          content: '';
          position: absolute;
          inset: 0 auto auto 0;
          width: 100%;
          height: 4px;
          background: var(--metric-accent);
        }

        .tone-blue {
          --metric-accent: #4369f4;
          --metric-soft: rgba(67, 105, 244, 0.1);
          --metric-text: #1d44d6;
        }

        .tone-teal {
          --metric-accent: #159c80;
          --metric-soft: rgba(21, 156, 128, 0.1);
          --metric-text: #0f8169;
        }

        .tone-amber {
          --metric-accent: #d19a34;
          --metric-soft: rgba(209, 154, 52, 0.12);
          --metric-text: #9c6b12;
        }

        .tone-rose {
          --metric-accent: #d8554a;
          --metric-soft: rgba(216, 85, 74, 0.12);
          --metric-text: #b03d33;
        }

        .metric-card-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .metric-icon-wrap {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: var(--metric-soft);
          color: var(--metric-text);
        }

        .metric-trend {
          display: inline-flex;
          align-items: center;
          padding: 8px 10px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          line-height: 1.4;
        }

        .trend-up {
          background: rgba(22, 163, 74, 0.1);
          color: #0f8e42;
        }

        .trend-down {
          background: rgba(220, 38, 38, 0.1);
          color: #bf2d2d;
        }

        .metric-value {
          font-size: clamp(28px, 3vw, 36px);
          font-weight: 900;
          color: #13233f;
          letter-spacing: -0.03em;
          line-height: 1.05;
        }

        .metric-label {
          color: #1f2f4f;
          font-size: 15px;
          font-weight: 800;
        }

        .metric-note {
          margin: 0;
          color: #66758c;
          font-size: 13px;
          line-height: 1.8;
        }

        .dashboard-main-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.95fr);
          grid-template-areas:
            'analytics actions'
            'activities highlights';
          gap: 18px;
          align-items: start;
        }

        .analytics-panel {
          grid-area: analytics;
        }

        .actions-panel {
          grid-area: actions;
        }

        .activities-panel {
          grid-area: activities;
        }

        .highlights-panel {
          grid-area: highlights;
        }

        .panel-card {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(15, 23, 42, 0.06);
          border-radius: 28px;
          box-shadow: 0 14px 36px rgba(15, 23, 42, 0.06);
          padding: 22px;
        }

        .panel-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 20px;
        }

        .panel-head.compact {
          margin-bottom: 16px;
        }

        .panel-head h2 {
          margin: 4px 0 0;
          color: #11213b;
          font-size: 24px;
          line-height: 1.25;
        }

        .panel-head p {
          margin: 0;
          max-width: 360px;
          color: #6d7b90;
          font-size: 13px;
          line-height: 1.8;
        }

        .eyebrow {
          color: #159c80;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
        }

        .analytics-layout {
          display: grid;
          grid-template-columns: minmax(280px, 0.95fr) minmax(0, 1.05fr);
          gap: 20px;
          align-items: center;
        }

        .distribution-visual {
          display: grid;
          gap: 18px;
          align-content: start;
        }

        .donut-shell {
          position: relative;
          width: min(100%, 300px);
          aspect-ratio: 1;
          margin-inline: auto;
          display: grid;
          place-items: center;
        }

        .donut-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
        }

        .donut-core {
          position: absolute;
          inset: 22%;
          border-radius: 50%;
          background: linear-gradient(180deg, #ffffff 0%, #f4f7fb 100%);
          display: grid;
          place-items: center;
          text-align: center;
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
          padding: 20px;
        }

        .donut-value {
          font-size: 34px;
          line-height: 1;
          color: #13233f;
          font-weight: 900;
          letter-spacing: -0.04em;
        }

        .donut-title {
          color: #64748b;
          font-size: 13px;
          margin-top: 8px;
        }

        .distribution-legend {
          display: grid;
          gap: 10px;
        }

        .legend-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 16px;
          background: #f6f8fb;
        }

        .legend-label-group {
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          flex: 0 0 auto;
        }

        .legend-label {
          color: #233455;
          font-size: 14px;
          font-weight: 700;
        }

        .legend-stats {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #62728a;
          font-size: 12px;
          font-weight: 700;
        }

        .legend-number {
          color: #12213b;
          font-size: 14px;
        }

        .analytics-side {
          display: grid;
          gap: 18px;
        }

        .mini-stat-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .mini-stat-card {
          padding: 16px;
          border-radius: 18px;
          background: linear-gradient(180deg, #f8fbfd 0%, #eef4f8 100%);
          border: 1px solid rgba(17, 24, 39, 0.05);
          display: grid;
          gap: 6px;
        }

        .mini-stat-card span {
          color: #6a7891;
          font-size: 12px;
          font-weight: 700;
        }

        .mini-stat-card strong {
          color: #10213c;
          font-size: 24px;
          line-height: 1;
        }

        .mini-stat-card small {
          color: #8390a4;
          font-size: 12px;
        }

        .distribution-bars {
          display: grid;
          gap: 12px;
        }

        .distribution-row {
          display: grid;
          gap: 8px;
        }

        .distribution-row-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #5e6f87;
          font-size: 13px;
          font-weight: 700;
        }

        .distribution-row-head strong {
          color: #12213b;
        }

        .distribution-track {
          width: 100%;
          height: 10px;
          border-radius: 999px;
          background: #edf2f7;
          overflow: hidden;
        }

        .distribution-fill {
          height: 100%;
          border-radius: inherit;
        }

        .actions-list,
        .highlights-list {
          display: grid;
          gap: 12px;
        }

        .action-card {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          border-radius: 18px;
          border: 1px solid rgba(15, 23, 42, 0.06);
          background: #f7fafc;
          text-align: right;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }

        .action-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
          border-color: rgba(17, 24, 39, 0.1);
        }

        .action-icon {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          background: var(--metric-soft);
          color: var(--metric-text);
          flex: 0 0 auto;
        }

        .action-copy {
          flex: 1;
          display: grid;
          gap: 4px;
        }

        .action-copy strong {
          color: #12213b;
          font-size: 15px;
        }

        .action-copy small {
          color: #738197;
          font-size: 12px;
          line-height: 1.7;
        }

        .action-arrow {
          color: #8d98a9;
          flex: 0 0 auto;
        }

        .highlight-item {
          padding: 16px;
          border-radius: 18px;
          background:
            linear-gradient(180deg, rgba(247, 250, 252, 0.95), rgba(240, 245, 249, 0.95));
          border: 1px solid rgba(17, 24, 39, 0.05);
          display: grid;
          gap: 6px;
        }

        .highlight-label {
          color: #6f7f94;
          font-size: 12px;
          font-weight: 700;
        }

        .highlight-value {
          color: #13233f;
          font-size: 18px;
          line-height: 1.7;
        }

        .highlight-helper {
          color: #8491a4;
          font-size: 12px;
          line-height: 1.7;
        }

        .activities-panel {
          display: grid;
          gap: 18px;
          align-self: start;
        }

        .activities-topbar {
          display: grid;
          grid-template-columns: minmax(0, 1.3fr) minmax(260px, 0.7fr);
          gap: 16px;
        }

        .activity-summary-cards {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .activity-summary-card,
        .activity-density-card {
          padding: 16px;
          border-radius: 18px;
          background: #f7fafc;
          border: 1px solid rgba(15, 23, 42, 0.05);
          display: grid;
          gap: 8px;
        }

        .activity-summary-card span,
        .activity-density-head {
          color: #6b7a90;
          font-size: 12px;
          font-weight: 700;
        }

        .activity-summary-card strong {
          color: #13233f;
          font-size: 22px;
          line-height: 1.1;
        }

        .activity-density-head {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .sparkline {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          height: 76px;
        }

        .sparkline-bar {
          flex: 1 1 0;
          border-radius: 999px 999px 4px 4px;
          background: linear-gradient(180deg, #20b594 0%, #315fef 100%);
          min-height: 6px;
        }

        .activity-toolbar {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: 16px;
          padding: 14px 16px;
          border-radius: 22px;
          background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid rgba(15, 23, 42, 0.05);
        }

        .filter-group {
          display: inline-grid;
          grid-auto-flow: column;
          grid-auto-columns: max-content;
          align-items: center;
          gap: 10px;
          justify-self: end;
          width: max-content;
          max-width: 100%;
          padding: 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(15, 23, 42, 0.06);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
          overflow-x: auto;
          scrollbar-width: none;
        }

        .filter-group::-webkit-scrollbar {
          display: none;
        }

        .filter-chip {
          border: 1px solid rgba(17, 24, 39, 0.08);
          background: #ffffff;
          color: #51627b;
          border-radius: 999px;
          padding: 11px 18px;
          min-height: 44px;
          white-space: nowrap;
          font-size: 13px;
          font-weight: 800;
          line-height: 1;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-chip:hover {
          border-color: rgba(21, 156, 128, 0.22);
          background: #f8fffd;
          color: #137f69;
        }

        .filter-chip.active {
          background: #0f8f76;
          border-color: #0f8f76;
          color: #ffffff;
          box-shadow: 0 10px 24px rgba(15, 143, 118, 0.2);
        }

        .activity-pagination {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          justify-self: start;
          padding: 8px 10px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(15, 23, 42, 0.06);
          min-height: 60px;
        }

        .pagination-status {
          color: #6d7c91;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }

        .pagination-buttons {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .pagination-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          background: #ffffff;
          color: #20314f;
          border-radius: 14px;
          min-height: 42px;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .pagination-btn:disabled {
          cursor: not-allowed;
          opacity: 0.45;
        }

        .pagination-btn:not(:disabled):hover {
          background: #13233f;
          border-color: #13233f;
          color: #ffffff;
        }

        .activity-list {
          display: grid;
          gap: 12px;
        }

        .activity-card {
          display: grid;
          grid-template-columns: 52px minmax(0, 1fr);
          gap: 14px;
          padding: 16px;
          border-radius: 20px;
          border: 1px solid rgba(15, 23, 42, 0.06);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 251, 253, 0.96));
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.03);
        }

        .activity-card-icon {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          background: var(--activity-soft);
          color: var(--activity-accent);
        }

        .activity-card-body {
          display: grid;
          gap: 8px;
          min-width: 0;
        }

        .activity-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        .activity-type-pill {
          display: inline-flex;
          align-items: center;
          padding: 8px 12px;
          border-radius: 999px;
          background: var(--activity-soft);
          color: var(--activity-accent);
          font-size: 12px;
          font-weight: 800;
        }

        .activity-time {
          color: #8090a5;
          font-size: 12px;
          font-weight: 700;
        }

        .activity-action {
          margin: 0;
          color: #172746;
          line-height: 1.9;
          font-size: 14px;
        }

        .empty-state {
          display: grid;
          place-items: center;
          gap: 8px;
          min-height: 220px;
          text-align: center;
          border-radius: 22px;
          background: #f8fafc;
          border: 1px dashed rgba(17, 24, 39, 0.12);
          color: #708096;
          padding: 20px;
        }

        .empty-state strong {
          color: #1c2d4c;
          font-size: 18px;
        }

        .empty-state span {
          font-size: 13px;
        }

        @media (max-width: 1280px) {
          .metrics-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .dashboard-main-grid,
          .hero-panel,
          .activities-topbar,
          .analytics-layout {
            grid-template-columns: 1fr;
          }

          .dashboard-main-grid {
            grid-template-areas:
              'analytics'
              'actions'
              'activities'
              'highlights';
          }

          .hero-insights,
          .activity-summary-cards,
          .mini-stat-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .panel-head {
            flex-direction: column;
          }

          .panel-head p {
            max-width: none;
          }
        }

        @media (max-width: 820px) {
          .dashboard-shell {
            padding: 16px;
            gap: 16px;
          }

          .hero-panel,
          .panel-card {
            padding: 18px;
            border-radius: 22px;
          }

          .hero-insights,
          .metrics-grid,
          .activity-summary-cards,
          .mini-stat-grid {
            grid-template-columns: 1fr;
          }

          .activity-toolbar,
          .activity-pagination,
          .pagination-buttons {
            width: 100%;
          }

          .activity-toolbar {
            grid-template-columns: 1fr;
            padding: 14px;
          }

          .filter-group {
            justify-self: stretch;
            width: 100%;
            grid-auto-flow: column;
            justify-content: flex-start;
          }

          .activity-pagination {
            justify-self: stretch;
            justify-content: space-between;
            flex-wrap: wrap;
          }

          .pagination-buttons {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .pagination-btn {
            justify-content: center;
          }

          .action-card {
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
