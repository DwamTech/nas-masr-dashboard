'use client';

import { useState, useEffect } from 'react';
import { fetchBanners, updateBanner, getBannerDisplayName } from '@/services/banners';
import type { Banner } from '@/models/banners';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export default function BannersManagementClient() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
      const response = await fetchBanners(token);

      if (response.success && Array.isArray(response.data)) {
        setBanners(response.data);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'تعذر جلب البانرات';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setSelectedFile(null);
    setPreviewUrl(banner.banner_url);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingBanner(null);
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveBanner = async () => {
    if (!editingBanner || !selectedFile) {
      showToast('الرجاء اختيار صورة', 'warning');
      return;
    }

    try {
      setUploading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;

      const response = await updateBanner(editingBanner.slug, selectedFile, token);

      if (response.success) {
        // Update local state
        setBanners(prev => prev.map(b =>
          b.slug === editingBanner.slug
            ? { ...b, banner_url: response.data?.banner_url || null }
            : b
        ));

        showToast('تم تحديث البانر بنجاح', 'success');
        handleCloseEditModal();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'تعذر تحديث البانر';
      showToast(msg, 'error');
    } finally {
      setUploading(false);
    }
  };

  // Separate banners into main banners and category banners
  const mainBanners = banners.filter(b => b.slug === 'home' || b.slug === 'home_ads');
  const categoryBanners = banners.filter(b => b.slug !== 'home' && b.slug !== 'home_ads');

  return (
    <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', direction: 'rtl' }}>
      <style jsx>{`
        .page-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 3rem 2rem;
          border-radius: 16px;
          margin-bottom: 3rem;
          text-align: center;
          color: white;
          box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
        }
        
        .page-title {
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
          text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .page-subtitle {
          font-size: 1.1rem;
          opacity: 0.95;
        }
        
        .section-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 0.75rem;
          border-bottom: 3px solid #667eea;
        }
        
        .section-icon {
          font-size: 2rem;
        }
        
        .section-title {
          font-size: 1.75rem;
          font-weight: bold;
          color: #2c3e50;
        }
        
        .section {
          margin-bottom: 3rem;
        }
        
        .main-banners-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
          margin-bottom: 3rem;
        }
        
        @media (max-width: 768px) {
          .main-banners-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .category-banners-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }
        
        @media (max-width: 1200px) {
          .category-banners-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        @media (max-width: 900px) {
          .category-banners-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 600px) {
          .category-banners-grid {
            grid-template-columns: 1fr;
          }
        }
        
        .banner-card {
          background: white;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          padding: 1.5rem;
          transition: all 0.3s;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        
        .banner-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #667eea, #764ba2);
          transform: scaleX(0);
          transition: transform 0.3s;
        }
        
        .banner-card:hover::before {
          transform: scaleX(1);
        }
        
        .banner-card:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          transform: translateY(-4px);
          border-color: #667eea;
        }
        
        .banner-name {
          font-size: 1.1rem;
          font-weight: bold;
          color: #2c3e50;
          margin-bottom: 1rem;
          text-align: center;
        }
        
        .banner-preview {
          width: 100%;
          height: 150px;
          background: #f8f9fa;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          overflow: hidden;
          position: relative;
        }
        
        .banner-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .banner-placeholder {
          color: #95a5a6;
          font-size: 3rem;
        }
        
        .banner-status {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.95);
        }
        
        .status-active {
          color: #27ae60;
        }
        
        .status-empty {
          color: #e74c3c;
        }
        
        .btn-change {
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
        
        .btn-change:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }
        
        .btn-change:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          backdrop-filter: blur(4px);
        }
        
        .modal {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: modalSlideIn 0.3s ease-out;
        }
        
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .modal-header {
          padding: 1.5rem 2rem;
          border-bottom: 2px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 16px 16px 0 0;
        }
        
        .modal-title {
          font-size: 1.5rem;
          font-weight: bold;
        }
        
        .btn-close {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }
        
        .btn-close:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }
        
        .modal-body {
          padding: 2rem;
        }
        
        .form-group {
          margin-bottom: 1.5rem;
        }
        
        .form-label {
          display: block;
          margin-bottom: 0.75rem;
          font-weight: 600;
          color: #2c3e50;
          font-size: 1.1rem;
        }
        
        .file-input-wrapper {
          position: relative;
          overflow: hidden;
          display: inline-block;
          width: 100%;
        }
        
        .file-input {
          position: absolute;
          left: 0;
          top: 0;
          opacity: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }
        
        .file-input-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          padding: 1rem;
          background: #f8f9fa;
          border: 2px dashed #95a5a6;
          border-radius: 8px;
          color: #2c3e50;
          font-weight: 600;
          transition: all 0.3s;
          cursor: pointer;
        }
        
        .file-input-button:hover {
          background: #ecf0f1;
          border-color: #667eea;
          color: #667eea;
        }
        
        .preview-container {
          margin-top: 1.5rem;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 12px;
        }
        
        .preview-label {
          font-size: 0.9rem;
          color: #7f8c8d;
          margin-bottom: 1rem;
          text-align: center;
          font-weight: 600;
        }
        
        .preview-image-wrapper {
          width: 100%;
          max-height: 300px;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .preview-image-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .modal-footer {
          padding: 1.5rem 2rem;
          border-top: 2px solid #e0e0e0;
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }
        
        .btn {
          padding: 0.75rem 2rem;
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
          min-width: 250px;
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
          font-size: 1.1rem;
        }
        
        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #7f8c8d;
          font-size: 1.1rem;
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

      {/* Hero Section */}
      <div className="page-header">
        <h1 className="page-title">🎨 إدارة بنارات التطبيق</h1>
        <p className="page-subtitle">
          إدارة وتحديث البانرات الإعلانية للصفحة الرئيسية والأقسام المختلفة
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="loading-spinner">
          <p>جاري التحميل...</p>
        </div>
      )}

      {/* Main Content */}
      {!loading && (
        <>
          {/* Main Banners Section */}
          {mainBanners.length > 0 && (
            <div className="section">
              <div className="section-header">
                <span className="section-icon">🏠</span>
                <h2 className="section-title">البانرات الرئيسية</h2>
              </div>
              <div className="main-banners-grid">
                {mainBanners.map(banner => (
                  <div key={banner.slug} className="banner-card">
                    <div className="banner-name">
                      {getBannerDisplayName(banner.slug)}
                    </div>
                    <div className="banner-preview">
                      {banner.banner_url ? (
                        <>
                          <img
                            src={banner.banner_url}
                            alt={getBannerDisplayName(banner.slug)}
                          />
                          <span className="banner-status status-active">
                            ✓ مفعل
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="banner-placeholder">🖼️</span>
                          <span className="banner-status status-empty">
                            ⚠ غير مفعل
                          </span>
                        </>
                      )}
                    </div>
                    <button
                      className="btn-change"
                      onClick={() => handleOpenEditModal(banner)}
                      disabled={uploading}
                    >
                      تغيير البانر
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category Banners Section */}
          {categoryBanners.length > 0 && (
            <div className="section">
              <div className="section-header">
                <span className="section-icon">📂</span>
                <h2 className="section-title">بانرات الأقسام</h2>
              </div>
              <div className="category-banners-grid">
                {categoryBanners.map(banner => (
                  <div key={banner.slug} className="banner-card">
                    <div className="banner-name">
                      {getBannerDisplayName(banner.slug)}
                    </div>
                    <div className="banner-preview">
                      {banner.banner_url ? (
                        <>
                          <img
                            src={banner.banner_url}
                            alt={getBannerDisplayName(banner.slug)}
                          />
                          <span className="banner-status status-active">
                            ✓
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="banner-placeholder">🖼️</span>
                          <span className="banner-status status-empty">
                            ⚠
                          </span>
                        </>
                      )}
                    </div>
                    <button
                      className="btn-change"
                      onClick={() => handleOpenEditModal(banner)}
                      disabled={uploading}
                    >
                      تغيير
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {mainBanners.length === 0 && categoryBanners.length === 0 && (
            <div className="empty-state">
              <p>لا توجد بانرات متاحة</p>
            </div>
          )}
        </>
      )}

      {/* Edit Modal */}
      {showEditModal && editingBanner && (
        <div className="modal-overlay" onClick={handleCloseEditModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                تحديث: {getBannerDisplayName(editingBanner.slug)}
              </h2>
              <button className="btn-close" onClick={handleCloseEditModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">اختر صورة البانر</label>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    className="file-input"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <div className="file-input-button">
                    <span>📁</span>
                    <span>{selectedFile ? selectedFile.name : 'اختر صورة'}</span>
                  </div>
                </div>
              </div>

              {/* Preview */}
              {previewUrl && (
                <div className="preview-container">
                  <div className="preview-label">
                    {selectedFile ? '🎨 معاينة الصورة الجديدة' : '🖼️ البانر الحالي'}
                  </div>
                  <div className="preview-image-wrapper">
                    <img src={previewUrl} alt="Preview" />
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={handleCloseEditModal}
                disabled={uploading}
              >
                إلغاء
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveBanner}
                disabled={uploading || !selectedFile}
              >
                {uploading ? 'جاري الرفع...' : 'حفظ التعديلات'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
