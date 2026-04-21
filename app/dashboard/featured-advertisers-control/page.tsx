'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FeaturedAdvertiserSection } from '@/models/featuredAdvertisers';
import {
  fetchFeaturedAdvertiserSections,
  updateFeaturedAdvertiserSectionVisibility,
} from '@/services/featuredAdvertisers';
import { resolveBackendAssetUrl } from '@/utils/api';

function getSectionImage(section: FeaturedAdvertiserSection): string {
  return (
    resolveBackendAssetUrl(section.global_image_full_url) ||
    resolveBackendAssetUrl(section.icon_url) ||
    '/categories.png'
  );
}

export default function FeaturedAdvertisersControlPage() {
  const [sections, setSections] = useState<FeaturedAdvertiserSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingSectionId, setSavingSectionId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadSections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchFeaturedAdvertiserSections();
      setSections(data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل الأقسام');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSections();
  }, [loadSections]);

  const totals = useMemo(() => {
    const enabledCount = sections.filter((section) => section.show_featured_advertisers).length;
    const disabledCount = sections.length - enabledCount;
    const emptyEnabledCount = sections.filter(
      (section) => section.show_featured_advertisers && section.featured_advertisers_count === 0
    ).length;

    return { enabledCount, disabledCount, emptyEnabledCount };
  }, [sections]);

  const handleToggle = useCallback(async (section: FeaturedAdvertiserSection) => {
    const nextValue = !section.show_featured_advertisers;
    const previousSections = sections;

    setSavingSectionId(section.id);
    setSuccessMessage(null);
    setSections((current) =>
      current.map((item) =>
        item.id === section.id
          ? { ...item, show_featured_advertisers: nextValue }
          : item
      )
    );

    try {
      const updated = await updateFeaturedAdvertiserSectionVisibility(section.id, nextValue);
      setSections((current) =>
        current.map((item) => (item.id === section.id ? { ...item, ...updated } : item))
      );
      setSuccessMessage(
        nextValue
          ? `تم تشغيل أفضل المعلنين لقسم ${section.name}`
          : `تم تعطيل أفضل المعلنين لقسم ${section.name}`
      );
    } catch (toggleError) {
      setSections(previousSections);
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : 'تعذر تحديث حالة أفضل المعلنين لهذا القسم'
      );
    } finally {
      setSavingSectionId(null);
    }
  }, [sections]);

  return (
    <div className="featured-control-page">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">إدارة تجربة الانتقال من الهوم</span>
          <h1>إدارة المعلنين المميزين للاقسام</h1>
          <p>
            من هنا نحدد هل القسم يعرض صفحة المعلنين المميزين في التطبيق أم يتخطاها
            ويفتح صفحة عرض جميع الإعلانات مباشرة، بدون حذف أي معلنين مميزين محفوظين.
          </p>
        </div>

        <div className="stats">
          <div className="stat-card">
            <strong>{sections.length}</strong>
            <span>إجمالي الأقسام</span>
          </div>
          <div className="stat-card accent">
            <strong>{totals.enabledCount}</strong>
            <span>أقسام مفعلة</span>
          </div>
          <div className="stat-card">
            <strong>{totals.disabledCount}</strong>
            <span>أقسام معطلة</span>
          </div>
          <div className="stat-card muted">
            <strong>{totals.emptyEnabledCount}</strong>
            <span>أقسام مفعلة بلا معلنين حاليًا</span>
          </div>
        </div>
      </section>

      {successMessage && (
        <div className="feedback success" role="status">
          {successMessage}
        </div>
      )}

      {loading && (
        <div className="table-shell loading-state" aria-busy="true">
          جاري تحميل إعدادات الأقسام...
        </div>
      )}

      {!loading && error && (
        <div className="feedback error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={loadSections}>
            إعادة المحاولة
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="table-shell">
          <table className="sections-table">
            <thead>
              <tr>
                <th>صورة القسم</th>
                <th>اسم القسم</th>
                <th>تشغيل صفحة المعلنين المميزين</th>
              </tr>
            </thead>
            <tbody>
              {sections.map((section) => {
                const enabled = section.show_featured_advertisers;
                const isSaving = savingSectionId === section.id;

                return (
                  <tr key={section.id}>
                    <td>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        className="section-image"
                        src={getSectionImage(section)}
                        alt={section.name}
                        loading="lazy"
                      />
                    </td>
                    <td>
                      <div className="section-cell">
                        <div className="section-name">{section.name}</div>
                        <div className="section-slug">{section.slug}</div>
                      </div>
                    </td>
                    <td>
                      <label className={`toggle ${enabled ? 'enabled' : 'disabled'} ${isSaving ? 'saving' : ''}`}>
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={() => void handleToggle(section)}
                          disabled={isSaving}
                        />
                        <span className="track">
                          <span className="thumb" />
                        </span>
                        <span className="toggle-label">
                          {isSaving ? 'جارٍ الحفظ...' : enabled ? 'مفعل' : 'معطل'}
                        </span>
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .featured-control-page {
          max-width: 1380px;
          margin: 0 auto;
          padding: 2rem;
        }

        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.95fr);
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .hero-copy,
        .stats {
          border: 1px solid rgba(186, 230, 253, 0.8);
          border-radius: 28px;
          background:
            radial-gradient(circle at top left, rgba(34, 197, 94, 0.12), transparent 30%),
            linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          box-shadow: 0 24px 52px rgba(15, 23, 42, 0.08);
        }

        .hero-copy {
          padding: 2rem;
        }

        .eyebrow {
          display: inline-flex;
          padding: 0.42rem 0.85rem;
          border-radius: 999px;
          background: #ecfeff;
          color: #0f766e;
          font-size: 0.82rem;
          font-weight: 800;
          margin-bottom: 1rem;
        }

        .hero-copy h1 {
          margin: 0 0 0.85rem;
          font-size: clamp(1.9rem, 2.8vw, 2.7rem);
          font-weight: 900;
          color: #0f172a;
        }

        .hero-copy p {
          margin: 0;
          color: #475569;
          line-height: 1.9;
          max-width: 62ch;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1rem;
          padding: 1rem;
        }

        .stat-card {
          border-radius: 22px;
          padding: 1.05rem 1.1rem;
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid #dbeafe;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .stat-card.accent {
          background: linear-gradient(135deg, #14532d, #0f766e);
          border-color: transparent;
        }

        .stat-card.muted {
          background: #f8fafc;
        }

        .stat-card strong {
          font-size: 2rem;
          font-weight: 900;
          color: #0f172a;
        }

        .stat-card span {
          color: #475569;
        }

        .stat-card.accent strong,
        .stat-card.accent span {
          color: #ffffff;
        }

        .feedback {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          border-radius: 18px;
          padding: 1rem 1.2rem;
          margin-bottom: 1rem;
          font-weight: 700;
        }

        .feedback.success {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
        }

        .feedback.error {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }

        .feedback button {
          border: 0;
          border-radius: 12px;
          background: #ffffff;
          color: inherit;
          padding: 0.7rem 1rem;
          cursor: pointer;
          font-weight: 800;
        }

        .table-shell {
          overflow: hidden;
          border-radius: 26px;
          border: 1px solid #dbeafe;
          background: #ffffff;
          box-shadow: 0 24px 50px rgba(15, 23, 42, 0.08);
        }

        .loading-state {
          padding: 2rem;
          text-align: center;
          color: #475569;
          font-weight: 700;
        }

        .sections-table {
          width: 100%;
          border-collapse: collapse;
        }

        .sections-table th,
        .sections-table td {
          padding: 1.1rem 1rem;
          text-align: right;
          border-bottom: 1px solid #e2e8f0;
          vertical-align: middle;
        }

        .sections-table th {
          background: #f8fafc;
          color: #334155;
          font-size: 0.92rem;
          font-weight: 800;
        }

        .sections-table tbody tr:last-child td {
          border-bottom: 0;
        }

        .section-cell {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .section-name {
          font-weight: 800;
          color: #0f172a;
        }

        .section-slug {
          color: #64748b;
          font-size: 0.86rem;
          direction: ltr;
          text-align: left;
        }

        .count-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 54px;
          padding: 0.38rem 0.7rem;
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
          font-weight: 800;
        }

        .behavior-copy {
          color: #475569;
          line-height: 1.7;
          max-width: 42ch;
        }

        .toggle {
          display: inline-flex;
          align-items: center;
          gap: 0.8rem;
          font-weight: 800;
          color: #0f172a;
        }

        .toggle input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        .track {
          position: relative;
          width: 58px;
          height: 32px;
          border-radius: 999px;
          background: #cbd5e1;
          transition: background 0.2s ease;
        }

        .thumb {
          position: absolute;
          top: 4px;
          right: 4px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.18);
          transition: transform 0.2s ease;
        }

        .toggle.enabled .track {
          background: #10b981;
        }

        .toggle.enabled .thumb {
          transform: translateX(-26px);
        }

        .toggle.disabled .toggle-label {
          color: #b91c1c;
        }

        .toggle.enabled .toggle-label {
          color: #047857;
        }

        .toggle.saving {
          opacity: 0.72;
        }

        @media (max-width: 980px) {
          .hero {
            grid-template-columns: 1fr;
          }

          .stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 720px) {
          .featured-control-page {
            padding: 1rem;
          }

          .stats {
            grid-template-columns: 1fr;
          }

          .table-shell {
            overflow-x: auto;
          }

          .sections-table {
            min-width: 620px;
          }
        }

        .section-image {
          width: 72px;
          height: 72px;
          border-radius: 18px;
          object-fit: cover;
          border: 1px solid #dbeafe;
          background: #f8fafc;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
        }
      `}</style>
    </div>
  );
}
