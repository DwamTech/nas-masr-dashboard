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
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3500);
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
                if (Array.isArray(bannersData)) {
                    setBanners(bannersData);
                }
                if (Array.isArray(categoriesData)) {
                    setCategories(categoriesData);
                }
            })
            .catch((err) => {
                const msg = err instanceof Error ? err.message : 'تعذر جلب البيانات';
                showToast(msg, 'error');
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const handleOpenAddModal = () => {
        setAddForm({
            category_id: categories[0]?.id || 0,
            banner_image: null,
            is_active: true,
            display_order: 0
        });
        setShowAddModal(true);
    };

    const handleCloseAddModal = () => {
        setShowAddModal(false);
        setAddForm({
            category_id: 0,
            banner_image: null,
            is_active: true,
            display_order: 0
        });
    };

    const handleAddBanner = async () => {
        if (!addForm.banner_image) {
            showToast('يرجى اختيار صورة البانر', 'warning');
            return;
        }

        if (!addForm.category_id) {
            showToast('يرجى اختيار القسم', 'warning');
            return;
        }

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
            handleCloseAddModal();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'تعذر إضافة البانر';
            showToast(msg, 'error');
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

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setEditingBanner(null);
        setEditForm({
            category_id: 0,
            banner_image: null,
            is_active: true,
            display_order: 0
        });
    };

    const handleEditBanner = async () => {
        if (!editingBanner) return;

        try {
            setUploadingBanner(true);
            const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;

            const updateData: any = {};

            if (editForm.category_id !== editingBanner.category_id) {
                updateData.category_id = editForm.category_id;
            }

            if (editForm.banner_image) {
                updateData.banner_image = editForm.banner_image;
            }

            updateData.is_active = editForm.is_active;
            updateData.display_order = editForm.display_order;

            const updated = await updateCategoryBanner(editingBanner.id, updateData, token);

            setBanners(prev => prev.map(b => b.id === updated.id ? updated : b));
            showToast('تم تحديث البانر بنجاح', 'success');
            handleCloseEditModal();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'تعذر تحديث البانر';
            showToast(msg, 'error');
        } finally {
            setUploadingBanner(false);
        }
    };

    const handleOpenDeleteConfirm = (banner: CategoryBanner) => {
        setDeletingBanner(banner);
        setShowDeleteConfirm(true);
    };

    const handleCloseDeleteConfirm = () => {
        setShowDeleteConfirm(false);
        setDeletingBanner(null);
    };

    const handleDeleteBanner = async () => {
        if (!deletingBanner) return;

        try {
            setUploadingBanner(true);
            const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;

            await deleteCategoryBanner(deletingBanner.id, token);

            setBanners(prev => prev.filter(b => b.id !== deletingBanner.id));
            showToast('تم حذف البانر بنجاح', 'success');
            handleCloseDeleteConfirm();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'تعذر حذف البانر';
            showToast(msg, 'error');
        } finally {
            setUploadingBanner(false);
        }
    };

    const getCategoryName = (categoryId: number): string => {
        const category = categories.find(c => c.id === categoryId);
        return category?.name || 'غير معروف';
    };

    const filteredBanners = banners.filter(banner => {
        const categoryName = getCategoryName(banner.category_id);
        const searchLower = searchTerm.toLowerCase();
        return categoryName.toLowerCase().includes(searchLower) ||
            banner.category_slug?.toLowerCase().includes(searchLower);
    });

    // سنكمل في الجزء التالي...
    return (
        <div style={{ padding: '2rem', fontFamily: 'Arial, sans-serif', direction: 'rtl' }}>
            {/* سنضيف المحتوى في الملف التالي */}
        </div>
    );
}
