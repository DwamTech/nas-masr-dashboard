'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { fetchCarMakes, fetchCategoryFields, fetchCategoryFieldMaps, fetchCategoryMainSubsBatch, postAdminGovernorates, updateCategoryFieldOptions, fetchAdminMakesWithIds, postAdminMake, postAdminMakeModels, postAdminMainSection, postAdminSubSections, fetchAdminMainSectionsBatch, fetchAdminMainSections, deleteAdminMainSection, deleteAdminSubSection, fetchAdminSubSections, fetchPublicSubSections, updateAdminMake, deleteAdminMake, updateAdminModel, deleteAdminModel, fetchMakeModels, updateAdminMainSection, updateAdminSubSection, fetchAdminCategories, updateAdminCategoryActive, updateAdminCategoryImage, deleteAdminCategoryImage } from '@/services/makes';
import { fetchGovernorates, fetchGovernorateById, fetchCitiesMappings, createGovernorate, updateGovernorate, deleteGovernorate, createCity, updateCity, deleteCity } from '@/services/governorates';
import { fetchSystemSettings, updateSystemSettings, updatePublicSystemSettingsImage } from '@/services/systemSettings';
import { processOptions, processOptionsMap, processHierarchicalOptions } from '@/utils/optionsHelper';
import type { SystemSettingsData } from '@/models/system-settings';
import type { AdminMainSectionRecord, AdminSubSectionRecord, AdminCategoryListItem } from '@/models/makes';
import { DraggableOptionsList } from '@/components/DraggableOptions';
import { updateOptionRanksWithRetry } from '@/services/optionRanks';
import '@/components/DraggableOptions/styles.css';

interface Category {
  id: number;
  name: string;
  slug?: string;
  icon: string;
  status: 'active' | 'disabled';
  order: number;
  // يدعم إما قيمة نوع بسيطة أو كائن مع خيارات للحقل
  customFields: { [key: string]: string | { type: string; options?: string[] } };
  showOnHomepage: boolean;
  homepageImage?: string;
  cardsCount?: number;
}

