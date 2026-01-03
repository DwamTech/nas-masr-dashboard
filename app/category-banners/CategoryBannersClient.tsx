'use client';

import { useState, useEffect } from 'react';
import {
    fetchAdminCategories,
    fetchCategoryBanners,
    createCategoryBanner,
    updateCategoryBanner,
    deleteCategoryBanner
} from '@/services/makes';
import type { AdminCategoryListItem, CategoryBanner } from '@/models/makes';

interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}

export default function CategoryBannersManagementClient() {
    const [banners, setBanners] = useState<CategoryBanner[]>([]);
    const [categories, setCategories] = useState<AdminCategoryListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [editingBanner, setEditingBanner] = useState<CategoryBanner | null>(null);
    const [deletingBanner, setDeletingBanner] = useState<CategoryBanner | null>(null);
    const [uploadingBanner, setUploadingBanner] = useState(false);

    const [addForm, setAddForm] = useState({
        category_id: 0,
        banner_image: null as File | null,
        is_active: true,
        display_order: 0
    });

    const [editForm, setEditForm] = useState({
        category_id: 0,
        banner_image: null as File | null,
        is_active: true,
        display_order: 0
    });

    const showToast = (message: string, type: Toast['type'] = 'info') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    };

    const getImageSrc = (raw: string | undefined): string | null => {
        const s = String(raw || '').trim();
        if (!s) return null;
        if (/^https?:\/\//i.test(s)) return s;
        if (s.startsWith('/')) return `https://api.nasmasr.app${s}`;
        return `https://api.nasmasr.app/${s}`;
    };

    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;

        Promise.all([
            fetchCategoryBanners(token),
            fetchAdminCategories(token)
        ])
            .then(([bannersData, categoriesData]) => {
                if (Array.isArray(bannersData)) setBanners(bannersData);
                if (Array.isArray(categoriesData)) setCategories(categoriesData);
            })
            .catch((err) => showToast(err instanceof Error ? err.message : 'تعذر جلب البيانات', 'error'))
            .finally(() => setLoading(false));
    }, []);

    const handleOpenAddModal = () => {
        setAddForm({ category_id: categories[0]?.id || 0, banner_image: null, is_active: true, display_order: 0 });
        setShowAddModal(true);
    };

    const handleAddBanner = async () => {
        if (!addForm.banner_image) return showToast('يرجى اختيار صورة البانر', 'warning');
        if (!addForm.category_id) return showToast('يرجى اختيار القسم', 'warning');

        try {
            setUploadingBanner(true);
            const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
            const newBanner = await createCategoryBanner({
                category_id: addForm.category_id,
                banner_image: addForm.banner_image,
                is_active: addForm.is_active,
                display_order: addForm.display_order
            }, token);
            setBanners(prev => [...prev, newBanner]);
            showToast('تم إضافة البانر بنجاح', 'success');
            setShowAddModal(false);
            setAddForm({ category_id: 0, banner_image: null, is_active: true, display_order: 0 });
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'تعذر إضافة البانر', 'error');
        } finally {
            setUploadingBanner(false);
        }
    };

    const handleOpenEditModal = (banner: CategoryBanner) => {
        setEditingBanner(banner);
        setEditForm({
            category_id: banner.category_id,
            banner_image: null,
            is_active: typeof banner.is_active === 'boolean' ? banner.is_active : banner.is_active === 1,
            display_order: banner.display_order || 0
        });
        setShowEditModal(true);
    };

    const handleEditBanner = async () => {
        if (!editingBanner) return;
        try {
            setUploadingBanner(true);
            const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;

            const updateData: any = {
                category_id: editForm.category_id,
                is_active: editForm.is_active,
                display_order: editForm.display_order
            };

            if (editForm.banner_image) {
                updateData.banner_image = editForm.banner_image;
            }

            const updated = await updateCategoryBanner(editingBanner.id, updateData, token);
            setBanners(prev => prev.map(b => b.id === updated.id ? updated : b));
            showToast('تم تحديث البانر بنجاح', 'success');
            setShowEditModal(false);
            setEditingBanner(null);
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'تعذر تحديث البانر', 'error');
        } finally {
            setUploadingBanner(false);
        }
    };

    const handleDeleteBanner = async () => {
        if (!deletingBanner) return;
        try {
            setUploadingBanner(true);
            const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
            await deleteCategoryBanner(deletingBanner.id, token);
            setBanners(prev => prev.filter(b => b.id !== deletingBanner.id));
            showToast('تم حذف البانر بنجاح', 'success');
            setShowDeleteConfirm(false);
            setDeletingBanner(null);
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'تعذر حذف البانر', 'error');
        } finally {
            setUploadingBanner(false);
        }
    };

    const getCategoryName = (categoryId: number): string => {
        return categories.find(c => c.id === categoryId)?.name || 'غير معروف';
    };

    const filteredBanners = banners.filter(banner => {
        const categoryName = getCategoryName(banner.category_id);
        const searchLower = searchTerm.toLowerCase();
        return categoryName.toLowerCase().includes(searchLower) || banner.category_slug?.toLowerCase().includes(searchLower);
    });

    return (
        <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', direction: 'rtl' }}>
            <style jsx>{`
        /* نفس الـ styles من صفحة إدارة الأقسام */
        .page-title { font-size: 2rem; font-weight: bold; color: #2c3e50; margin-bottom: 0.5rem; }
        .page-subtitle { color: #7f8c8d; font-size: 1rem; margin-bottom: 2rem; }
        .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
        .search-input { padding: 0.75rem 1rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; flex: 1; min-width: 250px; }
        .btn-add { padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #27ae60 0%, #219653 100%); color: white; border: none; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; }
        .btn-add:hover { transform: scale(1.02); box-shadow: 0 4px 12px rgba(39, 174, 96, 0.4); }
        .banners-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; }
        .banner-card { background: white; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; transition: all 0.3s; }
        .banner-card:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); transform: translateY(-2px); }
        .banner-image { width: 100%; height: 200px; object-fit: cover; }
        .banner-info { padding: 1rem; }
        .banner-category { font-weight: 600; color: #2c3e50; margin-bottom: 0.5rem; }
        .banner-meta { font-size: 0.875rem; color: #7f8c8d; margin-bottom: 0.5rem; }
        .banner-actions { display: flex; gap: 0.5rem; padding: 1rem; border-top: 1px solid #e0e0e0; }
        .btn { padding: 0.5rem 1rem; border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 600; cursor: pointer; flex: 1; }
        .btn-edit { background: #3498db; color: white; }
        .btn-delete { background: #e74c3c; color: white; }
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
        .modal { background: white; border-radius: 12px; width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
        .modal-header { padding: 1.5rem; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; }
        .modal-title { font-size: 1.5rem; font-weight: bold; color: #2c3e50; }
        .btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #95a5a6; }
        .modal-body { padding: 1.5rem; }
        .form-group { margin-bottom: 1.5rem; }
        .form-label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #2c3e50; }
        .form-input, .form-select { width: 100%; padding: 0.75rem; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 1rem; }
        .form-checkbox { width: auto; margin-left: 0.5rem; }
        .preview-image { width: 100%; max-height: 200px; object-fit: contain; margin-top: 1rem; border-radius: 8px; }
        .modal-footer { padding: 1.5rem; border-top: 1px solid #e0e0e0; display: flex; gap: 1rem; justify-content: flex-end; }
        .btn-secondary { background: #ecf0f1; color: #2c3e50; }
        .btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
        .btn-danger { background: #e74c3c; color: white; }
        .toast-container { position: fixed; top: 1rem; right: 1rem; z-index: 2000; display: flex; flex-direction: column; gap: 0.5rem; }
        .toast { padding: 1rem 1.5rem; border-radius: 8px; color: white; font-weight: 500; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
        .toast-success { background: #27ae60; }
        .toast-error { background: #e74c3c; }
        .toast-info { background: #3498db; }
        .toast-warning { background: #f39c12; }
        .loading-spinner, .empty-state { text-align: center; padding: 3rem; color: #7f8c8d; }
      `}</style>

            {/* Toast Notifications */}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast toast-${toast.type}`}>{toast.message}</div>
                ))}
            </div>

            {/* Page Header */}
            <h1 className="page-title">إدارة بنرات الأقسام</h1>
            <p className="page-subtitle">إضافة وتعديل وحذف بنرات الأقسام المختلفة</p>

            {/* Top Bar */}
            <div className="top-bar">
                <input
                    type="text"
                    className="search-input"
                    placeholder="🔍 ابحث عن بانر..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="btn-add" onClick={handleOpenAddModal}>
                    ➕ إضافة بانر جديد
                </button>
            </div>

            {/* Loading State */}
            {loading && <div className="loading-spinner"><p>جاري التحميل...</p></div>}

            {/* Empty State */}
            {!loading && filteredBanners.length === 0 && (
                <div className="empty-state"><p>لا توجد بنرات متاحة</p></div>
            )}

            {/* Banners Grid */}
            {!loading && filteredBanners.length > 0 && (
                <div className="banners-grid">
                    {filteredBanners.map(banner => (
                        <div key={banner.id} className="banner-card">
                            {getImageSrc(banner.banner_url) && (
                                <img src={getImageSrc(banner.banner_url)!} alt={getCategoryName(banner.category_id)} className="banner-image" />
                            )}
                            <div className="banner-info">
                                <div className="banner-category">{getCategoryName(banner.category_id)}</div>
                                <div className="banner-meta">الترتيب: {banner.display_order || 0}</div>
                                <div className="banner-meta">الحالة: {banner.is_active ? '✅ نشط' : '❌ غير نشط'}</div>
                            </div>
                            <div className="banner-actions">
                                <button className="btn btn-edit" onClick={() => handleOpenEditModal(banner)}>✏️ تعديل</button>
                                <button className="btn btn-delete" onClick={() => { setDeletingBanner(banner); setShowDeleteConfirm(true); }}>🗑️ حذف</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">إضافة بانر جديد</h2>
                            <button className="btn-close" onClick={() => setShowAddModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">القسم</label>
                                <select className="form-select" value={addForm.category_id} onChange={(e) => setAddForm(prev => ({ ...prev, category_id: parseInt(e.target.value) }))}>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">صورة البانر</label>
                                <input type="file" className="form-input" accept="image/*" onChange={(e) => setAddForm(prev => ({ ...prev, banner_image: e.target.files?.[0] || null }))} />
                                {addForm.banner_image && <img src={URL.createObjectURL(addForm.banner_image)} alt="Preview" className="preview-image" />}
                            </div>
                            <div className="form-group">
                                <label className="form-label">ترتيب العرض</label>
                                <input type="number" className="form-input" value={addForm.display_order} onChange={(e) => setAddForm(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    <input type="checkbox" className="form-checkbox" checked={addForm.is_active} onChange={(e) => setAddForm(prev => ({ ...prev, is_active: e.target.checked }))} />
                                    نشط
                                </label>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)} disabled={uploadingBanner}>إلغاء</button>
                            <button className="btn btn-primary" onClick={handleAddBanner} disabled={uploadingBanner}>
                                {uploadingBanner ? 'جاري الإضافة...' : 'إضافة'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editingBanner && (
                <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">تعديل البانر</h2>
                            <button className="btn-close" onClick={() => setShowEditModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">القسم</label>
                                <select className="form-select" value={editForm.category_id} onChange={(e) => setEditForm(prev => ({ ...prev, category_id: parseInt(e.target.value) }))}>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">صورة البانر الجديدة (اختياري)</label>
                                <input type="file" className="form-input" accept="image/*" onChange={(e) => setEditForm(prev => ({ ...prev, banner_image: e.target.files?.[0] || null }))} />
                                {editForm.banner_image ? (
                                    <img src={URL.createObjectURL(editForm.banner_image)} alt="Preview" className="preview-image" />
                                ) : editingBanner.banner_url ? (
                                    <img src={getImageSrc(editingBanner.banner_url)!} alt="Current" className="preview-image" />
                                ) : null}
                            </div>
                            <div className="form-group">
                                <label className="form-label">ترتيب العرض</label>
                                <input type="number" className="form-input" value={editForm.display_order} onChange={(e) => setEditForm(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">
                                    <input type="checkbox" className="form-checkbox" checked={editForm.is_active} onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.checked }))} />
                                    نشط
                                </label>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowEditModal(false)} disabled={uploadingBanner}>إلغاء</button>
                            <button className="btn btn-primary" onClick={handleEditBanner} disabled={uploadingBanner}>
                                {uploadingBanner ? 'جاري التحديث...' : 'تحديث'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && deletingBanner && (
                <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2 className="modal-title">تأكيد الحذف</h2>
                            <button className="btn-close" onClick={() => setShowDeleteConfirm(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p>هل أنت متأكد من حذف بانر "{getCategoryName(deletingBanner.category_id)}"؟</p>
                            <p style={{ color: '#e74c3c', fontSize: '0.875rem' }}>هذا الإجراء لا يمكن التراجع عنه.</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)} disabled={uploadingBanner}>إلغاء</button>
                            <button className="btn btn-danger" onClick={handleDeleteBanner} disabled={uploadingBanner}>
                                {uploadingBanner ? 'جاري الحذف...' : 'حذف'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
