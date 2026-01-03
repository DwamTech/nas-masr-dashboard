'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { fetchAdminCategories, fetchCategoryHomepage, updateCategoryHomepage } from '@/services/makes';
import type { AdminCategoryListItem, CategoryHomepageItem } from '@/models/makes';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export default function CategoryHomepageManagementClient() {
  const [categories, setCategories] = useState<AdminCategoryListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryHomepageItem | null>(null);
  const [editForm, setEditForm] = useState({ name: '', icon: null as File | null });
  const [uploadingIcon, setUploadingIcon] = useState(false);

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const getImageSrc = (raw: string | undefined): string | null => {
    const s = String(raw || '').trim();
    if (!s) return null;
    const clean = s.replace(/[\s]/g, '').replace(/^`+|`+$/g, '');
    let u = clean;

    if (/^data:image\/(png|jpe?g|webp);base64,/i.test(u)) return u;
    const isAbs = /^https?:\/\//i.test(u);
    const isRel = u.startsWith('/');
    const looksFile = /\.(png|jpe?g|webp)$/i.test(u);

    if (!isAbs && !isRel && (u.startsWith('defaults/') || looksFile)) {
      u = '/' + u.replace(/^\.?\/?/, '');
    }

    if (u.startsWith('/defaults/')) {
      u = `https://api.nasmasr.app/storage${u}`;
    } else if (u.startsWith('/')) {
      u = `https://api.nasmasr.app${u}`;
    }

    try {
      new URL(u);
      return u;
    } catch {
      return null;
    }
  };

  // دالة للتحقق إذا كانت الأيقونة emoji أم URL صورة
  const isIconEmoji = (icon: string | undefined): boolean => {
    if (!icon) return false;
    const trimmed = icon.trim();
    // إذا كانت تحتوي على نقطة أو سلاش أو بروتوكول، فهي على الأرجح URL
    if (trimmed.includes('.') || trimmed.includes('/') || trimmed.startsWith('http')) {
      return false;
    }
    // إذا كانت قصيرة جداً (1-3 أحرف) فهي على الأرجح emoji
    return trimmed.length <= 3;
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;

    fetchAdminCategories(token)
      .then((list) => {
        if (Array.isArray(list) && list.length) {
          const sorted = [...list].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
          setCategories(sorted);
        }
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'تعذر جلب الأقسام';
        showToast(msg, 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleOpenEditModal = async (category: AdminCategoryListItem) => {
    try {
      setUploadingIcon(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
      const details = await fetchCategoryHomepage(category.id, token);

      setEditingCategory(details);
      setEditForm({
        name: details.name,
        icon: null
      });
      setShowEditModal(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'تعذر جلب بيانات القسم';
      showToast(msg, 'error');
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingCategory(null);
    setEditForm({ name: '', icon: null });
  };

  const handleSaveEdit = async () => {
    if (!editingCategory) return;

    try {
      setUploadingIcon(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;

      const updateData: { name?: string; icon?: File | null } = {};

      if (editForm.name.trim() && editForm.name.trim() !== editingCategory.name) {
        updateData.name = editForm.name.trim();
      }

      if (editForm.icon) {
        updateData.icon = editForm.icon;
      }

      if (Object.keys(updateData).length === 0) {
        showToast('لا توجد تغييرات للحفظ', 'info');
        return;
      }

      const updated = await updateCategoryHomepage(editingCategory.id, updateData, token);

      // Update local state
      setCategories(prev => prev.map(cat => {
        if (cat.id === updated.id) {
          return {
            ...cat,
            name: updated.name,
            icon: updated.icon_url
          };
        }
        return cat;
      }));

      showToast('تم تحديث القسم بنجاح', 'success');
      handleCloseEditModal();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'تعذر تحديث القسم';
      showToast(msg, 'error');
    } finally {
      setUploadingIcon(false);
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', direction: 'rtl' }}>
      <style jsx>{`
        .page-header {
          margin-bottom: 2rem;
        }
        
        .page-title {
          font-size: 2rem;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 0.5rem;
        }
        
        .page-subtitle {
          color: #7f8c8d;
          font-size: 1rem;
        }
        
        .search-container {
          margin-bottom: 2rem;
        }
        
        .search-input {
          width: 100%;
          max-width: 500px;
          padding: 0.75rem 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s;
        }
        
        .search-input:focus {
          outline: none;
          border-color: #3498db;
        }
        
        .categories-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        
        .category-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.3s;
          cursor: pointer;
        }
        
        .category-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }
        
        .category-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .category-icon {
          font-size: 2.5rem;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8f9fa;
          border-radius: 10px;
        }
        
        .category-icon img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 10px;
        }
        
        .category-info {
          flex: 1;
        }
        
        .category-name {
          font-size: 1.25rem;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 0.25rem;
        }
        
        .category-slug {
          font-size: 0.875rem;
          color: #95a5a6;
        }
        
        .category-actions {
          margin-top: 1rem;
        }
        
        .btn-manage {
          width: 100%;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .btn-manage:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .btn-manage:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        
        .modal {
          background: white;
          border-radius: 12px;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }
        
        .modal-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .modal-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: #2c3e50;
        }
        
        .btn-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #95a5a6;
          transition: color 0.3s;
        }
        
        .btn-close:hover {
          color: #e74c3c;
        }
        
        .modal-body {
          padding: 1.5rem;
        }
        
        .form-group {
          margin-bottom: 1.5rem;
        }
        
        .form-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #2c3e50;
        }
        
        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s;
        }
        
        .form-input:focus {
          outline: none;
          border-color: #3498db;
        }
        
        .icon-preview {
          margin-top: 1rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          text-align: center;
        }
        
        .icon-preview-label {
          font-size: 0.875rem;
          color: #7f8c8d;
          margin-bottom: 0.5rem;
        }
        
        .icon-preview-image {
          width: 80px;
          height: 80px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .icon-preview-image img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }
        
        .modal-footer {
          padding: 1.5rem;
          border-top: 1px solid #e0e0e0;
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }
        
        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .btn-secondary {
          background: #ecf0f1;
          color: #2c3e50;
        }
        
        .btn-secondary:hover {
          background: #d5dbdb;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .toast-container {
          position: fixed;
          top: 1rem;
          right: 1rem;
          z-index: 2000;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .toast {
          padding: 1rem 1.5rem;
          border-radius: 8px;
          color: white;
          font-weight: 500;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .toast-success {
          background: #27ae60;
        }
        
        .toast-error {
          background: #e74c3c;
        }
        
        .toast-info {
          background: #3498db;
        }
        
        .toast-warning {
          background: #f39c12;
        }
        
        .loading-spinner {
          text-align: center;
          padding: 3rem;
          color: #7f8c8d;
        }
        
        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #7f8c8d;
        }
      `}</style>

      {/* Toast Notifications */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>

      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">إدارة أقسام الصفحة الرئيسية</h1>
        <p className="page-subtitle">
          إدارة بيانات الأقسام المعروضة في الصفحة الرئيسية (الاسم والأيقونة)
        </p>
      </div>

      {/* Search */}
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 ابحث عن قسم..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-spinner">
          <p>جاري التحميل...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredCategories.length === 0 && (
        <div className="empty-state">
          <p>لا توجد أقسام متاحة</p>
        </div>
      )}

      {/* Categories Grid */}
      {!loading && filteredCategories.length > 0 && (
        <div className="categories-grid">
          {filteredCategories.map(category => (
            <div key={category.id} className="category-card">
              <div className="category-header">
                <div className="category-icon">
                  {/* أولاً: نحاول عرض صورة القسم (homepage_image) */}
                  {category.homepage_image && getImageSrc(category.homepage_image) ? (
                    <img
                      src={getImageSrc(category.homepage_image)!}
                      alt={category.name}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        // إذا فشلت الصورة، نعرض الأيقونة أو emoji
                        if (category.icon) {
                          e.currentTarget.parentElement!.textContent = category.icon;
                        } else {
                          e.currentTarget.parentElement!.textContent = '📦';
                        }
                      }}
                    />
                  ) : category.icon && isIconEmoji(category.icon) ? (
                    <span>{category.icon}</span>
                  ) : category.icon && getImageSrc(category.icon) ? (
                    <img
                      src={getImageSrc(category.icon)!}
                      alt={category.name}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.textContent = '📦';
                      }}
                    />
                  ) : (
                    <span>📦</span>
                  )}
                </div>
                <div className="category-info">
                  <div className="category-name">{category.name}</div>
                  {category.slug && (
                    <div className="category-slug">{category.slug}</div>
                  )}
                </div>
              </div>
              <div className="category-actions">
                <button
                  className="btn-manage"
                  onClick={() => handleOpenEditModal(category)}
                  disabled={uploadingIcon}
                >
                  إدارة بيانات القسم
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingCategory && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">تعديل بيانات القسم</h2>
              <button className="btn-close" onClick={handleCloseEditModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              {/* اسم القسم */}
              <div className="form-group">
                <label className="form-label">اسم القسم</label>
                <input
                  type="text"
                  className="form-input"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="أدخل اسم القسم"
                />
              </div>

              {/* أيقونة القسم */}
              <div className="form-group">
                <label className="form-label">أيقونة القسم</label>
                <input
                  type="file"
                  className="form-input"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setEditForm(prev => ({ ...prev, icon: file }));
                    }
                  }}
                />

                {/* Preview */}
                {(editForm.icon || editingCategory.icon_url) && (
                  <div className="icon-preview">
                    <div className="icon-preview-label">
                      {editForm.icon ? 'الأيقونة الجديدة' : 'الأيقونة الحالية'}
                    </div>
                    <div className="icon-preview-image">
                      {editForm.icon ? (
                        <img
                          src={URL.createObjectURL(editForm.icon)}
                          alt="Preview"
                        />
                      ) : editingCategory.icon_url && isIconEmoji(editingCategory.icon_url) ? (
                        <span style={{ fontSize: '3rem' }}>{editingCategory.icon_url}</span>
                      ) : editingCategory.icon_url && getImageSrc(editingCategory.icon_url) ? (
                        <img
                          src={getImageSrc(editingCategory.icon_url)!}
                          alt={editingCategory.name}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={handleCloseEditModal}
                disabled={uploadingIcon}
              >
                إلغاء
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveEdit}
                disabled={uploadingIcon}
              >
                {uploadingIcon ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
