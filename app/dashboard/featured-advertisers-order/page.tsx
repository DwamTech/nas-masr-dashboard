'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import FeaturedAdvertisersRankModal from '@/components/featured-advertisers-order/FeaturedAdvertisersRankModal';
import type { FeaturedAdvertiserSection } from '@/models/featuredAdvertisers';
import { fetchFeaturedAdvertiserSections } from '@/services/featuredAdvertisers';
import { resolveBackendAssetUrl } from '@/utils/api';

function getSectionImage(section: FeaturedAdvertiserSection): string {
  return (
    resolveBackendAssetUrl(section.global_image_full_url) ||
    resolveBackendAssetUrl(section.icon_url) ||
    '/categories.png'
  );
}

export default function FeaturedAdvertisersOrderPage() {
  const [sections, setSections] = useState<FeaturedAdvertiserSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<FeaturedAdvertiserSection | null>(null);

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
    const advertisers = sections.reduce((sum, section) => sum + section.featured_advertisers_count, 0);
    const nonEmptySections = sections.filter((section) => section.featured_advertisers_count > 0).length;

    return { advertisers, nonEmptySections };
  }, [sections]);

  return (
    <div className="featured-order-page">
      <div className="hero">
        <div className="hero-copy">
          <span className="eyebrow">لوحة إدارة الأقسام</span>
          <h1>إدارة ترتيب المعلنين المميزين</h1>
          <p>
            صفحة مركزية لترتيب ظهور المعلنين المميزين داخل كل قسم، مع واجهة سحب وإفلات
            سريعة ومتصلة مباشرة بواجهات الإدارة الخلفية.
          </p>
        </div>

        <div className="hero-stats">
          <div className="stat-card">
            <strong>{sections.length}</strong>
            <span>قسم متاح للإدارة</span>
          </div>
          <div className="stat-card accent">
            <strong>{totals.nonEmptySections}</strong>
            <span>قسم يحتوي معلنين مميزين</span>
          </div>
          <div className="stat-card">
            <strong>{totals.advertisers}</strong>
            <span>إجمالي المعلنين داخل البطاقات</span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="sections-grid" aria-live="polite" aria-busy="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="section-card skeleton-card" aria-hidden="true">
              <div className="section-image skeleton-block" />
              <div className="section-content">
                <div className="skeleton-line title" />
                <div className="skeleton-line subtitle" />
                <div className="skeleton-line button" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="feedback-box error-box" role="alert">
          <strong>تعذر تحميل الصفحة</strong>
          <span>{error}</span>
          <button type="button" onClick={loadSections}>
            إعادة المحاولة
          </button>
        </div>
      )}

      {!loading && !error && sections.length === 0 && (
        <div className="feedback-box empty-box" role="status">
          <strong>لا توجد أقسام متاحة حاليًا.</strong>
          <span>بمجرد توفر أقسام نشطة في الإدارة الخلفية ستظهر هنا تلقائيًا.</span>
        </div>
      )}

      {!loading && !error && sections.length > 0 && (
        <div className="sections-grid">
          {sections.map((section) => (
            <article key={section.id} className="section-card">
              <div className="section-image-wrap">
                <img src={getSectionImage(section)} alt={section.name} className="section-image" />
                <span className="count-badge">{section.featured_advertisers_count} معلن</span>
              </div>

              <div className="section-content">
                <div>
                  <h2>{section.name}</h2>
                  <p>
                    رتب ظهور المعلنين المميزين في هذا القسم عبر نافذة سحب وإفلات سلسة،
                    مع حفظ فوري بعد كل إعادة ترتيب.
                  </p>
                </div>

                <button
                  type="button"
                  className="manage-button"
                  onClick={() => setSelectedSection(section)}
                >
                  إدارة الترتيب
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <FeaturedAdvertisersRankModal
        isOpen={Boolean(selectedSection)}
        section={selectedSection}
        onClose={() => setSelectedSection(null)}
      />

      <style jsx>{`
        .featured-order-page {
          padding: 2rem;
          max-width: 1380px;
          margin: 0 auto;
        }

        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.9fr);
          gap: 1.5rem;
          align-items: stretch;
          margin-bottom: 2rem;
        }

        .hero-copy,
        .hero-stats {
          border: 1px solid rgba(191, 219, 254, 0.65);
          border-radius: 28px;
          background:
            radial-gradient(circle at top right, rgba(14, 165, 233, 0.18), transparent 35%),
            linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          box-shadow: 0 28px 60px rgba(15, 23, 42, 0.08);
        }

        .hero-copy {
          padding: 2rem;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.4rem 0.8rem;
          border-radius: 999px;
          background: #eff6ff;
          color: #1d4ed8;
          font-size: 0.82rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .hero-copy h1 {
          margin: 0 0 0.85rem;
          color: #0f172a;
          font-size: clamp(1.9rem, 2.8vw, 2.7rem);
          font-weight: 900;
          line-height: 1.2;
        }

        .hero-copy p {
          margin: 0;
          color: #475569;
          font-size: 1rem;
          line-height: 1.9;
          max-width: 60ch;
        }

        .hero-stats {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          padding: 1rem;
        }

        .stat-card {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          padding: 1.1rem 1.2rem;
          border-radius: 22px;
          background: rgba(255, 255, 255, 0.84);
          border: 1px solid #dbeafe;
        }

        .stat-card.accent {
          background: linear-gradient(135deg, #0f172a, #1e3a8a);
          border-color: transparent;
        }

        .stat-card strong {
          color: #0f172a;
          font-size: 2rem;
          font-weight: 900;
        }

        .stat-card span {
          color: #475569;
          font-size: 0.95rem;
        }

        .stat-card.accent strong,
        .stat-card.accent span {
          color: #ffffff;
        }

        .sections-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
          gap: 1.25rem;
        }

        .section-card {
          overflow: hidden;
          border: 1px solid #dbeafe;
          border-radius: 26px;
          background: #ffffff;
          box-shadow: 0 24px 48px rgba(15, 23, 42, 0.08);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }

        .section-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 28px 58px rgba(15, 23, 42, 0.12);
        }

        .section-image-wrap {
          position: relative;
          height: 180px;
          background: linear-gradient(135deg, #dbeafe, #f8fafc);
        }

        .section-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .count-badge {
          position: absolute;
          top: 1rem;
          left: 1rem;
          padding: 0.42rem 0.8rem;
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.82);
          color: #ffffff;
          font-size: 0.82rem;
          font-weight: 700;
          backdrop-filter: blur(6px);
        }

        .section-content {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 1.1rem;
          padding: 1.35rem;
          min-height: 215px;
        }

        .section-content h2 {
          margin: 0 0 0.5rem;
          color: #0f172a;
          font-size: 1.2rem;
          font-weight: 800;
        }

        .section-content p {
          margin: 0;
          color: #475569;
          font-size: 0.94rem;
          line-height: 1.85;
        }

        .manage-button {
          width: 100%;
          min-height: 48px;
          border: none;
          border-radius: 16px;
          background: linear-gradient(135deg, #0f172a, #1d4ed8);
          color: #ffffff;
          font-size: 0.96rem;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 18px 30px rgba(29, 78, 216, 0.24);
        }

        .feedback-box {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.6rem;
          padding: 2rem;
          border-radius: 26px;
          text-align: center;
        }

        .feedback-box strong {
          color: #0f172a;
          font-size: 1.1rem;
        }

        .feedback-box span {
          color: #475569;
          line-height: 1.8;
        }

        .feedback-box button {
          margin-top: 0.35rem;
          min-height: 42px;
          padding: 0.7rem 1rem;
          border: none;
          border-radius: 14px;
          background: #0f172a;
          color: #ffffff;
          font-weight: 700;
          cursor: pointer;
        }

        .error-box {
          border: 1px solid #fecaca;
          background: #fef2f2;
        }

        .empty-box {
          border: 1px dashed #cbd5e1;
          background: #f8fafc;
        }

        .skeleton-card {
          pointer-events: none;
        }

        .skeleton-block,
        .skeleton-line {
          background: linear-gradient(90deg, #e2e8f0 25%, #f8fafc 50%, #e2e8f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.3s infinite linear;
        }

        .skeleton-line {
          border-radius: 999px;
          height: 14px;
        }

        .skeleton-line.title {
          width: 58%;
          height: 18px;
          margin-bottom: 0.85rem;
        }

        .skeleton-line.subtitle {
          width: 88%;
          margin-bottom: 0.55rem;
        }

        .skeleton-line.button {
          width: 100%;
          height: 46px;
          border-radius: 16px;
          margin-top: auto;
        }

        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        @media (max-width: 980px) {
          .hero {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .featured-order-page {
            padding: 1rem;
          }

          .hero-copy,
          .hero-stats {
            border-radius: 22px;
          }

          .hero-copy {
            padding: 1.3rem;
          }
        }
      `}</style>
    </div>
  );
}