const initialCategories: Category[] = [
  { id: 1, name: 'إيجار السيارات', icon: '🚗', status: 'active', order: 1, customFields: { 'نوع السيارة': 'text', 'السعر اليومي': 'number' }, showOnHomepage: true, cardsCount: 6 },
  { id: 2, name: 'عقارات', icon: '🏠', status: 'active', order: 2, customFields: { 'نوع العقار': 'select', 'المساحة': 'number', 'السعر': 'number' }, showOnHomepage: true, cardsCount: 8 },
  { id: 3, name: 'السيارات', icon: '🚙', status: 'active', order: 3, customFields: {}, showOnHomepage: true, cardsCount: 10 },
  { id: 4, name: 'قطع غيار السيارات', icon: '🔧', status: 'active', order: 4, customFields: { 'نوع القطعة': 'text', 'متوافق مع': 'text' }, showOnHomepage: false },
  { id: 36, name: 'طيور وحيوانات', icon: '🐾', status: 'active', order: 5, customFields: {}, showOnHomepage: false },
  { id: 5, name: 'المدرسين', icon: '👨‍🏫', status: 'active', order: 6, customFields: { 'التخصص': 'select', 'المؤهل العلمي': 'select', 'سنوات الخبرة': 'number' }, showOnHomepage: true, cardsCount: 4 },
  { id: 6, name: 'أطباء', icon: '👨‍⚕️', status: 'active', order: 7, customFields: { 'التخصص': 'select', 'الدرجة العلمية': 'select', 'العيادة': 'text' }, showOnHomepage: true, cardsCount: 6 },
  { id: 7, name: 'الوظائف', icon: '💼', status: 'active', order: 8, customFields: { 'نوع العقد': 'select', 'الراتب': 'number', 'المؤهل المطلوب': 'select' }, showOnHomepage: true, cardsCount: 12 },
  { id: 8, name: 'منتجات غذائية', icon: '🍎', status: 'active', order: 9, customFields: { 'نوع المنتج': 'text', 'تاريخ الانتهاء': 'date' }, showOnHomepage: false },
  { id: 9, name: 'المطاعم', icon: '🍕', status: 'active', order: 10, customFields: { 'نوع المطبخ': 'select', 'التقييم': 'number' }, showOnHomepage: true, cardsCount: 8 },
  { id: 10, name: 'المتاجر والمولات', icon: '🏬', status: 'active', order: 11, customFields: { 'نوع المتجر': 'text', 'المنطقة': 'text' }, showOnHomepage: false },
  { id: 11, name: 'محلات غذائية', icon: '🍎', status: 'active', order: 12, customFields: { 'نوع المحل': 'text', 'ساعات العمل': 'text' }, showOnHomepage: true, cardsCount: 6 },
  { id: 12, name: 'خدمات وصيانة المنازل', icon: '🔨', status: 'active', order: 13, customFields: { 'نوع الخدمة': 'select', 'المنطقة': 'text' }, showOnHomepage: true, cardsCount: 8 },
  { id: 13, name: 'الأثاث', icon: '🚛', status: 'active', order: 14, customFields: { 'نوع الأثاث': 'text', 'الحالة': 'select' }, showOnHomepage: true, cardsCount: 6 },
  { id: 14, name: 'أدوات منزلية', icon: '🏠', status: 'active', order: 15, customFields: { 'نوع الأداة': 'text', 'الحالة': 'select' }, showOnHomepage: false },
  { id: 15, name: 'الأجهزة المنزلية', icon: '📺', status: 'active', order: 16, customFields: { 'نوع الجهاز': 'text', 'الماركة': 'text' }, showOnHomepage: true, cardsCount: 8 },
  { id: 16, name: 'إلكترونيات', icon: '💻', status: 'active', order: 17, customFields: { 'نوع الجهاز': 'text', 'الماركة': 'text' }, showOnHomepage: true, cardsCount: 10 },
  { id: 17, name: 'الصحة', icon: '⚕️', status: 'active', order: 18, customFields: { 'نوع الخدمة': 'select', 'التخصص': 'text' }, showOnHomepage: true, cardsCount: 6 },
  { id: 18, name: 'التعليم', icon: '📚', status: 'active', order: 19, customFields: { 'المرحلة التعليمية': 'select', 'المادة': 'text' }, showOnHomepage: true, cardsCount: 8 },
  { id: 19, name: 'الشحن والتوصيل', icon: '🚚', status: 'active', order: 20, customFields: { 'نوع الشحن': 'select', 'المنطقة': 'text' }, showOnHomepage: false },
  { id: 20, name: 'الملابس الرجالية والأحذية', icon: '👔', status: 'active', order: 21, customFields: { 'نوع المنتج': 'text', 'المقاس': 'text' }, showOnHomepage: true, cardsCount: 6 },
  { id: 21, name: 'نقل ومعدات ثقيلة', icon: '🚛', status: 'active', order: 22, customFields: { 'نوع المعدة': 'text', 'الحمولة': 'number' }, showOnHomepage: false },
  { id: 22, name: 'مستلزمات ولعب أطفال', icon: '🎈', status: 'active', order: 23, customFields: { 'العمر المناسب': 'text', 'نوع المنتج': 'text' }, showOnHomepage: true, cardsCount: 8 },
  { id: 23, name: 'المهن الحرة والخدمات', icon: '💼', status: 'active', order: 24, customFields: { 'نوع المهنة': 'text', 'سنوات الخبرة': 'number' }, showOnHomepage: true, cardsCount: 6 },
  { id: 24, name: 'الساعات والمجوهرات', icon: '⌚', status: 'active', order: 25, customFields: { 'نوع المنتج': 'text', 'الماركة': 'text' }, showOnHomepage: false },
  { id: 25, name: 'خدمات وصيانة السيارات', icon: '🔧', status: 'active', order: 26, customFields: { 'نوع الخدمة': 'select', 'نوع السيارة': 'text' }, showOnHomepage: true, cardsCount: 6 },
  { id: 26, name: 'الصيانة العامة', icon: '⚙️', status: 'active', order: 27, customFields: { 'نوع الصيانة': 'text', 'المنطقة': 'text' }, showOnHomepage: false },
  { id: 27, name: 'أدوات البناء', icon: '⚒️', status: 'active', order: 28, customFields: { 'نوع الأداة': 'text', 'الحالة': 'select' }, showOnHomepage: false },
  { id: 28, name: 'جيمات', icon: '💪', status: 'active', order: 29, customFields: { 'نوع العضوية': 'select', 'المنطقة': 'text' }, showOnHomepage: true, cardsCount: 4 },
  { id: 29, name: 'دراجات ومركبات خفيفة', icon: '🚲', status: 'active', order: 30, customFields: { 'نوع المركبة': 'text', 'الحالة': 'select' }, showOnHomepage: false },
  { id: 30, name: 'مواد وخطوط إنتاج', icon: '🏭', status: 'active', order: 31, customFields: { 'نوع المادة': 'text', 'الكمية': 'number' }, showOnHomepage: false },
  { id: 31, name: 'منتجات مزارع ومصانع', icon: '🌾', status: 'active', order: 32, customFields: { 'نوع المنتج': 'text', 'مصدر الإنتاج': 'text' }, showOnHomepage: true, cardsCount: 6 },
  { id: 32, name: 'الإضاءة والديكور', icon: '💡', status: 'active', order: 33, customFields: { 'نوع المنتج': 'text', 'الطراز': 'text' }, showOnHomepage: true, cardsCount: 8 },
  { id: 33, name: 'مفقودين', icon: '🔍', status: 'active', order: 34, customFields: { 'نوع المفقود': 'select', 'تاريخ الفقدان': 'date' }, showOnHomepage: false },
  { id: 34, name: 'عدد ومستلزمات', icon: '🔨', status: 'active', order: 35, customFields: { 'نوع العدة': 'text', 'الاستخدام': 'text' }, showOnHomepage: false },
  { id: 35, name: 'بيع الجملة', icon: '📦', status: 'active', order: 36, customFields: { 'نوع المنتج': 'text', 'الحد الأدنى للطلب': 'number' }, showOnHomepage: true, cardsCount: 10 },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<'management' | 'homepage'>('management');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [managingCategoryId, setManagingCategoryId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showUnifiedImagesModal, setShowUnifiedImagesModal] = useState(false);
  interface Toast { id: string; message: string; type: 'success' | 'error' | 'info' | 'warning'; }
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); }, 3500);
  };
  const removeToast = (id: string) => { setToasts(prev => prev.filter(t => t.id !== id)); };
  const updateOptionsWithToast = (
    slug: string,
    field: string | undefined,
    options: string[],
    success?: string
  ) => {
    const name = field?.trim();
    if (!name) return Promise.resolve();
    return updateCategoryFieldOptions(slug, name, options)
      .then(() => { if (success) showToast(success, 'success'); })
      .catch((err) => {
        const msg = getErrMsg(err, 'حدث خطأ في تحديث البيانات');
        showToast(msg, 'error');
      });
  };
  const [selectedGovernorate, setSelectedGovernorate] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [systemSettings, setSystemSettings] = useState<SystemSettingsData | null>(null);
  const [unifiedImagesSettings, setUnifiedImagesSettings] = useState<SystemSettingsData | null>(null);
  const [unifiedImagesLoading, setUnifiedImagesLoading] = useState(false);
  const [unifiedImagesError, setUnifiedImagesError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [defaultImagePreview, setDefaultImagePreview] = useState<Record<string, string>>({});
  const [BRANDS_MODELS, setBRANDS_MODELS] = useState<Record<string, string[]>>({});
  const [MAKE_IDS, setMAKE_IDS] = useState<Record<string, number>>({});
  const [MODEL_IDS_BY_BRAND, setMODEL_IDS_BY_BRAND] = useState<Record<string, Record<string, number>>>({});
  const [RENTAL_BRANDS_MODELS, setRENTAL_BRANDS_MODELS] = useState<Record<string, string[]>>({});
  const [PARTS_BRANDS_MODELS, setPARTS_BRANDS_MODELS] = useState<Record<string, string[]>>({});
  const getImageSrc = (raw: string | undefined): string | null => {
    const s = String(raw || '').trim();
    if (!s) return null;
    const clean = s.replace(/[\s]/g, '').replace(/^`+|`+$/g, '');
    let u = clean;
    if (/^data:image\/(png|jpe?g|webp);base64,/i.test(u)) return u;
    const isAbs = /^https?:\/\//i.test(u);
    const isRel = u.startsWith('/');
    const looksFile = /\.(png|jpe?g|webp)$/i.test(u);
    if (!isAbs && !isRel && (u.startsWith('defaults/') || looksFile)) u = '/' + u.replace(/^\.?\/?/, '');
    if (u.startsWith('/defaults/')) u = `https://back.nasmasr.app/storage${u}`;
    else if (u.startsWith('/')) u = `https://back.nasmasr.app${u}`;
    try { new URL(u); return u; } catch { return null; }
  };
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
    const mapToUi = (it: AdminCategoryListItem): Category => {
      const fieldsArr = Array.isArray(it.fields) ? it.fields : [];
      const fieldsObj: { [key: string]: string | { type: string; options?: string[] } } = {};
      for (const f of fieldsArr) {
        const n = String(f.field_name || '').trim();
        if (!n) continue;
        const opts = Array.isArray(f.options) ? f.options : [];
        if (opts.length) fieldsObj[n] = { type: 'select', options: opts };
        else fieldsObj[n] = 'text';
      }
      return {
        id: it.id,
        name: it.name,
        slug: it.slug,
        icon: (it.slug && {
          'cars': '🚙',
          'real_estate': '🏠',
          'spare-parts': '🔧',
          'animals': '🐾',
          'teachers': '👨‍🏫',
          'doctors': '👨‍⚕️',
          'jobs': '💼',
          'food-products': '🍎',
          'restaurants': '🍕',
          'stores': '🏬',
          'groceries': '🍎',
          'home-services': '🔨',
          'furniture': '🚛',
          'home-tools': '🏠',
          'home-appliances': '📺',
          'electronics': '💻',
          'health': '⚕️',
          'education': '📚',
          'shipping': '🚚',
          'mens-clothes': '👔',
          'heavy-transport': '🚛',
          'kids-toys': '🎈',
          'free-professions': '💼',
          'watches-jewelry': '⌚',
          'car-services': '🔧',
          'maintenance': '⚙️',
          'construction': '⚒️',
          'gym': '💪',
          'light-vehicles': '🚲',
          'production-lines': '🏭',
          'farm-products': '🌾',
          'lighting-decor': '💡',
          'missing': '🔍',
          'tools': '🔨',
          'wholesale': '📦',
        }[it.slug]) || '📦',
        status: it.is_active ? 'active' : 'disabled',
        order: typeof it.sort_order === 'number' ? it.sort_order : it.id,
        customFields: fieldsObj,
        showOnHomepage: !!it.is_active,
        homepageImage: it.homepage_image,
        cardsCount: it.cards_count,
      };
    };
    fetchAdminCategories(token)
      .then((list) => {
        if (Array.isArray(list) && list.length) {
          const mapped = list.map(mapToUi);
          setCategories(mapped);
        }
      })
      .catch(() => { });
    fetchSystemSettings(token)
      .then((data) => {
        if (data && data.data) {
          setSystemSettings(data.data);
        }
      })
      .catch(() => { });
  }, []);
  const getErrMsg = (err: unknown, fallback: string): string => {
    if (typeof err === 'string') return err;
    if (err instanceof Error && typeof err.message === 'string') return err.message;
    if (err && typeof err === 'object') {
      const o = err as Record<string, unknown>;
      const m = o['message'];
      if (typeof m === 'string') return m;
      const e = o['error'];
      if (typeof e === 'string') return e;
    }
    return fallback;
  };

  const openUnifiedImagesModal = () => {
    setShowUnifiedImagesModal(true);
    setUnifiedImagesError(null);
    setUnifiedImagesSettings(null);
    setUnifiedImagesLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
    fetchSystemSettings(token)
      .then((res) => {
        const out = (() => {
          if (!res || typeof res !== 'object') return null;
          const o = res as Record<string, unknown>;
          const candidate = o['data'] && typeof o['data'] === 'object' ? (o['data'] as Record<string, unknown>) : o;
          if (!candidate || typeof candidate !== 'object') return null;
          return candidate as unknown as SystemSettingsData;
        })();
        if (!out) {
          setUnifiedImagesError('تعذر قراءة إعدادات النظام');
          setUnifiedImagesSettings(null);
          return;
        }
        setUnifiedImagesSettings(out);
      })
      .catch((err) => {
        setUnifiedImagesSettings(null);
        setUnifiedImagesError(getErrMsg(err, 'تعذر جلب إعدادات النظام'));
      })
      .finally(() => {
        setUnifiedImagesLoading(false);
      });
  };
  const propagateBrandDelete = (name: string) => {
    setBRANDS_MODELS(prev => { const n = { ...prev }; delete n[name]; return n; });
    setRENTAL_BRANDS_MODELS(prev => { const n = { ...prev }; delete n[name]; return n; });
    setPARTS_BRANDS_MODELS(prev => { const n = { ...prev }; delete n[name]; return n; });
    setMAKE_IDS(prev => { const rec = { ...prev }; delete rec[name]; return rec; });
    setMODEL_IDS_BY_BRAND(prev => { const rec = { ...prev }; delete rec[name]; return rec; });
    if (selectedBrand === name) { setSelectedBrand(''); setSelectedModel(''); }
    if (selectedRentalBrand === name) { setSelectedRentalBrand(''); setSelectedRentalModel(''); }
    if (selectedPartsBrand === name) { setSelectedPartsBrand(''); setSelectedPartsModel(''); }
  };
  const propagateBrandRename = (prevName: string, next: string, id?: number) => {
    setBRANDS_MODELS(prev => { if (prev[next]) return prev; const n = { ...prev }; const list = n[prevName] ?? []; delete n[prevName]; n[next] = list; return n; });
    setRENTAL_BRANDS_MODELS(prev => { if (prev[next]) return prev; const n = { ...prev }; const list = n[prevName] ?? []; delete n[prevName]; n[next] = list; return n; });
    setPARTS_BRANDS_MODELS(prev => { if (prev[next]) return prev; const n = { ...prev }; const list = n[prevName] ?? []; delete n[prevName]; n[next] = list; return n; });
    setMAKE_IDS(prev => { const rec = { ...prev }; const currId = rec[prevName]; delete rec[prevName]; rec[next] = typeof currId === 'number' ? currId : (typeof id === 'number' ? id! : currId); return rec; });
    setMODEL_IDS_BY_BRAND(prev => { const rec = { ...prev }; const mrec = rec[prevName]; delete rec[prevName]; if (mrec) rec[next] = mrec; return rec; });
    if (selectedBrand === prevName) setSelectedBrand(next);
    if (selectedRentalBrand === prevName) setSelectedRentalBrand(next);
    if (selectedPartsBrand === prevName) setSelectedPartsBrand(next);
  };
  const propagateBrandAdd = (name: string, id?: number) => {
    setBRANDS_MODELS(prev => { if (prev[name]) return prev; return { ...prev, [name]: [] }; });
    setRENTAL_BRANDS_MODELS(prev => { if (prev[name]) return prev; return { ...prev, [name]: [] }; });
    setPARTS_BRANDS_MODELS(prev => { if (prev[name]) return prev; return { ...prev, [name]: [] }; });
    if (typeof id === 'number') setMAKE_IDS(prev => ({ ...prev, [name]: id! }));
  };
  const propagateModelsAdded = (brand: string, names: string[], idMap?: Record<string, number>) => {
    const addTo = (prev: Record<string, string[]>) => { const existing = prev[brand] ?? []; const toAdd = names.filter(m => !existing.includes(m)); if (toAdd.length === 0) return prev; return { ...prev, [brand]: processOptions([...existing, ...toAdd]) }; };
    setBRANDS_MODELS(prev => addTo(prev));
    setRENTAL_BRANDS_MODELS(prev => addTo(prev));
    setPARTS_BRANDS_MODELS(prev => addTo(prev));
    if (idMap && Object.keys(idMap).length) setMODEL_IDS_BY_BRAND(prev => ({ ...prev, [brand]: { ...(prev[brand] ?? {}), ...idMap } }));
  };
  const propagateModelDelete = (brand: string, m: string) => {
    const removeFrom = (prev: Record<string, string[]>) => { const list = prev[brand] ?? []; return { ...prev, [brand]: list.filter(x => x !== m) }; };
    setBRANDS_MODELS(prev => removeFrom(prev));
    setRENTAL_BRANDS_MODELS(prev => removeFrom(prev));
    setPARTS_BRANDS_MODELS(prev => removeFrom(prev));
    setMODEL_IDS_BY_BRAND(prev => { const rec = { ...(prev[brand] ?? {}) }; delete rec[m]; return { ...prev, [brand]: rec }; });
    if (selectedModel === m) setSelectedModel('');
    if (selectedRentalModel === m) setSelectedRentalModel('');
    if (selectedPartsModel === m) setSelectedPartsModel('');
  };
  const propagateModelRename = (brand: string, prevName: string, next: string) => {
    const renameIn = (prev: Record<string, string[]>) => { const list = prev[brand] ?? []; if (list.includes(next)) return prev; const updated = list.map(x => (x === prevName ? next : x)); return { ...prev, [brand]: updated }; };
    setBRANDS_MODELS(prev => renameIn(prev));
    setRENTAL_BRANDS_MODELS(prev => renameIn(prev));
    setPARTS_BRANDS_MODELS(prev => renameIn(prev));
    setMODEL_IDS_BY_BRAND(prev => { const rec = { ...(prev[brand] ?? {}) }; const id = rec[prevName]; delete rec[prevName]; if (typeof id === 'number') rec[next] = id; return { ...prev, [brand]: rec }; });
    if (selectedModel === prevName) setSelectedModel(next);
    if (selectedRentalModel === prevName) setSelectedRentalModel(next);
    if (selectedPartsModel === prevName) setSelectedPartsModel(next);
  };
  const [MAIN_IDS_BY_SLUG, setMAIN_IDS_BY_SLUG] = useState<Record<string, Record<string, number>>>({});
  const [SUB_IDS_BY_SLUG, setSUB_IDS_BY_SLUG] = useState<Record<string, Record<string, Record<string, number>>>>({});
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newModelsBulk, setNewModelsBulk] = useState('');
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
    Promise.all([
      fetchCarMakes(token),
      fetchAdminMakesWithIds(token).catch(() => []),
    ])
      .then(([d, adminList]) => {
        const map: Record<string, string[]> = {};
        for (const it of d.makes) {
          if (it && typeof it.name === 'string') {
            map[it.name] = Array.isArray(it.models) ? it.models : [];
          }
        }
        // البيانات جاية مرتبة من الباك إند - لا حاجة لإعادة الترتيب
        setBRANDS_MODELS(map);
        setRENTAL_BRANDS_MODELS(map);
        setPARTS_BRANDS_MODELS(map);
        const ids: Record<string, number> = {};
        const modelIds: Record<string, Record<string, number>> = {};
        for (const it of adminList) {
          if (it && typeof it.name === 'string' && typeof it.id === 'number') {
            ids[it.name] = it.id;
            if (it.model_objects && Array.isArray(it.model_objects)) {
              const mRec: Record<string, number> = {};
              for (const m of it.model_objects) {
                if (m.name && m.id) mRec[m.name] = m.id;
              }
              modelIds[it.name] = mRec;
            }
          }
        }
        setMAKE_IDS(ids);
        setMODEL_IDS_BY_BRAND(modelIds);
      })
      .catch(() => { });
  }, []);

  const ensureMakeId = async (name: string): Promise<number | null> => {
    const n = String(name || '').trim();
    if (!n) return null;
    const existing = MAKE_IDS[n];
    if (typeof existing === 'number') return existing;
    try {
      const created = await postAdminMake(n);
      setMAKE_IDS(prev => ({ ...prev, [created.name]: created.id }));
      return created.id;
    } catch (err) {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
        const list = await fetchAdminMakesWithIds(token).catch(() => []);
        const found = (list as { id: number; name: string }[]).find(it => String(it?.name || '').trim() === n);
        if (found && typeof found.id === 'number') {
          setMAKE_IDS(prev => ({ ...prev, [found.name]: found.id }));
          return found.id;
        }
      } catch { }
      const msg = getErrMsg(err, 'حدث خطأ في الحصول على الماركة');
      showToast(msg, 'error');
      return null;
    }
  };
  const ensureMainSectionId = async (slug: string, name: string): Promise<number | null> => {
    const n = String(name || '').trim();
    if (!n) return null;
    const existing = MAIN_IDS_BY_SLUG[slug]?.[n];
    if (typeof existing === 'number') return existing;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
      const arr = await fetchAdminMainSections(slug, token);
      const found = arr.find(it => String(it?.name || '').trim() === n);
      if (found && typeof found.id === 'number') {
        setMAIN_IDS_BY_SLUG(prev => ({ ...prev, [slug]: { ...(prev[slug] ?? {}), [found.name]: found.id } }));
        return found.id;
      }
    } catch { }
    showToast('تعذر الحصول على معرف الرئيسي', 'error');
    return null;
  };
  const handleAddMain = async (
    slug: string,
    name: string,
    setMap: (updater: (prev: Record<string, string[]>) => Record<string, string[]>) => void,
    setSelected: (v: string) => void,
    clearInput: () => void,
  ) => {
    const v = String(name || '').trim();
    if (!v) return;
    try {
      const created = await postAdminMainSection(slug, v);
      setMap(prev => {
        if (prev[created.name]) return prev;
        return { ...prev, [created.name]: [] };
      });
      setMAIN_IDS_BY_SLUG(prev => ({ ...prev, [slug]: { ...(prev[slug] ?? {}), [created.name]: created.id } }));
      setSelected(created.name);
      clearInput();
      showToast('تم إضافة الرئيسي', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في إضافة الرئيسي');
      showToast(msg, 'error');
    }
  };
  const handleAddSubsBulk = async (
    slug: string,
    selectedMain: string,
    tokens: string[],
    setMap: (updater: (prev: Record<string, string[]>) => Record<string, string[]>) => void,
    setSelectedSub: (v: string) => void,
    clearBulkInput: () => void,
  ) => {
    const mainId = await ensureMainSectionId(slug, selectedMain);
    if (!mainId) return;
    const uniq = Array.from(new Set(tokens.map(x => String(x).trim()).filter(Boolean)));
    if (uniq.length === 0) return;
    try {
      const resp = await postAdminSubSections(mainId, uniq);
      const createdNames = Array.isArray(resp.sub_sections) ? resp.sub_sections.map(s => String(s.name).trim()).filter(Boolean) : uniq;
      const idMap: Record<string, number> = {};
      if (Array.isArray(resp.sub_sections)) {
        for (const s of resp.sub_sections) {
          const nm = String(s?.name || '').trim();
          const sid = typeof s?.id === 'number' ? s.id : undefined;
          if (nm && typeof sid === 'number') idMap[nm] = sid;
        }
      }
      setMap(prev => {
        const existing = prev[selectedMain] ?? [];
        const toAdd = createdNames.filter(s => !existing.includes(s));
        if (toAdd.length === 0) return prev;
        return { ...prev, [selectedMain]: processOptions([...existing, ...toAdd]) };
      });
      if (Object.keys(idMap).length) {
        setSUB_IDS_BY_SLUG(prev => ({
          ...prev,
          [slug]: { ...(prev[slug] ?? {}), [selectedMain]: { ...((prev[slug] ?? {})[selectedMain] ?? {}), ...idMap } },
        }));
      }
      setSelectedSub('');
      clearBulkInput();
      showToast('تم تسليم الفرعيات', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في إضافة الفرعيات');
      showToast(msg, 'error');
    }
  };
  const ensureSubSectionId = async (slug: string, mainName: string, subName: string): Promise<number | null> => {
    const m = String(mainName || '').trim();
    const s = String(subName || '').trim();
    if (!m || !s) return null;
    const existing = SUB_IDS_BY_SLUG[slug]?.[m]?.[s];
    if (typeof existing === 'number') return existing;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
      const arr = await fetchAdminMainSections(slug, token);
      const foundMain = arr.find(it => String(it?.name || '').trim() === m);
      const foundSub = foundMain?.sub_sections?.find(ss => String(ss?.name || '').trim() === s);
      if (foundSub && typeof foundSub.id === 'number') {
        setSUB_IDS_BY_SLUG(prev => ({
          ...prev,
          [slug]: {
            ...(prev[slug] ?? {}),
            [m]: { ...((prev[slug] ?? {})[m] ?? {}), [s]: foundSub.id },
          },
        }));
        return foundSub.id;
      }
      const mainId = typeof foundMain?.id === 'number' ? foundMain.id : await ensureMainSectionId(slug, m);
      if (typeof mainId === 'number' && mainId) {
        const list = await fetchAdminSubSections(mainId, token);
        const sub = list.find(ss => String(ss?.name || '').trim() === s);
        if (sub && typeof sub.id === 'number') {
          setSUB_IDS_BY_SLUG(prev => ({
            ...prev,
            [slug]: {
              ...(prev[slug] ?? {}),
              [m]: { ...((prev[slug] ?? {})[m] ?? {}), [s]: sub.id },
            },
          }));
          return sub.id;
        }
      }
    } catch { }
    showToast('تعذر الحصول على معرف الفرعي', 'error');
    return null;
  };
  const handleDeleteMain = async (
    slug: string,
    name: string,
    setMap: (updater: (prev: Record<string, string[]>) => Record<string, string[]>) => void,
    selected: string,
    setSelected: (v: string) => void,
  ) => {
    const id = await ensureMainSectionId(slug, name);
    if (!id) return;
    try {
      await deleteAdminMainSection(id);
      setMap(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      setMAIN_IDS_BY_SLUG(prev => {
        const rec = { ...(prev[slug] ?? {}) };
        delete rec[name];
        return { ...prev, [slug]: rec };
      });
      setSUB_IDS_BY_SLUG(prev => {
        const rec = { ...(prev[slug] ?? {}) };
        delete rec[name];
        return { ...prev, [slug]: rec };
      });
      if (selected === name) setSelected('');
      showToast('تم حذف الرئيسي', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في حذف الرئيسي');
      showToast(msg, 'error');
    }
  };
  const handleDeleteSub = async (
    slug: string,
    selectedMain: string,
    subName: string,
    setMap: (updater: (prev: Record<string, string[]>) => Record<string, string[]>) => void,
    selectedSub: string,
    setSelectedSub: (v: string) => void,
  ) => {
    const id = await ensureSubSectionId(slug, selectedMain, subName);
    if (!id) return;
    try {
      await deleteAdminSubSection(id);
      setMap(prev => {
        const list = prev[selectedMain] ?? [];
        const nextList = list.filter(x => x !== subName);
        return { ...prev, [selectedMain]: nextList };
      });
      setSUB_IDS_BY_SLUG(prev => {
        const slugRec = { ...(prev[slug] ?? {}) };
        const mainRec = { ...(slugRec[selectedMain] ?? {}) };
        delete mainRec[subName];
        slugRec[selectedMain] = mainRec;
        return { ...prev, [slug]: slugRec };
      });
      if (selectedSub === subName) setSelectedSub('');
      showToast('تم حذف الفرعي', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في حذف الفرعي');
      showToast(msg, 'error');
    }
  };
  const handleRenameMain = async (
    slug: string,
    prevName: string,
    nextRaw: string,
    setMap: (updater: (prev: Record<string, string[]>) => Record<string, string[]>) => void,
    selected: string,
    setSelected: (v: string) => void,
  ) => {
    const next = nextRaw.trim();
    if (!next || prevName === next) return;
    const id = await ensureMainSectionId(slug, prevName);
    if (!id) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
      const rec = await updateAdminMainSection(id, next, token);
      setMap(prev => {
        if (prev[next]) return prev;
        const n = { ...prev };
        const list = n[prevName] ?? [];
        delete n[prevName];
        n[rec.name] = list;
        return n;
      });
      setMAIN_IDS_BY_SLUG(prev => {
        const slugRec = { ...(prev[slug] ?? {}) };
        const currId = slugRec[prevName];
        delete slugRec[prevName];
        slugRec[rec.name] = typeof currId === 'number' ? currId : id;
        return { ...prev, [slug]: slugRec };
      });
      setSUB_IDS_BY_SLUG(prev => {
        const slugRec = { ...(prev[slug] ?? {}) };
        const curr = slugRec[prevName];
        delete slugRec[prevName];
        if (curr) slugRec[rec.name] = curr;
        return { ...prev, [slug]: slugRec };
      });
      if (selected === prevName) setSelected(rec.name);
      showToast('تم تعديل الرئيسي', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في تعديل الرئيسي');
      showToast(msg, 'error');
    }
  };
  const handleRenameSub = async (
    slug: string,
    selectedMain: string,
    prevName: string,
    nextRaw: string,
    setMap: (updater: (prev: Record<string, string[]>) => Record<string, string[]>) => void,
    selectedSub: string,
    setSelectedSub: (v: string) => void,
  ) => {
    const next = nextRaw.trim();
    if (!next || prevName === next || !selectedMain) return;
    const id = await ensureSubSectionId(slug, selectedMain, prevName);
    if (!id) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
      const rec = await updateAdminSubSection(id, next, token);
      setMap(prev => {
        const list = prev[selectedMain] ?? [];
        if (list.includes(rec.name)) return prev;
        const updated = list.map(x => (x === prevName ? rec.name : x));
        return { ...prev, [selectedMain]: updated };
      });
      setSUB_IDS_BY_SLUG(prev => {
        const slugRec = { ...(prev[slug] ?? {}) };
        const mainRec = { ...(slugRec[selectedMain] ?? {}) };
        const currId = mainRec[prevName];
        delete mainRec[prevName];
        mainRec[rec.name] = typeof currId === 'number' ? currId : id;
        slugRec[selectedMain] = mainRec;
        return { ...prev, [slug]: slugRec };
      });
      if (selectedSub === prevName) setSelectedSub(rec.name);
      showToast('تم تعديل الفرعي', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في تعديل الفرعي');
      showToast(msg, 'error');
    }
  };
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
    Promise.all([
      fetchCategoryFieldMaps([
        'cars',
        'cars_rent',
        'real_estate',
        'teachers',
        'doctors',
        'jobs',
        'spare-parts',
        'stores',
        'restaurants',
        'groceries',
        'food-products',
        'electronics',
        'home-tools',
        'furniture',
        'health',
        'education',
        'shipping',
        'mens-clothes',
        'watches-jewelry',
        'free-professions',
        'kids-toys',
        'gym',
        'construction',
        'maintenance',
        'car-services',
        'home-services',
        'lighting-decor',
        'animals',
        'farm-products',
        'wholesale',
        'production-lines',
        'light-vehicles',
        'heavy-transport',
        'tools',
        'home-appliances',
        'missing',
      ], token),
      fetchCategoryMainSubsBatch([
        'jobs',
        'spare-parts',
        'animals',
        'food-products',
        'restaurants',
        'stores',
        'groceries',
        'kids-toys',
        'home-services',
        'furniture',
        'home-tools',
        'home-appliances',
        'electronics',
        'health',
        'education',
        'shipping',
        'mens-clothes',
        'watches-jewelry',
        'free-professions',
        'car-services',
        'maintenance',
        'construction',
        'gym',
        'light-vehicles',
        'production-lines',
        'farm-products',
        'lighting-decor',
        'missing',
        'tools',
        'wholesale',
        'heavy-transport',
      ], token),
      fetchAdminMainSectionsBatch([
        'jobs', 'spare-parts', 'animals', 'food-products', 'restaurants', 'stores', 'groceries', 'kids-toys', 'home-services', 'furniture', 'home-tools', 'home-appliances', 'electronics', 'health', 'education', 'shipping', 'mens-clothes', 'watches-jewelry', 'free-professions', 'car-services', 'maintenance', 'construction', 'gym', 'light-vehicles', 'production-lines', 'farm-products', 'lighting-decor', 'missing', 'tools', 'wholesale', 'heavy-transport'
      ], token),
    ])
      .then(([maps, mainSubs, mainWithIds]) => {
        const pick = (obj: Record<string, string[]> | undefined, keys: string[]): string[] => {
          if (!obj) return [];
          for (const [k, v] of Object.entries(obj)) {
            const name = String(k || '').toLowerCase();
            if (keys.some((kw) => name.includes(kw))) return Array.isArray(v) ? v : [];
          }
          return [];
        };
        const findKey = (obj: Record<string, string[]> | undefined, keys: string[]): string => {
          if (!obj) return '';
          for (const k of Object.keys(obj)) {
            const name = String(k || '').toLowerCase();
            if (keys.some((kw) => name.includes(kw))) return k;
          }
          return '';
        };
        const buildMainSubs = (obj: Record<string, string[]> | undefined, mainKeys: string[], subKeys: string[]): Record<string, string[]> => {
          const mains = pick(obj, mainKeys);
          const subs = pick(obj, subKeys);
          const out: Record<string, string[]> = {};
          for (const m of mains) out[m] = subs;
          return out;
        };
        const cars = maps['cars'];
        const year = pick(cars, ['سنة', 'year', 'تصنيع', 'model', 'manufacture', 'production']);
        const kms = pick(cars, ['كيلو', 'كم', 'km', 'kilo', 'mileage']);
        const fuel = pick(cars, ['وقود', 'fuel', 'gas']);
        const trans = pick(cars, ['فتيس', 'ناقل', 'transmission', 'gear']);
        const exterior = pick(cars, ['خارجي', 'exterior', 'color']);
        const ctype = pick(cars, ['النوع', 'type']);
        setCarsYearKey(findKey(cars, ['سنة', 'year', 'تصنيع', 'model', 'manufacture', 'production']));
        setCarsKmKey(findKey(cars, ['كيلو', 'كم', 'km', 'kilo', 'mileage']));
        setCarsFuelKey(findKey(cars, ['وقود', 'fuel', 'gas']));
        setCarsTransmissionKey(findKey(cars, ['فتيس', 'ناقل', 'transmission', 'gear']));
        setCarsExteriorColorKey(findKey(cars, ['خارجي', 'exterior', 'color']));
        setCarsTypeKey(findKey(cars, ['النوع', 'type']));
        if (year.length) setYearOptions(processOptions(year.slice().sort((a, b) => Number(b) - Number(a))));
        if (kms.length) setKmOptions(processOptions(kms));
        if (fuel.length) setFuelOptions(processOptions(fuel));
        if (trans.length) setTransmissionOptions(processOptions(trans));
        if (exterior.length) setExteriorColorOptions(processOptions(exterior));
        if (ctype.length) setCarTypeOptions(processOptions(ctype));
        const rent = maps['cars_rent'];
        const rYear = pick(rent, ['سنة', 'year', 'تصنيع', 'model']);
        const drv = pick(rent, ['سائق', 'driver']);
        setRentalYearKey(findKey(rent, ['سنة', 'year', 'تصنيع', 'model']));
        setDriverKey(findKey(rent, ['سائق', 'driver']));
        if (rYear.length) setRentalYearOptions(processOptions(rYear.slice().sort((a, b) => Number(b) - Number(a))));
        if (drv.length) setDriverOptions(processOptions(drv));
        const real = maps['real_estate'];
        const prop = pick(real, ['نوع العقار', 'property', 'estate', 'type']);
        const contract = pick(real, ['عقد', 'contract', 'rent', 'sale']);
        setRealPropertyKey(findKey(real, ['نوع العقار', 'property', 'estate', 'type']));
        setRealContractKey(findKey(real, ['عقد', 'contract', 'rent', 'sale']));
        if (prop.length) setPropertyTypeOptions(processOptions(prop));
        if (contract.length) setContractTypeOptions(processOptions(contract));
        const t = maps['teachers'];
        const tSpec = pick(t, ['specialization', 'teacher_specialty', 'تخصص', 'specialty', 'subject']);
        const tKey = findKey(t, ['specialization', 'teacher_specialty', 'تخصص', 'specialty', 'subject']);
        setTeacherSpecialtyKey(tKey || 'specialization');
        if (tSpec.length) setTeacherSpecialtyOptions(processOptions(tSpec));
        const d = maps['doctors'];
        const dSpec = pick(d, ['specialization', 'doctor_specialty', 'تخصص', 'specialty']);
        const dKey = findKey(d, ['specialization', 'doctor_specialty', 'تخصص', 'specialty']);
        setDoctorSpecialtyKey(dKey || 'specialization');
        if (dSpec.length) setDoctorSpecialtyOptions(processOptions(dSpec));
        const j = maps['jobs'];
        const jCat = pick(j, ['job_type', 'job_category', 'category', 'فئة', 'مجال', 'قسم', 'التصنيف']);
        const jSpec = pick(j, ['specialization', 'specialty', 'تخصص', 'التخصص']);
        setJobCategoryKey(findKey(j, ['job_type', 'job_category', 'category', 'فئة', 'مجال', 'قسم', 'التصنيف']));
        setJobSpecialtyKey(findKey(j, ['specialization', 'specialty', 'تخصص', 'التخصص']));

        // التصنيف والتخصص مستقلين - لا ربط بينهم
        if (jCat.length) setJobCategoryOptions(processOptions(jCat));
        if (jSpec.length) setJobSpecialtyOptions(processOptions(jSpec));
        setPARTS_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['spare-parts'] ?? {}).length ? (mainSubs['spare-parts'] as Record<string, string[]>) : buildMainSubs(maps['spare-parts'], ['قطعة', 'part', 'نوع', 'رئيس', 'main', 'category', 'قسم'], ['compatible', 'متوافق', 'موديل', 'model', 'فرعي', 'sub', 'brand', 'ماركة'])));
        setANIMALS_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['animals'] ?? {}).length ? (mainSubs['animals'] as Record<string, string[]>) : buildMainSubs(maps['animals'], ['نوع', 'animal', 'حيوان', 'طيور', 'category'], ['سلالة', 'breed', 'sub', 'فرعي'])));
        setAnimalsMainKey(findKey(maps['animals'], ['نوع', 'animal', 'حيوان', 'طيور', 'category']));
        setAnimalsSubKey(findKey(maps['animals'], ['سلالة', 'breed', 'sub', 'فرعي']));
        setFOOD_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['food-products'] ?? {}).length ? (mainSubs['food-products'] as Record<string, string[]>) : buildMainSubs(maps['food-products'], ['نوع', 'food', 'منتج', 'category'], ['sub', 'فرعي', 'فئة', 'تصنيف'])));
        setFoodMainKey(findKey(maps['food-products'], ['نوع', 'food', 'منتج', 'category']));
        setFoodSubKey(findKey(maps['food-products'], ['sub', 'فرعي', 'فئة', 'تصنيف']));
        setRESTAURANTS_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['restaurants'] ?? {}).length ? (mainSubs['restaurants'] as Record<string, string[]>) : buildMainSubs(maps['restaurants'], ['مطبخ', 'cuisine', 'نوع', 'category'], ['sub', 'فرعي', 'قائمة', 'menu'])));
        setRestaurantsMainKey(findKey(maps['restaurants'], ['مطبخ', 'cuisine', 'نوع', 'category']));
        setRestaurantsSubKey(findKey(maps['restaurants'], ['sub', 'فرعي', 'قائمة', 'menu']));
        setSTORES_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['stores'] ?? {}).length ? (mainSubs['stores'] as Record<string, string[]>) : buildMainSubs(maps['stores'], ['نوع المتجر', 'store', 'نوع', 'category'], ['sub', 'فرعي'])));
        setStoresMainKey(findKey(maps['stores'], ['نوع المتجر', 'store', 'نوع', 'category']));
        setStoresSubKey(findKey(maps['stores'], ['sub', 'فرعي']));
        setGROCERIES_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['groceries'] ?? {}).length ? (mainSubs['groceries'] as Record<string, string[]>) : buildMainSubs(maps['groceries'], ['نوع', 'category', 'منتج'], ['sub', 'فرعي'])));
        setGroceriesMainKey(findKey(maps['groceries'], ['نوع', 'category', 'منتج']));
        setGroceriesSubKey(findKey(maps['groceries'], ['sub', 'فرعي']));
        setKIDS_SUPPLIES_TOYS_MAIN_SUBS(
          processHierarchicalOptions(Object.keys(mainSubs['kids-toys'] ?? {}).length
            ? (mainSubs['kids-toys'] as Record<string, string[]>)
            : buildMainSubs(
              maps['kids-toys'],
              ['نوع', 'category', 'لعب', 'مستلزمات', 'أطفال'],
              ['sub', 'فرعي']
            ))
        );
        setHOME_SERVICES_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['home-services'] ?? {}).length ? (mainSubs['home-services'] as Record<string, string[]>) : buildMainSubs(maps['home-services'], ['نوع الخدمة', 'service', 'نوع', 'category'], ['sub', 'فرعي'])));
        setFURNITURE_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['furniture'] ?? {}).length ? (mainSubs['furniture'] as Record<string, string[]>) : buildMainSubs(maps['furniture'], ['نوع الأثاث', 'furniture', 'نوع', 'category'], ['sub', 'فرعي', 'مادة', 'material'])));
        setHOUSEHOLD_TOOLS_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['home-tools'] ?? {}).length ? (mainSubs['home-tools'] as Record<string, string[]>) : buildMainSubs(maps['home-tools'], ['نوع الأداة', 'tool', 'نوع', 'category'], ['sub', 'فرعي'])));
        setHOME_APPLIANCES_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['home-appliances'] ?? {}).length ? (mainSubs['home-appliances'] as Record<string, string[]>) : buildMainSubs(maps['home-appliances'], ['نوع الجهاز', 'appliance', 'نوع', 'category'], ['sub', 'فرعي', 'موديل', 'model'])));
        setELECTRONICS_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['electronics'] ?? {}).length ? (mainSubs['electronics'] as Record<string, string[]>) : buildMainSubs(maps['electronics'], ['نوع الجهاز', 'device', 'نوع', 'category'], ['sub', 'فرعي', 'موديل', 'model'])));
        setHEALTH_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['health'] ?? {}).length ? (mainSubs['health'] as Record<string, string[]>) : buildMainSubs(maps['health'], ['نوع الخدمة', 'خدمة', 'category'], ['sub', 'فرعي', 'تخصص', 'specialty'])));
        setEDUCATION_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['education'] ?? {}).length ? (mainSubs['education'] as Record<string, string[]>) : buildMainSubs(maps['education'], ['مرحلة', 'المرحلة', 'education', 'category'], ['مادة', 'subject', 'sub', 'فرعي'])));
        setSHIPPING_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['shipping'] ?? {}).length ? (mainSubs['shipping'] as Record<string, string[]>) : buildMainSubs(maps['shipping'], ['نوع الشحن', 'shipping', 'نوع', 'category'], ['sub', 'فرعي'])));
        setMENS_CLOTHING_SHOES_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['mens-clothes'] ?? {}).length ? (mainSubs['mens-clothes'] as Record<string, string[]>) : buildMainSubs(maps['mens-clothes'], ['نوع المنتج', 'ملابس', 'category'], ['sub', 'فرعي', 'مقاس', 'size'])));
        setWATCHES_JEWELRY_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['watches-jewelry'] ?? {}).length ? (mainSubs['watches-jewelry'] as Record<string, string[]>) : buildMainSubs(maps['watches-jewelry'], ['نوع المنتج', 'ساعات', 'مجوهرات', 'category'], ['sub', 'فرعي'])));
        setFREELANCE_SERVICES_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['free-professions'] ?? {}).length ? (mainSubs['free-professions'] as Record<string, string[]>) : buildMainSubs(maps['free-professions'], ['نوع المهنة', 'مهن', 'category'], ['sub', 'فرعي'])));
        setCAR_SERVICES_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['car-services'] ?? {}).length ? (mainSubs['car-services'] as Record<string, string[]>) : buildMainSubs(maps['car-services'], ['نوع الخدمة', 'service', 'نوع', 'category'], ['sub', 'فرعي', 'سيارة', 'car'])));
        setGENERAL_MAINTENANCE_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['maintenance'] ?? {}).length ? (mainSubs['maintenance'] as Record<string, string[]>) : buildMainSubs(maps['maintenance'], ['نوع الصيانة', 'maintenance', 'نوع', 'category'], ['sub', 'فرعي'])));
        setCONSTRUCTION_TOOLS_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['construction'] ?? {}).length ? (mainSubs['construction'] as Record<string, string[]>) : buildMainSubs(maps['construction'], ['أدوات', 'construction', 'نوع', 'category'], ['sub', 'فرعي'])));
        setGYMS_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['gym'] ?? {}).length ? (mainSubs['gym'] as Record<string, string[]>) : buildMainSubs(maps['gym'], ['نوع العضوية', 'gym', 'نوع', 'category'], ['sub', 'فرعي'])));
        setBIKES_LIGHT_VEHICLES_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['light-vehicles'] ?? {}).length ? (mainSubs['light-vehicles'] as Record<string, string[]>) : buildMainSubs(maps['light-vehicles'], ['نوع المركبة', 'vehicle', 'نوع', 'category'], ['sub', 'فرعي'])));
        setMATERIALS_PRODUCTION_LINES_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['production-lines'] ?? {}).length ? (mainSubs['production-lines'] as Record<string, string[]>) : buildMainSubs(maps['production-lines'], ['خط', 'line', 'مادة', 'material', 'category'], ['sub', 'فرعي'])));
        setFARMS_FACTORIES_PRODUCTS_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['farm-products'] ?? {}).length ? (mainSubs['farm-products'] as Record<string, string[]>) : buildMainSubs(maps['farm-products'], ['نوع المنتج', 'product', 'category'], ['sub', 'فرعي'])));
        setLIGHTING_DECOR_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['lighting-decor'] ?? {}).length ? (mainSubs['lighting-decor'] as Record<string, string[]>) : buildMainSubs(maps['lighting-decor'], ['نوع المنتج', 'إضاءة', 'ديكور', 'category'], ['sub', 'فرعي'])));
        setMISSING_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['missing'] ?? {}).length ? (mainSubs['missing'] as Record<string, string[]>) : buildMainSubs(maps['missing'], ['نوع المفقود', 'missing', 'category'], ['sub', 'فرعي', 'تاريخ', 'date'])));
        setTOOLS_SUPPLIES_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['tools'] ?? {}).length ? (mainSubs['tools'] as Record<string, string[]>) : buildMainSubs(maps['tools'], ['نوع العدة', 'tools', 'نوع', 'category'], ['sub', 'فرعي'])));
        setWHOLESALE_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['wholesale'] ?? {}).length ? (mainSubs['wholesale'] as Record<string, string[]>) : buildMainSubs(maps['wholesale'], ['نوع المنتج', 'wholesale', 'category'], ['sub', 'فرعي'])));
        setHEAVY_EQUIPMENT_MAIN_SUBS(processHierarchicalOptions(Object.keys(mainSubs['heavy-transport'] ?? {}).length ? (mainSubs['heavy-transport'] as Record<string, string[]>) : buildMainSubs(maps['heavy-transport'], ['نوع المعدة', 'equipment', 'نوع', 'category'], ['sub', 'فرعي'])));
        const parts = maps['spare-parts'];
        const brands = pick(parts, ['ماركة', 'brand', 'الشركة']);
        const models = pick(parts, ['موديل', 'model', 'طراز', 'type']);
        if (brands.length && models.length) setPARTS_BRANDS_MODELS(prev => (prev && Object.keys(prev).length ? prev : Object.fromEntries(brands.map(b => [b, models]))));
        try {
          const idMap: Record<string, Record<string, number>> = {};
          for (const [slug, arr] of Object.entries(mainWithIds)) {
            const rec: Record<string, number> = {};
            const list = arr as AdminMainSectionRecord[] | undefined;
            if (Array.isArray(list)) {
              for (const it of list) {
                const name = String(it?.name || '').trim();
                const id = typeof it?.id === 'number' ? it.id : undefined;
                if (name && typeof id === 'number') rec[name] = id;
              }
            }
            idMap[slug] = rec;
          }
          setMAIN_IDS_BY_SLUG(idMap);
          const adminMap = (slug: string): Record<string, string[]> => {
            const list = mainWithIds[slug] as AdminMainSectionRecord[] | undefined;
            const out: Record<string, string[]> = {};
            if (Array.isArray(list)) {
              for (const it of list) {
                const name = String(it?.name || '').trim();
                const subsRaw = it.sub_sections as AdminSubSectionRecord[] | undefined;
                const subs = Array.isArray(subsRaw) ? subsRaw.map(s => String(s?.name || '').trim()).filter(Boolean) : [];
                if (name) out[name] = subs;
              }
            }
            return out;
          };
          const adminSubIds = (slug: string): Record<string, Record<string, number>> => {
            const list = mainWithIds[slug] as AdminMainSectionRecord[] | undefined;
            const out: Record<string, Record<string, number>> = {};
            if (Array.isArray(list)) {
              for (const it of list) {
                const name = String(it?.name || '').trim();
                const subsRaw = it.sub_sections as AdminSubSectionRecord[] | undefined;
                const rec: Record<string, number> = {};
                if (Array.isArray(subsRaw)) {
                  for (const s of subsRaw) {
                    const sn = String(s?.name || '').trim();
                    const sid = typeof s?.id === 'number' ? s.id : undefined;
                    if (sn && typeof sid === 'number') rec[sn] = sid;
                  }
                }
                if (name) out[name] = rec;
              }
            }
            return out;
          };
          const applyAdmin = <T extends Record<string, string[]>>(slug: string, setter: (v: T | ((prev: T) => T)) => void) => {
            const map = adminMap(slug);
            if (Object.keys(map).length) setter(map as T);
          };
          applyAdmin('jobs', setJOBS_MAIN_SUBS);
          applyAdmin('animals', setANIMALS_MAIN_SUBS);
          applyAdmin('food-products', setFOOD_MAIN_SUBS);
          applyAdmin('restaurants', setRESTAURANTS_MAIN_SUBS);
          applyAdmin('stores', setSTORES_MAIN_SUBS);
          applyAdmin('groceries', setGROCERIES_MAIN_SUBS);
          applyAdmin('kids-toys', setKIDS_SUPPLIES_TOYS_MAIN_SUBS);
          applyAdmin('home-services', setHOME_SERVICES_MAIN_SUBS);
          applyAdmin('furniture', setFURNITURE_MAIN_SUBS);
          applyAdmin('home-tools', setHOUSEHOLD_TOOLS_MAIN_SUBS);
          applyAdmin('home-appliances', setHOME_APPLIANCES_MAIN_SUBS);
          applyAdmin('electronics', setELECTRONICS_MAIN_SUBS);
          applyAdmin('health', setHEALTH_MAIN_SUBS);
          applyAdmin('education', setEDUCATION_MAIN_SUBS);
          applyAdmin('shipping', setSHIPPING_MAIN_SUBS);
          applyAdmin('mens-clothes', setMENS_CLOTHING_SHOES_MAIN_SUBS);
          applyAdmin('watches-jewelry', setWATCHES_JEWELRY_MAIN_SUBS);
          applyAdmin('free-professions', setFREELANCE_SERVICES_MAIN_SUBS);
          applyAdmin('car-services', setCAR_SERVICES_MAIN_SUBS);
          applyAdmin('maintenance', setGENERAL_MAINTENANCE_MAIN_SUBS);
          applyAdmin('construction', setCONSTRUCTION_TOOLS_MAIN_SUBS);
          applyAdmin('gym', setGYMS_MAIN_SUBS);
          applyAdmin('light-vehicles', setBIKES_LIGHT_VEHICLES_MAIN_SUBS);
          applyAdmin('production-lines', setMATERIALS_PRODUCTION_LINES_MAIN_SUBS);
          applyAdmin('farm-products', setFARMS_FACTORIES_PRODUCTS_MAIN_SUBS);
          applyAdmin('lighting-decor', setLIGHTING_DECOR_MAIN_SUBS);
          applyAdmin('missing', setMISSING_MAIN_SUBS);
          applyAdmin('tools', setTOOLS_SUPPLIES_MAIN_SUBS);
          applyAdmin('wholesale', setWHOLESALE_MAIN_SUBS);
          applyAdmin('heavy-transport', setHEAVY_EQUIPMENT_MAIN_SUBS);
          const subIdMap: Record<string, Record<string, Record<string, number>>> = {};
          for (const slug of Object.keys(mainWithIds)) {
            subIdMap[slug] = adminSubIds(slug);
          }
          setSUB_IDS_BY_SLUG(subIdMap);
        } catch { }
      })
      .catch(() => { });
  }, []);
  const [manufactureYear, setManufactureYear] = useState('');
  const [kilometersRange, setKilometersRange] = useState('');
  const [carType, setCarType] = useState('');
  const [exteriorColor, setExteriorColor] = useState('');
  const [transmissionType, setTransmissionType] = useState('');
  const [fuelType, setFuelType] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newKm, setNewKm] = useState('');
  const [newCarTypeVal, setNewCarTypeVal] = useState('');
  const [newExteriorColorVal, setNewExteriorColorVal] = useState('');
  const [newTransmissionVal, setNewTransmissionVal] = useState('');
  const [newFuelVal, setNewFuelVal] = useState('');
  const [selectedRentalBrand, setSelectedRentalBrand] = useState('');
  const [selectedRentalModel, setSelectedRentalModel] = useState('');
  const [newRentalBrand, setNewRentalBrand] = useState('');
  const [newRentalModelsBulk, setNewRentalModelsBulk] = useState('');
  const [rentalYear, setRentalYear] = useState('');
  const [newRentalYear, setNewRentalYear] = useState('');
  const [driverOptions, setDriverOptions] = useState<string[]>([]);
  const [driver, setDriver] = useState('');
  const [newDriverVal, setNewDriverVal] = useState('');
  const PROPERTY_TYPES: string[] = [];
  const CONTRACT_TYPES: string[] = [];
  const [propertyType, setPropertyType] = useState('');
  const [contractType, setContractType] = useState('');
  const [propertyTypeOptions, setPropertyTypeOptions] = useState<string[]>(PROPERTY_TYPES);
  const [contractTypeOptions, setContractTypeOptions] = useState<string[]>(CONTRACT_TYPES);
  const [newPropertyTypeVal, setNewPropertyTypeVal] = useState('');
  const [newContractTypeVal, setNewContractTypeVal] = useState('');
  const [selectedPartsBrand, setSelectedPartsBrand] = useState('');
  const [selectedPartsModel, setSelectedPartsModel] = useState('');
  const [newPartsBrand, setNewPartsBrand] = useState('');
  const [newPartsModelsBulk, setNewPartsModelsBulk] = useState('');
  const [PARTS_MAIN_SUBS, setPARTS_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedPartsMain, setSelectedPartsMain] = useState('');
  const [selectedPartsSub, setSelectedPartsSub] = useState('');
  const [newPartsMain, setNewPartsMain] = useState('');
  const [newPartsSubsBulk, setNewPartsSubsBulk] = useState('');
  const [ANIMALS_MAIN_SUBS, setANIMALS_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [JOBS_MAIN_SUBS, setJOBS_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedAnimalMain, setSelectedAnimalMain] = useState('');
  const [selectedAnimalSub, setSelectedAnimalSub] = useState('');
  const [newAnimalMain, setNewAnimalMain] = useState('');
  const [newAnimalSubsBulk, setNewAnimalSubsBulk] = useState('');
  const TEACHER_SPECIALTIES: string[] = [];
  const DOCTOR_SPECIALTIES: string[] = [];
  const JOB_CATEGORIES: string[] = [];
  const JOB_SPECIALTIES: string[] = [];
  const [teacherSpecialty, setTeacherSpecialty] = useState('');
  const [teacherSpecialtyOptions, setTeacherSpecialtyOptions] = useState<string[]>(TEACHER_SPECIALTIES);
  const [newTeacherSpecialtyVal, setNewTeacherSpecialtyVal] = useState('');
  const [doctorSpecialty, setDoctorSpecialty] = useState('');
  const [doctorSpecialtyOptions, setDoctorSpecialtyOptions] = useState<string[]>(DOCTOR_SPECIALTIES);
  const [newDoctorSpecialtyVal, setNewDoctorSpecialtyVal] = useState('');
  const [jobCategory, setJobCategory] = useState('');
  const [jobCategoryOptions, setJobCategoryOptions] = useState<string[]>(JOB_CATEGORIES);
  const [newJobCategoryVal, setNewJobCategoryVal] = useState('');
  const [jobSpecialty, setJobSpecialty] = useState('');
  const [jobSpecialtyOptions, setJobSpecialtyOptions] = useState<string[]>(JOB_SPECIALTIES);
  const [newJobSpecialtyVal, setNewJobSpecialtyVal] = useState('');
  const [carsYearKey, setCarsYearKey] = useState('');
  const [carsKmKey, setCarsKmKey] = useState('');
  const [carsFuelKey, setCarsFuelKey] = useState('');
  const [carsTransmissionKey, setCarsTransmissionKey] = useState('');
  const [carsExteriorColorKey, setCarsExteriorColorKey] = useState('');
  const [carsTypeKey, setCarsTypeKey] = useState('');
  const [rentalYearKey, setRentalYearKey] = useState('');
  const [driverKey, setDriverKey] = useState('');
  const [realPropertyKey, setRealPropertyKey] = useState('');
  const [realContractKey, setRealContractKey] = useState('');
  const [teacherSpecialtyKey, setTeacherSpecialtyKey] = useState('');
  const [doctorSpecialtyKey, setDoctorSpecialtyKey] = useState('');
  const [jobCategoryKey, setJobCategoryKey] = useState('');
  const [jobSpecialtyKey, setJobSpecialtyKey] = useState('');
  const [animalsMainKey, setAnimalsMainKey] = useState('');
  const [animalsSubKey, setAnimalsSubKey] = useState('');
  const [foodMainKey, setFoodMainKey] = useState('');
  const [foodSubKey, setFoodSubKey] = useState('');
  const [restaurantsMainKey, setRestaurantsMainKey] = useState('');
  const [restaurantsSubKey, setRestaurantsSubKey] = useState('');
  const [storesMainKey, setStoresMainKey] = useState('');
  const [storesSubKey, setStoresSubKey] = useState('');
  const [groceriesMainKey, setGroceriesMainKey] = useState('');
  const [groceriesSubKey, setGroceriesSubKey] = useState('');
  const [FOOD_MAIN_SUBS, setFOOD_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedFoodMain, setSelectedFoodMain] = useState('');
  const [selectedFoodSub, setSelectedFoodSub] = useState('');
  const [newFoodMain, setNewFoodMain] = useState('');
  const [newFoodSubsBulk, setNewFoodSubsBulk] = useState('');
  // تم تعطيل الربط بين التصنيف والتخصص - كل واحد مستقل الآن
  // useEffect(() => {
  //   let mounted = true;
  //   (async () => {
  //     if (!jobCategory) {
  //       if (mounted) {
  //         setJobSpecialtyOptions([]);
  //         setJobSpecialty('');
  //       }
  //       return;
  //     }
  //     const mainId = await ensureMainSectionId('jobs', jobCategory);
  //     if (!mainId) {
  //       const list = JOBS_MAIN_SUBS[jobCategory] ?? [];
  //       if (mounted) {
  //         setJobSpecialtyOptions(list);
  //         if (!list.includes(jobSpecialty)) setJobSpecialty('');
  //       }
  //       return;
  //     }
  //     try {
  //       const subs = await fetchPublicSubSections(mainId);
  //       const names = subs.map(s => String(s?.name || '').trim()).filter(Boolean);
  //       const list = names.length ? names : (JOBS_MAIN_SUBS[jobCategory] ?? []);
  //       if (mounted) {
  //         setJobSpecialtyOptions(list);
  //         if (!list.includes(jobSpecialty)) setJobSpecialty('');
  //       }
  //     } catch {
  //       const list = JOBS_MAIN_SUBS[jobCategory] ?? [];
  //       if (mounted) {
  //         setJobSpecialtyOptions(list);
  //         if (!list.includes(jobSpecialty)) setJobSpecialty('');
  //       }
  //     }
  //   })();
  //   return () => { mounted = false; };
  // }, [jobCategory, JOBS_MAIN_SUBS]);
  const [RESTAURANTS_MAIN_SUBS, setRESTAURANTS_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedRestaurantMain, setSelectedRestaurantMain] = useState('');
  const [selectedRestaurantSub, setSelectedRestaurantSub] = useState('');
  const [newRestaurantMain, setNewRestaurantMain] = useState('');
  const [newRestaurantSubsBulk, setNewRestaurantSubsBulk] = useState('');
  const [STORES_MAIN_SUBS, setSTORES_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedStoreMain, setSelectedStoreMain] = useState('');
  const [selectedStoreSub, setSelectedStoreSub] = useState('');
  const [newStoreMain, setNewStoreMain] = useState('');
  const [newStoreSubsBulk, setNewStoreSubsBulk] = useState('');
  const [GROCERIES_MAIN_SUBS, setGROCERIES_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedGroceryMain, setSelectedGroceryMain] = useState('');
  const [selectedGrocerySub, setSelectedGrocerySub] = useState('');
  const [newGroceryMain, setNewGroceryMain] = useState('');
  const [newGrocerySubsBulk, setNewGrocerySubsBulk] = useState('');
  const [HOME_SERVICES_MAIN_SUBS, setHOME_SERVICES_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedHomeServiceMain, setSelectedHomeServiceMain] = useState('');
  const [selectedHomeServiceSub, setSelectedHomeServiceSub] = useState('');
  const [newHomeServiceMain, setNewHomeServiceMain] = useState('');
  const [newHomeServiceSubsBulk, setNewHomeServiceSubsBulk] = useState('');
  const [FURNITURE_MAIN_SUBS, setFURNITURE_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedFurnitureMain, setSelectedFurnitureMain] = useState('');
  const [selectedFurnitureSub, setSelectedFurnitureSub] = useState('');
  const [newFurnitureMain, setNewFurnitureMain] = useState('');
  const [newFurnitureSubsBulk, setNewFurnitureSubsBulk] = useState('');
  const [HOUSEHOLD_TOOLS_MAIN_SUBS, setHOUSEHOLD_TOOLS_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedHouseholdToolMain, setSelectedHouseholdToolMain] = useState('');
  const [selectedHouseholdToolSub, setSelectedHouseholdToolSub] = useState('');
  const [newHouseholdToolMain, setNewHouseholdToolMain] = useState('');
  const [newHouseholdToolSubsBulk, setNewHouseholdToolSubsBulk] = useState('');
  const [HOME_APPLIANCES_MAIN_SUBS, setHOME_APPLIANCES_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedHomeApplianceMain, setSelectedHomeApplianceMain] = useState('');
  const [selectedHomeApplianceSub, setSelectedHomeApplianceSub] = useState('');
  const [newHomeApplianceMain, setNewHomeApplianceMain] = useState('');
  const [newHomeApplianceSubsBulk, setNewHomeApplianceSubsBulk] = useState('');
  const [ELECTRONICS_MAIN_SUBS, setELECTRONICS_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedElectronicsMain, setSelectedElectronicsMain] = useState('');
  const [selectedElectronicsSub, setSelectedElectronicsSub] = useState('');
  const [newElectronicsMain, setNewElectronicsMain] = useState('');
  const [newElectronicsSubsBulk, setNewElectronicsSubsBulk] = useState('');
  const [HEALTH_MAIN_SUBS, setHEALTH_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedHealthMain, setSelectedHealthMain] = useState('');
  const [selectedHealthSub, setSelectedHealthSub] = useState('');
  const [newHealthMain, setNewHealthMain] = useState('');
  const [newHealthSubsBulk, setNewHealthSubsBulk] = useState('');
  const [EDUCATION_MAIN_SUBS, setEDUCATION_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedEducationMain, setSelectedEducationMain] = useState('');
  const [selectedEducationSub, setSelectedEducationSub] = useState('');
  const [newEducationMain, setNewEducationMain] = useState('');
  const [newEducationSubsBulk, setNewEducationSubsBulk] = useState('');
  const [SHIPPING_MAIN_SUBS, setSHIPPING_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedShippingMain, setSelectedShippingMain] = useState('');
  const [selectedShippingSub, setSelectedShippingSub] = useState('');
  const [newShippingMain, setNewShippingMain] = useState('');
  const [newShippingSubsBulk, setNewShippingSubsBulk] = useState('');
  const [MENS_CLOTHING_SHOES_MAIN_SUBS, setMENS_CLOTHING_SHOES_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedMensClothingShoesMain, setSelectedMensClothingShoesMain] = useState('');
  const [selectedMensClothingShoesSub, setSelectedMensClothingShoesSub] = useState('');
  const [newMensClothingShoesMain, setNewMensClothingShoesMain] = useState('');
  const [newMensClothingShoesSubsBulk, setNewMensClothingShoesSubsBulk] = useState('');
  const [HEAVY_EQUIPMENT_MAIN_SUBS, setHEAVY_EQUIPMENT_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedHeavyEquipmentMain, setSelectedHeavyEquipmentMain] = useState('');
  const [selectedHeavyEquipmentSub, setSelectedHeavyEquipmentSub] = useState('');
  const [newHeavyEquipmentMain, setNewHeavyEquipmentMain] = useState('');
  const [newHeavyEquipmentSubsBulk, setNewHeavyEquipmentSubsBulk] = useState('');
  const [KIDS_SUPPLIES_TOYS_MAIN_SUBS, setKIDS_SUPPLIES_TOYS_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedKidsSuppliesToysMain, setSelectedKidsSuppliesToysMain] = useState('');
  const [selectedKidsSuppliesToysSub, setSelectedKidsSuppliesToysSub] = useState('');
  const [newKidsSuppliesToysMain, setNewKidsSuppliesToysMain] = useState('');
  const [newKidsSuppliesToysSubsBulk, setNewKidsSuppliesToysSubsBulk] = useState('');
  const [FREELANCE_SERVICES_MAIN_SUBS, setFREELANCE_SERVICES_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedFreelanceServicesMain, setSelectedFreelanceServicesMain] = useState('');
  const [selectedFreelanceServicesSub, setSelectedFreelanceServicesSub] = useState('');
  const [newFreelanceServicesMain, setNewFreelanceServicesMain] = useState('');
  const [newFreelanceServicesSubsBulk, setNewFreelanceServicesSubsBulk] = useState('');
  const [WATCHES_JEWELRY_MAIN_SUBS, setWATCHES_JEWELRY_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedWatchesJewelryMain, setSelectedWatchesJewelryMain] = useState('');
  const [selectedWatchesJewelrySub, setSelectedWatchesJewelrySub] = useState('');
  const [newWatchesJewelryMain, setNewWatchesJewelryMain] = useState('');
  const [newWatchesJewelrySubsBulk, setNewWatchesJewelrySubsBulk] = useState('');
  const [CAR_SERVICES_MAIN_SUBS, setCAR_SERVICES_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedCarServicesMain, setSelectedCarServicesMain] = useState('');
  const [selectedCarServicesSub, setSelectedCarServicesSub] = useState('');
  const [newCarServicesMain, setNewCarServicesMain] = useState('');
  const [newCarServicesSubsBulk, setNewCarServicesSubsBulk] = useState('');
  const [GENERAL_MAINTENANCE_MAIN_SUBS, setGENERAL_MAINTENANCE_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedGeneralMaintenanceMain, setSelectedGeneralMaintenanceMain] = useState('');
  const [selectedGeneralMaintenanceSub, setSelectedGeneralMaintenanceSub] = useState('');
  const [newGeneralMaintenanceMain, setNewGeneralMaintenanceMain] = useState('');
  const [newGeneralMaintenanceSubsBulk, setNewGeneralMaintenanceSubsBulk] = useState('');
  const [CONSTRUCTION_TOOLS_MAIN_SUBS, setCONSTRUCTION_TOOLS_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedConstructionToolsMain, setSelectedConstructionToolsMain] = useState('');
  const [selectedConstructionToolsSub, setSelectedConstructionToolsSub] = useState('');
  const [newConstructionToolsMain, setNewConstructionToolsMain] = useState('');
  const [newConstructionToolsSubsBulk, setNewConstructionToolsSubsBulk] = useState('');
  const [GYMS_MAIN_SUBS, setGYMS_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedGymsMain, setSelectedGymsMain] = useState('');
  const [selectedGymsSub, setSelectedGymsSub] = useState('');
  const [newGymsMain, setNewGymsMain] = useState('');
  const [newGymsSubsBulk, setNewGymsSubsBulk] = useState('');
  const [BIKES_LIGHT_VEHICLES_MAIN_SUBS, setBIKES_LIGHT_VEHICLES_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedBikesLightVehiclesMain, setSelectedBikesLightVehiclesMain] = useState('');
  const [selectedBikesLightVehiclesSub, setSelectedBikesLightVehiclesSub] = useState('');
  const [newBikesLightVehiclesMain, setNewBikesLightVehiclesMain] = useState('');
  const [newBikesLightVehiclesSubsBulk, setNewBikesLightVehiclesSubsBulk] = useState('');
  const [MATERIALS_PRODUCTION_LINES_MAIN_SUBS, setMATERIALS_PRODUCTION_LINES_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedMaterialsProductionLinesMain, setSelectedMaterialsProductionLinesMain] = useState('');
  const [selectedMaterialsProductionLinesSub, setSelectedMaterialsProductionLinesSub] = useState('');
  const [newMaterialsProductionLinesMain, setNewMaterialsProductionLinesMain] = useState('');
  const [newMaterialsProductionLinesSubsBulk, setNewMaterialsProductionLinesSubsBulk] = useState('');
  const [FARMS_FACTORIES_PRODUCTS_MAIN_SUBS, setFARMS_FACTORIES_PRODUCTS_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedFarmsFactoriesProductsMain, setSelectedFarmsFactoriesProductsMain] = useState('');
  const [selectedFarmsFactoriesProductsSub, setSelectedFarmsFactoriesProductsSub] = useState('');
  const [newFarmsFactoriesProductsMain, setNewFarmsFactoriesProductsMain] = useState('');
  const [newFarmsFactoriesProductsSubsBulk, setNewFarmsFactoriesProductsSubsBulk] = useState('');
  const [LIGHTING_DECOR_MAIN_SUBS, setLIGHTING_DECOR_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedLightingDecorMain, setSelectedLightingDecorMain] = useState('');
  const [selectedLightingDecorSub, setSelectedLightingDecorSub] = useState('');
  const [newLightingDecorMain, setNewLightingDecorMain] = useState('');
  const [newLightingDecorSubsBulk, setNewLightingDecorSubsBulk] = useState('');
  const [MISSING_MAIN_SUBS, setMISSING_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedMissingMain, setSelectedMissingMain] = useState('');
  const [selectedMissingSub, setSelectedMissingSub] = useState('');
  const [newMissingMain, setNewMissingMain] = useState('');
  const [newMissingSubsBulk, setNewMissingSubsBulk] = useState('');
  const [TOOLS_SUPPLIES_MAIN_SUBS, setTOOLS_SUPPLIES_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedToolsSuppliesMain, setSelectedToolsSuppliesMain] = useState('');
  const [selectedToolsSuppliesSub, setSelectedToolsSuppliesSub] = useState('');
  const [newToolsSuppliesMain, setNewToolsSuppliesMain] = useState('');
  const [newToolsSuppliesSubsBulk, setNewToolsSuppliesSubsBulk] = useState('');
  const [WHOLESALE_MAIN_SUBS, setWHOLESALE_MAIN_SUBS] = useState<Record<string, string[]>>({});
  const [selectedWholesaleMain, setSelectedWholesaleMain] = useState('');
  const [selectedWholesaleSub, setSelectedWholesaleSub] = useState('');
  const [newWholesaleMain, setNewWholesaleMain] = useState('');
  const [newWholesaleSubsBulk, setNewWholesaleSubsBulk] = useState('');

  // حالة محرر خيارات الحقل
  const [fieldOptionsEditor, setFieldOptionsEditor] = useState<{ categoryId: number; fieldName: string } | null>(null);
  const [tempOptions, setTempOptions] = useState<string[]>([]);

  const filteredCategories = categories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || cat.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const [GOVERNORATES_MAP, setGOVERNORATES_MAP] = useState<Record<string, string[]>>({});
  const [GOVERNORATE_IDS, setGOVERNORATE_IDS] = useState<Record<string, number>>({});
  const [CATEGORY_IMAGE_UPLOADING, setCATEGORY_IMAGE_UPLOADING] = useState<Record<number, boolean>>({});
  const viewCategoryImage = (url?: string | null) => {
    const src = getImageSrc(String(url || ''));
    if (!src) return;
    try { window.open(src, '_blank', 'noopener'); } catch { }
  };
  const uploadCategoryImage = async (categoryId: number, file: File) => {
    setCATEGORY_IMAGE_UPLOADING(prev => ({ ...prev, [categoryId]: true }));
    try {
      const rec = await updateAdminCategoryImage(categoryId, file);
      setCategories(prev => prev.map(c => (c.id === categoryId ? { ...c, homepageImage: rec.homepage_image } : c)));
      showToast('تم تحديث الصورة', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في رفع الصورة');
      showToast(msg, 'error');
    } finally {
      setCATEGORY_IMAGE_UPLOADING(prev => ({ ...prev, [categoryId]: false }));
    }
  };
  const deleteCategoryImage = async (categoryId: number) => {
    setCATEGORY_IMAGE_UPLOADING(prev => ({ ...prev, [categoryId]: true }));
    try {
      const rec = await deleteAdminCategoryImage(categoryId);
      setCategories(prev => prev.map(c => (c.id === categoryId ? { ...c, homepageImage: rec.homepage_image } : c)));
      showToast('تم حذف الصورة', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في حذف الصورة');
      showToast(msg, 'error');
    } finally {
      setCATEGORY_IMAGE_UPLOADING(prev => ({ ...prev, [categoryId]: false }));
    }
  };

  const saveCitiesCacheById = (govId: number, names: string[]) => {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem('admin:govCities');
      const obj: Record<number, string[]> = raw ? JSON.parse(raw) : {};
      const prev = Array.isArray(obj[govId]) ? obj[govId] : [];
      obj[govId] = Array.from(new Set([...prev, ...names]));
      localStorage.setItem('admin:govCities', JSON.stringify(obj));
    } catch { }
  };

  const saveCitiesCacheByName = (govName: string, names: string[]) => {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem('admin:govCitiesByName');
      const obj: Record<string, string[]> = raw ? JSON.parse(raw) : {};
      const prev = Array.isArray(obj[govName]) ? obj[govName] : [];
      obj[govName] = Array.from(new Set([...prev, ...names]));
      localStorage.setItem('admin:govCitiesByName', JSON.stringify(obj));
    } catch { }
  };
  const saveCityIdCache = (govId: number, cityName: string, cityId: number) => {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem('admin:cityIds');
      const obj: Record<number, Record<string, number>> = raw ? JSON.parse(raw) : {};
      const prev = obj[govId] ?? {};
      prev[cityName] = cityId;
      obj[govId] = prev;
      localStorage.setItem('admin:cityIds', JSON.stringify(obj));
    } catch { }
  };
  const renameCityIdCache = (govId: number, oldName: string, newName: string) => {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem('admin:cityIds');
      const obj: Record<number, Record<string, number>> = raw ? JSON.parse(raw) : {};
      const prev = obj[govId] ?? {};
      const id = prev[oldName];
      delete prev[oldName];
      if (typeof id === 'number') prev[newName] = id;
      obj[govId] = prev;
      localStorage.setItem('admin:cityIds', JSON.stringify(obj));
    } catch { }
  };
  const deleteCityIdCache = (govId: number, cityName: string) => {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem('admin:cityIds');
      const obj: Record<number, Record<string, number>> = raw ? JSON.parse(raw) : {};
      const prev = obj[govId] ?? {};
      delete prev[cityName];
      obj[govId] = prev;
      localStorage.setItem('admin:cityIds', JSON.stringify(obj));
    } catch { }
  };
  const saveCityRenameById = (govId: number, oldName: string, newName: string) => {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem('admin:cityRenamesById');
      const obj: Record<number, Record<string, string>> = raw ? JSON.parse(raw) : {};
      const prev = obj[govId] ?? {};
      prev[oldName] = newName;
      obj[govId] = prev;
      localStorage.setItem('admin:cityRenamesById', JSON.stringify(obj));
    } catch { }
  };
  const saveCityRenameByName = (govName: string, oldName: string, newName: string) => {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem('admin:cityRenamesByName');
      const obj: Record<string, Record<string, string>> = raw ? JSON.parse(raw) : {};
      const prev = obj[govName] ?? {};
      prev[oldName] = newName;
      obj[govName] = prev;
      localStorage.setItem('admin:cityRenamesByName', JSON.stringify(obj));
    } catch { }
  };
  const saveCityDeletedById = (govId: number, cityName: string) => {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem('admin:cityDeletedById');
      const obj: Record<number, string[]> = raw ? JSON.parse(raw) : {};
      const prev = Array.isArray(obj[govId]) ? obj[govId] : [];
      obj[govId] = Array.from(new Set([...prev, cityName]));
      localStorage.setItem('admin:cityDeletedById', JSON.stringify(obj));
    } catch { }
  };
  const saveCityDeletedByName = (govName: string, cityName: string) => {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem('admin:cityDeletedByName');
      const obj: Record<string, string[]> = raw ? JSON.parse(raw) : {};
      const prev = Array.isArray(obj[govName]) ? obj[govName] : [];
      obj[govName] = Array.from(new Set([...prev, cityName]));
      localStorage.setItem('admin:cityDeletedByName', JSON.stringify(obj));
    } catch { }
  };
  const clearCityDeletedById = (govId: number, cityName: string) => {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem('admin:cityDeletedById');
      const obj: Record<number, string[]> = raw ? JSON.parse(raw) : {};
      const prev = Array.isArray(obj[govId]) ? obj[govId] : [];
      obj[govId] = prev.filter(x => x !== cityName);
      localStorage.setItem('admin:cityDeletedById', JSON.stringify(obj));
    } catch { }
  };
  const clearCityDeletedByName = (govName: string, cityName: string) => {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem('admin:cityDeletedByName');
      const obj: Record<string, string[]> = raw ? JSON.parse(raw) : {};
      const prev = Array.isArray(obj[govName]) ? obj[govName] : [];
      obj[govName] = prev.filter(x => x !== cityName);
      localStorage.setItem('admin:cityDeletedByName', JSON.stringify(obj));
    } catch { }
  };
  const getCityId = (govName: string, cityName: string): number | undefined => {
    try {
      const govId = GOVERNORATE_IDS[govName];
      if (typeof govId !== 'number') return undefined;
      const raw = typeof window !== 'undefined' ? localStorage.getItem('admin:cityIds') : null;
      const obj: Record<number, Record<string, number>> = raw ? JSON.parse(raw) : {};
      const id = obj[govId]?.[cityName];
      return typeof id === 'number' ? id : undefined;
    } catch { return undefined; }
  };
  const resolveCityId = async (govName: string, cityName: string): Promise<number | undefined> => {
    const existing = getCityId(govName, cityName);
    if (typeof existing === 'number') return existing;
    const govId = GOVERNORATE_IDS[govName];
    if (typeof govId !== 'number') return undefined;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
      await fetchGovernorateById(govId, token);
      const next = getCityId(govName, cityName);
      return typeof next === 'number' ? next : undefined;
    } catch {
      return undefined;
    }
  };
  const saveGovernorateRename = (oldName: string, newName: string) => {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem('admin:govRenames');
      const obj: Record<string, string> = raw ? JSON.parse(raw) : {};
      obj[oldName] = newName;
      localStorage.setItem('admin:govRenames', JSON.stringify(obj));
    } catch { }
  };
  const cities = selectedGovernorate ? GOVERNORATES_MAP[selectedGovernorate] ?? [] : [];
  const renameGovernorate = async (prevName: string, nextRaw: string) => {
    const next = nextRaw.trim();
    if (!next || prevName === next) return;
    if (GOVERNORATES_MAP[next]) { showToast('الاسم موجود مسبقًا في نفس القائمة', 'warning'); return; }
    const govId = GOVERNORATE_IDS[prevName];
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
      if (typeof govId === 'number') {
        const g = await updateGovernorate(govId, next, token);
        setGOVERNORATES_MAP(prev => {
          const n = { ...prev };
          const prevList = n[prevName] ?? [];
          const merged = Array.from(new Set([...(Array.isArray(g.cities) ? g.cities : []), ...prevList]));
          delete n[prevName];
          n[g.name] = merged;
          return n;
        });
        setGOVERNORATE_IDS(prev => {
          const n = { ...prev };
          delete n[prevName];
          if (typeof g.id === 'number') n[g.name] = g.id!; else n[g.name] = govId;
          return n;
        });
        try {
          if (typeof window !== 'undefined') {
            const raw = localStorage.getItem('admin:govCitiesByName');
            const obj: Record<string, string[]> = raw ? JSON.parse(raw) : {};
            const list = Array.isArray(obj[prevName]) ? obj[prevName] : [];
            delete obj[prevName];
            if (list.length) obj[g.name] = Array.from(new Set([...(obj[g.name] ?? []), ...list]));
            localStorage.setItem('admin:govCitiesByName', JSON.stringify(obj));
          }
        } catch { }
        saveGovernorateRename(prevName, g.name);
        if (selectedGovernorate === prevName) setSelectedGovernorate(g.name);
        showToast('تم تعديل المحافظة', 'success');
      } else {
        setGOVERNORATES_MAP(prev => {
          const n = { ...prev };
          const list = n[prevName] ?? [];
          delete n[prevName];
          n[next] = list;
          return n;
        });
        setGOVERNORATE_IDS(prev => {
          const n = { ...prev };
          const id = n[prevName];
          delete n[prevName];
          if (typeof id === 'number') n[next] = id;
          return n;
        });
        try {
          if (typeof window !== 'undefined') {
            const raw = localStorage.getItem('admin:govCitiesByName');
            const obj: Record<string, string[]> = raw ? JSON.parse(raw) : {};
            const list = Array.isArray(obj[prevName]) ? obj[prevName] : [];
            delete obj[prevName];
            if (list.length) obj[next] = Array.from(new Set([...(obj[next] ?? []), ...list]));
            localStorage.setItem('admin:govCitiesByName', JSON.stringify(obj));
          }
        } catch { }
        saveGovernorateRename(prevName, next);
        if (selectedGovernorate === prevName) setSelectedGovernorate(next);
        showToast('تم تعديل المحافظة', 'success');
      }
    } catch (e) {
      let msg = e instanceof Error ? e.message : 'تعذر تعديل المحافظة';
      const low = String(msg).toLowerCase();
      if (low.includes('undefined method') && low.includes('governoratecontroller::update')) {
        msg = 'التعديل غير متاح حاليًا: لا توجد دالة update على السيرفر';
      }
      showToast(msg, 'error');
    }
  };
  const renameCity = async (prevName: string, nextRaw: string) => {
    const next = nextRaw.trim();
    if (!next || prevName === next || !selectedGovernorate) return;
    let cityId = getCityId(selectedGovernorate, prevName);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
      if (typeof cityId === 'number') {
        const c = await updateCity(cityId, next, token);
        setGOVERNORATES_MAP(prev => {
          const list = prev[selectedGovernorate] ?? [];
          if (list.includes(c.name)) return prev;
          const updated = list.map(x => (x === prevName ? c.name : x));
          return { ...prev, [selectedGovernorate]: updated };
        });
        const govId = GOVERNORATE_IDS[selectedGovernorate];
        if (typeof govId === 'number' && typeof c.id === 'number') renameCityIdCache(govId, prevName, c.name);
        if (typeof govId === 'number') saveCityRenameById(govId, prevName, c.name);
        saveCityRenameByName(selectedGovernorate, prevName, c.name);
        if (typeof govId === 'number') clearCityDeletedById(govId, c.name);
        clearCityDeletedByName(selectedGovernorate, c.name);
        if (selectedCity === prevName) setSelectedCity(c.name);
        showToast('تم تعديل المدينة', 'success');
      } else {
        cityId = await resolveCityId(selectedGovernorate, prevName);
        if (typeof cityId === 'number') {
          const c = await updateCity(cityId, next, token);
          setGOVERNORATES_MAP(prev => {
            const list = prev[selectedGovernorate] ?? [];
            if (list.includes(c.name)) return prev;
            const updated = list.map(x => (x === prevName ? c.name : x));
            return { ...prev, [selectedGovernorate]: updated };
          });
          const govId = GOVERNORATE_IDS[selectedGovernorate];
          if (typeof govId === 'number' && typeof c.id === 'number') renameCityIdCache(govId, prevName, c.name);
          if (typeof govId === 'number') saveCityRenameById(govId, prevName, c.name);
          saveCityRenameByName(selectedGovernorate, prevName, c.name);
          if (typeof govId === 'number') clearCityDeletedById(govId, c.name);
          clearCityDeletedByName(selectedGovernorate, c.name);
          if (selectedCity === prevName) setSelectedCity(c.name);
          showToast('تم تعديل المدينة', 'success');
        } else {
          setGOVERNORATES_MAP(prev => {
            const list = prev[selectedGovernorate] ?? [];
            if (list.includes(next)) return prev;
            const updated = list.map(x => (x === prevName ? next : x));
            return { ...prev, [selectedGovernorate]: updated };
          });
          const govId = GOVERNORATE_IDS[selectedGovernorate];
          if (typeof govId === 'number') renameCityIdCache(govId, prevName, next);
          if (typeof govId === 'number') saveCityRenameById(govId, prevName, next);
          saveCityRenameByName(selectedGovernorate, prevName, next);
          if (typeof govId === 'number') clearCityDeletedById(govId, next);
          clearCityDeletedByName(selectedGovernorate, next);
          if (selectedCity === prevName) setSelectedCity(next);
          showToast('تم تعديل المدينة', 'info');
        }
      }
    } catch (e) {
      let msg = e instanceof Error ? e.message : 'تعذر تعديل المدينة';
      const low = String(msg).toLowerCase();
      if (low.includes('undefined method') && low.includes('cities::update')) {
        msg = 'التعديل غير متاح حاليًا: لا توجد دالة update للمدينة على السيرفر';
      }
      showToast(msg, 'error');
    }
  };
  const [newGovernorate, setNewGovernorate] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newCitiesBulk, setNewCitiesBulk] = useState('');
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // 1️⃣ جلب البيانات من الـ API أولاً
        const items = await fetchGovernorates();
        if (!mounted) return;

        const map: Record<string, string[]> = {};
        const idMap: Record<string, number> = {};

        // 2️⃣ بناء الـ maps من الـ API response
        for (const g of items) {
          const name = g.name;
          if (!name) continue;

          // استخراج أسماء المدن من City objects
          const cityNames = Array.isArray(g.cities)
            ? g.cities.map(c => typeof c === 'string' ? c : c.name).filter(Boolean)
            : [];

          map[name] = Array.from(new Set(cityNames));
          if (typeof g.id === 'number') idMap[name] = g.id;
        }

        // 3️⃣ جلب cities mappings للحصول على IDs المدن
        try {
          const mappingsResp = await fetchCitiesMappings();
          const { by_governorate_id, by_governorate_name } = mappingsResp.data;

          // حفظ الـ mappings في localStorage كـ cache
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('admin:cityIds', JSON.stringify(by_governorate_id));
              localStorage.setItem('admin:govCitiesByName', JSON.stringify(
                Object.fromEntries(
                  Object.entries(by_governorate_name).map(([govName, cities]) => [
                    govName,
                    Object.keys(cities)
                  ])
                )
              ));
              // حفظ by_governorate_id كـ city names
              const govCitiesById: Record<number, string[]> = {};
              for (const [govId, cities] of Object.entries(by_governorate_id)) {
                govCitiesById[Number(govId)] = Object.keys(cities);
              }
              localStorage.setItem('admin:govCities', JSON.stringify(govCitiesById));
            } catch { }
          }
        } catch (err) {
          console.warn('Failed to fetch cities mappings, using API data only:', err);
        }

        // 4️⃣ دمج البيانات المحفوظة من localStorage (cache fallback)
        try {
          const cachedByIdRaw = typeof window !== 'undefined' ? localStorage.getItem('admin:govCities') : null;
          const cachedByNameRaw = typeof window !== 'undefined' ? localStorage.getItem('admin:govCitiesByName') : null;
          const cachedById: Record<number, string[]> = cachedByIdRaw ? JSON.parse(cachedByIdRaw) : {};
          const cachedByName: Record<string, string[]> = cachedByNameRaw ? JSON.parse(cachedByNameRaw) : {};

          // دمج من cache بالـ ID
          for (const [name, id] of Object.entries(idMap)) {
            const extra = Array.isArray(cachedById[id]) ? cachedById[id] : [];
            if (extra.length) map[name] = Array.from(new Set([...(map[name] ?? []), ...extra]));
          }

          // دمج من cache بالاسم
          for (const [name, extra] of Object.entries(cachedByName)) {
            if (extra && extra.length) map[name] = Array.from(new Set([...(map[name] ?? []), ...extra]));
          }

          // تطبيق إعادة التسمية من cache
          const renRaw = typeof window !== 'undefined' ? localStorage.getItem('admin:govRenames') : null;
          const renames: Record<string, string> = renRaw ? JSON.parse(renRaw) : {};
          for (const [oldName, newName] of Object.entries(renames)) {
            if (!oldName || !newName || oldName === newName) continue;
            const oldList = map[oldName] ?? [];
            const newList = map[newName] ?? [];
            if (oldList.length || newList.length) {
              map[newName] = Array.from(new Set([...newList, ...oldList]));
              delete map[oldName];
            }
            if (typeof idMap[oldName] === 'number') {
              if (typeof idMap[newName] !== 'number') idMap[newName] = idMap[oldName];
              delete idMap[oldName];
            }
          }

          // تطبيق تعديلات المدن من cache
          const cityRenByIdRaw = typeof window !== 'undefined' ? localStorage.getItem('admin:cityRenamesById') : null;
          const cityRenByNameRaw = typeof window !== 'undefined' ? localStorage.getItem('admin:cityRenamesByName') : null;
          const cityDelByIdRaw = typeof window !== 'undefined' ? localStorage.getItem('admin:cityDeletedById') : null;
          const cityDelByNameRaw = typeof window !== 'undefined' ? localStorage.getItem('admin:cityDeletedByName') : null;
          const cityRenById: Record<number, Record<string, string>> = cityRenByIdRaw ? JSON.parse(cityRenByIdRaw) : {};
          const cityRenByName: Record<string, Record<string, string>> = cityRenByNameRaw ? JSON.parse(cityRenByNameRaw) : {};
          const cityDelById: Record<number, string[]> = cityDelByIdRaw ? JSON.parse(cityDelByIdRaw) : {};
          const cityDelByName: Record<string, string[]> = cityDelByNameRaw ? JSON.parse(cityDelByNameRaw) : {};

          // تطبيق إعادة التسمية للمحافظات على المدن
          for (const [oldName, newName] of Object.entries(renames)) {
            if (!oldName || !newName || oldName === newName) continue;
            const renOld = cityRenByName[oldName] ?? {};
            const renNew = cityRenByName[newName] ?? {};
            if (Object.keys(renOld).length) {
              cityRenByName[newName] = { ...renNew, ...renOld };
              delete cityRenByName[oldName];
            }
            const delOld = cityDelByName[oldName] ?? [];
            const delNew = cityDelByName[newName] ?? [];
            if (Array.isArray(delOld) && delOld.length) {
              cityDelByName[newName] = Array.from(new Set([...(Array.isArray(delNew) ? delNew : []), ...delOld]));
              delete cityDelByName[oldName];
            }
          }

          // تطبيق التعديلات على المدن
          for (const [gname, gid] of Object.entries(idMap)) {
            const list = map[gname] ?? [];
            const renMap = cityRenById[gid] ?? {};
            const delList = Array.isArray(cityDelById[gid]) ? cityDelById[gid] : [];
            const renamed = list.map(x => (renMap[x] ? renMap[x] : x));
            const filtered = renamed.filter(x => !delList.includes(x));
            map[gname] = Array.from(new Set(filtered));
          }

          for (const [gname, renMap] of Object.entries(cityRenByName)) {
            const list = map[gname] ?? [];
            const renamed = list.map(x => (renMap[x] ? renMap[x] : x));
            map[gname] = Array.from(new Set(renamed));
          }

          for (const [gname, delList] of Object.entries(cityDelByName)) {
            const list = map[gname] ?? [];
            const filtered = list.filter(x => !(Array.isArray(delList) && delList.includes(x)));
            map[gname] = Array.from(new Set(filtered));
          }
        } catch (err) {
          console.warn('Failed to merge localStorage cache:', err);
        }

        setGOVERNORATES_MAP(map);
        setGOVERNORATE_IDS(idMap);
      } catch (err) {
        console.error('Failed to fetch governorates from API, trying localStorage fallback:', err);

        // Fallback: استخدام localStorage فقط في حالة فشل الـ API
        try {
          const cachedIds = typeof window !== 'undefined' ? localStorage.getItem('admin:governorateIds') : null;
          if (cachedIds) {
            try { setGOVERNORATE_IDS(JSON.parse(cachedIds as string)); } catch { }
          }

          const cachedByIdRaw = typeof window !== 'undefined' ? localStorage.getItem('admin:govCities') : null;
          const cachedByNameRaw = typeof window !== 'undefined' ? localStorage.getItem('admin:govCitiesByName') : null;

          if (cachedByIdRaw || cachedByNameRaw) {
            const map: Record<string, string[]> = {};
            const cachedById: Record<number, string[]> = cachedByIdRaw ? JSON.parse(cachedByIdRaw) : {};
            const cachedByName: Record<string, string[]> = cachedByNameRaw ? JSON.parse(cachedByNameRaw) : {};

            // بناء الـ map من cache
            for (const [name, cities] of Object.entries(cachedByName)) {
              if (cities && cities.length) map[name] = Array.from(new Set(cities));
            }

            setGOVERNORATES_MAP(map);
          }
        } catch (fallbackErr) {
          console.error('localStorage fallback also failed:', fallbackErr);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') localStorage.setItem('admin:governorateIds', JSON.stringify(GOVERNORATE_IDS));
    } catch { }
  }, [GOVERNORATE_IDS]);
  const addGovernorate = async () => {
    const name = newGovernorate.trim();
    if (!name) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
      const g = await createGovernorate(name, token);
      setGOVERNORATES_MAP(prev => ({ ...prev, [g.name]: Array.isArray(g.cities) ? g.cities : [] }));
      if (typeof g.id === 'number') setGOVERNORATE_IDS(prev => ({ ...prev, [g.name]: g.id! }));
    } catch {
      setGOVERNORATES_MAP(prev => {
        if (prev[name]) return prev;
        return { ...prev, [name]: [] };
      });
    }
    setSelectedGovernorate(name);
    setSelectedCity('');
    setNewGovernorate('');
  };
  const removeGovernorate = async (name: string) => {
    const govId = GOVERNORATE_IDS[name];
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
      if (typeof govId === 'number') {
        await deleteGovernorate(govId, token);
      }
      setGOVERNORATES_MAP(prev => {
        const n = { ...prev };
        delete n[name];
        return n;
      });
      setGOVERNORATE_IDS(prev => {
        const n = { ...prev };
        delete n[name];
        return n;
      });
      try {
        if (typeof window !== 'undefined') {
          const byNameRaw = localStorage.getItem('admin:govCitiesByName');
          const byIdRaw = localStorage.getItem('admin:govCities');
          if (byNameRaw) {
            const obj: Record<string, string[]> = JSON.parse(byNameRaw);
            delete obj[name];
            localStorage.setItem('admin:govCitiesByName', JSON.stringify(obj));
          }
          if (byIdRaw && typeof govId === 'number') {
            const objId: Record<number, string[]> = JSON.parse(byIdRaw);
            delete objId[govId];
            localStorage.setItem('admin:govCities', JSON.stringify(objId));
          }
        }
      } catch { }
      if (selectedGovernorate === name) {
        setSelectedGovernorate('');
        setSelectedCity('');
      }
      showToast('تم حذف المحافظة', 'info');
    } catch (e) {
      let msg = e instanceof Error ? e.message : 'لا يمكن حذف المحافظة لأنها مرتبطة بإعلان';
      const low = String(msg).toLowerCase();
      if (low.includes('undefined method') && low.includes('governoratecontroller::destroy')) {
        msg = 'الحذف غير متاح حاليًا: لا توجد دالة destroy على السيرفر';
      }
      showToast(msg, 'warning');
    }
  };
  const addCity = async () => {
    const name = newCity.trim();
    if (!name || !selectedGovernorate) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
      const govId = GOVERNORATE_IDS[selectedGovernorate];
      if (typeof govId === 'number') {
        const city = await createCity(govId, name, token);
        setGOVERNORATES_MAP(prev => {
          const list = prev[selectedGovernorate] ?? [];
          if (list.includes(city.name)) return prev;
          return { ...prev, [selectedGovernorate]: [...list, city.name] };
        });
        saveCitiesCacheById(govId, [city.name]);
        saveCitiesCacheByName(selectedGovernorate, [city.name]);
        if (typeof city.id === 'number') saveCityIdCache(govId, city.name, city.id);
        clearCityDeletedById(govId, city.name);
        clearCityDeletedByName(selectedGovernorate, city.name);
      } else {
        setGOVERNORATES_MAP(prev => {
          const list = prev[selectedGovernorate] ?? [];
          if (list.includes(name)) return prev;
          return { ...prev, [selectedGovernorate]: [...list, name] };
        });
        saveCitiesCacheByName(selectedGovernorate, [name]);
        clearCityDeletedByName(selectedGovernorate, name);
      }
    } catch {
      setGOVERNORATES_MAP(prev => {
        const list = prev[selectedGovernorate] ?? [];
        if (list.includes(name)) return prev;
        return { ...prev, [selectedGovernorate]: [...list, name] };
      });
      const govId = GOVERNORATE_IDS[selectedGovernorate];
      if (typeof govId === 'number') saveCitiesCacheById(govId, [name]);
      saveCitiesCacheByName(selectedGovernorate, [name]);
      const govId2 = GOVERNORATE_IDS[selectedGovernorate];
      if (typeof govId2 === 'number') clearCityDeletedById(govId2, name);
      clearCityDeletedByName(selectedGovernorate, name);
    }
    setNewCity('');
  };
  const addCitiesBulk = async () => {
    if (!selectedGovernorate) return;
    const tokens = newCitiesBulk.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
      const govId = GOVERNORATE_IDS[selectedGovernorate];
      if (typeof govId === 'number') {
        const added: string[] = [];
        for (const cityName of tokens) {
          try {
            const c = await createCity(govId, cityName, token);
            if (c?.name) added.push(c.name);
            if (typeof c?.id === 'number') saveCityIdCache(govId, c.name, c.id!);
          } catch {
            added.push(cityName);
          }
        }
        setGOVERNORATES_MAP(prev => {
          const list = prev[selectedGovernorate] ?? [];
          const merged = Array.from(new Set([...list, ...added]));
          return { ...prev, [selectedGovernorate]: merged };
        });
        saveCitiesCacheById(govId, added);
        saveCitiesCacheByName(selectedGovernorate, added);
        for (const cityName of added) {
          clearCityDeletedById(govId, cityName);
          clearCityDeletedByName(selectedGovernorate, cityName);
        }
      } else {
        setGOVERNORATES_MAP(prev => {
          const list = prev[selectedGovernorate] ?? [];
          const merged = Array.from(new Set([...list, ...tokens]));
          return { ...prev, [selectedGovernorate]: merged };
        });
        saveCitiesCacheByName(selectedGovernorate, tokens);
        for (const cityName of tokens) {
          clearCityDeletedByName(selectedGovernorate, cityName);
        }
      }
    } catch {
      setGOVERNORATES_MAP(prev => {
        const list = prev[selectedGovernorate] ?? [];
        const merged = Array.from(new Set([...list, ...tokens]));
        return { ...prev, [selectedGovernorate]: merged };
      });
      const govId = GOVERNORATE_IDS[selectedGovernorate];
      if (typeof govId === 'number') saveCitiesCacheById(govId, tokens);
      saveCitiesCacheByName(selectedGovernorate, tokens);
      const gid = GOVERNORATE_IDS[selectedGovernorate];
      for (const cityName of tokens) {
        if (typeof gid === 'number') clearCityDeletedById(gid, cityName);
        clearCityDeletedByName(selectedGovernorate, cityName);
      }
    }
    setNewCitiesBulk('');
  };
  const removeCity = async (name: string) => {
    if (!selectedGovernorate) return;
    const linked = selectedCity === name;
    if (linked) { showToast('مرتبط بداتا إعلان، يمكنك التعديل بدلًا من الحذف', 'warning'); return; }
    let cityId = getCityId(selectedGovernorate, name);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
      if (typeof cityId === 'number') {
        await deleteCity(cityId, token);
      }
      else {
        cityId = await resolveCityId(selectedGovernorate, name);
        if (typeof cityId === 'number') {
          await deleteCity(cityId, token);
        }
      }
      setGOVERNORATES_MAP(prev => {
        const list = prev[selectedGovernorate] ?? [];
        return { ...prev, [selectedGovernorate]: list.filter(x => x !== name) };
      });
      const govId = GOVERNORATE_IDS[selectedGovernorate];
      if (typeof govId === 'number') deleteCityIdCache(govId, name);
      if (typeof govId === 'number') saveCityDeletedById(govId, name);
      saveCityDeletedByName(selectedGovernorate, name);
      if (selectedCity === name) setSelectedCity('');
      showToast('تم حذف المدينة', 'info');
    } catch (e) {
      let msg = e instanceof Error ? e.message : 'تعذر حذف المدينة';
      const low = String(msg).toLowerCase();
      if (low.includes('undefined method') && low.includes('cities::destroy')) {
        msg = 'الحذف غير متاح حاليًا: لا توجد دالة destroy للمدينة على السيرفر';
      }
      showToast(msg, 'warning');
    }
  };
  // دالة بسيطة لترتيب المفاتيح مع وضع "غير ذلك" في الآخر
  const sortKeysWithOtherAtEnd = (obj: Record<string, any>): string[] => {
    const keys = Object.keys(obj);
    const otherKey = 'غير ذلك';
    const filtered = keys.filter(k => k !== otherKey);
    // ترتيب عكسي (من ي إلى أ)
    filtered.sort((a, b) => b.localeCompare(a, 'ar'));
    // إضافة "غير ذلك" في الآخر إذا كانت موجودة
    if (keys.includes(otherKey)) {
      filtered.push(otherKey);
    }
    return filtered;
  };

  const models = selectedBrand ? BRANDS_MODELS[selectedBrand] ?? [] : [];
  const rentalModels = selectedRentalBrand ? RENTAL_BRANDS_MODELS[selectedRentalBrand] ?? [] : [];
  const partsModels = selectedPartsBrand ? PARTS_BRANDS_MODELS[selectedPartsBrand] ?? [] : [];
  const partsSubs = selectedPartsMain ? PARTS_MAIN_SUBS[selectedPartsMain] ?? [] : [];
  const animalSubs = selectedAnimalMain ? ANIMALS_MAIN_SUBS[selectedAnimalMain] ?? [] : [];
  const foodSubs = selectedFoodMain ? FOOD_MAIN_SUBS[selectedFoodMain] ?? [] : [];
  const restaurantSubs = selectedRestaurantMain ? RESTAURANTS_MAIN_SUBS[selectedRestaurantMain] ?? [] : [];
  const storeSubs = selectedStoreMain ? STORES_MAIN_SUBS[selectedStoreMain] ?? [] : [];
  const grocerySubs = selectedGroceryMain ? GROCERIES_MAIN_SUBS[selectedGroceryMain] ?? [] : [];
  const homeServiceSubs = selectedHomeServiceMain ? HOME_SERVICES_MAIN_SUBS[selectedHomeServiceMain] ?? [] : [];
  const furnitureSubs = selectedFurnitureMain ? FURNITURE_MAIN_SUBS[selectedFurnitureMain] ?? [] : [];
  const householdToolSubs = selectedHouseholdToolMain ? HOUSEHOLD_TOOLS_MAIN_SUBS[selectedHouseholdToolMain] ?? [] : [];
  const homeApplianceSubs = selectedHomeApplianceMain ? HOME_APPLIANCES_MAIN_SUBS[selectedHomeApplianceMain] ?? [] : [];
  const electronicsSubs = selectedElectronicsMain ? ELECTRONICS_MAIN_SUBS[selectedElectronicsMain] ?? [] : [];
  const healthSubs = selectedHealthMain ? HEALTH_MAIN_SUBS[selectedHealthMain] ?? [] : [];
  const educationSubs = selectedEducationMain ? EDUCATION_MAIN_SUBS[selectedEducationMain] ?? [] : [];
  const shippingSubs = selectedShippingMain ? SHIPPING_MAIN_SUBS[selectedShippingMain] ?? [] : [];
  const mensClothingShoesSubs = selectedMensClothingShoesMain ? MENS_CLOTHING_SHOES_MAIN_SUBS[selectedMensClothingShoesMain] ?? [] : [];
  const heavyEquipmentSubs = selectedHeavyEquipmentMain ? HEAVY_EQUIPMENT_MAIN_SUBS[selectedHeavyEquipmentMain] ?? [] : [];
  const kidsSuppliesToysSubs = selectedKidsSuppliesToysMain ? KIDS_SUPPLIES_TOYS_MAIN_SUBS[selectedKidsSuppliesToysMain] ?? [] : [];
  const freelanceServicesSubs = selectedFreelanceServicesMain ? FREELANCE_SERVICES_MAIN_SUBS[selectedFreelanceServicesMain] ?? [] : [];
  const watchesJewelrySubs = selectedWatchesJewelryMain ? WATCHES_JEWELRY_MAIN_SUBS[selectedWatchesJewelryMain] ?? [] : [];
  const carServicesSubs = selectedCarServicesMain ? CAR_SERVICES_MAIN_SUBS[selectedCarServicesMain] ?? [] : [];
  const generalMaintenanceSubs = selectedGeneralMaintenanceMain ? GENERAL_MAINTENANCE_MAIN_SUBS[selectedGeneralMaintenanceMain] ?? [] : [];
  const constructionToolsSubs = selectedConstructionToolsMain ? CONSTRUCTION_TOOLS_MAIN_SUBS[selectedConstructionToolsMain] ?? [] : [];
  const gymsSubs = selectedGymsMain ? GYMS_MAIN_SUBS[selectedGymsMain] ?? [] : [];
  const bikesLightVehiclesSubs = selectedBikesLightVehiclesMain ? BIKES_LIGHT_VEHICLES_MAIN_SUBS[selectedBikesLightVehiclesMain] ?? [] : [];
  const materialsProductionLinesSubs = selectedMaterialsProductionLinesMain ? MATERIALS_PRODUCTION_LINES_MAIN_SUBS[selectedMaterialsProductionLinesMain] ?? [] : [];
  const farmsFactoriesProductsSubs = selectedFarmsFactoriesProductsMain ? FARMS_FACTORIES_PRODUCTS_MAIN_SUBS[selectedFarmsFactoriesProductsMain] ?? [] : [];
  const lightingDecorSubs = selectedLightingDecorMain ? LIGHTING_DECOR_MAIN_SUBS[selectedLightingDecorMain] ?? [] : [];
  const missingSubs = selectedMissingMain ? MISSING_MAIN_SUBS[selectedMissingMain] ?? [] : [];
  const toolsSuppliesSubs = selectedToolsSuppliesMain ? TOOLS_SUPPLIES_MAIN_SUBS[selectedToolsSuppliesMain] ?? [] : [];
  const wholesaleSubs = selectedWholesaleMain ? WHOLESALE_MAIN_SUBS[selectedWholesaleMain] ?? [] : [];
  const YEAR_OPTIONS = Array.from({ length: new Date().getFullYear() - 1950 + 1 }, (_, i) => String(1950 + i)).reverse();
  const [yearOptions, setYearOptions] = useState<string[]>([]);
  const [kmOptions, setKmOptions] = useState<string[]>([]);
  const [carTypeOptions, setCarTypeOptions] = useState<string[]>([]);
  const [exteriorColorOptions, setExteriorColorOptions] = useState<string[]>([]);
  const [transmissionOptions, setTransmissionOptions] = useState<string[]>([]);
  const [fuelOptions, setFuelOptions] = useState<string[]>([]);
  const [rentalYearOptions, setRentalYearOptions] = useState<string[]>([]);
  const ManagedSelect = ({ options, value, onChange, onDelete, onEdit, disabled, placeholder }: { options: string[]; value: string; onChange: (v: string) => void; onDelete: (v: string) => void; onEdit?: (prev: string, next: string) => void; disabled?: boolean; placeholder?: string }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState<string>('');
    useEffect(() => {
      const h = (e: MouseEvent) => {
        if (!ref.current) return;
        const t = e.target as Node;
        if (!ref.current.contains(t)) setOpen(false);
      };
      document.addEventListener('mousedown', h);
      return () => document.removeEventListener('mousedown', h);
    }, []);
    return (
      <div className={`managed-select ${disabled ? 'disabled' : ''}`} ref={ref}>
        <button type="button" className="managed-select-toggle" disabled={disabled} onClick={() => setOpen((p) => !p)}>
          <span className={`managed-select-value ${value ? 'filled' : ''}`}>{value || placeholder || 'اختر'}</span>
          <span className={`managed-select-caret ${open ? 'open' : ''}`}>▾</span>
        </button>
        {open && (
          <div className="managed-select-menu">
            {options.length === 0 ? (
              <div className="managed-select-empty">لا توجد عناصر</div>
            ) : (
              options.map((opt) => (
                <div key={opt} className={`managed-select-item ${value === opt ? 'selected' : ''}`} onClick={() => { if (!editingKey) { onChange(opt); setOpen(false); } }}>
                  {editingKey === opt ? (
                    <div className="managed-select-editing">
                      <input className="form-input" value={editingValue} onChange={(e) => setEditingValue(e.target.value)} />
                      <button type="button" className="managed-select-save" onClick={(e) => { e.stopPropagation(); const next = editingValue.trim(); if (!next) return; onEdit?.(opt, next); setEditingKey(null); setEditingValue(''); }}>
                        حفظ
                      </button>
                      <button type="button" className="managed-select-cancel" onClick={(e) => { e.stopPropagation(); setEditingKey(null); setEditingValue(''); }}>
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="managed-select-text">{opt}</span>
                      <div className="managed-select-actions">
                        <button type="button" className="managed-select-edit" onClick={(e) => { e.stopPropagation(); setEditingKey(opt); setEditingValue(opt); }}>
                          تعديل
                        </button>
                        <button type="button" className="managed-select-delete" onClick={(e) => { e.stopPropagation(); onDelete(opt); }}>
                          حذف
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  const handleManageSave = () => {
    setManagingCategoryId(null);
  };

  const handleStatusToggle = async (id: number) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
    const prev = categories.find(c => c.id === id);
    const desired = prev?.status === 'active' ? false : true;
    try {
      const updated = await updateAdminCategoryActive(id, desired, token);
      setCategories(prevList => prevList.map(cat => (
        cat.id === id
          ? { ...cat, status: updated.is_active ? 'active' : 'disabled' }
          : cat
      )));
      showToast('تم تحديث الحالة', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في تحديث الحالة');
      showToast(msg, 'error');
    }
  };

  const handleHomepageToggle = async (id: number) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
    const prev = categories.find(c => c.id === id);
    const desired = prev ? !prev.showOnHomepage : true;
    try {
      const updated = await updateAdminCategoryActive(id, desired, token);
      setCategories(prevList => prevList.map(cat => (
        cat.id === id
          ? { ...cat, showOnHomepage: !!updated.is_active, status: updated.is_active ? 'active' : 'disabled', homepageImage: updated.homepage_image || cat.homepageImage }
          : cat
      )));
      showToast('تم تحديث الظهور', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في تحديث الظهور');
      showToast(msg, 'error');
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('هل أنت متأكد من حذف هذا القسم؟')) {
      setCategories(prev => prev.filter(cat => cat.id !== id));
    }
  };

  const addBrand = async () => {
    const name = newBrand.trim();
    if (!name) return;
    try {
      const created = await postAdminMake(name);
      propagateBrandAdd(created.name, created.id);
      setSelectedBrand(created.name);
      setNewBrand('');
      showToast('تم إضافة الماركة', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في إضافة الماركة');
      showToast(msg, 'error');
    }
  };

  const removeBrand = async (name: string) => {
    const id = await ensureMakeId(name);
    if (!id) return;
    try {
      await deleteAdminMake(id);
      propagateBrandDelete(name);
      showToast('تم حذف الماركة', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في حذف الماركة');
      showToast(msg, 'error');
    }
  };
  const renameBrand = async (prevName: string, nextRaw: string) => {
    const next = nextRaw.trim();
    if (!next || prevName === next) return;
    const id = await ensureMakeId(prevName);
    if (!id) return;
    try {
      await updateAdminMake(id, next);
      propagateBrandRename(prevName, next, id);
      showToast('تم تعديل الماركة', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في تعديل الماركة');
      showToast(msg, 'error');
    }
  };

  const addModelsBulk = async () => {
    if (!selectedBrand) return;
    const raw = newModelsBulk;
    const tokens = raw
      .split(/[\,\n،]/)
      .map(t => t.trim())
      .filter(t => t.length > 0);
    if (tokens.length === 0) return;
    const makeId = await ensureMakeId(selectedBrand);
    if (!makeId) return;
    try {
      const resp = await postAdminMakeModels(makeId, tokens);
      const createdNames = Array.isArray(resp.models) ? resp.models.map(m => String(m.name).trim()).filter(Boolean) : tokens;
      const idMap: Record<string, number> = {};
      const arr = Array.isArray(resp.models) ? resp.models : [];
      for (const it of arr) {
        const nm = String(it?.name || '').trim();
        const mid = typeof it?.id === 'number' ? it.id : undefined;
        if (nm && typeof mid === 'number') idMap[nm] = mid;
      }
      propagateModelsAdded(selectedBrand, createdNames, idMap);
      setSelectedModel('');
      setNewModelsBulk('');
      showToast('تم تسليم الموديلات', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في إضافة الموديلات');
      showToast(msg, 'error');
    }
  };

  const removeModel = async (m: string) => {
    if (!selectedBrand) return;
    const makeId = await ensureMakeId(selectedBrand);
    if (!makeId) return;
    let modelId = MODEL_IDS_BY_BRAND[selectedBrand]?.[m];
    if (typeof modelId !== 'number') {
      try {
        const list = await fetchMakeModels(makeId);
        const found = list.find(it => String(it?.name || '').trim() === m);
        if (found && typeof found.id === 'number') {
          modelId = found.id;
          setMODEL_IDS_BY_BRAND(prev => ({ ...prev, [selectedBrand]: { ...(prev[selectedBrand] ?? {}), [m]: modelId as number } }));
        }
      } catch { }
    }
    if (typeof modelId !== 'number') { showToast('تعذر الحصول على معرف الموديل', 'error'); return; }
    try {
      await deleteAdminModel(modelId);
      propagateModelDelete(selectedBrand, m);
      showToast('تم حذف الموديل', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في حذف الموديل');
      showToast(msg, 'error');
    }
  };
  const renameModel = async (prevName: string, nextRaw: string) => {
    const next = nextRaw.trim();
    if (!next || prevName === next || !selectedBrand) return;
    const makeId = await ensureMakeId(selectedBrand);
    if (!makeId) return;
    let modelId = MODEL_IDS_BY_BRAND[selectedBrand]?.[prevName];
    if (typeof modelId !== 'number') {
      try {
        const list = await fetchMakeModels(makeId);
        const found = list.find(it => String(it?.name || '').trim() === prevName);
        if (found && typeof found.id === 'number') {
          modelId = found.id;
        }
      } catch { }
    }
    if (typeof modelId !== 'number') { showToast('تعذر الحصول على معرف الموديل', 'error'); return; }
    try {
      await updateAdminModel(modelId, next, makeId);
      propagateModelRename(selectedBrand, prevName, next);
      showToast('تم تعديل الموديل', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في تعديل الموديل');
      showToast(msg, 'error');
    }
  };

  const handleSaveModelsRanks = async (reorderedModels: string[]) => {
    if (!selectedBrand) return;
    const category = categories.find(c => c.slug === 'cars');
    if (!category?.slug) return;

    try {
      await updateOptionRanksWithRetry(category.slug, 'model', reorderedModels);
      showToast('تم حفظ الترتيب', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في حفظ الترتيب');
      showToast(msg, 'error');
      throw err;
    }
  };
  const addPartsBrand = async () => {
    const name = newPartsBrand.trim();
    if (!name) return;
    try {
      const created = await postAdminMake(name);
      propagateBrandAdd(created.name, created.id);
      setSelectedPartsBrand(created.name);
      setNewPartsBrand('');
      showToast('تم إضافة الماركة', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في إضافة الماركة');
      showToast(msg, 'error');
    }
  };
  const removePartsBrand = async (name: string) => {
    const id = await ensureMakeId(name);
    if (!id) return;
    try {
      await deleteAdminMake(id);
      propagateBrandDelete(name);
      showToast('تم حذف الماركة', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في حذف الماركة');
      showToast(msg, 'error');
    }
  };
  const addPartsModelsBulk = async () => {
    if (!selectedPartsBrand) return;
    const raw = newPartsModelsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    const makeId = await ensureMakeId(selectedPartsBrand);
    if (!makeId) return;
    try {
      const resp = await postAdminMakeModels(makeId, tokens);
      const createdNames = Array.isArray(resp.models) ? resp.models.map(m => String(m.name).trim()).filter(Boolean) : tokens;
      const idMap: Record<string, number> = {};
      const arr = Array.isArray(resp.models) ? resp.models : [];
      for (const it of arr) {
        const nm = String(it?.name || '').trim();
        const mid = typeof it?.id === 'number' ? it.id : undefined;
        if (nm && typeof mid === 'number') idMap[nm] = mid;
      }
      propagateModelsAdded(selectedPartsBrand, createdNames, idMap);
      setSelectedPartsModel('');
      setNewPartsModelsBulk('');
      showToast('تم تسليم الموديلات', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في إضافة الموديلات');
      showToast(msg, 'error');
    }
  };
  const removePartsModel = async (m: string) => {
    if (!selectedPartsBrand) return;
    const makeId = await ensureMakeId(selectedPartsBrand);
    if (!makeId) return;
    let modelId = MODEL_IDS_BY_BRAND[selectedPartsBrand]?.[m];
    if (typeof modelId !== 'number') {
      try {
        const list = await fetchMakeModels(makeId);
        const found = list.find(it => String(it?.name || '').trim() === m);
        if (found && typeof found.id === 'number') {
          modelId = found.id;
          setMODEL_IDS_BY_BRAND(prev => ({ ...prev, [selectedPartsBrand]: { ...(prev[selectedPartsBrand] ?? {}), [m]: modelId as number } }));
        }
      } catch { }
    }
    if (typeof modelId !== 'number') { showToast('تعذر الحصول على معرف الموديل', 'error'); return; }
    try {
      await deleteAdminModel(modelId);
      propagateModelDelete(selectedPartsBrand, m);
      showToast('تم حذف الموديل', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في حذف الموديل');
      showToast(msg, 'error');
    }
  };

  const renamePartsBrand = async (prevName: string, nextRaw: string) => {
    const next = nextRaw.trim();
    if (!next || prevName === next) return;
    const id = await ensureMakeId(prevName);
    if (!id) return;
    try {
      await updateAdminMake(id, next);
      propagateBrandRename(prevName, next, id);
      showToast('تم تعديل الماركة', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في تعديل الماركة');
      showToast(msg, 'error');
    }
  };

  const renamePartsModel = async (prevName: string, nextRaw: string) => {
    const next = nextRaw.trim();
    if (!next || prevName === next || !selectedPartsBrand) return;
    const makeId = await ensureMakeId(selectedPartsBrand);
    if (!makeId) return;
    let modelId = MODEL_IDS_BY_BRAND[selectedPartsBrand]?.[prevName];
    if (typeof modelId !== 'number') {
      try {
        const list = await fetchMakeModels(makeId);
        const found = list.find(it => String(it?.name || '').trim() === prevName);
        if (found && typeof found.id === 'number') {
          modelId = found.id;
        }
      } catch { }
    }
    if (typeof modelId !== 'number') { showToast('تعذر الحصول على معرف الموديل', 'error'); return; }
    try {
      await updateAdminModel(modelId, next, makeId);
      propagateModelRename(selectedPartsBrand, prevName, next);
      showToast('تم تعديل الموديل', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في تعديل الموديل');
      showToast(msg, 'error');
    }
  };
  const addPartsMain = () => {
    const name = newPartsMain.trim();
    if (!name) return;
    handleAddMain('spare-parts', name, setPARTS_MAIN_SUBS, setSelectedPartsMain, () => setNewPartsMain(''));
  };
  const removePartsMain = (name: string) => {
    handleDeleteMain('spare-parts', name, setPARTS_MAIN_SUBS, selectedPartsMain, setSelectedPartsMain);
  };
  const addPartsSubsBulk = () => {
    if (!selectedPartsMain) return;
    const raw = newPartsSubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('spare-parts', selectedPartsMain, tokens, setPARTS_MAIN_SUBS, setSelectedPartsSub, () => setNewPartsSubsBulk(''));
  };
  const removePartsSub = (s: string) => {
    if (!selectedPartsMain) return;
    handleDeleteSub('spare-parts', selectedPartsMain, s, setPARTS_MAIN_SUBS, selectedPartsSub, setSelectedPartsSub);
  };
  const renamePartsMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('spare-parts', prevName, nextRaw, setPARTS_MAIN_SUBS, selectedPartsMain, setSelectedPartsMain);
  };
  const renamePartsSub = (prevName: string, nextRaw: string) => {
    handleRenameSub('spare-parts', selectedPartsMain, prevName, nextRaw, setPARTS_MAIN_SUBS, selectedPartsSub, setSelectedPartsSub);
  };
  const addAnimalMain = () => {
    const name = newAnimalMain.trim();
    if (!name) return;
    handleAddMain('animals', name, setANIMALS_MAIN_SUBS, setSelectedAnimalMain, () => setNewAnimalMain(''));
  };
  const renameAnimalMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('animals', prevName, nextRaw, setANIMALS_MAIN_SUBS, selectedAnimalMain, setSelectedAnimalMain);
  };
  const removeAnimalMain = (name: string) => {
    handleDeleteMain('animals', name, setANIMALS_MAIN_SUBS, selectedAnimalMain, setSelectedAnimalMain);
  };
  const addAnimalSubsBulk = () => {
    if (!selectedAnimalMain) return;
    const raw = newAnimalSubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('animals', selectedAnimalMain, tokens, setANIMALS_MAIN_SUBS, setSelectedAnimalSub, () => setNewAnimalSubsBulk(''));
  };
  const removeAnimalSub = (s: string) => {
    if (!selectedAnimalMain) return;
    handleDeleteSub('animals', selectedAnimalMain, s, setANIMALS_MAIN_SUBS, selectedAnimalSub, setSelectedAnimalSub);
  };
  const renameAnimalSub = (prevName: string, nextRaw: string) => {
    handleRenameSub('animals', selectedAnimalMain, prevName, nextRaw, setANIMALS_MAIN_SUBS, selectedAnimalSub, setSelectedAnimalSub);
  };

  const addRentalBrand = async () => {
    const name = newRentalBrand.trim();
    if (!name) return;
    try {
      const created = await postAdminMake(name);
      propagateBrandAdd(created.name, created.id);
      setSelectedRentalBrand(created.name);
      setNewRentalBrand('');
      showToast('تم إضافة الماركة', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في إضافة الماركة');
      showToast(msg, 'error');
    }
  };

  const removeRentalBrand = async (name: string) => {
    const id = await ensureMakeId(name);
    if (!id) return;
    try {
      await deleteAdminMake(id);
      propagateBrandDelete(name);
      showToast('تم حذف الماركة', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في حذف الماركة');
      showToast(msg, 'error');
    }
  };

  const renameRentalBrand = async (prevName: string, nextRaw: string) => {
    const next = nextRaw.trim();
    if (!next || prevName === next) return;
    const id = await ensureMakeId(prevName);
    if (!id) return;
    try {
      await updateAdminMake(id, next);
      propagateBrandRename(prevName, next, id);
      showToast('تم تعديل الماركة', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في تعديل الماركة');
      showToast(msg, 'error');
    }
  };

  const addRentalModelsBulk = async () => {
    if (!selectedRentalBrand) return;
    const raw = newRentalModelsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    const makeId = await ensureMakeId(selectedRentalBrand);
    if (!makeId) return;
    try {
      const resp = await postAdminMakeModels(makeId, tokens);
      const createdNames = Array.isArray(resp.models) ? resp.models.map(m => String(m.name).trim()).filter(Boolean) : tokens;
      const idMap: Record<string, number> = {};
      const arr = Array.isArray(resp.models) ? resp.models : [];
      for (const it of arr) {
        const nm = String(it?.name || '').trim();
        const mid = typeof it?.id === 'number' ? it.id : undefined;
        if (nm && typeof mid === 'number') idMap[nm] = mid;
      }
      propagateModelsAdded(selectedRentalBrand, createdNames, idMap);
      setSelectedRentalModel('');
      setNewRentalModelsBulk('');
      showToast('تم تسليم الموديلات', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في إضافة الموديلات');
      showToast(msg, 'error');
    }
  };

  const removeRentalModel = async (m: string) => {
    if (!selectedRentalBrand) return;
    const makeId = await ensureMakeId(selectedRentalBrand);
    if (!makeId) return;
    let modelId = MODEL_IDS_BY_BRAND[selectedRentalBrand]?.[m];
    if (typeof modelId !== 'number') {
      try {
        const list = await fetchMakeModels(makeId);
        const found = list.find(it => String(it?.name || '').trim() === m);
        if (found && typeof found.id === 'number') {
          modelId = found.id;
          setMODEL_IDS_BY_BRAND(prev => ({ ...prev, [selectedRentalBrand]: { ...(prev[selectedRentalBrand] ?? {}), [m]: modelId as number } }));
        }
      } catch { }
    }
    if (typeof modelId !== 'number') { showToast('تعذر الحصول على معرف الموديل', 'error'); return; }
    try {
      await deleteAdminModel(modelId);
      propagateModelDelete(selectedRentalBrand, m);
      showToast('تم حذف الموديل', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في حذف الموديل');
      showToast(msg, 'error');
    }
  };

  const renameRentalModel = async (prevName: string, nextRaw: string) => {
    const next = nextRaw.trim();
    if (!next || prevName === next || !selectedRentalBrand) return;
    const makeId = await ensureMakeId(selectedRentalBrand);
    if (!makeId) return;
    let modelId = MODEL_IDS_BY_BRAND[selectedRentalBrand]?.[prevName];
    if (typeof modelId !== 'number') {
      try {
        const list = await fetchMakeModels(makeId);
        const found = list.find(it => String(it?.name || '').trim() === prevName);
        if (found && typeof found.id === 'number') {
          modelId = found.id;
        }
      } catch { }
    }
    if (typeof modelId !== 'number') { showToast('تعذر الحصول على معرف الموديل', 'error'); return; }
    try {
      await updateAdminModel(modelId, next, makeId);
      propagateModelRename(selectedRentalBrand, prevName, next);
      showToast('تم تعديل الموديل', 'success');
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في تعديل الموديل');
      showToast(msg, 'error');
    }
  };

  const addRentalYearOption = () => {
    const v = newRentalYear.trim();
    if (!v) return;
    const next = (rentalYearOptions.includes(v) ? rentalYearOptions : [v, ...rentalYearOptions]).sort((a, b) => Number(b) - Number(a));
    setRentalYearOptions(next);
    updateOptionsWithToast('cars_rent', rentalYearKey, next, 'تم إضافة السنة');
    setNewRentalYear('');
  };

  const deleteSelectedRentalYearOption = () => {
    const v = rentalYear;
    if (!v) return;
    const next = rentalYearOptions.filter(x => x !== v);
    setRentalYearOptions(next);
    updateOptionsWithToast('cars_rent', rentalYearKey, next, 'تم حذف السنة');
    setRentalYear('');
  };
  const deleteRentalYearOption = (opt: string) => {
    const next = rentalYearOptions.filter(x => x !== opt);
    setRentalYearOptions(next);
    updateOptionsWithToast('cars_rent', rentalYearKey, next, 'تم حذف السنة');
    if (rentalYear === opt) setRentalYear('');
  };
  const renameRentalYearOption = (prev: string, nextRaw: string) => {
    const n = nextRaw.trim();
    if (!n || prev === n) return;
    const next = rentalYearOptions.map(x => (x === prev ? n : x)).sort((a, b) => Number(b) - Number(a));
    setRentalYearOptions(next);
    updateOptionsWithToast('cars_rent', rentalYearKey, next, 'تم تعديل السنة');
    if (rentalYear === prev) setRentalYear(n);
  };

  const addDriverOption = () => {
    const v = newDriverVal.trim();
    if (!v) return;
    const next = driverOptions.includes(v) ? driverOptions : [...driverOptions, v];
    setDriverOptions(next);
    updateOptionsWithToast('cars_rent', driverKey, next, 'تم إضافة خيار السائق');
    setNewDriverVal('');
  };

  const deleteSelectedDriverOption = () => {
    const v = driver;
    if (!v) return;
    const next = driverOptions.filter(x => x !== v);
    setDriverOptions(next);
    updateOptionsWithToast('cars_rent', driverKey, next, 'تم حذف خيار السائق');
    setDriver('');
  };
  const deleteDriverOption = (opt: string) => {
    const next = driverOptions.filter(x => x !== opt);
    setDriverOptions(next);
    updateOptionsWithToast('cars_rent', driverKey, next, 'تم حذف خيار السائق');
    if (driver === opt) setDriver('');
  };
  const renameDriverOption = (prev: string, nextRaw: string) => {
    const n = nextRaw.trim();
    if (!n || prev === n) return;
    const next = driverOptions.map(x => (x === prev ? n : x));
    setDriverOptions(next);
    updateOptionsWithToast('cars_rent', driverKey, next, 'تم تعديل خيار السائق');
    if (driver === prev) setDriver(n);
  };

  const addPropertyTypeOption = () => {
    const v = newPropertyTypeVal.trim();
    if (!v) return;
    const next = propertyTypeOptions.includes(v) ? propertyTypeOptions : [...propertyTypeOptions, v];
    setPropertyTypeOptions(next);
    updateOptionsWithToast('real_estate', realPropertyKey, next, 'تم إضافة نوع العقار');
    setNewPropertyTypeVal('');
  };

  const deleteSelectedPropertyTypeOption = () => {
    const v = propertyType;
    if (!v) return;
    const next = propertyTypeOptions.filter(x => x !== v);
    setPropertyTypeOptions(next);
    updateOptionsWithToast('real_estate', realPropertyKey, next, 'تم حذف نوع العقار');
    setPropertyType('');
  };
  const deletePropertyTypeOptionDirect = (opt: string) => {
    const next = propertyTypeOptions.filter(x => x !== opt);
    setPropertyTypeOptions(next);
    updateOptionsWithToast('real_estate', realPropertyKey, next, 'تم حذف نوع العقار');
    if (propertyType === opt) setPropertyType('');
  };
  const renamePropertyTypeOption = (prev: string, nextRaw: string) => {
    const n = nextRaw.trim();
    if (!n || prev === n) return;
    const next = propertyTypeOptions.map(x => (x === prev ? n : x));
    setPropertyTypeOptions(next);
    updateOptionsWithToast('real_estate', realPropertyKey, next, 'تم تعديل نوع العقار');
    if (propertyType === prev) setPropertyType(n);
  };

  const addContractTypeOption = () => {
    const v = newContractTypeVal.trim();
    if (!v) return;
    const next = contractTypeOptions.includes(v) ? contractTypeOptions : [...contractTypeOptions, v];
    setContractTypeOptions(next);
    updateOptionsWithToast('real_estate', realContractKey, next, 'تم إضافة نوع العقد');
    setNewContractTypeVal('');
  };

  const deleteSelectedContractTypeOption = () => {
    const v = contractType;
    if (!v) return;
    const next = contractTypeOptions.filter(x => x !== v);
    setContractTypeOptions(next);
    updateOptionsWithToast('real_estate', realContractKey, next, 'تم حذف نوع العقد');
    setContractType('');
  };
  const deleteContractTypeOptionDirect = (opt: string) => {
    const next = contractTypeOptions.filter(x => x !== opt);
    setContractTypeOptions(next);
    updateOptionsWithToast('real_estate', realContractKey, next, 'تم حذف نوع العقد');
    if (contractType === opt) setContractType('');
  };
  const renameContractTypeOption = (prev: string, nextRaw: string) => {
    const n = nextRaw.trim();
    if (!n || prev === n) return;
    const next = contractTypeOptions.map(x => (x === prev ? n : x));
    setContractTypeOptions(next);
    updateOptionsWithToast('real_estate', realContractKey, next, 'تم تعديل نوع العقد');
    if (contractType === prev) setContractType(n);
  };

  const addYearOption = () => {
    const v = newYear.trim();
    if (!v) return;
    const next = (yearOptions.includes(v) ? yearOptions : [v, ...yearOptions]).sort((a, b) => Number(b) - Number(a));
    setYearOptions(next);
    updateOptionsWithToast('cars', carsYearKey, next, 'تم إضافة السنة');
    setNewYear('');
  };

  const deleteSelectedYearOption = () => {
    const v = manufactureYear;
    if (!v) return;
    const next = yearOptions.filter(x => x !== v);
    setYearOptions(next);
    updateOptionsWithToast('cars', carsYearKey, next, 'تم حذف السنة');
    setManufactureYear('');
  };
  const deleteYearOption = (opt: string) => {
    const next = yearOptions.filter(x => x !== opt);
    setYearOptions(next);
    updateOptionsWithToast('cars', carsYearKey, next, 'تم حذف السنة');
    if (manufactureYear === opt) setManufactureYear('');
  };
  const renameYearOption = (prev: string, nextRaw: string) => {
    const n = nextRaw.trim();
    if (!n || prev === n) return;
    const next = yearOptions.map(x => (x === prev ? n : x)).sort((a, b) => Number(b) - Number(a));
    setYearOptions(next);
    updateOptionsWithToast('cars', carsYearKey, next, 'تم تعديل السنة');
    if (manufactureYear === prev) setManufactureYear(n);
  };

  const addKmOption = () => {
    const v = newKm.trim();
    if (!v) return;
    const next = kmOptions.includes(v) ? kmOptions : [...kmOptions, v];
    setKmOptions(next);
    updateOptionsWithToast('cars', carsKmKey, next, 'تم إضافة الكيلومترات');
    setNewKm('');
  };

  const deleteSelectedKmOption = () => {
    const v = kilometersRange;
    if (!v) return;
    const next = kmOptions.filter(x => x !== v);
    setKmOptions(next);
    updateOptionsWithToast('cars', carsKmKey, next, 'تم حذف الكيلومترات');
    setKilometersRange('');
  };
  const deleteKmOption = (opt: string) => {
    const next = kmOptions.filter(x => x !== opt);
    setKmOptions(next);
    updateOptionsWithToast('cars', carsKmKey, next, 'تم حذف الكيلومترات');
    if (kilometersRange === opt) setKilometersRange('');
  };
  const renameKmOption = (prev: string, nextRaw: string) => {
    const n = nextRaw.trim();
    if (!n || prev === n) return;
    const next = kmOptions.map(x => (x === prev ? n : x));
    setKmOptions(next);
    updateOptionsWithToast('cars', carsKmKey, next, 'تم تعديل الكيلومترات');
    if (kilometersRange === prev) setKilometersRange(n);
  };

  const addCarTypeOption = () => {
    const v = newCarTypeVal.trim();
    if (!v) return;
    const next = carTypeOptions.includes(v) ? carTypeOptions : [...carTypeOptions, v];
    setCarTypeOptions(next);
    updateOptionsWithToast('cars', carsTypeKey, next, 'تم إضافة نوع السيارة');
    setNewCarTypeVal('');
  };

  const deleteSelectedCarTypeOption = () => {
    const v = carType;
    if (!v) return;
    const next = carTypeOptions.filter(x => x !== v);
    setCarTypeOptions(next);
    updateOptionsWithToast('cars', carsTypeKey, next, 'تم حذف نوع السيارة');
    setCarType('');
  };
  const deleteCarTypeOption = (opt: string) => {
    const next = carTypeOptions.filter(x => x !== opt);
    setCarTypeOptions(next);
    updateOptionsWithToast('cars', carsTypeKey, next, 'تم حذف نوع السيارة');
    if (carType === opt) setCarType('');
  };
  const renameCarTypeOption = (prev: string, nextRaw: string) => {
    const n = nextRaw.trim();
    if (!n || prev === n) return;
    const next = carTypeOptions.map(x => (x === prev ? n : x));
    setCarTypeOptions(next);
    updateOptionsWithToast('cars', carsTypeKey, next, 'تم تعديل نوع السيارة');
    if (carType === prev) setCarType(n);
  };

  const addExteriorColorOption = () => {
    const v = newExteriorColorVal.trim();
    if (!v) return;
    const next = exteriorColorOptions.includes(v) ? exteriorColorOptions : [...exteriorColorOptions, v];
    setExteriorColorOptions(next);
    updateOptionsWithToast('cars', carsExteriorColorKey, next, 'تم إضافة اللون الخارجي');
    setNewExteriorColorVal('');
  };

  const deleteSelectedExteriorColorOption = () => {
    const v = exteriorColor;
    if (!v) return;
    const next = exteriorColorOptions.filter(x => x !== v);
    setExteriorColorOptions(next);
    updateOptionsWithToast('cars', carsExteriorColorKey, next, 'تم حذف اللون الخارجي');
    setExteriorColor('');
  };
  const deleteExteriorColorOption = (opt: string) => {
    const next = exteriorColorOptions.filter(x => x !== opt);
    setExteriorColorOptions(next);
    updateOptionsWithToast('cars', carsExteriorColorKey, next, 'تم حذف اللون الخارجي');
    if (exteriorColor === opt) setExteriorColor('');
  };
  const renameExteriorColorOption = (prev: string, nextRaw: string) => {
    const n = nextRaw.trim();
    if (!n || prev === n) return;
    const next = exteriorColorOptions.map(x => (x === prev ? n : x));
    setExteriorColorOptions(next);
    updateOptionsWithToast('cars', carsExteriorColorKey, next, 'تم تعديل اللون الخارجي');
    if (exteriorColor === prev) setExteriorColor(n);
  };

  const addTransmissionOption = () => {
    const v = newTransmissionVal.trim();
    if (!v) return;
    const next = transmissionOptions.includes(v) ? transmissionOptions : [...transmissionOptions, v];
    setTransmissionOptions(next);
    updateOptionsWithToast('cars', carsTransmissionKey, next, 'تم إضافة نوع الفتيس');
    setNewTransmissionVal('');
  };

  const deleteSelectedTransmissionOption = () => {
    const v = transmissionType;
    if (!v) return;
    const next = transmissionOptions.filter(x => x !== v);
    setTransmissionOptions(next);
    updateOptionsWithToast('cars', carsTransmissionKey, next, 'تم حذف نوع الفتيس');
    setTransmissionType('');
  };
  const deleteTransmissionOption = (opt: string) => {
    const next = transmissionOptions.filter(x => x !== opt);
    setTransmissionOptions(next);
    updateOptionsWithToast('cars', carsTransmissionKey, next, 'تم حذف نوع الفتيس');
    if (transmissionType === opt) setTransmissionType('');
  };
  const renameTransmissionOption = (prev: string, nextRaw: string) => {
    const n = nextRaw.trim();
    if (!n || prev === n) return;
    const next = transmissionOptions.map(x => (x === prev ? n : x));
    setTransmissionOptions(next);
    updateOptionsWithToast('cars', carsTransmissionKey, next, 'تم تعديل نوع الفتيس');
    if (transmissionType === prev) setTransmissionType(n);
  };

  const addFuelOption = () => {
    const v = newFuelVal.trim();
    if (!v) return;
    const next = fuelOptions.includes(v) ? fuelOptions : [...fuelOptions, v];
    setFuelOptions(next);
    updateOptionsWithToast('cars', carsFuelKey, next, 'تم إضافة نوع الوقود');
    setNewFuelVal('');
  };

  const deleteSelectedFuelOption = () => {
    const v = fuelType;
    if (!v) return;
    const next = fuelOptions.filter(x => x !== v);
    setFuelOptions(next);
    updateOptionsWithToast('cars', carsFuelKey, next, 'تم حذف نوع الوقود');
    setFuelType('');
  };
  const deleteFuelOption = (opt: string) => {
    const next = fuelOptions.filter(x => x !== opt);
    setFuelOptions(next);
    updateOptionsWithToast('cars', carsFuelKey, next, 'تم حذف نوع الوقود');
    if (fuelType === opt) setFuelType('');
  };
  const renameFuelOption = (prev: string, nextRaw: string) => {
    const n = nextRaw.trim();
    if (!n || prev === n) return;
    const next = fuelOptions.map(x => (x === prev ? n : x));
    setFuelOptions(next);
    updateOptionsWithToast('cars', carsFuelKey, next, 'تم تعديل نوع الوقود');
    if (fuelType === prev) setFuelType(n);
  };

  const addTeacherSpecialtyOption = () => {
    const v = newTeacherSpecialtyVal.trim();
    if (!v) return;
    const next = teacherSpecialtyOptions.includes(v) ? teacherSpecialtyOptions : [...teacherSpecialtyOptions, v];
    setTeacherSpecialtyOptions(next);
    updateOptionsWithToast('teachers', teacherSpecialtyKey, next, 'تم إضافة التخصص');
    setNewTeacherSpecialtyVal('');
  };
  const deleteSelectedTeacherSpecialtyOption = () => {
    const v = teacherSpecialty;
    if (!v) return;
    const next = teacherSpecialtyOptions.filter(x => x !== v);
    setTeacherSpecialtyOptions(next);
    updateOptionsWithToast('teachers', teacherSpecialtyKey, next, 'تم حذف التخصص');
    setTeacherSpecialty('');
  };
  const deleteTeacherSpecialtyOption = (opt: string) => {
    const next = teacherSpecialtyOptions.filter(x => x !== opt);
    setTeacherSpecialtyOptions(next);
    updateOptionsWithToast('teachers', teacherSpecialtyKey, next, 'تم حذف التخصص');
    if (teacherSpecialty === opt) setTeacherSpecialty('');
  };
  const renameTeacherSpecialtyOption = (prev: string, nextRaw: string) => {
    const n = nextRaw.trim();
    if (!n || prev === n) return;
    const next = teacherSpecialtyOptions.map(x => (x === prev ? n : x));
    setTeacherSpecialtyOptions(next);
    updateOptionsWithToast('teachers', teacherSpecialtyKey, next, 'تم تعديل التخصص');
    if (teacherSpecialty === prev) setTeacherSpecialty(n);
  };
  const addDoctorSpecialtyOption = () => {
    const v = newDoctorSpecialtyVal.trim();
    if (!v) return;
    const next = doctorSpecialtyOptions.includes(v) ? doctorSpecialtyOptions : [...doctorSpecialtyOptions, v];
    setDoctorSpecialtyOptions(next);
    updateOptionsWithToast('doctors', doctorSpecialtyKey, next, 'تم إضافة التخصص');
    setNewDoctorSpecialtyVal('');
  };
  const deleteSelectedDoctorSpecialtyOption = () => {
    const v = doctorSpecialty;
    if (!v) return;
    const next = doctorSpecialtyOptions.filter(x => x !== v);
    setDoctorSpecialtyOptions(next);
    updateOptionsWithToast('doctors', doctorSpecialtyKey, next, 'تم حذف التخصص');
    setDoctorSpecialty('');
  };
  const deleteDoctorSpecialtyOption = (opt: string) => {
    const next = doctorSpecialtyOptions.filter(x => x !== opt);
    setDoctorSpecialtyOptions(next);
    updateOptionsWithToast('doctors', doctorSpecialtyKey, next, 'تم حذف التخصص');
    if (doctorSpecialty === opt) setDoctorSpecialty('');
  };
  const renameDoctorSpecialtyOption = (prev: string, nextRaw: string) => {
    const n = nextRaw.trim();
    if (!n || prev === n) return;
    const next = doctorSpecialtyOptions.map(x => (x === prev ? n : x));
    setDoctorSpecialtyOptions(next);
    updateOptionsWithToast('doctors', doctorSpecialtyKey, next, 'تم تعديل التخصص');
    if (doctorSpecialty === prev) setDoctorSpecialty(n);
  };
  const addJobCategoryOption = async () => {
    const name = newJobCategoryVal.trim();
    if (!name) return;
    // التصنيف مستقل الآن - استخدام نفس طريقة التخصص
    await updateOptionsWithToast('jobs', jobCategoryKey, [...jobCategoryOptions, name], 'تم إضافة التصنيف');
    setJobCategoryOptions(prev => (prev.includes(name) ? prev : [...prev, name]));
    setNewJobCategoryVal('');
  };
  const deleteSelectedJobCategoryOption = () => {
    const v = jobCategory;
    if (!v) return;
    const updated = jobCategoryOptions.filter(x => x !== v);
    updateOptionsWithToast('jobs', jobCategoryKey, updated, 'تم حذف التصنيف');
    setJobCategoryOptions(updated);
    setJobCategory('');
  };
  const deleteJobCategoryOption = (opt: string) => {
    const updated = jobCategoryOptions.filter(x => x !== opt);
    updateOptionsWithToast('jobs', jobCategoryKey, updated, 'تم حذف التصنيف');
    setJobCategoryOptions(updated);
    if (jobCategory === opt) setJobCategory('');
  };
  const renameJobCategoryOption = (prev: string, nextRaw: string) => {
    const n = nextRaw.trim();
    if (!n || prev === n) return;
    const updated = jobCategoryOptions.map(x => (x === prev ? n : x));
    updateOptionsWithToast('jobs', jobCategoryKey, updated, 'تم تعديل التصنيف');
    setJobCategoryOptions(updated);
    if (jobCategory === prev) setJobCategory(n);
  };
  const addJobSpecialtyOption = async () => {
    const name = newJobSpecialtyVal.trim();
    if (!name) return;
    // التخصص مستقل الآن - لا يحتاج jobCategory
    await updateOptionsWithToast('jobs', jobSpecialtyKey, [...jobSpecialtyOptions, name], 'تم إضافة التخصص');
    setJobSpecialtyOptions(prev => (prev.includes(name) ? prev : [...prev, name]));
    setNewJobSpecialtyVal('');
  };
  const deleteSelectedJobSpecialtyOption = () => {
    const v = jobSpecialty;
    if (!v) return;
    const updated = jobSpecialtyOptions.filter(x => x !== v);
    updateOptionsWithToast('jobs', jobSpecialtyKey, updated, 'تم حذف التخصص');
    setJobSpecialtyOptions(updated);
    setJobSpecialty('');
  };
  const deleteJobSpecialtyOption = (opt: string) => {
    const updated = jobSpecialtyOptions.filter(x => x !== opt);
    updateOptionsWithToast('jobs', jobSpecialtyKey, updated, 'تم حذف التخصص');
    setJobSpecialtyOptions(updated);
    if (jobSpecialty === opt) setJobSpecialty('');
  };
  const renameJobSpecialtyOption = (prev: string, nextRaw: string) => {
    const n = nextRaw.trim();
    if (!n || prev === n) return;
    const updated = jobSpecialtyOptions.map(x => (x === prev ? n : x));
    updateOptionsWithToast('jobs', jobSpecialtyKey, updated, 'تم تعديل التخصص');
    setJobSpecialtyOptions(updated);
    if (jobSpecialty === prev) setJobSpecialty(n);
  };
  const addFoodMain = () => {
    const name = newFoodMain.trim();
    if (!name) return;
    handleAddMain('food-products', name, setFOOD_MAIN_SUBS, setSelectedFoodMain, () => setNewFoodMain(''));
  };
  const removeFoodMain = (name: string) => {
    handleDeleteMain('food-products', name, setFOOD_MAIN_SUBS, selectedFoodMain, setSelectedFoodMain);
  };
  const addFoodSubsBulk = () => {
    if (!selectedFoodMain) return;
    const raw = newFoodSubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('food-products', selectedFoodMain, tokens, setFOOD_MAIN_SUBS, setSelectedFoodSub, () => setNewFoodSubsBulk(''));
  };
  const removeFoodSub = (s: string) => {
    if (!selectedFoodMain) return;
    handleDeleteSub('food-products', selectedFoodMain, s, setFOOD_MAIN_SUBS, selectedFoodSub, setSelectedFoodSub);
  };
  const renameFoodMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('food-products', prevName, nextRaw, setFOOD_MAIN_SUBS, selectedFoodMain, setSelectedFoodMain);
  };
  const renameFoodSub = (prevName: string, nextRaw: string) => {
    handleRenameSub('food-products', selectedFoodMain, prevName, nextRaw, setFOOD_MAIN_SUBS, selectedFoodSub, setSelectedFoodSub);
  };

  const addRestaurantMain = () => {
    const name = newRestaurantMain.trim();
    if (!name) return;
    handleAddMain('restaurants', name, setRESTAURANTS_MAIN_SUBS, setSelectedRestaurantMain, () => setNewRestaurantMain(''));
  };
  const removeRestaurantMain = (name: string) => {
    handleDeleteMain('restaurants', name, setRESTAURANTS_MAIN_SUBS, selectedRestaurantMain, setSelectedRestaurantMain);
  };
  const addRestaurantSubsBulk = () => {
    if (!selectedRestaurantMain) return;
    const raw = newRestaurantSubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('restaurants', selectedRestaurantMain, tokens, setRESTAURANTS_MAIN_SUBS, setSelectedRestaurantSub, () => setNewRestaurantSubsBulk(''));
  };
  const removeRestaurantSub = (s: string) => {
    if (!selectedRestaurantMain) return;
    handleDeleteSub('restaurants', selectedRestaurantMain, s, setRESTAURANTS_MAIN_SUBS, selectedRestaurantSub, setSelectedRestaurantSub);
  };
  const renameRestaurantMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('restaurants', prevName, nextRaw, setRESTAURANTS_MAIN_SUBS, selectedRestaurantMain, setSelectedRestaurantMain);
  };
  const renameRestaurantSub = (prevName: string, nextRaw: string) => {
    handleRenameSub('restaurants', selectedRestaurantMain, prevName, nextRaw, setRESTAURANTS_MAIN_SUBS, selectedRestaurantSub, setSelectedRestaurantSub);
  };

  const addStoreMain = () => {
    const name = newStoreMain.trim();
    if (!name) return;
    handleAddMain('stores', name, setSTORES_MAIN_SUBS, setSelectedStoreMain, () => setNewStoreMain(''));
  };
  const removeStoreMain = (name: string) => {
    handleDeleteMain('stores', name, setSTORES_MAIN_SUBS, selectedStoreMain, setSelectedStoreMain);
  };
  const addStoreSubsBulk = () => {
    if (!selectedStoreMain) return;
    const raw = newStoreSubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('stores', selectedStoreMain, tokens, setSTORES_MAIN_SUBS, setSelectedStoreSub, () => setNewStoreSubsBulk(''));
  };
  const removeStoreSub = (s: string) => {
    if (!selectedStoreMain) return;
    handleDeleteSub('stores', selectedStoreMain, s, setSTORES_MAIN_SUBS, selectedStoreSub, setSelectedStoreSub);
  };
  const renameStoreMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('stores', prevName, nextRaw, setSTORES_MAIN_SUBS, selectedStoreMain, setSelectedStoreMain);
  };
  const renameStoreSub = (prevName: string, nextRaw: string) => {
    handleRenameSub('stores', selectedStoreMain, prevName, nextRaw, setSTORES_MAIN_SUBS, selectedStoreSub, setSelectedStoreSub);
  };

  const addGroceryMain = () => {
    const name = newGroceryMain.trim();
    if (!name) return;
    handleAddMain('groceries', name, setGROCERIES_MAIN_SUBS, setSelectedGroceryMain, () => setNewGroceryMain(''));
  };
  const removeGroceryMain = (name: string) => {
    handleDeleteMain('groceries', name, setGROCERIES_MAIN_SUBS, selectedGroceryMain, setSelectedGroceryMain);
  };
  const addGrocerySubsBulk = () => {
    if (!selectedGroceryMain) return;
    const raw = newGrocerySubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('groceries', selectedGroceryMain, tokens, setGROCERIES_MAIN_SUBS, setSelectedGrocerySub, () => setNewGrocerySubsBulk(''));
  };
  const removeGrocerySub = (s: string) => {
    if (!selectedGroceryMain) return;
    handleDeleteSub('groceries', selectedGroceryMain, s, setGROCERIES_MAIN_SUBS, selectedGrocerySub, setSelectedGrocerySub);
  };
  const renameGroceryMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('groceries', prevName, nextRaw, setGROCERIES_MAIN_SUBS, selectedGroceryMain, setSelectedGroceryMain);
  };
  const renameGrocerySub = (prevName: string, nextRaw: string) => {
    handleRenameSub('groceries', selectedGroceryMain, prevName, nextRaw, setGROCERIES_MAIN_SUBS, selectedGrocerySub, setSelectedGrocerySub);
  };

  const addHomeServiceMain = () => {
    const name = newHomeServiceMain.trim();
    if (!name) return;
    handleAddMain('home-services', name, setHOME_SERVICES_MAIN_SUBS, setSelectedHomeServiceMain, () => setNewHomeServiceMain(''));
  };
  const removeHomeServiceMain = (name: string) => {
    handleDeleteMain('home-services', name, setHOME_SERVICES_MAIN_SUBS, selectedHomeServiceMain, setSelectedHomeServiceMain);
  };
  const addHomeServiceSubsBulk = () => {
    if (!selectedHomeServiceMain) return;
    const raw = newHomeServiceSubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('home-services', selectedHomeServiceMain, tokens, setHOME_SERVICES_MAIN_SUBS, setSelectedHomeServiceSub, () => setNewHomeServiceSubsBulk(''));
  };
  const removeHomeServiceSub = (s: string) => {
    if (!selectedHomeServiceMain) return;
    handleDeleteSub('home-services', selectedHomeServiceMain, s, setHOME_SERVICES_MAIN_SUBS, selectedHomeServiceSub, setSelectedHomeServiceSub);
  };
  const renameHomeServiceMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('home-services', prevName, nextRaw, setHOME_SERVICES_MAIN_SUBS, selectedHomeServiceMain, setSelectedHomeServiceMain);
  };
  const renameHomeServiceSub = (prevName: string, nextRaw: string) => {
    handleRenameSub('home-services', selectedHomeServiceMain, prevName, nextRaw, setHOME_SERVICES_MAIN_SUBS, selectedHomeServiceSub, setSelectedHomeServiceSub);
  };

  const addFurnitureMain = () => {
    const name = newFurnitureMain.trim();
    if (!name) return;
    handleAddMain('furniture', name, setFURNITURE_MAIN_SUBS, setSelectedFurnitureMain, () => setNewFurnitureMain(''));
  };
  const removeFurnitureMain = (name: string) => {
    handleDeleteMain('furniture', name, setFURNITURE_MAIN_SUBS, selectedFurnitureMain, setSelectedFurnitureMain);
  };
  const addFurnitureSubsBulk = () => {
    if (!selectedFurnitureMain) return;
    const raw = newFurnitureSubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('furniture', selectedFurnitureMain, tokens, setFURNITURE_MAIN_SUBS, setSelectedFurnitureSub, () => setNewFurnitureSubsBulk(''));
  };
  const removeFurnitureSub = (s: string) => {
    if (!selectedFurnitureMain) return;
    handleDeleteSub('furniture', selectedFurnitureMain, s, setFURNITURE_MAIN_SUBS, selectedFurnitureSub, setSelectedFurnitureSub);
  };
  const renameFurnitureMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('furniture', prevName, nextRaw, setFURNITURE_MAIN_SUBS, selectedFurnitureMain, setSelectedFurnitureMain);
  };
  const renameFurnitureSub = (prevName: string, nextRaw: string) => {
    handleRenameSub('furniture', selectedFurnitureMain, prevName, nextRaw, setFURNITURE_MAIN_SUBS, selectedFurnitureSub, setSelectedFurnitureSub);
  };

  const addHouseholdToolMain = () => {
    const name = newHouseholdToolMain.trim();
    if (!name) return;
    handleAddMain('home-tools', name, setHOUSEHOLD_TOOLS_MAIN_SUBS, setSelectedHouseholdToolMain, () => setNewHouseholdToolMain(''));
  };
  const removeHouseholdToolMain = (name: string) => {
    handleDeleteMain('home-tools', name, setHOUSEHOLD_TOOLS_MAIN_SUBS, selectedHouseholdToolMain, setSelectedHouseholdToolMain);
  };
  const addHouseholdToolSubsBulk = () => {
    if (!selectedHouseholdToolMain) return;
    const raw = newHouseholdToolSubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('home-tools', selectedHouseholdToolMain, tokens, setHOUSEHOLD_TOOLS_MAIN_SUBS, setSelectedHouseholdToolSub, () => setNewHouseholdToolSubsBulk(''));
  };
  const removeHouseholdToolSub = (s: string) => {
    if (!selectedHouseholdToolMain) return;
    handleDeleteSub('home-tools', selectedHouseholdToolMain, s, setHOUSEHOLD_TOOLS_MAIN_SUBS, selectedHouseholdToolSub, setSelectedHouseholdToolSub);
  };
  const renameHouseholdToolMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('home-tools', prevName, nextRaw, setHOUSEHOLD_TOOLS_MAIN_SUBS, selectedHouseholdToolMain, setSelectedHouseholdToolMain);
  };
  const renameHouseholdToolSub = (prevName: string, nextRaw: string) => {
    handleRenameSub('home-tools', selectedHouseholdToolMain, prevName, nextRaw, setHOUSEHOLD_TOOLS_MAIN_SUBS, selectedHouseholdToolSub, setSelectedHouseholdToolSub);
  };

  const addHomeApplianceMain = () => {
    const name = newHomeApplianceMain.trim();
    if (!name) return;
    handleAddMain('home-appliances', name, setHOME_APPLIANCES_MAIN_SUBS, setSelectedHomeApplianceMain, () => setNewHomeApplianceMain(''));
  };
  const removeHomeApplianceMain = (name: string) => {
    handleDeleteMain('home-appliances', name, setHOME_APPLIANCES_MAIN_SUBS, selectedHomeApplianceMain, setSelectedHomeApplianceMain);
  };
  const addHomeApplianceSubsBulk = () => {
    if (!selectedHomeApplianceMain) return;
    const raw = newHomeApplianceSubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('home-appliances', selectedHomeApplianceMain, tokens, setHOME_APPLIANCES_MAIN_SUBS, setSelectedHomeApplianceSub, () => setNewHomeApplianceSubsBulk(''));
  };
  const removeHomeApplianceSub = (s: string) => {
    if (!selectedHomeApplianceMain) return;
    handleDeleteSub('home-appliances', selectedHomeApplianceMain, s, setHOME_APPLIANCES_MAIN_SUBS, selectedHomeApplianceSub, setSelectedHomeApplianceSub);
  };
  const renameHomeApplianceMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('home-appliances', prevName, nextRaw, setHOME_APPLIANCES_MAIN_SUBS, selectedHomeApplianceMain, setSelectedHomeApplianceMain);
  };
  const renameHomeApplianceSub = (prevName: string, nextRaw: string) => {
    handleRenameSub('home-appliances', selectedHomeApplianceMain, prevName, nextRaw, setHOME_APPLIANCES_MAIN_SUBS, selectedHomeApplianceSub, setSelectedHomeApplianceSub);
  };

  const addElectronicsMain = () => {
    const name = newElectronicsMain.trim();
    if (!name) return;
    handleAddMain('electronics', name, setELECTRONICS_MAIN_SUBS, setSelectedElectronicsMain, () => setNewElectronicsMain(''));
  };
  const removeElectronicsMain = (name: string) => {
    handleDeleteMain('electronics', name, setELECTRONICS_MAIN_SUBS, selectedElectronicsMain, setSelectedElectronicsMain);
  };
  const addElectronicsSubsBulk = () => {
    if (!selectedElectronicsMain) return;
    const raw = newElectronicsSubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('electronics', selectedElectronicsMain, tokens, setELECTRONICS_MAIN_SUBS, setSelectedElectronicsSub, () => setNewElectronicsSubsBulk(''));
  };
  const removeElectronicsSub = (s: string) => {
    if (!selectedElectronicsMain) return;
    handleDeleteSub('electronics', selectedElectronicsMain, s, setELECTRONICS_MAIN_SUBS, selectedElectronicsSub, setSelectedElectronicsSub);
  };
  const renameElectronicsMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('electronics', prevName, nextRaw, setELECTRONICS_MAIN_SUBS, selectedElectronicsMain, setSelectedElectronicsMain);
  };
  const renameElectronicsSub = (prevName: string, nextRaw: string) => {
    handleRenameSub('electronics', selectedElectronicsMain, prevName, nextRaw, setELECTRONICS_MAIN_SUBS, selectedElectronicsSub, setSelectedElectronicsSub);
  };

  const addHealthMain = () => {
    const name = newHealthMain.trim();
    if (!name) return;
    handleAddMain('health', name, setHEALTH_MAIN_SUBS, setSelectedHealthMain, () => setNewHealthMain(''));
  };
  const removeHealthMain = (name: string) => {
    handleDeleteMain('health', name, setHEALTH_MAIN_SUBS, selectedHealthMain, setSelectedHealthMain);
  };
  const addHealthSubsBulk = () => {
    if (!selectedHealthMain) return;
    const raw = newHealthSubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('health', selectedHealthMain, tokens, setHEALTH_MAIN_SUBS, setSelectedHealthSub, () => setNewHealthSubsBulk(''));
  };
  const removeHealthSub = (s: string) => {
    if (!selectedHealthMain) return;
    handleDeleteSub('health', selectedHealthMain, s, setHEALTH_MAIN_SUBS, selectedHealthSub, setSelectedHealthSub);
  };
  const renameHealthMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('health', prevName, nextRaw, setHEALTH_MAIN_SUBS, selectedHealthMain, setSelectedHealthMain);
  };
  const renameHealthSub = (prevName: string, nextRaw: string) => {
    handleRenameSub('health', selectedHealthMain, prevName, nextRaw, setHEALTH_MAIN_SUBS, selectedHealthSub, setSelectedHealthSub);
  };

  const addEducationMain = () => {
    const name = newEducationMain.trim();
    if (!name) return;
    handleAddMain('education', name, setEDUCATION_MAIN_SUBS, setSelectedEducationMain, () => setNewEducationMain(''));
  };
  const removeEducationMain = (name: string) => {
    handleDeleteMain('education', name, setEDUCATION_MAIN_SUBS, selectedEducationMain, setSelectedEducationMain);
  };
  const addEducationSubsBulk = () => {
    if (!selectedEducationMain) return;
    const raw = newEducationSubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('education', selectedEducationMain, tokens, setEDUCATION_MAIN_SUBS, setSelectedEducationSub, () => setNewEducationSubsBulk(''));
  };
  const removeEducationSub = (s: string) => {
    if (!selectedEducationMain) return;
    if (selectedEducationSub === s) { showToast('مرتبط بداتا إعلان، يمكنك التعديل بدلًا من الحذف', 'warning'); return; }
    handleDeleteSub('education', selectedEducationMain, s, setEDUCATION_MAIN_SUBS, selectedEducationSub, setSelectedEducationSub);
  };
  const renameEducationMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('education', prevName, nextRaw, setEDUCATION_MAIN_SUBS, selectedEducationMain, setSelectedEducationMain);
  };
  const renameEducationSub = (prevName: string, nextRaw: string) => {
    handleRenameSub('education', selectedEducationMain, prevName, nextRaw, setEDUCATION_MAIN_SUBS, selectedEducationSub, setSelectedEducationSub);
  };

  const addShippingMain = () => {
    const name = newShippingMain.trim();
    if (!name) return;
    handleAddMain('shipping', name, setSHIPPING_MAIN_SUBS, setSelectedShippingMain, () => setNewShippingMain(''));
  };
  const removeShippingMain = (name: string) => {
    handleDeleteMain('shipping', name, setSHIPPING_MAIN_SUBS, selectedShippingMain, setSelectedShippingMain);
  };
  const addShippingSubsBulk = () => {
    if (!selectedShippingMain) return;
    const raw = newShippingSubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('shipping', selectedShippingMain, tokens, setSHIPPING_MAIN_SUBS, setSelectedShippingSub, () => setNewShippingSubsBulk(''));
  };
  const removeShippingSub = (s: string) => {
    if (!selectedShippingMain) return;
    handleDeleteSub('shipping', selectedShippingMain, s, setSHIPPING_MAIN_SUBS, selectedShippingSub, setSelectedShippingSub);
  };
  const renameShippingMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('shipping', prevName, nextRaw, setSHIPPING_MAIN_SUBS, selectedShippingMain, setSelectedShippingMain);
  };
  const renameShippingSub = (prevName: string, nextRaw: string) => {
    handleRenameSub('shipping', selectedShippingMain, prevName, nextRaw, setSHIPPING_MAIN_SUBS, selectedShippingSub, setSelectedShippingSub);
  };

  const addMensClothingShoesMain = () => {
    const name = newMensClothingShoesMain.trim();
    if (!name) return;
    handleAddMain('mens-clothes', name, setMENS_CLOTHING_SHOES_MAIN_SUBS, setSelectedMensClothingShoesMain, () => setNewMensClothingShoesMain(''));
  };
  const removeMensClothingShoesMain = (name: string) => {
    handleDeleteMain('mens-clothes', name, setMENS_CLOTHING_SHOES_MAIN_SUBS, selectedMensClothingShoesMain, setSelectedMensClothingShoesMain);
  };
  const addMensClothingShoesSubsBulk = () => {
    if (!selectedMensClothingShoesMain) return;
    const raw = newMensClothingShoesSubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('mens-clothes', selectedMensClothingShoesMain, tokens, setMENS_CLOTHING_SHOES_MAIN_SUBS, setSelectedMensClothingShoesSub, () => setNewMensClothingShoesSubsBulk(''));
  };
  const removeMensClothingShoesSub = (s: string) => {
    if (!selectedMensClothingShoesMain) return;
    handleDeleteSub('mens-clothes', selectedMensClothingShoesMain, s, setMENS_CLOTHING_SHOES_MAIN_SUBS, selectedMensClothingShoesSub, setSelectedMensClothingShoesSub);
  };
  const renameMensClothingShoesMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('mens-clothes', prevName, nextRaw, setMENS_CLOTHING_SHOES_MAIN_SUBS, selectedMensClothingShoesMain, setSelectedMensClothingShoesMain);
  };
  const renameMensClothingShoesSub = (prevName: string, nextRaw: string) => {
    handleRenameSub('mens-clothes', selectedMensClothingShoesMain, prevName, nextRaw, setMENS_CLOTHING_SHOES_MAIN_SUBS, selectedMensClothingShoesSub, setSelectedMensClothingShoesSub);
  };

  const addHeavyEquipmentMain = () => {
    const name = newHeavyEquipmentMain.trim();
    if (!name) return;
    handleAddMain('heavy-transport', name, setHEAVY_EQUIPMENT_MAIN_SUBS, setSelectedHeavyEquipmentMain, () => setNewHeavyEquipmentMain(''));
  };
  const removeHeavyEquipmentMain = (name: string) => {
    handleDeleteMain('heavy-transport', name, setHEAVY_EQUIPMENT_MAIN_SUBS, selectedHeavyEquipmentMain, setSelectedHeavyEquipmentMain);
  };
  const addHeavyEquipmentSubsBulk = () => {
    if (!selectedHeavyEquipmentMain) return;
    const raw = newHeavyEquipmentSubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('heavy-transport', selectedHeavyEquipmentMain, tokens, setHEAVY_EQUIPMENT_MAIN_SUBS, setSelectedHeavyEquipmentSub, () => setNewHeavyEquipmentSubsBulk(''));
  };
  const removeHeavyEquipmentSub = (s: string) => {
    if (!selectedHeavyEquipmentMain) return;
    handleDeleteSub('heavy-transport', selectedHeavyEquipmentMain, s, setHEAVY_EQUIPMENT_MAIN_SUBS, selectedHeavyEquipmentSub, setSelectedHeavyEquipmentSub);
  };
  const renameHeavyEquipmentMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('heavy-transport', prevName, nextRaw, setHEAVY_EQUIPMENT_MAIN_SUBS, selectedHeavyEquipmentMain, setSelectedHeavyEquipmentMain);
  };
  const renameHeavyEquipmentSub = (prevName: string, nextRaw: string) => {
    handleRenameSub('heavy-transport', selectedHeavyEquipmentMain, prevName, nextRaw, setHEAVY_EQUIPMENT_MAIN_SUBS, selectedHeavyEquipmentSub, setSelectedHeavyEquipmentSub);
  };

  const addKidsSuppliesToysMain = () => {
    const name = newKidsSuppliesToysMain.trim();
    if (!name) return;
    handleAddMain('kids-toys', name, setKIDS_SUPPLIES_TOYS_MAIN_SUBS, setSelectedKidsSuppliesToysMain, () => setNewKidsSuppliesToysMain(''));
  };
  const removeKidsSuppliesToysMain = (name: string) => {
    handleDeleteMain('kids-toys', name, setKIDS_SUPPLIES_TOYS_MAIN_SUBS, selectedKidsSuppliesToysMain, setSelectedKidsSuppliesToysMain);
  };
  const addKidsSuppliesToysSubsBulk = () => {
    if (!selectedKidsSuppliesToysMain) return;
    const raw = newKidsSuppliesToysSubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('kids-toys', selectedKidsSuppliesToysMain, tokens, setKIDS_SUPPLIES_TOYS_MAIN_SUBS, setSelectedKidsSuppliesToysSub, () => setNewKidsSuppliesToysSubsBulk(''));
  };
  const removeKidsSuppliesToysSub = (s: string) => {
    if (!selectedKidsSuppliesToysMain) return;
    handleDeleteSub('kids-toys', selectedKidsSuppliesToysMain, s, setKIDS_SUPPLIES_TOYS_MAIN_SUBS, selectedKidsSuppliesToysSub, setSelectedKidsSuppliesToysSub);
  };

  const renameKidsSuppliesToysMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('kids-toys', prevName, nextRaw, setKIDS_SUPPLIES_TOYS_MAIN_SUBS, selectedKidsSuppliesToysMain, setSelectedKidsSuppliesToysMain);
  };

  const renameKidsSuppliesToysSub = (prevName: string, nextRaw: string) => {
    handleRenameSub('kids-toys', selectedKidsSuppliesToysMain, prevName, nextRaw, setKIDS_SUPPLIES_TOYS_MAIN_SUBS, selectedKidsSuppliesToysSub, setSelectedKidsSuppliesToysSub);
  };

  const addFreelanceServicesMain = () => {
    const name = newFreelanceServicesMain.trim();
    if (!name) return;
    handleAddMain('free-professions', name, setFREELANCE_SERVICES_MAIN_SUBS, setSelectedFreelanceServicesMain, () => setNewFreelanceServicesMain(''));
  };
  const removeFreelanceServicesMain = (name: string) => {
    handleDeleteMain('free-professions', name, setFREELANCE_SERVICES_MAIN_SUBS, selectedFreelanceServicesMain, setSelectedFreelanceServicesMain);
  };
  const addFreelanceServicesSubsBulk = () => {
    if (!selectedFreelanceServicesMain) return;
    const raw = newFreelanceServicesSubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('free-professions', selectedFreelanceServicesMain, tokens, setFREELANCE_SERVICES_MAIN_SUBS, setSelectedFreelanceServicesSub, () => setNewFreelanceServicesSubsBulk(''));
  };
  const removeFreelanceServicesSub = (s: string) => {
    if (!selectedFreelanceServicesMain) return;
    handleDeleteSub('free-professions', selectedFreelanceServicesMain, s, setFREELANCE_SERVICES_MAIN_SUBS, selectedFreelanceServicesSub, setSelectedFreelanceServicesSub);
  };
  const renameFreelanceServicesMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('free-professions', prevName, nextRaw, setFREELANCE_SERVICES_MAIN_SUBS, selectedFreelanceServicesMain, setSelectedFreelanceServicesMain);
  };
  const renameFreelanceServicesSub = (prevName: string, nextRaw: string) => {
    handleRenameSub('free-professions', selectedFreelanceServicesMain, prevName, nextRaw, setFREELANCE_SERVICES_MAIN_SUBS, selectedFreelanceServicesSub, setSelectedFreelanceServicesSub);
  };

  const addWatchesJewelryMain = () => {
    const name = newWatchesJewelryMain.trim();
    if (!name) return;
    handleAddMain('watches-jewelry', name, setWATCHES_JEWELRY_MAIN_SUBS, setSelectedWatchesJewelryMain, () => setNewWatchesJewelryMain(''));
  };
  const removeWatchesJewelryMain = (name: string) => {
    handleDeleteMain('watches-jewelry', name, setWATCHES_JEWELRY_MAIN_SUBS, selectedWatchesJewelryMain, setSelectedWatchesJewelryMain);
  };
  const addWatchesJewelrySubsBulk = () => {
    if (!selectedWatchesJewelryMain) return;
    const raw = newWatchesJewelrySubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('watches-jewelry', selectedWatchesJewelryMain, tokens, setWATCHES_JEWELRY_MAIN_SUBS, setSelectedWatchesJewelrySub, () => setNewWatchesJewelrySubsBulk(''));
  };
  const removeWatchesJewelrySub = (s: string) => {
    if (!selectedWatchesJewelryMain) return;
    handleDeleteSub('watches-jewelry', selectedWatchesJewelryMain, s, setWATCHES_JEWELRY_MAIN_SUBS, selectedWatchesJewelrySub, setSelectedWatchesJewelrySub);
  };
  const renameWatchesJewelryMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('watches-jewelry', prevName, nextRaw, setWATCHES_JEWELRY_MAIN_SUBS, selectedWatchesJewelryMain, setSelectedWatchesJewelryMain);
  };
  const renameWatchesJewelrySub = (prevName: string, nextRaw: string) => {
    handleRenameSub('watches-jewelry', selectedWatchesJewelryMain, prevName, nextRaw, setWATCHES_JEWELRY_MAIN_SUBS, selectedWatchesJewelrySub, setSelectedWatchesJewelrySub);
  };

  const addCarServicesMain = () => {
    const name = newCarServicesMain.trim();
    if (!name) return;
    handleAddMain('car-services', name, setCAR_SERVICES_MAIN_SUBS, setSelectedCarServicesMain, () => setNewCarServicesMain(''));
  };
  const removeCarServicesMain = (name: string) => {
    handleDeleteMain('car-services', name, setCAR_SERVICES_MAIN_SUBS, selectedCarServicesMain, setSelectedCarServicesMain);
  };

  const addCarServicesSubsBulk = () => {
    if (!selectedCarServicesMain) return;
    const raw = newCarServicesSubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('car-services', selectedCarServicesMain, tokens, setCAR_SERVICES_MAIN_SUBS, setSelectedCarServicesSub, () => setNewCarServicesSubsBulk(''));
  };
  const removeCarServicesSub = (s: string) => {
    if (!selectedCarServicesMain) return;
    handleDeleteSub('car-services', selectedCarServicesMain, s, setCAR_SERVICES_MAIN_SUBS, selectedCarServicesSub, setSelectedCarServicesSub);
  };
  const renameCarServicesMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('car-services', prevName, nextRaw, setCAR_SERVICES_MAIN_SUBS, selectedCarServicesMain, setSelectedCarServicesMain);
  };
  const renameCarServicesSub = (prevName: string, nextRaw: string) => {
    handleRenameSub('car-services', selectedCarServicesMain, prevName, nextRaw, setCAR_SERVICES_MAIN_SUBS, selectedCarServicesSub, setSelectedCarServicesSub);
  };

  const addGeneralMaintenanceMain = () => {
    const name = newGeneralMaintenanceMain.trim();
    if (!name) return;
    handleAddMain('maintenance', name, setGENERAL_MAINTENANCE_MAIN_SUBS, setSelectedGeneralMaintenanceMain, () => setNewGeneralMaintenanceMain(''));
  };
  const removeGeneralMaintenanceMain = (name: string) => {
    handleDeleteMain('maintenance', name, setGENERAL_MAINTENANCE_MAIN_SUBS, selectedGeneralMaintenanceMain, setSelectedGeneralMaintenanceMain);
  };
  const addGeneralMaintenanceSubsBulk = () => {
    if (!selectedGeneralMaintenanceMain) return;
    const raw = newGeneralMaintenanceSubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('maintenance', selectedGeneralMaintenanceMain, tokens, setGENERAL_MAINTENANCE_MAIN_SUBS, setSelectedGeneralMaintenanceSub, () => setNewGeneralMaintenanceSubsBulk(''));
  };
  const removeGeneralMaintenanceSub = (s: string) => {
    if (!selectedGeneralMaintenanceMain) return;
    handleDeleteSub('maintenance', selectedGeneralMaintenanceMain, s, setGENERAL_MAINTENANCE_MAIN_SUBS, selectedGeneralMaintenanceSub, setSelectedGeneralMaintenanceSub);
  };
  const renameGeneralMaintenanceMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('maintenance', prevName, nextRaw, setGENERAL_MAINTENANCE_MAIN_SUBS, selectedGeneralMaintenanceMain, setSelectedGeneralMaintenanceMain);
  };
  const renameGeneralMaintenanceSub = (prevName: string, nextRaw: string) => {
    handleRenameSub('maintenance', selectedGeneralMaintenanceMain, prevName, nextRaw, setGENERAL_MAINTENANCE_MAIN_SUBS, selectedGeneralMaintenanceSub, setSelectedGeneralMaintenanceSub);
  };

  const addConstructionToolsMain = () => {
    const name = newConstructionToolsMain.trim();
    if (!name) return;
    handleAddMain('construction', name, setCONSTRUCTION_TOOLS_MAIN_SUBS, setSelectedConstructionToolsMain, () => setNewConstructionToolsMain(''));
  };
  const removeConstructionToolsMain = (name: string) => {
    handleDeleteMain('construction', name, setCONSTRUCTION_TOOLS_MAIN_SUBS, selectedConstructionToolsMain, setSelectedConstructionToolsMain);
  };
  const addConstructionToolsSubsBulk = () => {
    if (!selectedConstructionToolsMain) return;
    const raw = newConstructionToolsSubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('construction', selectedConstructionToolsMain, tokens, setCONSTRUCTION_TOOLS_MAIN_SUBS, setSelectedConstructionToolsSub, () => setNewConstructionToolsSubsBulk(''));
  };
  const removeConstructionToolsSub = (s: string) => {
    if (!selectedConstructionToolsMain) return;
    handleDeleteSub('construction', selectedConstructionToolsMain, s, setCONSTRUCTION_TOOLS_MAIN_SUBS, selectedConstructionToolsSub, setSelectedConstructionToolsSub);
  };
  const renameConstructionToolsMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('construction', prevName, nextRaw, setCONSTRUCTION_TOOLS_MAIN_SUBS, selectedConstructionToolsMain, setSelectedConstructionToolsMain);
  };
  const renameConstructionToolsSub = (prevName: string, nextRaw: string) => {
    handleRenameSub('construction', selectedConstructionToolsMain, prevName, nextRaw, setCONSTRUCTION_TOOLS_MAIN_SUBS, selectedConstructionToolsSub, setSelectedConstructionToolsSub);
  };

  const addGymsMain = () => {
    const name = newGymsMain.trim();
    if (!name) return;
    handleAddMain('gym', name, setGYMS_MAIN_SUBS, setSelectedGymsMain, () => setNewGymsMain(''));
  };
  const removeGymsMain = (name: string) => {
    handleDeleteMain('gym', name, setGYMS_MAIN_SUBS, selectedGymsMain, setSelectedGymsMain);
  };
  const addGymsSubsBulk = () => {
    if (!selectedGymsMain) return;
    const raw = newGymsSubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('gym', selectedGymsMain, tokens, setGYMS_MAIN_SUBS, setSelectedGymsSub, () => setNewGymsSubsBulk(''));
  };
  const removeGymsSub = (s: string) => {
    if (!selectedGymsMain) return;
    handleDeleteSub('gym', selectedGymsMain, s, setGYMS_MAIN_SUBS, selectedGymsSub, setSelectedGymsSub);
  };
  const renameGymsMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('gym', prevName, nextRaw, setGYMS_MAIN_SUBS, selectedGymsMain, setSelectedGymsMain);
  };
  const renameGymsSub = (prevName: string, nextRaw: string) => {
    handleRenameSub('gym', selectedGymsMain, prevName, nextRaw, setGYMS_MAIN_SUBS, selectedGymsSub, setSelectedGymsSub);
  };

  const addBikesLightVehiclesMain = () => {
    const name = newBikesLightVehiclesMain.trim();
    if (!name) return;
    handleAddMain('light-vehicles', name, setBIKES_LIGHT_VEHICLES_MAIN_SUBS, setSelectedBikesLightVehiclesMain, () => setNewBikesLightVehiclesMain(''));
  };
  const removeBikesLightVehiclesMain = (name: string) => {
    handleDeleteMain('light-vehicles', name, setBIKES_LIGHT_VEHICLES_MAIN_SUBS, selectedBikesLightVehiclesMain, setSelectedBikesLightVehiclesMain);
  };
  const addBikesLightVehiclesSubsBulk = () => {
    if (!selectedBikesLightVehiclesMain) return;
    const raw = newBikesLightVehiclesSubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('light-vehicles', selectedBikesLightVehiclesMain, tokens, setBIKES_LIGHT_VEHICLES_MAIN_SUBS, setSelectedBikesLightVehiclesSub, () => setNewBikesLightVehiclesSubsBulk(''));
  };
  const removeBikesLightVehiclesSub = (s: string) => {
    if (!selectedBikesLightVehiclesMain) return;
    handleDeleteSub('light-vehicles', selectedBikesLightVehiclesMain, s, setBIKES_LIGHT_VEHICLES_MAIN_SUBS, selectedBikesLightVehiclesSub, setSelectedBikesLightVehiclesSub);
  };
  const renameBikesLightVehiclesMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('light-vehicles', prevName, nextRaw, setBIKES_LIGHT_VEHICLES_MAIN_SUBS, selectedBikesLightVehiclesMain, setSelectedBikesLightVehiclesMain);
  };
  const renameBikesLightVehiclesSub = (prevName: string, nextRaw: string) => {
    handleRenameSub('light-vehicles', selectedBikesLightVehiclesMain, prevName, nextRaw, setBIKES_LIGHT_VEHICLES_MAIN_SUBS, selectedBikesLightVehiclesSub, setSelectedBikesLightVehiclesSub);
  };

  const addMaterialsProductionLinesMain = () => {
    const name = newMaterialsProductionLinesMain.trim();
    if (!name) return;
    handleAddMain('production-lines', name, setMATERIALS_PRODUCTION_LINES_MAIN_SUBS, setSelectedMaterialsProductionLinesMain, () => setNewMaterialsProductionLinesMain(''));
  };
  const removeMaterialsProductionLinesMain = (name: string) => {
    handleDeleteMain('production-lines', name, setMATERIALS_PRODUCTION_LINES_MAIN_SUBS, selectedMaterialsProductionLinesMain, setSelectedMaterialsProductionLinesMain);
  };
  const addMaterialsProductionLinesSubsBulk = () => {
    if (!selectedMaterialsProductionLinesMain) return;
    const raw = newMaterialsProductionLinesSubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('production-lines', selectedMaterialsProductionLinesMain, tokens, setMATERIALS_PRODUCTION_LINES_MAIN_SUBS, setSelectedMaterialsProductionLinesSub, () => setNewMaterialsProductionLinesSubsBulk(''));
  };
  const removeMaterialsProductionLinesSub = (s: string) => {
    if (!selectedMaterialsProductionLinesMain) return;
    handleDeleteSub('production-lines', selectedMaterialsProductionLinesMain, s, setMATERIALS_PRODUCTION_LINES_MAIN_SUBS, selectedMaterialsProductionLinesSub, setSelectedMaterialsProductionLinesSub);
  };
  const renameMaterialsProductionLinesMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('production-lines', prevName, nextRaw, setMATERIALS_PRODUCTION_LINES_MAIN_SUBS, selectedMaterialsProductionLinesMain, setSelectedMaterialsProductionLinesMain);
  };
  const renameMaterialsProductionLinesSub = (prevName: string, nextRaw: string) => {
    handleRenameSub('production-lines', selectedMaterialsProductionLinesMain, prevName, nextRaw, setMATERIALS_PRODUCTION_LINES_MAIN_SUBS, selectedMaterialsProductionLinesSub, setSelectedMaterialsProductionLinesSub);
  };

  const addFarmsFactoriesProductsMain = () => {
    const name = newFarmsFactoriesProductsMain.trim();
    if (!name) return;
    handleAddMain('farm-products', name, setFARMS_FACTORIES_PRODUCTS_MAIN_SUBS, setSelectedFarmsFactoriesProductsMain, () => setNewFarmsFactoriesProductsMain(''));
  };
  const removeFarmsFactoriesProductsMain = (name: string) => {
    handleDeleteMain('farm-products', name, setFARMS_FACTORIES_PRODUCTS_MAIN_SUBS, selectedFarmsFactoriesProductsMain, setSelectedFarmsFactoriesProductsMain);
  };
  const addFarmsFactoriesProductsSubsBulk = () => {
    if (!selectedFarmsFactoriesProductsMain) return;
    const raw = newFarmsFactoriesProductsSubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('farm-products', selectedFarmsFactoriesProductsMain, tokens, setFARMS_FACTORIES_PRODUCTS_MAIN_SUBS, setSelectedFarmsFactoriesProductsSub, () => setNewFarmsFactoriesProductsSubsBulk(''));
  };
  const removeFarmsFactoriesProductsSub = (s: string) => {
    if (!selectedFarmsFactoriesProductsMain) return;
    handleDeleteSub('farm-products', selectedFarmsFactoriesProductsMain, s, setFARMS_FACTORIES_PRODUCTS_MAIN_SUBS, selectedFarmsFactoriesProductsSub, setSelectedFarmsFactoriesProductsSub);
  };
  const renameFarmsFactoriesProductsMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('farm-products', prevName, nextRaw, setFARMS_FACTORIES_PRODUCTS_MAIN_SUBS, selectedFarmsFactoriesProductsMain, setSelectedFarmsFactoriesProductsMain);
  };
  const renameFarmsFactoriesProductsSub = (prevName: string, nextRaw: string) => {
    handleRenameSub('farm-products', selectedFarmsFactoriesProductsMain, prevName, nextRaw, setFARMS_FACTORIES_PRODUCTS_MAIN_SUBS, selectedFarmsFactoriesProductsSub, setSelectedFarmsFactoriesProductsSub);
  };

  const addLightingDecorMain = () => {
    const name = newLightingDecorMain.trim();
    if (!name) return;
    handleAddMain('lighting-decor', name, setLIGHTING_DECOR_MAIN_SUBS, setSelectedLightingDecorMain, () => setNewLightingDecorMain(''));
  };
  const removeLightingDecorMain = (name: string) => {
    handleDeleteMain('lighting-decor', name, setLIGHTING_DECOR_MAIN_SUBS, selectedLightingDecorMain, setSelectedLightingDecorMain);
  };
  const addLightingDecorSubsBulk = () => {
    if (!selectedLightingDecorMain) return;
    const raw = newLightingDecorSubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('lighting-decor', selectedLightingDecorMain, tokens, setLIGHTING_DECOR_MAIN_SUBS, setSelectedLightingDecorSub, () => setNewLightingDecorSubsBulk(''));
  };
  const removeLightingDecorSub = (s: string) => {
    if (!selectedLightingDecorMain) return;
    handleDeleteSub('lighting-decor', selectedLightingDecorMain, s, setLIGHTING_DECOR_MAIN_SUBS, selectedLightingDecorSub, setSelectedLightingDecorSub);
  };
  const renameLightingDecorMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('lighting-decor', prevName, nextRaw, setLIGHTING_DECOR_MAIN_SUBS, selectedLightingDecorMain, setSelectedLightingDecorMain);
  };
  const renameLightingDecorSub = (prevName: string, nextRaw: string) => {
    handleRenameSub('lighting-decor', selectedLightingDecorMain, prevName, nextRaw, setLIGHTING_DECOR_MAIN_SUBS, selectedLightingDecorSub, setSelectedLightingDecorSub);
  };


  const removeMissingMain = (name: string) => {
    handleDeleteMain('missing', name, setMISSING_MAIN_SUBS, selectedMissingMain, setSelectedMissingMain);
  };
  const addMissingMain = () => {
    const name = newMissingMain.trim();
    if (!name) return;
    handleAddMain('missing', name, setMISSING_MAIN_SUBS, setSelectedMissingMain, () => setNewMissingMain(''));
  };
  const addMissingSubsBulk = () => {
    if (!selectedMissingMain) return;
    const raw = newMissingSubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('missing', selectedMissingMain, tokens, setMISSING_MAIN_SUBS, setSelectedMissingSub, () => setNewMissingSubsBulk(''));
  };
  const removeMissingSub = (s: string) => {
    if (!selectedMissingMain) return;
    handleDeleteSub('missing', selectedMissingMain, s, setMISSING_MAIN_SUBS, selectedMissingSub, setSelectedMissingSub);
  };
  const renameMissingMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('missing', prevName, nextRaw, setMISSING_MAIN_SUBS, selectedMissingMain, setSelectedMissingMain);
  };
  const renameMissingSub = (prevName: string, nextRaw: string) => {
    handleRenameSub('missing', selectedMissingMain, prevName, nextRaw, setMISSING_MAIN_SUBS, selectedMissingSub, setSelectedMissingSub);
  };

  const addToolsSuppliesMain = () => {
    const name = newToolsSuppliesMain.trim();
    if (!name) return;
    handleAddMain('tools', name, setTOOLS_SUPPLIES_MAIN_SUBS, setSelectedToolsSuppliesMain, () => setNewToolsSuppliesMain(''));
  };
  const removeToolsSuppliesMain = (name: string) => {
    handleDeleteMain('tools', name, setTOOLS_SUPPLIES_MAIN_SUBS, selectedToolsSuppliesMain, setSelectedToolsSuppliesMain);
  };
  const addToolsSuppliesSubsBulk = () => {
    if (!selectedToolsSuppliesMain) return;
    const raw = newToolsSuppliesSubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('tools', selectedToolsSuppliesMain, tokens, setTOOLS_SUPPLIES_MAIN_SUBS, setSelectedToolsSuppliesSub, () => setNewToolsSuppliesSubsBulk(''));
  };
  const removeToolsSuppliesSub = (s: string) => {
    if (!selectedToolsSuppliesMain) return;
    handleDeleteSub('tools', selectedToolsSuppliesMain, s, setTOOLS_SUPPLIES_MAIN_SUBS, selectedToolsSuppliesSub, setSelectedToolsSuppliesSub);
  };
  const renameToolsSuppliesMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('tools', prevName, nextRaw, setTOOLS_SUPPLIES_MAIN_SUBS, selectedToolsSuppliesMain, setSelectedToolsSuppliesMain);
  };
  const renameToolsSuppliesSub = (prevName: string, nextRaw: string) => {
    handleRenameSub('tools', selectedToolsSuppliesMain, prevName, nextRaw, setTOOLS_SUPPLIES_MAIN_SUBS, selectedToolsSuppliesSub, setSelectedToolsSuppliesSub);
  };

  const addWholesaleMain = () => {
    const name = newWholesaleMain.trim();
    if (!name) return;
    handleAddMain('wholesale', name, setWHOLESALE_MAIN_SUBS, setSelectedWholesaleMain, () => setNewWholesaleMain(''));
  };
  const removeWholesaleMain = (name: string) => {
    handleDeleteMain('wholesale', name, setWHOLESALE_MAIN_SUBS, selectedWholesaleMain, setSelectedWholesaleMain);
  };
  const addWholesaleSubsBulk = () => {
    if (!selectedWholesaleMain) return;
    const raw = newWholesaleSubsBulk;
    const tokens = raw.split(/[\,\n،]/).map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length === 0) return;
    handleAddSubsBulk('wholesale', selectedWholesaleMain, tokens, setWHOLESALE_MAIN_SUBS, setSelectedWholesaleSub, () => setNewWholesaleSubsBulk(''));
  };
  const removeWholesaleSub = (s: string) => {
    if (!selectedWholesaleMain) return;
    handleDeleteSub('wholesale', selectedWholesaleMain, s, setWHOLESALE_MAIN_SUBS, selectedWholesaleSub, setSelectedWholesaleSub);
  };
  const renameWholesaleMain = (prevName: string, nextRaw: string) => {
    handleRenameMain('wholesale', prevName, nextRaw, setWHOLESALE_MAIN_SUBS, selectedWholesaleMain, setSelectedWholesaleMain);
  };
  const renameWholesaleSub = (prevName: string, nextRaw: string) => {
    handleRenameSub('wholesale', selectedWholesaleMain, prevName, nextRaw, setWHOLESALE_MAIN_SUBS, selectedWholesaleSub, setSelectedWholesaleSub);
  };

  // فتح نافذة إدارة خيارات الحقل
  const openFieldOptions = (categoryId: number, fieldName: string) => {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return;
    const raw = cat.customFields[fieldName];
    const meta = typeof raw === 'string' ? { type: raw } : raw;
    setTempOptions([...(meta.options || [])]);
    setFieldOptionsEditor({ categoryId, fieldName });
  };

  const handleOptionUpdate = (index: number, value: string) => {
    setTempOptions(prev => prev.map((opt, i) => (i === index ? value : opt)));
  };

  const addOptionRow = () => {
    setTempOptions(prev => [...prev, '']);
  };

  const removeOptionRow = (index: number) => {
    setTempOptions(prev => prev.filter((_, i) => i !== index));
  };

  const saveFieldOptions = () => {
    if (!fieldOptionsEditor) return;
    const { categoryId, fieldName } = fieldOptionsEditor;
    setCategories(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      const raw = cat.customFields[fieldName];
      const meta = typeof raw === 'string' ? { type: raw } : raw;
      // حفظ فقط للحقول من نوع select
      if (meta.type !== 'select') {
        return cat;
      }
      const cleaned = tempOptions.map(o => o.trim()).filter(o => o.length > 0);
      const newCustomFields = {
        ...cat.customFields,
        [fieldName]: { type: 'select', options: cleaned },
      };
      return { ...cat, customFields: newCustomFields };
    }));
    setFieldOptionsEditor(null);
  };

  const closeFieldOptions = () => setFieldOptionsEditor(null);

  // معلومات مساعدة لعرض النافذة
  const currentFieldMeta = fieldOptionsEditor
    ? (() => {
      const cat = categories.find(c => c.id === fieldOptionsEditor.categoryId);
      if (!cat) return null as null | { type: string; options?: string[] };
      const raw = cat.customFields[fieldOptionsEditor.fieldName];
      return typeof raw === 'string' ? { type: raw } : raw;
    })()
    : null;
  const currentCategoryName = fieldOptionsEditor
    ? categories.find(c => c.id === fieldOptionsEditor.categoryId)?.name || ''
    : '';

  const getDefaultImageKey = (cat: Category): 'jobs_default_image' | 'doctors_default_image' | 'teachers_default_image' | null => {
    const s = (cat.slug || '').toLowerCase();
    const n = (cat.name || '').toLowerCase();
    if (s === 'jobs' || n.includes('وظائف')) return 'jobs_default_image';
    if (s === 'doctors' || n.includes('أطباء') || n.includes('اطباء')) return 'doctors_default_image';
    if (s === 'teachers' || n.includes('مدرسين')) return 'teachers_default_image';
    return null;
  };

  const handleDefaultImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const key = e.target.getAttribute('data-key');
    if (!file || !key) return;
    const previewUrl = URL.createObjectURL(file);
    setDefaultImagePreview(prev => ({ ...prev, [key]: previewUrl }));

    setUploadingImage(key);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
      const res = await updatePublicSystemSettingsImage(key, file, token);
      const out = (() => {
        if (!res || typeof res !== 'object') return null;
        const o = res as Record<string, unknown>;
        const candidate = o['data'] && typeof o['data'] === 'object' ? (o['data'] as Record<string, unknown>) : o;
        if (!candidate || typeof candidate !== 'object') return null;
        return candidate as unknown as SystemSettingsData;
      })();
      if (out) {
        setSystemSettings(out);
        setUnifiedImagesSettings(out);
        showToast('تم تحديث الصورة الافتراضية بنجاح', 'success');
      } else {
        showToast('تم الرفع ولكن تعذر قراءة الاستجابة', 'warning');
      }
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في تحديث الصورة');
      showToast(msg, 'error');
    } finally {
      setUploadingImage(null);
      setDefaultImagePreview(prev => { const n = { ...prev }; delete n[key]; return n; });
      URL.revokeObjectURL(previewUrl);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteDefaultImage = async (key: 'jobs_default_image' | 'doctors_default_image' | 'teachers_default_image') => {
    setUploadingImage(key);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') ?? undefined : undefined;
      const res = await updateSystemSettings({ [key]: '' }, token);
      if (res && res.data) {
        setSystemSettings(res.data);
        showToast('تم حذف الصورة الافتراضية', 'success');
      }
    } catch (err) {
      const msg = getErrMsg(err, 'حدث خطأ في حذف الصورة');
      showToast(msg, 'error');
    } finally {
      setUploadingImage(null);
      setDefaultImagePreview(prev => { const n = { ...prev }; delete n[key]; return n; });
    }
  };

  return (
    <div className="categories-page">
      {/* Header */}
      <div className="categories-header">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">الأقسام والتصنيفات</h1>
            <p className="page-description">إدارة أقسام الموقع والتحكم في الظهور على الواجهة الرئيسية</p>
          </div>
          <div className="header-actions">
            {/* <button 
              className="btn-add-category"
              onClick={() => setShowAddModal(true)}
            >
              <span className="btn-icon">➕</span>
              إضافة قسم جديد
            </button> */}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="tabs-navigation">
        {/* <button 
          className={`tab-btn ${activeTab === 'management' ? 'active' : ''}`}
          onClick={() => setActiveTab('management')}
        >
          <span className="tab-icon">⚙️</span>
          إدارة الأقسام
        </button> */}
        {/* <button 
          className={`tab-btn ${activeTab === 'homepage' ? 'active' : ''}`}
          onClick={() => setActiveTab('homepage')}
        >
          <span className="tab-icon">🏠</span>
          الظهور على الواجهة
        </button> */}
      </div>

      {/* Search and Filters */}
      <div className="search-filters">
        <div className="search-container">
          <input
            type="text"
            placeholder="البحث في الأقسام..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            style={{ paddingRight: '50px' }}
          />
          <div className="search-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="url(#searchGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="searchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1bb28f" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        {/* <div className="filter-actions">
          <select 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="disabled">معطل</option>
          </select>
          <button 
            className="filter-reset"
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('');
            }}
            title="إعادة تعيين الفلاتر"
          >
            🔄 إعادة تعيين
          </button>
        </div> */}
      </div>

      {/* Content based on active tab */}
      {activeTab === 'management' && (
        <div className="management-content">
          <div className="results-info">
            <p className="results-count">
              عرض {filteredCategories.length} من أصل {categories.length} قسم
              {(searchTerm || statusFilter) && (
                <span className="filter-indicator"> (مفلتر)</span>
              )}
            </p>
          </div>
          <div className="toast-container">
            {toasts.map(t => (
              <div key={t.id} className={`toast toast-${t.type}`} onClick={() => removeToast(t.id)} title="إغلاق">
                {t.message}
              </div>
            ))}
          </div>
          <div className="location-filter">
            <div className="location-group">
              <label className="location-label">المحافظة</label>
              <ManagedSelect
                options={sortKeysWithOtherAtEnd(GOVERNORATES_MAP)}
                value={selectedGovernorate}
                onChange={(v) => { setSelectedGovernorate(v); setSelectedCity(''); }}
                onDelete={(opt) => removeGovernorate(opt)}
                onEdit={(prev, next) => renameGovernorate(prev, next)}
                placeholder="اختر المحافظة"
              />
              <div className="inline-actions">
                <input
                  type="text"
                  className="form-input"
                  placeholder="أضف محافظة"
                  value={newGovernorate}
                  onChange={(e) => setNewGovernorate(e.target.value)}
                />
                <button className="btn-add" onClick={addGovernorate}>إضافة</button>
              </div>
            </div>

            <div className="location-group">
              <label className="location-label">المدينة</label>
              <ManagedSelect
                options={cities}
                value={selectedCity}
                onChange={(v) => setSelectedCity(v)}
                onDelete={(opt) => removeCity(opt)}
                onEdit={(prev, next) => renameCity(prev, next)}
                disabled={!selectedGovernorate}
                placeholder={selectedGovernorate ? 'اختر المدينة' : 'اختر المحافظة أولًا'}
              />
              <div className="inline-actions">
                <input
                  type="text"
                  className="form-input"
                  placeholder="أضف مدينة"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  disabled={!selectedGovernorate}
                />
                <button className="btn-add" onClick={addCity} disabled={!selectedGovernorate}>إضافة</button>
              </div>
              {/* <div className="inline-actions">
                <textarea
                  className="form-input"
                  placeholder="أدخل المدن مفصولة بفواصل أو أسطر"
                  value={newCitiesBulk}
                  onChange={(e) => setNewCitiesBulk(e.target.value)}
                  disabled={!selectedGovernorate}
                  rows={1}
                />
                <button className="btn-add" onClick={addCitiesBulk} disabled={!selectedGovernorate}>تسليم المدن</button>
              </div> */}
            </div>
          </div>
          <div className="inline-actions">
            <button className="btn-add" onClick={openUnifiedImagesModal}>
              إدارة صور الإعلانات الموحدة
            </button>
          </div>
          {showUnifiedImagesModal && (
            <div className="modal-overlay" onClick={() => setShowUnifiedImagesModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>إدارة صور الإعلانات الموحدة</h3>
                  <button className="modal-close" onClick={() => setShowUnifiedImagesModal(false)}>✕</button>
                </div>
                <div className="modal-body">
                  <div className="favorites-grid">
                    {unifiedImagesLoading ? (
                      <div className="favorite-item">
                        <span className="favorite-label">جاري التحميل...</span>
                      </div>
                    ) : unifiedImagesError ? (
                      <div className="favorite-item">
                        <span className="favorite-label">{unifiedImagesError}</span>
                      </div>
                    ) : (
                      (() => {
                        const items: Array<{ k: 'jobs_default_image' | 'doctors_default_image' | 'teachers_default_image'; label: string }> = [
                          { k: 'jobs_default_image', label: 'الوظائف' },
                          { k: 'doctors_default_image', label: 'الأطباء' },
                          { k: 'teachers_default_image', label: 'المدرسين' },
                        ];
                        return items.map(({ k, label }) => {
                          const raw = unifiedImagesSettings ? unifiedImagesSettings[k] : '';
                          const src = getImageSrc(String(raw || ''));
                          return (
                            <div key={k} className="favorite-item">
                              <span className="favorite-label">{label}</span>
                              {src ? <Image src={src} alt={label} width={160} height={120} unoptimized /> : <span>لا توجد صورة</span>}
                              <div className="inline-actions" style={{ marginInlineStart: 12 }}>
                                <button
                                  className="btn-add"
                                  onClick={() => {
                                    if (fileInputRef.current) {
                                      fileInputRef.current.setAttribute('data-key', k);
                                      fileInputRef.current.click();
                                    }
                                  }}
                                  disabled={uploadingImage === k}
                                >
                                  {uploadingImage === k ? 'جاري الرفع...' : (src ? 'استبدال' : 'رفع صورة')}
                                </button>
                              </div>
                            </div>
                          );
                        });
                      })()
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="categories-grid">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <div key={category.id} className={`category-card ${managingCategoryId === category.id ? 'manage-active' : ''}`}>
                  <div className="category-content">
                    <div className="category-header">
                      <div className="category-info">
                        <span className="category-icon" suppressHydrationWarning>
                          {(() => {
                            const defKey = getDefaultImageKey(category);
                            const sysPreview = defKey ? defaultImagePreview[defKey] : undefined;
                            const sysRaw = defKey && systemSettings ? systemSettings[defKey] : '';
                            const sysSrc = getImageSrc(String(sysRaw || ''));
                            const homepageSrc = getImageSrc(category.homepageImage);
                            const finalSrc = sysPreview || sysSrc || homepageSrc || null;
                            return finalSrc ? (
                              <Image src={finalSrc} alt={category.name} width={64} height={64} unoptimized />
                            ) : null
                          })()}
                        </span>
                        <div className="category-details">
                          <h3 className="category-name">{category.name}</h3>
                          <span className="category-order">ترتيب: {category.order}</span>
                        </div>
                      </div>
                      <div className="category-status">
                        <span className={`status-badge ${category.status}`}>
                          {category.status === 'active' ? 'نشط' : 'معطل'}
                        </span>
                      </div>
                    </div>

                    <div className="homepage-visibility">
                      <label className="toggle-label">
                        <span className="toggle-text">الظهور في الواجهة</span>
                        <div className="toggle-switch-container">
                          <input
                            type="checkbox"
                            className="toggle-input"
                            checked={category.showOnHomepage}
                            onChange={() => handleHomepageToggle(category.id)}
                          />
                          <span className="toggle-slider"></span>
                          <span className="toggle-status">
                            {category.showOnHomepage ? 'مفعل' : 'مخفي'}
                          </span>
                        </div>
                      </label>
                    </div>

                    {managingCategoryId === category.id && (
                      <button
                        className="manage-close"
                        onClick={() => setManagingCategoryId(null)}
                        aria-label="إغلاق إدارة القسم"
                        type="button"
                      >
                        ✕
                      </button>
                    )}

                    {/* <div className="category-fields">
                      <h4>الحقول المخصصة:</h4>
                      <div className="fields-list">
                        {Object.entries(category.customFields).map(([field, raw]) => {
                          const meta = typeof raw === 'string' ? { type: raw } : raw;
                          return (
                            <button
                              key={field}
                              className="field-tag clickable"
                              onClick={() => openFieldOptions(category.id, field)}
                              title="إدارة خيارات هذا الحقل"
                              type="button"
                            >
                              {field} ({meta.type}) <span className="tag-action">⚙️</span>
                            </button>
                          );
                        })}
                      </div>
                    </div> */}
                    {category.slug === 'cars' && (
                      <div className="category-fields">
                        <h4>إدارة الماركة والموديلات:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">الماركة</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(BRANDS_MODELS)}
                              value={selectedBrand}
                              onChange={(v) => { setSelectedBrand(v); setSelectedModel(''); }}
                              onDelete={(opt) => removeBrand(opt)}
                              onEdit={(prev, next) => renameBrand(prev, next)}
                              placeholder="اختر الماركة"
                            />
                            <div className="inline-actions">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="أضف ماركة"
                                value={newBrand}
                                onChange={(e) => setNewBrand(e.target.value)}
                              />
                              <button className="btn-add" onClick={addBrand}>إضافة</button>
                              {/* {selectedBrand && (
                                <button className="btn-delete" onClick={() => removeBrand(selectedBrand)}>حذف الماركة</button>
                              )} */}
                            </div>
                            <DraggableOptionsList
                              options={sortKeysWithOtherAtEnd(BRANDS_MODELS)}
                              onReorder={(reordered) => {
                                // Reorder brands while maintaining their models
                                const newBrandsModels: Record<string, string[]> = {};
                                reordered.forEach(brand => {
                                  newBrandsModels[brand] = BRANDS_MODELS[brand] ?? [];
                                });
                                setBRANDS_MODELS(newBrandsModels);
                              }}
                              onSave={async (reorderedBrands) => {
                                const category = categories.find(c => c.slug === 'cars');
                                if (!category?.slug) return;
                                try {
                                  await updateOptionRanksWithRetry(category.slug, 'brand', reorderedBrands);
                                  showToast('تم حفظ ترتيب الماركات', 'success');
                                } catch (err) {
                                  const msg = getErrMsg(err, 'حدث خطأ في حفظ ترتيب الماركات');
                                  showToast(msg, 'error');
                                  throw err;
                                }
                              }}
                              otherOptionLabel="غير ذلك"
                              renderOption={(brand) => (
                                <span className="model-tag">
                                  {brand}
                                  <button className="tag-remove" onClick={() => removeBrand(brand)} title="حذف">✕</button>
                                </span>
                              )}
                            />
                          </div>
                          <div className="location-group">
                            <label className="location-label">الموديل</label>
                            <ManagedSelect
                              options={models}
                              value={selectedModel}
                              onChange={(v) => setSelectedModel(v)}
                              onDelete={(opt) => removeModel(opt)}
                              onEdit={(prev, next) => renameModel(prev, next)}
                              disabled={!selectedBrand}
                              placeholder={selectedBrand ? 'اختر الموديل' : 'اختر الماركة أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea
                                className="form-input"
                                placeholder="أدخل كل الموديلات، مفصولة بفواصل أو أسطر"
                                value={newModelsBulk}
                                onChange={(e) => setNewModelsBulk(e.target.value)}
                                disabled={!selectedBrand}
                                rows={1}
                              />
                              <button className="btn-add" onClick={addModelsBulk} disabled={!selectedBrand}>تسليم الموديلات</button>
                            </div>
                            <DraggableOptionsList
                              options={models}
                              onReorder={(reordered) => {
                                if (selectedBrand) {
                                  setBRANDS_MODELS(prev => ({ ...prev, [selectedBrand]: reordered }));
                                }
                              }}
                              onSave={handleSaveModelsRanks}
                              otherOptionLabel="غير ذلك"
                              renderOption={(m) => (
                                <span className="model-tag">
                                  {m}
                                  <button className="tag-remove" onClick={() => removeModel(m)} title="حذف">✕</button>
                                </span>
                              )}
                            />
                          </div>
                          <div className="location-group">
                            <label className="location-label">سنة التصنيع</label>
                            <ManagedSelect
                              options={yearOptions}
                              value={manufactureYear}
                              onChange={(v) => setManufactureYear(v)}
                              onDelete={(opt) => deleteYearOption(opt)}
                              onEdit={(prev, next) => renameYearOption(prev, next)}
                              placeholder="اختر السنة"
                            />
                            <div className="inline-actions">
                              <input
                                type="number"
                                className="form-input"
                                placeholder="أضف سنة"
                                value={newYear}
                                onChange={(e) => setNewYear(e.target.value)}
                              />
                              <button className="btn-add" onClick={addYearOption}>إضافة</button>
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">الكيلو متر</label>
                            <ManagedSelect
                              options={kmOptions}
                              value={kilometersRange}
                              onChange={(v) => setKilometersRange(v)}
                              onDelete={(opt) => deleteKmOption(opt)}
                              onEdit={(prev, next) => renameKmOption(prev, next)}
                              placeholder="اختر الكيلو متر"
                            />
                            <div className="inline-actions">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="أضف نطاق كم"
                                value={newKm}
                                onChange={(e) => setNewKm(e.target.value)}
                              />
                              <button className="btn-add" onClick={addKmOption}>إضافة</button>
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">النوع</label>
                            <ManagedSelect
                              options={carTypeOptions}
                              value={carType}
                              onChange={(v) => setCarType(v)}
                              onDelete={(opt) => deleteCarTypeOption(opt)}
                              onEdit={(prev, next) => renameCarTypeOption(prev, next)}
                              placeholder="اختر النوع"
                            />
                            <div className="inline-actions">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="أضف نوع"
                                value={newCarTypeVal}
                                onChange={(e) => setNewCarTypeVal(e.target.value)}
                              />
                              <button className="btn-add" onClick={addCarTypeOption}>إضافة</button>
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">اللون الخارجي</label>
                            <ManagedSelect
                              options={exteriorColorOptions}
                              value={exteriorColor}
                              onChange={(v) => setExteriorColor(v)}
                              onDelete={(opt) => deleteExteriorColorOption(opt)}
                              onEdit={(prev, next) => renameExteriorColorOption(prev, next)}
                              placeholder="اختر اللون الخارجي"
                            />
                            <div className="inline-actions">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="أضف لون"
                                value={newExteriorColorVal}
                                onChange={(e) => setNewExteriorColorVal(e.target.value)}
                              />
                              <button className="btn-add" onClick={addExteriorColorOption}>إضافة</button>
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">الفتيس</label>
                            <ManagedSelect
                              options={transmissionOptions}
                              value={transmissionType}
                              onChange={(v) => setTransmissionType(v)}
                              onDelete={(opt) => deleteTransmissionOption(opt)}
                              onEdit={(prev, next) => renameTransmissionOption(prev, next)}
                              placeholder="اختر الفتيس"
                            />
                            <div className="inline-actions">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="أضف نوع فتيس"
                                value={newTransmissionVal}
                                onChange={(e) => setNewTransmissionVal(e.target.value)}
                              />
                              <button className="btn-add" onClick={addTransmissionOption}>إضافة</button>
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">نوع الوقود</label>
                            <ManagedSelect
                              options={fuelOptions}
                              value={fuelType}
                              onChange={(v) => setFuelType(v)}
                              onDelete={(opt) => deleteFuelOption(opt)}
                              onEdit={(prev, next) => renameFuelOption(prev, next)}
                              placeholder="اختر نوع الوقود"
                            />
                            <div className="inline-actions">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="أضف نوع وقود"
                                value={newFuelVal}
                                onChange={(e) => setNewFuelVal(e.target.value)}
                              />
                              <button className="btn-add" onClick={addFuelOption}>إضافة</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'teachers' && (
                      <div className="category-fields">
                        <h4>إدارة تخصصات المدرسين:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">التخصص</label>
                            <ManagedSelect
                              options={teacherSpecialtyOptions}
                              value={teacherSpecialty}
                              onChange={(v) => setTeacherSpecialty(v)}
                              onDelete={(opt) => deleteTeacherSpecialtyOption(opt)}
                              onEdit={(prev, next) => renameTeacherSpecialtyOption(prev, next)}
                              placeholder="اختر التخصص"
                            />
                            <div className="inline-actions">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="أضف تخصص"
                                value={newTeacherSpecialtyVal}
                                onChange={(e) => setNewTeacherSpecialtyVal(e.target.value)}
                              />
                              <button className="btn-add" onClick={addTeacherSpecialtyOption}>إضافة</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'doctors' && (
                      <div className="category-fields">
                        <h4>إدارة تخصصات الأطباء:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">التخصص</label>
                            <ManagedSelect
                              options={doctorSpecialtyOptions}
                              value={doctorSpecialty}
                              onChange={(v) => setDoctorSpecialty(v)}
                              onDelete={(opt) => deleteDoctorSpecialtyOption(opt)}
                              onEdit={(prev, next) => renameDoctorSpecialtyOption(prev, next)}
                              placeholder="اختر التخصص"
                            />
                            <div className="inline-actions">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="أضف تخصص"
                                value={newDoctorSpecialtyVal}
                                onChange={(e) => setNewDoctorSpecialtyVal(e.target.value)}
                              />
                              <button className="btn-add" onClick={addDoctorSpecialtyOption}>إضافة</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'jobs' && (
                      <div className="category-fields">
                        <h4>إدارة التصنيفات والتخصصات:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">التصنيف</label>
                            <ManagedSelect
                              options={jobCategoryOptions}
                              value={jobCategory}
                              onChange={(v) => setJobCategory(v)}
                              onDelete={(opt) => deleteJobCategoryOption(opt)}
                              onEdit={(prev, next) => renameJobCategoryOption(prev, next)}
                              placeholder="اختر التصنيف"
                            />
                            <div className="inline-actions">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="أضف تصنيف"
                                value={newJobCategoryVal}
                                onChange={(e) => setNewJobCategoryVal(e.target.value)}
                              />
                              <button className="btn-add" onClick={addJobCategoryOption}>إضافة</button>
                            </div>
                            <DraggableOptionsList
                              options={jobCategoryOptions}
                              onReorder={setJobCategoryOptions}
                              onSave={async (reordered) => {
                                const category = categories.find(c => c.slug === 'jobs');
                                if (!category?.slug) return;
                                try {
                                  await updateOptionRanksWithRetry(category.slug, jobCategoryKey, reordered);
                                  showToast('تم حفظ ترتيب التصنيفات', 'success');
                                } catch (err) {
                                  const msg = getErrMsg(err, 'حدث خطأ في حفظ الترتيب');
                                  showToast(msg, 'error');
                                  throw err;
                                }
                              }}
                              otherOptionLabel="غير ذلك"
                              renderOption={(opt) => (
                                <span className="model-tag">
                                  {opt}
                                  <button className="tag-remove" onClick={() => deleteJobCategoryOption(opt)} title="حذف">✕</button>
                                </span>
                              )}
                            />
                          </div>
                          <div className="location-group">
                            <label className="location-label">التخصص</label>
                            <ManagedSelect
                              options={jobSpecialtyOptions}
                              value={jobSpecialty}
                              onChange={(v) => setJobSpecialty(v)}
                              onDelete={(opt) => deleteJobSpecialtyOption(opt)}
                              onEdit={(prev, next) => renameJobSpecialtyOption(prev, next)}
                              placeholder="اختر التخصص"
                            />
                            <div className="inline-actions">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="أضف تخصص"
                                value={newJobSpecialtyVal}
                                onChange={(e) => setNewJobSpecialtyVal(e.target.value)}
                              />
                              <button className="btn-add" onClick={addJobSpecialtyOption}>إضافة</button>
                            </div>
                            <DraggableOptionsList
                              options={jobSpecialtyOptions}
                              onReorder={setJobSpecialtyOptions}
                              onSave={async (reordered) => {
                                const category = categories.find(c => c.slug === 'jobs');
                                if (!category?.slug) return;
                                try {
                                  await updateOptionRanksWithRetry(category.slug, jobSpecialtyKey, reordered);
                                  showToast('تم حفظ ترتيب التخصصات', 'success');
                                } catch (err) {
                                  const msg = getErrMsg(err, 'حدث خطأ في حفظ الترتيب');
                                  showToast(msg, 'error');
                                  throw err;
                                }
                              }}
                              otherOptionLabel="غير ذلك"
                              renderOption={(opt) => (
                                <span className="model-tag">
                                  {opt}
                                  <button className="tag-remove" onClick={() => deleteJobSpecialtyOption(opt)} title="حذف">✕</button>
                                </span>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {category.slug === 'food-products' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية للمنتجات:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(FOOD_MAIN_SUBS)}
                              value={selectedFoodMain}
                              onChange={(v) => { setSelectedFoodMain(v); setSelectedFoodSub(''); }}
                              onDelete={(opt) => removeFoodMain(opt)}
                              onEdit={(prev, next) => renameFoodMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="أضف رئيسي"
                                value={newFoodMain}
                                onChange={(e) => setNewFoodMain(e.target.value)}
                              />
                              <button className="btn-add" onClick={addFoodMain}>إضافة</button>
                            </div>
                            <DraggableOptionsList
                              options={sortKeysWithOtherAtEnd(FOOD_MAIN_SUBS)}
                              onReorder={(reordered) => {
                                const newMap: Record<string, string[]> = {};
                                reordered.forEach(main => {
                                  newMap[main] = FOOD_MAIN_SUBS[main] ?? [];
                                });
                                setFOOD_MAIN_SUBS(newMap);
                              }}
                              onSave={async (reordered) => {
                                const category = categories.find(c => c.slug === 'food-products');
                                if (!category?.slug) return;
                                try {
                                  await updateOptionRanksWithRetry(category.slug, foodMainKey, reordered);
                                  showToast('تم حفظ ترتيب الفئات الرئيسية', 'success');
                                } catch (err) {
                                  const msg = getErrMsg(err, 'حدث خطأ في حفظ الترتيب');
                                  showToast(msg, 'error');
                                  throw err;
                                }
                              }}
                              otherOptionLabel="غير ذلك"
                              renderOption={(main) => (
                                <span className="model-tag">
                                  {main}
                                  <button className="tag-remove" onClick={() => removeFoodMain(main)} title="حذف">✕</button>
                                </span>
                              )}
                            />
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={foodSubs}
                              value={selectedFoodSub}
                              onChange={(v) => setSelectedFoodSub(v)}
                              onDelete={(opt) => removeFoodSub(opt)}
                              onEdit={(prev, next) => renameFoodSub(prev, next)}
                              disabled={!selectedFoodMain}
                              placeholder={selectedFoodMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea
                                className="form-input"
                                placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر"
                                value={newFoodSubsBulk}
                                onChange={(e) => setNewFoodSubsBulk(e.target.value)}
                                disabled={!selectedFoodMain}
                                rows={3}
                              />
                              <button className="btn-add" onClick={addFoodSubsBulk} disabled={!selectedFoodMain}>تسليم الفرعيات</button>
                            </div>
                            <DraggableOptionsList
                              options={foodSubs}
                              onReorder={(reordered) => {
                                if (selectedFoodMain) {
                                  setFOOD_MAIN_SUBS(prev => ({ ...prev, [selectedFoodMain]: reordered }));
                                }
                              }}
                              onSave={async (reordered) => {
                                const category = categories.find(c => c.slug === 'food-products');
                                if (!category?.slug || !selectedFoodMain) return;
                                try {
                                  await updateOptionRanksWithRetry(category.slug, foodSubKey, reordered);
                                  showToast('تم حفظ ترتيب الفرعيات', 'success');
                                } catch (err) {
                                  const msg = getErrMsg(err, 'حدث خطأ في حفظ الترتيب');
                                  showToast(msg, 'error');
                                  throw err;
                                }
                              }}
                              otherOptionLabel="غير ذلك"
                              renderOption={(s) => (
                                <span className="model-tag">
                                  {s}
                                  <button className="tag-remove" onClick={() => removeFoodSub(s)} title="حذف">✕</button>
                                </span>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'restaurants' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(RESTAURANTS_MAIN_SUBS)}
                              value={selectedRestaurantMain}
                              onChange={(v) => { setSelectedRestaurantMain(v); setSelectedRestaurantSub(''); }}
                              onDelete={(opt) => removeRestaurantMain(opt)}
                              onEdit={(prev, next) => renameRestaurantMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="أضف رئيسي"
                                value={newRestaurantMain}
                                onChange={(e) => setNewRestaurantMain(e.target.value)}
                              />
                              <button className="btn-add" onClick={addRestaurantMain}>إضافة</button>
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={restaurantSubs}
                              value={selectedRestaurantSub}
                              onChange={(v) => setSelectedRestaurantSub(v)}
                              onDelete={(opt) => removeRestaurantSub(opt)}
                              onEdit={(prev, next) => renameRestaurantSub(prev, next)}
                              disabled={!selectedRestaurantMain}
                              placeholder={selectedRestaurantMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea
                                className="form-input"
                                placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر"
                                value={newRestaurantSubsBulk}
                                onChange={(e) => setNewRestaurantSubsBulk(e.target.value)}
                                disabled={!selectedRestaurantMain}
                                rows={3}
                              />
                              <button className="btn-add" onClick={addRestaurantSubsBulk} disabled={!selectedRestaurantMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {restaurantSubs.map(s => (
                                <span key={s} className="model-tag">
                                  {s}
                                  <button className="tag-remove" onClick={() => removeRestaurantSub(s)} title="حذف">✕</button>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'stores' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(STORES_MAIN_SUBS)}
                              value={selectedStoreMain}
                              onChange={(v) => { setSelectedStoreMain(v); setSelectedStoreSub(''); }}
                              onDelete={(opt) => removeStoreMain(opt)}
                              onEdit={(prev, next) => renameStoreMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="أضف رئيسي"
                                value={newStoreMain}
                                onChange={(e) => setNewStoreMain(e.target.value)}
                              />
                              <button className="btn-add" onClick={addStoreMain}>إضافة</button>
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={storeSubs}
                              value={selectedStoreSub}
                              onChange={(v) => setSelectedStoreSub(v)}
                              onDelete={(opt) => removeStoreSub(opt)}
                              onEdit={(prev, next) => renameStoreSub(prev, next)}
                              disabled={!selectedStoreMain}
                              placeholder={selectedStoreMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea
                                className="form-input"
                                placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر"
                                value={newStoreSubsBulk}
                                onChange={(e) => setNewStoreSubsBulk(e.target.value)}
                                disabled={!selectedStoreMain}
                                rows={3}
                              />
                              <button className="btn-add" onClick={addStoreSubsBulk} disabled={!selectedStoreMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {storeSubs.map(s => (
                                <span key={s} className="model-tag">
                                  {s}
                                  <button className="tag-remove" onClick={() => removeStoreSub(s)} title="حذف">✕</button>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'groceries' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(GROCERIES_MAIN_SUBS)}
                              value={selectedGroceryMain}
                              onChange={(v) => { setSelectedGroceryMain(v); setSelectedGrocerySub(''); }}
                              onDelete={(opt) => removeGroceryMain(opt)}
                              onEdit={(prev, next) => renameGroceryMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="أضف رئيسي"
                                value={newGroceryMain}
                                onChange={(e) => setNewGroceryMain(e.target.value)}
                              />
                              <button className="btn-add" onClick={addGroceryMain}>إضافة</button>
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={grocerySubs}
                              value={selectedGrocerySub}
                              onChange={(v) => setSelectedGrocerySub(v)}
                              onDelete={(opt) => removeGrocerySub(opt)}
                              onEdit={(prev, next) => renameGrocerySub(prev, next)}
                              disabled={!selectedGroceryMain}
                              placeholder={selectedGroceryMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea
                                className="form-input"
                                placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر"
                                value={newGrocerySubsBulk}
                                onChange={(e) => setNewGrocerySubsBulk(e.target.value)}
                                disabled={!selectedGroceryMain}
                                rows={3}
                              />
                              <button className="btn-add" onClick={addGrocerySubsBulk} disabled={!selectedGroceryMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {grocerySubs.map(s => (
                                <span key={s} className="model-tag">
                                  {s}
                                  <button className="tag-remove" onClick={() => removeGrocerySub(s)} title="حذف">✕</button>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'home-services' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(HOME_SERVICES_MAIN_SUBS)}
                              value={selectedHomeServiceMain}
                              onChange={(v) => { setSelectedHomeServiceMain(v); setSelectedHomeServiceSub(''); }}
                              onDelete={(opt) => removeHomeServiceMain(opt)}
                              onEdit={(prev, next) => renameHomeServiceMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="أضف رئيسي"
                                value={newHomeServiceMain}
                                onChange={(e) => setNewHomeServiceMain(e.target.value)}
                              />
                              <button className="btn-add" onClick={addHomeServiceMain}>إضافة</button>
                              {/*  {selectedHomeServiceMain && (
                                <button className="btn-delete" onClick={() => removeHomeServiceMain(selectedHomeServiceMain)}>حذف الرئيسي</button>
                              )}*/}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={homeServiceSubs}
                              value={selectedHomeServiceSub}
                              onChange={(v) => setSelectedHomeServiceSub(v)}
                              onDelete={(opt) => removeHomeServiceSub(opt)}
                              onEdit={(prev, next) => renameHomeServiceSub(prev, next)}
                              disabled={!selectedHomeServiceMain}
                              placeholder={selectedHomeServiceMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea
                                className="form-input"
                                placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر"
                                value={newHomeServiceSubsBulk}
                                onChange={(e) => setNewHomeServiceSubsBulk(e.target.value)}
                                disabled={!selectedHomeServiceMain}
                                rows={3}
                              />
                              <button className="btn-add" onClick={addHomeServiceSubsBulk} disabled={!selectedHomeServiceMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {homeServiceSubs.map(s => (
                                <span key={s} className="model-tag">
                                  {s}
                                  <button className="tag-remove" onClick={() => removeHomeServiceSub(s)} title="حذف">✕</button>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'furniture' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(FURNITURE_MAIN_SUBS)}
                              value={selectedFurnitureMain}
                              onChange={(v) => { setSelectedFurnitureMain(v); setSelectedFurnitureSub(''); }}
                              onDelete={(opt) => removeFurnitureMain(opt)}
                              onEdit={(prev, next) => renameFurnitureMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="أضف رئيسي"
                                value={newFurnitureMain}
                                onChange={(e) => setNewFurnitureMain(e.target.value)}
                              />
                              <button className="btn-add" onClick={addFurnitureMain}>إضافة</button>
                              {/* {selectedFurnitureMain && (
                                <button className="btn-delete" onClick={() => removeFurnitureMain(selectedFurnitureMain)}>حذف الرئيسي</button>
                              )} */}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={furnitureSubs}
                              value={selectedFurnitureSub}
                              onChange={(v) => setSelectedFurnitureSub(v)}
                              onDelete={(opt) => removeFurnitureSub(opt)}
                              onEdit={(prev, next) => renameFurnitureSub(prev, next)}
                              disabled={!selectedFurnitureMain}
                              placeholder={selectedFurnitureMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea
                                className="form-input"
                                placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر"
                                value={newFurnitureSubsBulk}
                                onChange={(e) => setNewFurnitureSubsBulk(e.target.value)}
                                disabled={!selectedFurnitureMain}
                                rows={3}
                              />
                              <button className="btn-add" onClick={addFurnitureSubsBulk} disabled={!selectedFurnitureMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {furnitureSubs.map(s => (
                                <span key={s} className="model-tag">
                                  {s}
                                  <button className="tag-remove" onClick={() => removeFurnitureSub(s)} title="حذف">✕</button>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'home-tools' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(HOUSEHOLD_TOOLS_MAIN_SUBS)}
                              value={selectedHouseholdToolMain}
                              onChange={(v) => { setSelectedHouseholdToolMain(v); setSelectedHouseholdToolSub(''); }}
                              onDelete={(opt) => removeHouseholdToolMain(opt)}
                              onEdit={(prev, next) => renameHouseholdToolMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="أضف رئيسي"
                                value={newHouseholdToolMain}
                                onChange={(e) => setNewHouseholdToolMain(e.target.value)}
                              />
                              <button className="btn-add" onClick={addHouseholdToolMain}>إضافة</button>
                              {/* {selectedHouseholdToolMain && (
                                <button className="btn-delete" onClick={() => removeHouseholdToolMain(selectedHouseholdToolMain)}>حذف الرئيسي</button>
                              )} */}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={householdToolSubs}
                              value={selectedHouseholdToolSub}
                              onChange={(v) => setSelectedHouseholdToolSub(v)}
                              onDelete={(opt) => removeHouseholdToolSub(opt)}
                              onEdit={(prev, next) => renameHouseholdToolSub(prev, next)}
                              disabled={!selectedHouseholdToolMain}
                              placeholder={selectedHouseholdToolMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea
                                className="form-input"
                                placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر"
                                value={newHouseholdToolSubsBulk}
                                onChange={(e) => setNewHouseholdToolSubsBulk(e.target.value)}
                                disabled={!selectedHouseholdToolMain}
                                rows={3}
                              />
                              <button className="btn-add" onClick={addHouseholdToolSubsBulk} disabled={!selectedHouseholdToolMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {householdToolSubs.map(s => (
                                <span key={s} className="model-tag">
                                  {s}
                                  <button className="tag-remove" onClick={() => removeHouseholdToolSub(s)} title="حذف">✕</button>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'home-appliances' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(HOME_APPLIANCES_MAIN_SUBS)}
                              value={selectedHomeApplianceMain}
                              onChange={(v) => { setSelectedHomeApplianceMain(v); setSelectedHomeApplianceSub(''); }}
                              onDelete={(opt) => removeHomeApplianceMain(opt)}
                              onEdit={(prev, next) => renameHomeApplianceMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="أضف رئيسي"
                                value={newHomeApplianceMain}
                                onChange={(e) => setNewHomeApplianceMain(e.target.value)}
                              />
                              <button className="btn-add" onClick={addHomeApplianceMain}>إضافة</button>
                              {/* {selectedHomeApplianceMain && (
                                <button className="btn-delete" onClick={() => removeHomeApplianceMain(selectedHomeApplianceMain)}>حذف الرئيسي</button>
                              )} */}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={homeApplianceSubs}
                              value={selectedHomeApplianceSub}
                              onChange={(v) => setSelectedHomeApplianceSub(v)}
                              onDelete={(opt) => removeHomeApplianceSub(opt)}
                              onEdit={(prev, next) => renameHomeApplianceSub(prev, next)}
                              disabled={!selectedHomeApplianceMain}
                              placeholder={selectedHomeApplianceMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea
                                className="form-input"
                                placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر"
                                value={newHomeApplianceSubsBulk}
                                onChange={(e) => setNewHomeApplianceSubsBulk(e.target.value)}
                                disabled={!selectedHomeApplianceMain}
                                rows={3}
                              />
                              <button className="btn-add" onClick={addHomeApplianceSubsBulk} disabled={!selectedHomeApplianceMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {homeApplianceSubs.map(s => (
                                <span key={s} className="model-tag">
                                  {s}
                                  <button className="tag-remove" onClick={() => removeHomeApplianceSub(s)} title="حذف">✕</button>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'electronics' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(ELECTRONICS_MAIN_SUBS)}
                              value={selectedElectronicsMain}
                              onChange={(v) => { setSelectedElectronicsMain(v); setSelectedElectronicsSub(''); }}
                              onDelete={(opt) => removeElectronicsMain(opt)}
                              onEdit={(prev, next) => renameElectronicsMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="أضف رئيسي"
                                value={newElectronicsMain}
                                onChange={(e) => setNewElectronicsMain(e.target.value)}
                              />
                              <button className="btn-add" onClick={addElectronicsMain}>إضافة</button>
                              {/* {selectedElectronicsMain && (
                                <button className="btn-delete" onClick={() => removeElectronicsMain(selectedElectronicsMain)}>حذف الرئيسي</button>
                              )} */}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={electronicsSubs}
                              value={selectedElectronicsSub}
                              onChange={(v) => setSelectedElectronicsSub(v)}
                              onDelete={(opt) => removeElectronicsSub(opt)}
                              onEdit={(prev, next) => renameElectronicsSub(prev, next)}
                              disabled={!selectedElectronicsMain}
                              placeholder={selectedElectronicsMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea
                                className="form-input"
                                placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر"
                                value={newElectronicsSubsBulk}
                                onChange={(e) => setNewElectronicsSubsBulk(e.target.value)}
                                disabled={!selectedElectronicsMain}
                                rows={3}
                              />
                              <button className="btn-add" onClick={addElectronicsSubsBulk} disabled={!selectedElectronicsMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {electronicsSubs.map(s => (
                                <span key={s} className="model-tag">
                                  {s}
                                  <button className="tag-remove" onClick={() => removeElectronicsSub(s)} title="حذف">✕</button>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'health' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(HEALTH_MAIN_SUBS)}
                              value={selectedHealthMain}
                              onChange={(v) => { setSelectedHealthMain(v); setSelectedHealthSub(''); }}
                              onDelete={(opt) => removeHealthMain(opt)}
                              onEdit={(prev, next) => renameHealthMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="أضف رئيسي"
                                value={newHealthMain}
                                onChange={(e) => setNewHealthMain(e.target.value)}
                              />
                              <button className="btn-add" onClick={addHealthMain}>إضافة</button>
                              {/* {selectedHealthMain && (
                                <button className="btn-delete" onClick={() => removeHealthMain(selectedHealthMain)}>حذف الرئيسي</button>
                              )} */}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={healthSubs}
                              value={selectedHealthSub}
                              onChange={(v) => setSelectedHealthSub(v)}
                              onDelete={(opt) => removeHealthSub(opt)}
                              onEdit={(prev, next) => renameHealthSub(prev, next)}
                              disabled={!selectedHealthMain}
                              placeholder={selectedHealthMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea
                                className="form-input"
                                placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر"
                                value={newHealthSubsBulk}
                                onChange={(e) => setNewHealthSubsBulk(e.target.value)}
                                disabled={!selectedHealthMain}
                                rows={3}
                              />
                              <button className="btn-add" onClick={addHealthSubsBulk} disabled={!selectedHealthMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {healthSubs.map(s => (
                                <span key={s} className="model-tag">
                                  {s}
                                  <button className="tag-remove" onClick={() => removeHealthSub(s)} title="حذف">✕</button>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'education' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(EDUCATION_MAIN_SUBS)}
                              value={selectedEducationMain}
                              onChange={(v) => { setSelectedEducationMain(v); setSelectedEducationSub(''); }}
                              onDelete={(opt) => removeEducationMain(opt)}
                              onEdit={(prev, next) => renameEducationMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input type="text" className="form-input" placeholder="أضف رئيسي" value={newEducationMain} onChange={(e) => setNewEducationMain(e.target.value)} />
                              <button className="btn-add" onClick={addEducationMain}>إضافة</button>
                              {/* {selectedEducationMain && (<button className="btn-delete" onClick={() => removeEducationMain(selectedEducationMain)}>حذف الرئيسي</button>)} */}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={educationSubs}
                              value={selectedEducationSub}
                              onChange={(v) => setSelectedEducationSub(v)}
                              onDelete={(opt) => removeEducationSub(opt)}
                              onEdit={(prev, next) => renameEducationSub(prev, next)}
                              disabled={!selectedEducationMain}
                              placeholder={selectedEducationMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea className="form-input" placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر" value={newEducationSubsBulk} onChange={(e) => setNewEducationSubsBulk(e.target.value)} disabled={!selectedEducationMain} rows={3} />
                              <button className="btn-add" onClick={addEducationSubsBulk} disabled={!selectedEducationMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {educationSubs.map(s => (
                                <span key={s} className="model-tag">
                                  {s}
                                  <button className="tag-edit" title="تعديل" onClick={() => {
                                    const next = (typeof window !== 'undefined') ? prompt('تعديل الفرعي', s) || '' : '';
                                    renameEducationSub(s, next);
                                  }}>✎</button>
                                  <button className="tag-remove" onClick={() => removeEducationSub(s)} title="حذف">✕</button>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'shipping' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(SHIPPING_MAIN_SUBS)}
                              value={selectedShippingMain}
                              onChange={(v) => { setSelectedShippingMain(v); setSelectedShippingSub(''); }}
                              onDelete={(opt) => removeShippingMain(opt)}
                              onEdit={(prev, next) => renameShippingMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input type="text" className="form-input" placeholder="أضف رئيسي" value={newShippingMain} onChange={(e) => setNewShippingMain(e.target.value)} />
                              <button className="btn-add" onClick={addShippingMain}>إضافة</button>
                              {/* {selectedShippingMain && (<button className="btn-delete" onClick={() => removeShippingMain(selectedShippingMain)}>حذف الرئيسي</button>)} */}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={shippingSubs}
                              value={selectedShippingSub}
                              onChange={(v) => setSelectedShippingSub(v)}
                              onDelete={(opt) => removeShippingSub(opt)}
                              onEdit={(prev, next) => renameShippingSub(prev, next)}
                              disabled={!selectedShippingMain}
                              placeholder={selectedShippingMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea className="form-input" placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر" value={newShippingSubsBulk} onChange={(e) => setNewShippingSubsBulk(e.target.value)} disabled={!selectedShippingMain} rows={3} />
                              <button className="btn-add" onClick={addShippingSubsBulk} disabled={!selectedShippingMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {shippingSubs.map(s => (
                                <span key={s} className="model-tag">{s}<button className="tag-remove" onClick={() => removeShippingSub(s)} title="حذف">✕</button></span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'mens-clothes' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(MENS_CLOTHING_SHOES_MAIN_SUBS)}
                              value={selectedMensClothingShoesMain}
                              onChange={(v) => { setSelectedMensClothingShoesMain(v); setSelectedMensClothingShoesSub(''); }}
                              onDelete={(opt) => removeMensClothingShoesMain(opt)}
                              onEdit={(prev, next) => renameMensClothingShoesMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input type="text" className="form-input" placeholder="أضف رئيسي" value={newMensClothingShoesMain} onChange={(e) => setNewMensClothingShoesMain(e.target.value)} />
                              <button className="btn-add" onClick={addMensClothingShoesMain}>إضافة</button>
                              {/* {selectedMensClothingShoesMain && (<button className="btn-delete" onClick={() => removeMensClothingShoesMain(selectedMensClothingShoesMain)}>حذف الرئيسي</button>)} */}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={mensClothingShoesSubs}
                              value={selectedMensClothingShoesSub}
                              onChange={(v) => setSelectedMensClothingShoesSub(v)}
                              onDelete={(opt) => removeMensClothingShoesSub(opt)}
                              onEdit={(prev, next) => renameMensClothingShoesSub(prev, next)}
                              disabled={!selectedMensClothingShoesMain}
                              placeholder={selectedMensClothingShoesMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea className="form-input" placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر" value={newMensClothingShoesSubsBulk} onChange={(e) => setNewMensClothingShoesSubsBulk(e.target.value)} disabled={!selectedMensClothingShoesMain} rows={3} />
                              <button className="btn-add" onClick={addMensClothingShoesSubsBulk} disabled={!selectedMensClothingShoesMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {mensClothingShoesSubs.map(s => (
                                <span key={s} className="model-tag">{s}<button className="tag-remove" onClick={() => removeMensClothingShoesSub(s)} title="حذف">✕</button></span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'heavy-transport' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(HEAVY_EQUIPMENT_MAIN_SUBS)}
                              value={selectedHeavyEquipmentMain}
                              onChange={(v) => { setSelectedHeavyEquipmentMain(v); setSelectedHeavyEquipmentSub(''); }}
                              onDelete={(opt) => removeHeavyEquipmentMain(opt)}
                              onEdit={(prev, next) => renameHeavyEquipmentMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input type="text" className="form-input" placeholder="أضف رئيسي" value={newHeavyEquipmentMain} onChange={(e) => setNewHeavyEquipmentMain(e.target.value)} />
                              <button className="btn-add" onClick={addHeavyEquipmentMain}>إضافة</button>
                              {/* {selectedHeavyEquipmentMain && (<button className="btn-delete" onClick={() => removeHeavyEquipmentMain(selectedHeavyEquipmentMain)}>حذف الرئيسي</button>)} */}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={heavyEquipmentSubs}
                              value={selectedHeavyEquipmentSub}
                              onChange={(v) => setSelectedHeavyEquipmentSub(v)}
                              onDelete={(opt) => removeHeavyEquipmentSub(opt)}
                              onEdit={(prev, next) => renameHeavyEquipmentSub(prev, next)}
                              disabled={!selectedHeavyEquipmentMain}
                              placeholder={selectedHeavyEquipmentMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea className="form-input" placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر" value={newHeavyEquipmentSubsBulk} onChange={(e) => setNewHeavyEquipmentSubsBulk(e.target.value)} disabled={!selectedHeavyEquipmentMain} rows={3} />
                              <button className="btn-add" onClick={addHeavyEquipmentSubsBulk} disabled={!selectedHeavyEquipmentMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {heavyEquipmentSubs.map(s => (
                                <span key={s} className="model-tag">{s}<button className="tag-remove" onClick={() => removeHeavyEquipmentSub(s)} title="حذف">✕</button></span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'kids-toys' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(KIDS_SUPPLIES_TOYS_MAIN_SUBS)}
                              value={selectedKidsSuppliesToysMain}
                              onChange={(v) => { setSelectedKidsSuppliesToysMain(v); setSelectedKidsSuppliesToysSub(''); }}
                              onDelete={(opt) => removeKidsSuppliesToysMain(opt)}
                              onEdit={(prev, next) => renameKidsSuppliesToysMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input type="text" className="form-input" placeholder="أضف رئيسي" value={newKidsSuppliesToysMain} onChange={(e) => setNewKidsSuppliesToysMain(e.target.value)} />
                              <button className="btn-add" onClick={addKidsSuppliesToysMain}>إضافة</button>
                              {/* {selectedKidsSuppliesToysMain && (<button className="btn-delete" onClick={() => removeKidsSuppliesToysMain(selectedKidsSuppliesToysMain)}>حذف الرئيسي</button>)} */}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={kidsSuppliesToysSubs}
                              value={selectedKidsSuppliesToysSub}
                              onChange={(v) => setSelectedKidsSuppliesToysSub(v)}
                              onDelete={(opt) => removeKidsSuppliesToysSub(opt)}
                              onEdit={(prev, next) => renameKidsSuppliesToysSub(prev, next)}
                              disabled={!selectedKidsSuppliesToysMain}
                              placeholder={selectedKidsSuppliesToysMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea className="form-input" placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر" value={newKidsSuppliesToysSubsBulk} onChange={(e) => setNewKidsSuppliesToysSubsBulk(e.target.value)} disabled={!selectedKidsSuppliesToysMain} rows={3} />
                              <button className="btn-add" onClick={addKidsSuppliesToysSubsBulk} disabled={!selectedKidsSuppliesToysMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {kidsSuppliesToysSubs.map(s => (
                                <span key={s} className="model-tag">{s}<button className="tag-remove" onClick={() => removeKidsSuppliesToysSub(s)} title="حذف">✕</button></span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'free-professions' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(FREELANCE_SERVICES_MAIN_SUBS)}
                              value={selectedFreelanceServicesMain}
                              onChange={(v) => { setSelectedFreelanceServicesMain(v); setSelectedFreelanceServicesSub(''); }}
                              onDelete={(opt) => removeFreelanceServicesMain(opt)}
                              onEdit={(prev, next) => renameFreelanceServicesMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input type="text" className="form-input" placeholder="أضف رئيسي" value={newFreelanceServicesMain} onChange={(e) => setNewFreelanceServicesMain(e.target.value)} />
                              <button className="btn-add" onClick={addFreelanceServicesMain}>إضافة</button>
                              {/* {selectedFreelanceServicesMain && (<button className="btn-delete" onClick={() => removeFreelanceServicesMain(selectedFreelanceServicesMain)}>حذف الرئيسي</button>)} */}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={freelanceServicesSubs}
                              value={selectedFreelanceServicesSub}
                              onChange={(v) => setSelectedFreelanceServicesSub(v)}
                              onDelete={(opt) => removeFreelanceServicesSub(opt)}
                              onEdit={(prev, next) => renameFreelanceServicesSub(prev, next)}
                              disabled={!selectedFreelanceServicesMain}
                              placeholder={selectedFreelanceServicesMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea className="form-input" placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر" value={newFreelanceServicesSubsBulk} onChange={(e) => setNewFreelanceServicesSubsBulk(e.target.value)} disabled={!selectedFreelanceServicesMain} rows={3} />
                              <button className="btn-add" onClick={addFreelanceServicesSubsBulk} disabled={!selectedFreelanceServicesMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {freelanceServicesSubs.map(s => (
                                <span key={s} className="model-tag">{s}<button className="tag-remove" onClick={() => removeFreelanceServicesSub(s)} title="حذف">✕</button></span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'watches-jewelry' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(WATCHES_JEWELRY_MAIN_SUBS)}
                              value={selectedWatchesJewelryMain}
                              onChange={(v) => { setSelectedWatchesJewelryMain(v); setSelectedWatchesJewelrySub(''); }}
                              onDelete={(opt) => removeWatchesJewelryMain(opt)}
                              onEdit={(prev, next) => renameWatchesJewelryMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input type="text" className="form-input" placeholder="أضف رئيسي" value={newWatchesJewelryMain} onChange={(e) => setNewWatchesJewelryMain(e.target.value)} />
                              <button className="btn-add" onClick={addWatchesJewelryMain}>إضافة</button>
                              {/* {selectedWatchesJewelryMain && (<button className="btn-delete" onClick={() => removeWatchesJewelryMain(selectedWatchesJewelryMain)}>حذف الرئيسي</button>)} */}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={watchesJewelrySubs}
                              value={selectedWatchesJewelrySub}
                              onChange={(v) => setSelectedWatchesJewelrySub(v)}
                              onDelete={(opt) => removeWatchesJewelrySub(opt)}
                              onEdit={(prev, next) => renameWatchesJewelrySub(prev, next)}
                              disabled={!selectedWatchesJewelryMain}
                              placeholder={selectedWatchesJewelryMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea className="form-input" placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر" value={newWatchesJewelrySubsBulk} onChange={(e) => setNewWatchesJewelrySubsBulk(e.target.value)} disabled={!selectedWatchesJewelryMain} rows={3} />
                              <button className="btn-add" onClick={addWatchesJewelrySubsBulk} disabled={!selectedWatchesJewelryMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {watchesJewelrySubs.map(s => (
                                <span key={s} className="model-tag">{s}<button className="tag-remove" onClick={() => removeWatchesJewelrySub(s)} title="حذف">✕</button></span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'car-services' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(CAR_SERVICES_MAIN_SUBS)}
                              value={selectedCarServicesMain}
                              onChange={(v) => { setSelectedCarServicesMain(v); setSelectedCarServicesSub(''); }}
                              onDelete={(opt) => removeCarServicesMain(opt)}
                              onEdit={(prev, next) => renameCarServicesMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input type="text" className="form-input" placeholder="أضف رئيسي" value={newCarServicesMain} onChange={(e) => setNewCarServicesMain(e.target.value)} />
                              <button className="btn-add" onClick={addCarServicesMain}>إضافة</button>
                              {/* {selectedCarServicesMain && (<button className="btn-delete" onClick={() => removeCarServicesMain(selectedCarServicesMain)}>حذف الرئيسي</button>)} */}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={carServicesSubs}
                              value={selectedCarServicesSub}
                              onChange={(v) => setSelectedCarServicesSub(v)}
                              onDelete={(opt) => removeCarServicesSub(opt)}
                              onEdit={(prev, next) => renameCarServicesSub(prev, next)}
                              disabled={!selectedCarServicesMain}
                              placeholder={selectedCarServicesMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea className="form-input" placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر" value={newCarServicesSubsBulk} onChange={(e) => setNewCarServicesSubsBulk(e.target.value)} disabled={!selectedCarServicesMain} rows={3} />
                              <button className="btn-add" onClick={addCarServicesSubsBulk} disabled={!selectedCarServicesMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {carServicesSubs.map(s => (
                                <span key={s} className="model-tag">{s}<button className="tag-remove" onClick={() => removeCarServicesSub(s)} title="حذف">✕</button></span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'maintenance' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(GENERAL_MAINTENANCE_MAIN_SUBS)}
                              value={selectedGeneralMaintenanceMain}
                              onChange={(v) => { setSelectedGeneralMaintenanceMain(v); setSelectedGeneralMaintenanceSub(''); }}
                              onDelete={(opt) => removeGeneralMaintenanceMain(opt)}
                              onEdit={(prev, next) => renameGeneralMaintenanceMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input type="text" className="form-input" placeholder="أضف رئيسي" value={newGeneralMaintenanceMain} onChange={(e) => setNewGeneralMaintenanceMain(e.target.value)} />
                              <button className="btn-add" onClick={addGeneralMaintenanceMain}>إضافة</button>
                              {/* {selectedGeneralMaintenanceMain && (<button className="btn-delete" onClick={() => removeGeneralMaintenanceMain(selectedGeneralMaintenanceMain)}>حذف الرئيسي</button>)} */}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={generalMaintenanceSubs}
                              value={selectedGeneralMaintenanceSub}
                              onChange={(v) => setSelectedGeneralMaintenanceSub(v)}
                              onDelete={(opt) => removeGeneralMaintenanceSub(opt)}
                              onEdit={(prev, next) => renameGeneralMaintenanceSub(prev, next)}
                              disabled={!selectedGeneralMaintenanceMain}
                              placeholder={selectedGeneralMaintenanceMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea className="form-input" placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر" value={newGeneralMaintenanceSubsBulk} onChange={(e) => setNewGeneralMaintenanceSubsBulk(e.target.value)} disabled={!selectedGeneralMaintenanceMain} rows={3} />
                              <button className="btn-add" onClick={addGeneralMaintenanceSubsBulk} disabled={!selectedGeneralMaintenanceMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {generalMaintenanceSubs.map(s => (
                                <span key={s} className="model-tag">{s}<button className="tag-remove" onClick={() => removeGeneralMaintenanceSub(s)} title="حذف">✕</button></span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'construction' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(CONSTRUCTION_TOOLS_MAIN_SUBS)}
                              value={selectedConstructionToolsMain}
                              onChange={(v) => { setSelectedConstructionToolsMain(v); setSelectedConstructionToolsSub(''); }}
                              onDelete={(opt) => removeConstructionToolsMain(opt)}
                              onEdit={(prev, next) => renameConstructionToolsMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input type="text" className="form-input" placeholder="أضف رئيسي" value={newConstructionToolsMain} onChange={(e) => setNewConstructionToolsMain(e.target.value)} />
                              <button className="btn-add" onClick={addConstructionToolsMain}>إضافة</button>
                              {/* {selectedConstructionToolsMain && (<button className="btn-delete" onClick={() => removeConstructionToolsMain(selectedConstructionToolsMain)}>حذف الرئيسي</button>)} */}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={constructionToolsSubs}
                              value={selectedConstructionToolsSub}
                              onChange={(v) => setSelectedConstructionToolsSub(v)}
                              onDelete={(opt) => removeConstructionToolsSub(opt)}
                              onEdit={(prev, next) => renameConstructionToolsSub(prev, next)}
                              disabled={!selectedConstructionToolsMain}
                              placeholder={selectedConstructionToolsMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea className="form-input" placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر" value={newConstructionToolsSubsBulk} onChange={(e) => setNewConstructionToolsSubsBulk(e.target.value)} disabled={!selectedConstructionToolsMain} rows={3} />
                              <button className="btn-add" onClick={addConstructionToolsSubsBulk} disabled={!selectedConstructionToolsMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {constructionToolsSubs.map(s => (
                                <span key={s} className="model-tag">{s}<button className="tag-remove" onClick={() => removeConstructionToolsSub(s)} title="حذف">✕</button></span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'gym' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(GYMS_MAIN_SUBS)}
                              value={selectedGymsMain}
                              onChange={(v) => { setSelectedGymsMain(v); setSelectedGymsSub(''); }}
                              onDelete={(opt) => removeGymsMain(opt)}
                              onEdit={(prev, next) => renameGymsMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input type="text" className="form-input" placeholder="أضف رئيسي" value={newGymsMain} onChange={(e) => setNewGymsMain(e.target.value)} />
                              <button className="btn-add" onClick={addGymsMain}>إضافة</button>
                              {/* {selectedGymsMain && (<button className="btn-delete" onClick={() => removeGymsMain(selectedGymsMain)}>حذف الرئيسي</button>)} */}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={gymsSubs}
                              value={selectedGymsSub}
                              onChange={(v) => setSelectedGymsSub(v)}
                              onDelete={(opt) => removeGymsSub(opt)}
                              onEdit={(prev, next) => renameGymsSub(prev, next)}
                              disabled={!selectedGymsMain}
                              placeholder={selectedGymsMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea className="form-input" placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر" value={newGymsSubsBulk} onChange={(e) => setNewGymsSubsBulk(e.target.value)} disabled={!selectedGymsMain} rows={3} />
                              <button className="btn-add" onClick={addGymsSubsBulk} disabled={!selectedGymsMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {gymsSubs.map(s => (
                                <span key={s} className="model-tag">{s}<button className="tag-remove" onClick={() => removeGymsSub(s)} title="حذف">✕</button></span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'light-vehicles' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(BIKES_LIGHT_VEHICLES_MAIN_SUBS)}
                              value={selectedBikesLightVehiclesMain}
                              onChange={(v) => { setSelectedBikesLightVehiclesMain(v); setSelectedBikesLightVehiclesSub(''); }}
                              onDelete={(opt) => removeBikesLightVehiclesMain(opt)}
                              onEdit={(prev, next) => renameBikesLightVehiclesMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input type="text" className="form-input" placeholder="أضف رئيسي" value={newBikesLightVehiclesMain} onChange={(e) => setNewBikesLightVehiclesMain(e.target.value)} />
                              <button className="btn-add" onClick={addBikesLightVehiclesMain}>إضافة</button>
                              {/* {selectedBikesLightVehiclesMain && (<button className="btn-delete" onClick={() => removeBikesLightVehiclesMain(selectedBikesLightVehiclesMain)}>حذف الرئيسي</button>)} */}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={bikesLightVehiclesSubs}
                              value={selectedBikesLightVehiclesSub}
                              onChange={(v) => setSelectedBikesLightVehiclesSub(v)}
                              onDelete={(opt) => removeBikesLightVehiclesSub(opt)}
                              onEdit={(prev, next) => renameBikesLightVehiclesSub(prev, next)}
                              disabled={!selectedBikesLightVehiclesMain}
                              placeholder={selectedBikesLightVehiclesMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea className="form-input" placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر" value={newBikesLightVehiclesSubsBulk} onChange={(e) => setNewBikesLightVehiclesSubsBulk(e.target.value)} disabled={!selectedBikesLightVehiclesMain} rows={3} />
                              <button className="btn-add" onClick={addBikesLightVehiclesSubsBulk} disabled={!selectedBikesLightVehiclesMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {bikesLightVehiclesSubs.map(s => (
                                <span key={s} className="model-tag">{s}<button className="tag-remove" onClick={() => removeBikesLightVehiclesSub(s)} title="حذف">✕</button></span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'production-lines' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(MATERIALS_PRODUCTION_LINES_MAIN_SUBS)}
                              value={selectedMaterialsProductionLinesMain}
                              onChange={(v) => { setSelectedMaterialsProductionLinesMain(v); setSelectedMaterialsProductionLinesSub(''); }}
                              onDelete={(opt) => removeMaterialsProductionLinesMain(opt)}
                              onEdit={(prev, next) => renameMaterialsProductionLinesMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input type="text" className="form-input" placeholder="أضف رئيسي" value={newMaterialsProductionLinesMain} onChange={(e) => setNewMaterialsProductionLinesMain(e.target.value)} />
                              <button className="btn-add" onClick={addMaterialsProductionLinesMain}>إضافة</button>
                              {/* {selectedMaterialsProductionLinesMain && (<button className="btn-delete" onClick={() => removeMaterialsProductionLinesMain(selectedMaterialsProductionLinesMain)}>حذف الرئيسي</button>)} */}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={materialsProductionLinesSubs}
                              value={selectedMaterialsProductionLinesSub}
                              onChange={(v) => setSelectedMaterialsProductionLinesSub(v)}
                              onDelete={(opt) => removeMaterialsProductionLinesSub(opt)}
                              onEdit={(prev, next) => renameMaterialsProductionLinesSub(prev, next)}
                              disabled={!selectedMaterialsProductionLinesMain}
                              placeholder={selectedMaterialsProductionLinesMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea className="form-input" placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر" value={newMaterialsProductionLinesSubsBulk} onChange={(e) => setNewMaterialsProductionLinesSubsBulk(e.target.value)} disabled={!selectedMaterialsProductionLinesMain} rows={3} />
                              <button className="btn-add" onClick={addMaterialsProductionLinesSubsBulk} disabled={!selectedMaterialsProductionLinesMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {materialsProductionLinesSubs.map(s => (
                                <span key={s} className="model-tag">{s}<button className="tag-remove" onClick={() => removeMaterialsProductionLinesSub(s)} title="حذف">✕</button></span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'farm-products' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(FARMS_FACTORIES_PRODUCTS_MAIN_SUBS)}
                              value={selectedFarmsFactoriesProductsMain}
                              onChange={(v) => { setSelectedFarmsFactoriesProductsMain(v); setSelectedFarmsFactoriesProductsSub(''); }}
                              onDelete={(opt) => removeFarmsFactoriesProductsMain(opt)}
                              onEdit={(prev, next) => renameFarmsFactoriesProductsMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input type="text" className="form-input" placeholder="أضف رئيسي" value={newFarmsFactoriesProductsMain} onChange={(e) => setNewFarmsFactoriesProductsMain(e.target.value)} />
                              <button className="btn-add" onClick={addFarmsFactoriesProductsMain}>إضافة</button>
                              {/* {selectedFarmsFactoriesProductsMain && (<button className="btn-delete" onClick={() => removeFarmsFactoriesProductsMain(selectedFarmsFactoriesProductsMain)}>حذف الرئيسي</button>)} */}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={farmsFactoriesProductsSubs}
                              value={selectedFarmsFactoriesProductsSub}
                              onChange={(v) => setSelectedFarmsFactoriesProductsSub(v)}
                              onDelete={(opt) => removeFarmsFactoriesProductsSub(opt)}
                              onEdit={(prev, next) => renameFarmsFactoriesProductsSub(prev, next)}
                              disabled={!selectedFarmsFactoriesProductsMain}
                              placeholder={selectedFarmsFactoriesProductsMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea className="form-input" placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر" value={newFarmsFactoriesProductsSubsBulk} onChange={(e) => setNewFarmsFactoriesProductsSubsBulk(e.target.value)} disabled={!selectedFarmsFactoriesProductsMain} rows={3} />
                              <button className="btn-add" onClick={addFarmsFactoriesProductsSubsBulk} disabled={!selectedFarmsFactoriesProductsMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {farmsFactoriesProductsSubs.map(s => (
                                <span key={s} className="model-tag">{s}<button className="tag-remove" onClick={() => removeFarmsFactoriesProductsSub(s)} title="حذف">✕</button></span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'lighting-decor' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(LIGHTING_DECOR_MAIN_SUBS)}
                              value={selectedLightingDecorMain}
                              onChange={(v) => { setSelectedLightingDecorMain(v); setSelectedLightingDecorSub(''); }}
                              onDelete={(opt) => removeLightingDecorMain(opt)}
                              onEdit={(prev, next) => renameLightingDecorMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input type="text" className="form-input" placeholder="أضف رئيسي" value={newLightingDecorMain} onChange={(e) => setNewLightingDecorMain(e.target.value)} />
                              <button className="btn-add" onClick={addLightingDecorMain}>إضافة</button>
                              {/* {selectedLightingDecorMain && (<button className="btn-delete" onClick={() => removeLightingDecorMain(selectedLightingDecorMain)}>حذف الرئيسي</button>)} */}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={lightingDecorSubs}
                              value={selectedLightingDecorSub}
                              onChange={(v) => setSelectedLightingDecorSub(v)}
                              onDelete={(opt) => removeLightingDecorSub(opt)}
                              onEdit={(prev, next) => renameLightingDecorSub(prev, next)}
                              disabled={!selectedLightingDecorMain}
                              placeholder={selectedLightingDecorMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea className="form-input" placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر" value={newLightingDecorSubsBulk} onChange={(e) => setNewLightingDecorSubsBulk(e.target.value)} disabled={!selectedLightingDecorMain} rows={3} />
                              <button className="btn-add" onClick={addLightingDecorSubsBulk} disabled={!selectedLightingDecorMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {lightingDecorSubs.map(s => (
                                <span key={s} className="model-tag">{s}<button className="tag-remove" onClick={() => removeLightingDecorSub(s)} title="حذف">✕</button></span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'missing' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(MISSING_MAIN_SUBS)}
                              value={selectedMissingMain}
                              onChange={(v) => { setSelectedMissingMain(v); setSelectedMissingSub(''); }}
                              onDelete={(opt) => removeMissingMain(opt)}
                              onEdit={(prev, next) => renameMissingMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input type="text" className="form-input" placeholder="أضف رئيسي" value={newMissingMain} onChange={(e) => setNewMissingMain(e.target.value)} />
                              <button className="btn-add" onClick={addMissingMain}>إضافة</button>
                              {/* {selectedMissingMain && (<button className="btn-delete" onClick={() => removeMissingMain(selectedMissingMain)}>حذف الرئيسي</button>)} */}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={missingSubs}
                              value={selectedMissingSub}
                              onChange={(v) => setSelectedMissingSub(v)}
                              onDelete={(opt) => removeMissingSub(opt)}
                              onEdit={(prev, next) => renameMissingSub(prev, next)}
                              disabled={!selectedMissingMain}
                              placeholder={selectedMissingMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea className="form-input" placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر" value={newMissingSubsBulk} onChange={(e) => setNewMissingSubsBulk(e.target.value)} disabled={!selectedMissingMain} rows={3} />
                              <button className="btn-add" onClick={addMissingSubsBulk} disabled={!selectedMissingMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {missingSubs.map(s => (
                                <span key={s} className="model-tag">{s}<button className="tag-remove" onClick={() => removeMissingSub(s)} title="حذف">✕</button></span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'tools' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(TOOLS_SUPPLIES_MAIN_SUBS)}
                              value={selectedToolsSuppliesMain}
                              onChange={(v) => { setSelectedToolsSuppliesMain(v); setSelectedToolsSuppliesSub(''); }}
                              onDelete={(opt) => removeToolsSuppliesMain(opt)}
                              onEdit={(prev, next) => renameToolsSuppliesMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input type="text" className="form-input" placeholder="أضف رئيسي" value={newToolsSuppliesMain} onChange={(e) => setNewToolsSuppliesMain(e.target.value)} />
                              <button className="btn-add" onClick={addToolsSuppliesMain}>إضافة</button>
                              {/* {selectedToolsSuppliesMain && (<button className="btn-delete" onClick={() => removeToolsSuppliesMain(selectedToolsSuppliesMain)}>حذف الرئيسي</button>)} */}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={toolsSuppliesSubs}
                              value={selectedToolsSuppliesSub}
                              onChange={(v) => setSelectedToolsSuppliesSub(v)}
                              onDelete={(opt) => removeToolsSuppliesSub(opt)}
                              onEdit={(prev, next) => renameToolsSuppliesSub(prev, next)}
                              disabled={!selectedToolsSuppliesMain}
                              placeholder={selectedToolsSuppliesMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea className="form-input" placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر" value={newToolsSuppliesSubsBulk} onChange={(e) => setNewToolsSuppliesSubsBulk(e.target.value)} disabled={!selectedToolsSuppliesMain} rows={3} />
                              <button className="btn-add" onClick={addToolsSuppliesSubsBulk} disabled={!selectedToolsSuppliesMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {toolsSuppliesSubs.map(s => (
                                <span key={s} className="model-tag">{s}<button className="tag-remove" onClick={() => removeToolsSuppliesSub(s)} title="حذف">✕</button></span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'wholesale' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(WHOLESALE_MAIN_SUBS)}
                              value={selectedWholesaleMain}
                              onChange={(v) => { setSelectedWholesaleMain(v); setSelectedWholesaleSub(''); }}
                              onDelete={(opt) => removeWholesaleMain(opt)}
                              onEdit={(prev, next) => renameWholesaleMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input type="text" className="form-input" placeholder="أضف رئيسي" value={newWholesaleMain} onChange={(e) => setNewWholesaleMain(e.target.value)} />
                              <button className="btn-add" onClick={addWholesaleMain}>إضافة</button>
                              {/* {selectedWholesaleMain && (<button className="btn-delete" onClick={() => removeWholesaleMain(selectedWholesaleMain)}>حذف الرئيسي</button>)} */}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={wholesaleSubs}
                              value={selectedWholesaleSub}
                              onChange={(v) => setSelectedWholesaleSub(v)}
                              onDelete={(opt) => removeWholesaleSub(opt)}
                              onEdit={(prev, next) => renameWholesaleSub(prev, next)}
                              disabled={!selectedWholesaleMain}
                              placeholder={selectedWholesaleMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea className="form-input" placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر" value={newWholesaleSubsBulk} onChange={(e) => setNewWholesaleSubsBulk(e.target.value)} disabled={!selectedWholesaleMain} rows={3} />
                              <button className="btn-add" onClick={addWholesaleSubsBulk} disabled={!selectedWholesaleMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {wholesaleSubs.map(s => (
                                <span key={s} className="model-tag">{s}<button className="tag-remove" onClick={() => removeWholesaleSub(s)} title="حذف">✕</button></span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'spare-parts' && (
                      <div className="category-fields">
                        <h4>إدارة ماركات وموديلات القطع والفئات:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">الماركة</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(PARTS_BRANDS_MODELS)}
                              value={selectedPartsBrand}
                              onChange={(v) => { setSelectedPartsBrand(v); setSelectedPartsModel(''); }}
                              onDelete={(opt) => removePartsBrand(opt)}
                              onEdit={(prev, next) => renamePartsBrand(prev, next)}
                              placeholder="اختر الماركة"
                            />
                            <div className="inline-actions">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="أضف ماركة"
                                value={newPartsBrand}
                                onChange={(e) => setNewPartsBrand(e.target.value)}
                              />
                              <button className="btn-add" onClick={addPartsBrand}>إضافة</button>
                              {/* {selectedPartsBrand && (
                                <button className="btn-delete" onClick={() => removePartsBrand(selectedPartsBrand)}>حذف الماركة</button>
                              )} */}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">الموديل</label>
                            <ManagedSelect
                              options={partsModels}
                              value={selectedPartsModel}
                              onChange={(v) => setSelectedPartsModel(v)}
                              onDelete={(opt) => removePartsModel(opt)}
                              onEdit={(prev, next) => renamePartsModel(prev, next)}
                              disabled={!selectedPartsBrand}
                              placeholder={selectedPartsBrand ? 'اختر الموديل' : 'اختر الماركة أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea
                                className="form-input"
                                placeholder="أدخل كل الموديلات، مفصولة بفواصل أو أسطر"
                                value={newPartsModelsBulk}
                                onChange={(e) => setNewPartsModelsBulk(e.target.value)}
                                disabled={!selectedPartsBrand}
                                rows={3}
                              />
                              <button className="btn-add" onClick={addPartsModelsBulk} disabled={!selectedPartsBrand}>تسليم الموديلات</button>
                            </div>
                            <div className="models-list">
                              {partsModels.map(m => (
                                <span key={m} className="model-tag">
                                  {m}
                                  <button className="tag-remove" onClick={() => removePartsModel(m)} title="حذف">✕</button>
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(PARTS_MAIN_SUBS)}
                              value={selectedPartsMain}
                              onChange={(v) => { setSelectedPartsMain(v); setSelectedPartsSub(''); }}
                              onDelete={(opt) => removePartsMain(opt)}
                              onEdit={(prev, next) => renamePartsMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="أضف رئيسي"
                                value={newPartsMain}
                                onChange={(e) => setNewPartsMain(e.target.value)}
                              />
                              <button className="btn-add" onClick={addPartsMain}>إضافة</button>
                              {/* {selectedPartsMain && (
                                <button className="btn-delete" onClick={() => removePartsMain(selectedPartsMain)}>حذف الرئيسي</button>
                              )} */}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={partsSubs}
                              value={selectedPartsSub}
                              onChange={(v) => setSelectedPartsSub(v)}
                              onDelete={(opt) => removePartsSub(opt)}
                              onEdit={(prev, next) => renamePartsSub(prev, next)}
                              disabled={!selectedPartsMain}
                              placeholder={selectedPartsMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea
                                className="form-input"
                                placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر"
                                value={newPartsSubsBulk}
                                onChange={(e) => setNewPartsSubsBulk(e.target.value)}
                                disabled={!selectedPartsMain}
                                rows={3}
                              />
                              <button className="btn-add" onClick={addPartsSubsBulk} disabled={!selectedPartsMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {partsSubs.map(s => (
                                <span key={s} className="model-tag">
                                  {s}
                                  <button className="tag-remove" onClick={() => removePartsSub(s)} title="حذف">✕</button>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'cars_rent' && (
                      <div className="category-fields">
                        <h4>إدارة خيارات تأجير السيارات:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">الماركة</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(RENTAL_BRANDS_MODELS)}
                              value={selectedRentalBrand}
                              onChange={(v) => { setSelectedRentalBrand(v); setSelectedRentalModel(''); }}
                              onDelete={(opt) => removeRentalBrand(opt)}
                              onEdit={(prev, next) => renameRentalBrand(prev, next)}
                              placeholder="اختر الماركة"
                            />
                            <div className="inline-actions">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="أضف ماركة"
                                value={newRentalBrand}
                                onChange={(e) => setNewRentalBrand(e.target.value)}
                              />
                              <button className="btn-add" onClick={addRentalBrand}>إضافة</button>
                              {/* {selectedRentalBrand && (
                                <button className="btn-delete" onClick={() => removeRentalBrand(selectedRentalBrand)}>حذف الماركة</button>
                              )} */}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">الموديل</label>
                            <ManagedSelect
                              options={rentalModels}
                              value={selectedRentalModel}
                              onChange={(v) => setSelectedRentalModel(v)}
                              onDelete={(opt) => removeRentalModel(opt)}
                              onEdit={(prev, next) => renameRentalModel(prev, next)}
                              disabled={!selectedRentalBrand}
                              placeholder={selectedRentalBrand ? 'اختر الموديل' : 'اختر الماركة أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea
                                className="form-input"
                                placeholder="أدخل كل الموديلات، مفصولة بفواصل أو أسطر"
                                value={newRentalModelsBulk}
                                onChange={(e) => setNewRentalModelsBulk(e.target.value)}
                                disabled={!selectedRentalBrand}
                                rows={3}
                              />
                              <button className="btn-add" onClick={addRentalModelsBulk} disabled={!selectedRentalBrand}>تسليم الموديلات</button>
                            </div>
                            <div className="models-list">
                              {rentalModels.map(m => (
                                <span key={m} className="model-tag">
                                  {m}
                                  <button className="tag-remove" onClick={() => removeRentalModel(m)} title="حذف">✕</button>
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">السنة</label>
                            <ManagedSelect
                              options={rentalYearOptions}
                              value={rentalYear}
                              onChange={(v) => setRentalYear(v)}
                              onDelete={(opt) => deleteRentalYearOption(opt)}
                              onEdit={(prev, next) => renameRentalYearOption(prev, next)}
                              placeholder="اختر السنة"
                            />
                            <div className="inline-actions">
                              <input
                                type="number"
                                className="form-input"
                                placeholder="أضف سنة"
                                value={newRentalYear}
                                onChange={(e) => setNewRentalYear(e.target.value)}
                              />
                              <button className="btn-add" onClick={addRentalYearOption}>إضافة</button>
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">السائق</label>
                            <ManagedSelect
                              options={driverOptions}
                              value={driver}
                              onChange={(v) => setDriver(v)}
                              onDelete={(opt) => deleteDriverOption(opt)}
                              onEdit={(prev, next) => renameDriverOption(prev, next)}
                              placeholder="اختر السائق"
                            />
                            <div className="inline-actions">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="أضف خيار سائق"
                                value={newDriverVal}
                                onChange={(e) => setNewDriverVal(e.target.value)}
                              />
                              <button className="btn-add" onClick={addDriverOption}>إضافة</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'real_estate' && (
                      <div className="category-fields">
                        <h4>إدارة نوع العقار ونوع العقد:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">نوع العقار</label>
                            <ManagedSelect
                              options={propertyTypeOptions}
                              value={propertyType}
                              onChange={(v) => setPropertyType(v)}
                              onDelete={(opt) => deletePropertyTypeOptionDirect(opt)}
                              onEdit={(prev, next) => renamePropertyTypeOption(prev, next)}
                              placeholder="اختر نوع العقار"
                            />
                            <div className="inline-actions">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="أضف نوع عقار"
                                value={newPropertyTypeVal}
                                onChange={(e) => setNewPropertyTypeVal(e.target.value)}
                              />
                              <button className="btn-add" onClick={addPropertyTypeOption}>إضافة</button>
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">نوع العقد</label>
                            <ManagedSelect
                              options={contractTypeOptions}
                              value={contractType}
                              onChange={(v) => setContractType(v)}
                              onDelete={(opt) => deleteContractTypeOptionDirect(opt)}
                              onEdit={(prev, next) => renameContractTypeOption(prev, next)}
                              placeholder="اختر نوع العقد"
                            />
                            <div className="inline-actions">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="أضف نوع عقد"
                                value={newContractTypeVal}
                                onChange={(e) => setNewContractTypeVal(e.target.value)}
                              />
                              <button className="btn-add" onClick={addContractTypeOption}>إضافة</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {category.slug === 'animals' && (
                      <div className="category-fields">
                        <h4>إدارة الفئات الرئيسية والفرعية:</h4>
                        <div className="brand-model-filter">
                          <div className="location-group">
                            <label className="location-label">رئيسي</label>
                            <ManagedSelect
                              options={sortKeysWithOtherAtEnd(ANIMALS_MAIN_SUBS)}
                              value={selectedAnimalMain}
                              onChange={(v) => { setSelectedAnimalMain(v); setSelectedAnimalSub(''); }}
                              onDelete={(opt) => removeAnimalMain(opt)}
                              onEdit={(prev, next) => renameAnimalMain(prev, next)}
                              placeholder="اختر الرئيسي"
                            />
                            <div className="inline-actions">
                              <input
                                type="text"
                                className="form-input"
                                placeholder="أضف رئيسي"
                                value={newAnimalMain}
                                onChange={(e) => setNewAnimalMain(e.target.value)}
                              />
                              <button className="btn-add" onClick={addAnimalMain}>إضافة</button>
                            </div>
                          </div>
                          <div className="location-group">
                            <label className="location-label">فرعي</label>
                            <ManagedSelect
                              options={animalSubs}
                              value={selectedAnimalSub}
                              onChange={(v) => setSelectedAnimalSub(v)}
                              onDelete={(opt) => removeAnimalSub(opt)}
                              onEdit={(prev, next) => renameAnimalSub(prev, next)}
                              disabled={!selectedAnimalMain}
                              placeholder={selectedAnimalMain ? 'اختر الفرعي' : 'اختر الرئيسي أولًا'}
                            />
                            <div className="inline-actions">
                              <textarea
                                className="form-input"
                                placeholder="أدخل كل الفرعيات، مفصولة بفواصل أو أسطر"
                                value={newAnimalSubsBulk}
                                onChange={(e) => setNewAnimalSubsBulk(e.target.value)}
                                disabled={!selectedAnimalMain}
                                rows={3}
                              />
                              <button className="btn-add" onClick={addAnimalSubsBulk} disabled={!selectedAnimalMain}>تسليم الفرعيات</button>
                            </div>
                            <div className="models-list">
                              {animalSubs.map(s => (
                                <span key={s} className="model-tag">
                                  {s}
                                  <button className="tag-remove" onClick={() => removeAnimalSub(s)} title="حذف">✕</button>
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {managingCategoryId === category.id && (
                      <div className="manage-footer">
                        <button className="btn-manage-save" type="button" onClick={handleManageSave}>تم</button>
                        <button className="btn-manage-cancel" type="button" onClick={() => setManagingCategoryId(null)}>إلغاء</button>
                      </div>
                    )}
                  </div>

                  <div className="category-actions">
                    <button
                      className="btn-manage"
                      onClick={() => setManagingCategoryId(category.id)}
                    >
                      ⚙️ إدارة القسم
                    </button>
                    {/* <button 
                      className="btn-edit"
                      onClick={() => setEditingCategory(category)}
                    >
                       تعديل
                    </button> */}
                    {/* <button 
                      className={`btn-toggle ${category.status}`}
                      onClick={() => handleStatusToggle(category.id)}
                    >
                      {category.status === 'active' ? ' تعطيل' : '▶️ تفعيل'}
                    </button>
                    <button 
                      className="btn-delete"
                      onClick={() => handleDelete(category.id)}
                    >
                       حذف
                    </button> */}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <h3>لا توجد أقسام تطابق البحث</h3>
                <p>جرب تغيير معايير البحث أو الفلتر</p>
                <button
                  className="btn-clear-filters"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('');
                  }}
                >
                  مسح جميع الفلاتر
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {managingCategoryId !== null && (
        <div
          className="manage-overlay"
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('manage-overlay')) setManagingCategoryId(null);
          }}
        />
      )}

      {activeTab === 'homepage' && (
        <div className="homepage-content">
          <div className="homepage-settings">
            <div className="settings-header">
              <h2>إعدادات الظهور على الواجهة الرئيسية</h2>
              <p>تحكم في الأقسام التي تظهر على الصفحة الرئيسية وترتيبها</p>
            </div>

            <div className="homepage-categories">
              {categories
                .filter(cat => cat.showOnHomepage)
                .sort((a, b) => a.order - b.order)
                .map((category) => (
                  <div key={category.id} className="homepage-category-card">
                    <div className="category-preview">
                      <div className="preview-image">
                        {category.homepageImage ? (
                          <Image
                            src={category.homepageImage}
                            alt={category.name}
                            width={80}
                            height={80}
                            className="category-image"
                          />
                        ) : (
                          <div className="placeholder-image">
                            <span className="placeholder-icon">{category.icon}</span>
                          </div>
                        )}
                      </div>
                      <div className="category-info">
                        <h3>{category.name}</h3>
                        <p>عدد الكروت: {category.cardsCount || 6}</p>
                        <p>الترتيب: {category.order}</p>
                      </div>
                    </div>

                    <div className="homepage-controls">
                      {/* <div className="control-group">
                        <label>عدد المعلنين المفضلين :</label>
                        <input 
                          type="number" 
                          min="1" 
                          max="20" 
                          value={category.cardsCount || 6}
                          className="cards-count-input"
                        />
                      </div> */}

                      <div className="control-group">
                        <label>ترتيب الظهور:</label>
                        <input
                          type="number"
                          min="1"
                          value={category.order}
                          className="order-input"
                        />
                      </div>

                      <div className="control-group">
                        <label>صورة القسم:</label>
                        <input
                          type="file"
                          accept="image/*"
                          className="image-upload"
                        />
                      </div>

                      <div className="action-buttons">
                        <button
                          className="btn-homepage-toggle"
                          onClick={() => handleHomepageToggle(category.id)}
                        >
                          🚫 إخفاء من الواجهة
                        </button>
                        <button className="btn-save-settings">
                          💾 حفظ الإعدادات
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="hidden-categories">
              <h3>الأقسام المخفية من الواجهة</h3>
              <div className="hidden-list">
                {categories
                  .filter(cat => !cat.showOnHomepage)
                  .map((category) => (
                    <div key={category.id} className="hidden-category-item">
                      <span className="category-icon">{category.icon}</span>
                      <span className="category-name">{category.name}</span>
                      <button
                        className="btn-show-homepage"
                        onClick={() => handleHomepageToggle(category.id)}
                      >
                        إظهار في الواجهة
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Field Options Modal */}
      {fieldOptionsEditor && (
        <div className="modal-overlay field-options-overlay">
          <div className="modal-content field-options-modal">
            <div className="modal-header">
              <h2>
                إدارة خيارات الحقل: {fieldOptionsEditor.fieldName}
                {currentCategoryName ? ` — ${currentCategoryName}` : ''}
              </h2>
              <button className="modal-close" onClick={closeFieldOptions}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="options-editor">
                <div className="options-list">
                  {tempOptions.length === 0 && (
                    <div className="empty-options">لا توجد خيارات بعد — أضف أول خيار.</div>
                  )}
                  {tempOptions.map((opt, i) => (
                    <div key={i} className="option-row">
                      <input
                        type="text"
                        className="option-input"
                        value={opt}
                        placeholder={`خيار ${i + 1}`}
                        onChange={(e) => handleOptionUpdate(i, e.target.value)}
                      />
                      <button className="option-delete" type="button" onClick={() => removeOptionRow(i)}>
                        حذف
                      </button>
                    </div>
                  ))}
                </div>
                <div className="options-actions">
                  <button className="btn-add-option" type="button" onClick={addOptionRow}>
                    ➕ إضافة خيار
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-save-options"
                type="button"
                onClick={saveFieldOptions}
                disabled={!currentFieldMeta}
              >
                💾 حفظ الخيارات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingCategory) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingCategory ? 'تعديل القسم' : 'إضافة قسم جديد'}</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingCategory(null);
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <form className="category-form">
                <div className="form-group">
                  <label>اسم القسم</label>
                  <input
                    type="text"
                    placeholder="أدخل اسم القسم"
                    defaultValue={editingCategory?.name || ''}
                    className="form-input"
                  />
                </div>

                {/* <div className="form-group">
                  <label>أيقونة القسم</label>
                  <div className="icon-selector">
                    <input 
                      type="text" 
                      placeholder="اختر أيقونة (emoji)"
                      defaultValue={editingCategory?.icon || ''}
                      className="form-input icon-input"
                    />
                    <div className="icon-suggestions">
                      {['🚗', '🏠', '👨‍⚕️', '💼', '🍽️', '📚', '🔧', '🎯'].map(icon => (
                        <button key={icon} type="button" className="icon-option">
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div> */}

                <div className="form-group">
                  <label>ترتيب الظهور</label>
                  <input
                    type="number"
                    min="1"
                    defaultValue={editingCategory?.order || categories.length + 1}
                    className="form-input"
                  />
                </div>

                {/* <div className="form-group">
                  <label>الحقول المخصصة</label>
                  <div className="custom-fields">
                    <div className="field-item">
                      <input type="text" placeholder="اسم الحقل" className="field-name" />
                      <select className="field-type">
                        <option value="text">نص</option>
                        <option value="number">رقم</option>
                        <option value="select">قائمة اختيار</option>
                        <option value="date">تاريخ</option>
                      </select>
                      <button type="button" className="btn-remove-field">حذف</button>
                    </div>
                    <button type="button" className="btn-add-field">➕ إضافة حقل</button>
                  </div>
                </div> */}

                <div className="form-group">
                  <label>صور القسم</label>
                  <div className="image-uploads">
                    <div className="upload-item">
                      <label>أيقونة القسم:</label>
                      <input type="file" accept="image/*" className="image-input" />
                    </div>
                    <div className="upload-item">
                      <label>بنر القسم:</label>
                      <input type="file" accept="image/*" className="image-input" />
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-save">
                    💾 {editingCategory ? 'حفظ التعديلات' : 'إضافة القسم'}
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingCategory(null);
                    }}
                  >
                    ❌ إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Hidden input for default system settings images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleDefaultImageUpload}
      />
    </div>
  );
}


