'use client';

import { useEffect, useMemo, useState } from 'react';
import { Activity, RefreshCcw, Smartphone, UserCheck, Users } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AppOpensSummaryResponse } from '@/models/dashboardReports';
import { fetchAppOpensSummary } from '@/services/dashboardReports';

type AppOpensInsightsSectionProps = {
  from?: string;
  to?: string;
};

function MiniCard({
  title,
  value,
  hint,
  icon,
  color,
}: {
  title: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div
      style={{
        borderRadius: 20,
        border: '1px solid #e2e8f0',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        padding: '1rem',
        boxShadow: '0 16px 32px rgba(15, 23, 42, 0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 14,
            display: 'grid',
            placeItems: 'center',
            background: `${color}18`,
            color,
          }}
        >
          {icon}
        </div>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0f172a' }}>{value}</div>
        </div>
      </div>
      <div style={{ marginTop: '0.85rem' }}>
        <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '0.35rem' }}>{title}</div>
        <div style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6 }}>{hint}</div>
      </div>
    </div>
  );
}

export default function AppOpensInsightsSection({
  from,
  to,
}: AppOpensInsightsSectionProps) {
  const [data, setData] = useState<AppOpensSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const effectiveRange = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    return {
      from: from || today,
      to: to || today,
    };
  }, [from, to]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchAppOpensSummary(effectiveRange);
        if (!cancelled) {
          setData(response);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'تعذر تحميل تقرير فتح التطبيق');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [effectiveRange]);

  const chartData = useMemo(() => {
    return (data?.timeline || []).map((point) => ({
      date: new Date(point.date).toLocaleDateString('ar-EG', {
        month: 'short',
        day: 'numeric',
      }),
      unique_openers: point.unique_openers,
      total_opens: point.total_opens,
    }));
  }, [data]);

  return (
    <section
      style={{
        marginBottom: '1.75rem',
        borderRadius: 28,
        border: '1px solid rgba(148, 163, 184, 0.18)',
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.035), rgba(255, 255, 255, 0.98))',
        padding: '1.35rem',
        boxShadow: '0 22px 48px rgba(15, 23, 42, 0.08)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.85rem',
          marginBottom: '1rem',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
            تقرير فتح التطبيق
          </h2>
          <p style={{ margin: '0.4rem 0 0', color: '#64748b', lineHeight: 1.7 }}>
            يعرض عدد من فتحوا التطبيق بدون تكرار، وعدد مرات الفتح الكلي خلال الفترة المحددة.
          </p>
        </div>
        <div
          style={{
            padding: '0.65rem 0.85rem',
            borderRadius: 999,
            background: '#eff6ff',
            color: '#1d4ed8',
            fontWeight: 700,
            fontSize: '0.92rem',
          }}
        >
          {effectiveRange.from} - {effectiveRange.to}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '2rem 1rem', color: '#64748b', textAlign: 'center' }}>جارٍ تحميل تقرير فتح التطبيق...</div>
      ) : error ? (
        <div
          style={{
            padding: '1rem',
            borderRadius: 18,
            background: '#fff7ed',
            color: '#c2410c',
            fontWeight: 700,
          }}
        >
          {error}
        </div>
      ) : data ? (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '0.9rem',
              marginBottom: '1rem',
            }}
          >
            <MiniCard
              title="الفاتحون بدون تكرار"
              value={data.totals.unique_openers.toLocaleString('ar-EG')}
              hint="كل مستخدم أو ضيف يُحسب مرة واحدة فقط داخل الفترة."
              icon={<Users size={22} />}
              color="#0f766e"
            />
            <MiniCard
              title="عدد مرات الفتح"
              value={data.totals.total_opens.toLocaleString('ar-EG')}
              hint="يشمل كل فتح جديد للتطبيق حتى لو كان من نفس المستخدم."
              icon={<Activity size={22} />}
              color="#2563eb"
            />
            <MiniCard
              title="المستخدمون المسجلون"
              value={data.totals.unique_users.toLocaleString('ar-EG')}
              hint={`${data.totals.user_opens.toLocaleString('ar-EG')} مرة فتح من الحسابات المسجلة`}
              icon={<UserCheck size={22} />}
              color="#7c3aed"
            />
            <MiniCard
              title="الضيوف"
              value={data.totals.unique_guests.toLocaleString('ar-EG')}
              hint={`${data.totals.guest_opens.toLocaleString('ar-EG')} مرة فتح من الضيوف`}
              icon={<Smartphone size={22} />}
              color="#ea580c"
            />
          </div>

          <div
            style={{
              borderRadius: 22,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              padding: '1rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                marginBottom: '0.75rem',
                color: '#1e293b',
                fontWeight: 800,
              }}
            >
              <RefreshCcw size={18} />
              تطور الفتحات خلال الفترة
            </div>

            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="totalOpensGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.04} />
                    </linearGradient>
                    <linearGradient id="uniqueOpenersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 18px 42px rgba(15, 23, 42, 0.16)',
                      direction: 'rtl',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total_opens"
                    name="مرات الفتح"
                    stroke="#2563eb"
                    strokeWidth={3}
                    fill="url(#totalOpensGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="unique_openers"
                    name="الفاتحون الفريدون"
                    stroke="#0f766e"
                    strokeWidth={3}
                    fill="url(#uniqueOpenersGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ color: '#64748b', textAlign: 'center', padding: '1.5rem 1rem' }}>
                لا توجد بيانات فتح تطبيق داخل هذه الفترة.
              </div>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
