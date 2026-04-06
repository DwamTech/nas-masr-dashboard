'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useFocusReturn } from '@/hooks/useFocusReturn';
import type {
  FeaturedAdvertiserListItem,
  FeaturedAdvertiserSection,
} from '@/models/featuredAdvertisers';
import {
  fetchFeaturedAdvertisersBySection,
  reorderFeaturedAdvertisersInSection,
} from '@/services/featuredAdvertisers';
import { resolveBackendAssetUrl } from '@/utils/api';

interface FeaturedAdvertisersRankModalProps {
  isOpen: boolean;
  section: FeaturedAdvertiserSection | null;
  onClose: () => void;
}

export default function FeaturedAdvertisersRankModal({
  isOpen,
  section,
  onClose,
}: FeaturedAdvertisersRankModalProps) {
  const [advertisers, setAdvertisers] = useState<FeaturedAdvertiserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [draggedAdvertiserId, setDraggedAdvertiserId] = useState<number | null>(null);
  const [dragOverAdvertiserId, setDragOverAdvertiserId] = useState<number | null>(null);
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen);
  useFocusReturn(isOpen);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const loadAdvertisers = useCallback(async () => {
    if (!section) return;

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);
      const response = await fetchFeaturedAdvertisersBySection(section.slug);
      setAdvertisers(response.advertisers);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'تعذر تحميل معلني القسم');
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    if (!isOpen || !section) return;
    void loadAdvertisers();
  }, [isOpen, section, loadAdvertisers]);

  useEffect(() => {
    if (!isOpen) {
      setDraggedAdvertiserId(null);
      setDragOverAdvertiserId(null);
    }
  }, [isOpen]);

  const closeModal = useCallback(() => {
    setIsClosing(true);
    window.setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 180);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeModal();
      }
    };

    document.addEventListener('keydown', onEscape);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', onEscape);
    };
  }, [isOpen, closeModal]);

  const moveAdvertiser = useCallback(
    async (sourceId: number, targetId: number) => {
      if (!section || sourceId === targetId || saving) return;

      const sourceIndex = advertisers.findIndex((advertiser) => advertiser.id === sourceId);
      const targetIndex = advertisers.findIndex((advertiser) => advertiser.id === targetId);

      if (sourceIndex === -1 || targetIndex === -1) return;

      const previousAdvertisers = advertisers;
      const reorderedAdvertisers = [...advertisers];
      const [movedAdvertiser] = reorderedAdvertisers.splice(sourceIndex, 1);
      reorderedAdvertisers.splice(targetIndex, 0, movedAdvertiser);

      setAdvertisers(reorderedAdvertisers);
      setDraggedAdvertiserId(null);
      setDragOverAdvertiserId(null);

      try {
        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        await reorderFeaturedAdvertisersInSection(
          section.slug,
          reorderedAdvertisers.map((advertiser) => advertiser.id)
        );

        setSuccessMessage('تم حفظ الترتيب الجديد بنجاح.');
      } catch (saveError) {
        setAdvertisers(previousAdvertisers);
        setError(saveError instanceof Error ? saveError.message : 'تعذر حفظ الترتيب');
      } finally {
        setSaving(false);
      }
    },
    [advertisers, saving, section]
  );

  const moveAdvertiserByOffset = useCallback(
    async (advertiserId: number, direction: 'up' | 'down') => {
      const currentIndex = advertisers.findIndex((advertiser) => advertiser.id === advertiserId);
      if (currentIndex === -1) return;

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= advertisers.length) return;

      await moveAdvertiser(advertiserId, advertisers[targetIndex].id);
    },
    [advertisers, moveAdvertiser]
  );

  const renderAdvertiser = useCallback(
    (advertiser: FeaturedAdvertiserListItem, position: number) => {
      const imageSrc = resolveBackendAssetUrl(advertiser.profile_image_url) || '/user.png';
      const visibleListingsLabel = advertiser.has_visible_listings_in_section
        ? `${advertiser.current_section_visible_listings_count} إعلان ظاهر في هذا القسم`
        : 'لا توجد إعلانات ظاهرة في هذا القسم';

      return (
        <div
          style={{
            width: '100%',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 16px 30px rgba(15, 23, 42, 0.08)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.9rem',
              padding: '1rem',
              minWidth: 0,
            }}
          >
            <img
              src={imageSrc}
              alt={advertiser.name}
              style={{
                width: '58px',
                height: '58px',
                minWidth: '58px',
                borderRadius: '18px',
                objectFit: 'cover',
                background: '#e2e8f0',
                border: '1px solid #cbd5e1',
                display: 'block',
                flexShrink: 0,
              }}
            />
            <div
              style={{
                minWidth: 0,
                flex: 1,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  marginBottom: '0.4rem',
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    color: '#0f172a',
                    fontSize: '1rem',
                    fontWeight: 800,
                    lineHeight: 1.5,
                  }}
                >
                  {advertiser.name}
                </span>
                <span
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: '999px',
                    background: '#dbeafe',
                    color: '#1d4ed8',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    lineHeight: 1.2,
                  }}
                >
                  #{position}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.55rem 0.9rem',
                  color: '#475569',
                  fontSize: '0.9rem',
                  lineHeight: 1.7,
                }}
              >
                <span>{advertiser.phone || `ID: ${advertiser.user_id}`}</span>
                <span
                  style={{
                    color: advertiser.has_visible_listings_in_section ? '#0f766e' : '#b45309',
                    fontWeight: 700,
                  }}
                >
                  {visibleListingsLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      );
    },
    []
  );

  if (!isOpen || !section || !isMounted) return null;

  const modalContent = (
    <div
      className={`modal-backdrop ${isClosing ? 'closing' : ''}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 4000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(15, 23, 42, 0.58)',
        backdropFilter: 'blur(8px)',
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
    >
      <div
        ref={modalRef}
        className={`modal-shell ${isClosing ? 'closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="featured-advertisers-rank-title"
        style={{
          width: 'min(100%, 860px)',
          maxHeight: 'min(92vh, 900px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid rgba(148, 163, 184, 0.22)',
          borderRadius: '28px',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
          boxShadow: '0 32px 80px rgba(15, 23, 42, 0.28)',
        }}
      >
        <div
          className="modal-header"
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '1rem',
            padding: '1.5rem 1.5rem 1rem',
            borderBottom: '1px solid #e2e8f0',
            background:
              'radial-gradient(circle at top right, rgba(14, 165, 233, 0.12), transparent 35%), linear-gradient(180deg, #ffffff, #f8fafc)',
          }}
        >
          <div>
            <h2
              id="featured-advertisers-rank-title"
              style={{
                margin: '0 0 0.35rem',
                color: '#0f172a',
                fontSize: '1.6rem',
                fontWeight: 800,
              }}
            >
              إدارة ترتيب معلني قسم {section.name}
            </h2>
            <p
              style={{
                margin: 0,
                color: '#475569',
                lineHeight: 1.8,
                fontSize: '0.95rem',
              }}
            >
              اسحب المعلنين لأعلى أو لأسفل لإعادة ترتيب ظهورهم داخل هذا القسم فقط.
            </p>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={closeModal}
            aria-label="إغلاق النافذة"
            style={{
              flexShrink: 0,
              width: '44px',
              height: '44px',
              border: '1px solid #dbeafe',
              borderRadius: '14px',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '1.6rem',
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        {successMessage && (
          <div
            className="message success"
            style={{
              margin: '1rem 1.5rem 0',
              padding: '0.9rem 1rem',
              borderRadius: '16px',
              fontSize: '0.95rem',
              border: '1px solid #a7f3d0',
              background: '#ecfdf5',
              color: '#065f46',
            }}
          >
            {successMessage}
          </div>
        )}
        {error && (
          <div
            className="message error"
            style={{
              margin: '1rem 1.5rem 0',
              padding: '0.9rem 1rem',
              borderRadius: '16px',
              fontSize: '0.95rem',
              border: '1px solid #fecaca',
              background: '#fef2f2',
              color: '#991b1b',
            }}
          >
            {error}
          </div>
        )}

        <div
          className="modal-body"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.25rem 1.5rem 1.5rem',
            minHeight: 0,
          }}
        >
          {loading ? (
            <div
              className="state-box"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                padding: '1rem 1.1rem',
                borderRadius: '18px',
                marginBottom: '1rem',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '180px',
                border: '1px dashed #cbd5e1',
                background: '#f8fafc',
                textAlign: 'center',
                color: '#475569',
              }}
            >
              جاري تحميل المعلنين المميزين...
            </div>
          ) : advertisers.length === 0 ? (
            <div
              className="state-box empty"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                padding: '1rem 1.1rem',
                borderRadius: '18px',
                marginBottom: '1rem',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '180px',
                border: '1px dashed #cbd5e1',
                background: '#f8fafc',
                textAlign: 'center',
                color: '#475569',
              }}
            >
              <strong>لا يوجد معلنون مميزون في هذا القسم حاليًا.</strong>
              <span>يمكنك إضافة معلنين مميزين من صفحة المستخدمين ثم العودة لإدارة الترتيب.</span>
            </div>
          ) : (
            <>
              <div
                className="info-box"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                  padding: '1rem 1.1rem',
                  borderRadius: '18px',
                  marginBottom: '1rem',
                  border: '1px solid #bae6fd',
                  background: '#f0f9ff',
                  color: '#0c4a6e',
                }}
              >
                <strong>{advertisers.length} معلن مميز</strong>
                <span>يمكنك السحب والإفلات على الكمبيوتر، أو استخدام أزرار التحريك كحل بديل سريع.</span>
              </div>
              <div
                className="sortable-list"
                role="list"
                aria-label="قائمة المعلنين القابلة لإعادة الترتيب"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
              >
                {advertisers.map((advertiser, index) => {
                  const isDragging = draggedAdvertiserId === advertiser.id;
                  const isDragOver = dragOverAdvertiserId === advertiser.id && draggedAdvertiserId !== advertiser.id;

                  return (
                    <div
                      key={advertiser.id}
                      role="listitem"
                      className={`sortable-row ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '52px minmax(0, 1fr) 52px',
                        alignItems: 'stretch',
                        gap: '0.75rem',
                        padding: '0.3rem',
                        borderRadius: '24px',
                        border: isDragOver ? '1px solid #93c5fd' : '1px solid transparent',
                        transition: 'background 0.16s ease, border-color 0.16s ease, transform 0.16s ease',
                        background: isDragOver ? 'rgba(219, 234, 254, 0.55)' : 'transparent',
                        transform: isDragOver ? 'scale(0.995)' : 'none',
                        opacity: isDragging ? 0.65 : 1,
                      }}
                      draggable={!saving}
                      onDragStart={() => {
                        setDraggedAdvertiserId(advertiser.id);
                        setDragOverAdvertiserId(advertiser.id);
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        if (dragOverAdvertiserId !== advertiser.id) {
                          setDragOverAdvertiserId(advertiser.id);
                        }
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        void moveAdvertiser(draggedAdvertiserId ?? advertiser.id, advertiser.id);
                      }}
                      onDragEnd={() => {
                        setDraggedAdvertiserId(null);
                        setDragOverAdvertiserId(null);
                      }}
                    >
                      <button
                        type="button"
                        className="drag-handle-button"
                        aria-label={`اسحب ${advertiser.name} لإعادة الترتيب`}
                        disabled={saving}
                        style={{
                          border: '1px solid #dbeafe',
                          borderRadius: '16px',
                          background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
                          color: '#0f172a',
                          fontSize: '1.15rem',
                          fontWeight: 700,
                          cursor: saving ? 'not-allowed' : 'grab',
                          minHeight: '100%',
                          opacity: saving ? 0.6 : 1,
                        }}
                      >
                        ⋮⋮
                      </button>

                      <div className="sortable-content" style={{ minWidth: 0 }}>
                        {renderAdvertiser(advertiser, index + 1)}
                      </div>

                      <div
                        className="move-buttons"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.45rem',
                        }}
                      >
                        <button
                          type="button"
                          className="move-button"
                          onClick={() => void moveAdvertiserByOffset(advertiser.id, 'up')}
                          disabled={saving || index === 0}
                          aria-label={`تحريك ${advertiser.name} لأعلى`}
                          style={{
                            minHeight: '48px',
                            border: '1px solid #dbeafe',
                            borderRadius: '16px',
                            background: '#ffffff',
                            color: '#0f172a',
                            fontSize: '1.15rem',
                            fontWeight: 700,
                            cursor: saving || index === 0 ? 'not-allowed' : 'pointer',
                            opacity: saving || index === 0 ? 0.6 : 1,
                          }}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="move-button"
                          onClick={() => void moveAdvertiserByOffset(advertiser.id, 'down')}
                          disabled={saving || index === advertisers.length - 1}
                          aria-label={`تحريك ${advertiser.name} لأسفل`}
                          style={{
                            minHeight: '48px',
                            border: '1px solid #dbeafe',
                            borderRadius: '16px',
                            background: '#ffffff',
                            color: '#0f172a',
                            fontSize: '1.15rem',
                            fontWeight: 700,
                            cursor: saving || index === advertisers.length - 1 ? 'not-allowed' : 'pointer',
                            opacity: saving || index === advertisers.length - 1 ? 0.6 : 1,
                          }}
                        >
                          ↓
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div
          className="modal-footer"
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            padding: '1rem 1.5rem 1.5rem',
            borderTop: '1px solid #e2e8f0',
            background: '#ffffff',
          }}
        >
          <button
            type="button"
            className="secondary-button"
            onClick={loadAdvertisers}
            disabled={loading || saving}
            style={{
              minHeight: '44px',
              padding: '0.75rem 1.2rem',
              borderRadius: '14px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#0f172a',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: loading || saving ? 'not-allowed' : 'pointer',
              opacity: loading || saving ? 0.6 : 1,
            }}
          >
            إعادة التحميل
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={closeModal}
            disabled={saving}
            style={{
              minHeight: '44px',
              padding: '0.75rem 1.2rem',
              borderRadius: '14px',
              border: '1px solid transparent',
              background: '#0f172a',
              color: '#ffffff',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'جاري الحفظ...' : 'إغلاق'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
