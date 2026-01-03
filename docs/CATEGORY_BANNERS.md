# إدارة بنرات الأقسام - توثيق كامل

## نظرة عامة
صفحة لإدارة بنرات الأقسام (Category Banners) - السماح للمسؤولين بإضافة وتعديل وحذف البنرات الخاصة بالأقسام المختلفة.

## الموقع
- **المسار**: `/category-banners`
- **القائمة الجانبية**: `الأقسام والتصنيفات` > `إدارة بنرات الأقسام`

---

## المميزات

### ✨ 1. عرض جميع البنرات
- عرض شبكي منظم لجميع البنرات
- كل بطاقة تحتوي على:
  - صورة البانر
  - اسم القسم
  - ترتيب العرض
  - الحالة (نشط/غير نشط)
  - أزرار التعديل والحذف

### ✨ 2. إضافة بانر جديد
**زر**: "➕ إضافة بانر جديد"  
**الحقول**:
- القسم (اختيار من قائمة منسدلة)
- صورة البانر (رفع ملف)
- ترتيب العرض (رقم)
- الحالة (checkbox: نشط/غير نشط)

### ✨ 3. تعديل بانر موجود
**زر**: "✏️ تعديل"  
**الحقول**:
- تغيير القسم
- رفع صورة جديدة (اختياري)
- تغيير ترتيب العرض
- تغيير الحالة

### ✨ 4. حذف بانر
**زر**: "🗑️ حذف"  
- نافذة تأكيد قبل الحذف
- تحذير: "هذا الإجراء لا يمكن التراجع عنه"

### ✨ 5. البحث والتصفية
- شريط بحث سريع
- البحث بحسب اسم القسم أو slug

---

## API Endpoints المستخدمة

### 1. جلب جميع البنرات
```
GET /api/admin/category-banners
Authorization: Bearer {token}
```

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "category_id": 5,
      "category_name": "العقارات",
      "category_slug": "real_estate",
      "banner_url": "https://api.nasmasr.app/storage/uploads/banners/img.jpg",
      "is_active": true,
      "display_order": 1,
      "created_at": "2026-01-02T18:30:00"
    }
  ]
}
```

### 2. إنشاء بانر جديد
```
POST /api/admin/category-banners
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**Body:**
- `category_id`: رقم (Required)
- `banner_image`: ملف صورة (Required, Max 4MB)
- `is_active`: 0 أو 1 (Optional, default: 1)
- `display_order`: رقم (Optional, default: 0)

**Response:**
```json
{
  "message": "تم إضافة البانر بنجاح",
  "data": { ... }
}
```

### 3. تحديث بانر
```
POST /api/admin/category-banners/{id}
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**Body:**
- `_method`: "PUT" (Required)
- `category_id`: رقم (Optional)
- `banner_image`: ملف صورة (Optional)
- `is_active`: 0 أو 1 (Optional)
- `display_order`: رقم (Optional)

**Response:**
```json
{
  "message": "تم تحديث البانر بنجاح",
  "data": { ... }
}
```

### 4. حذف بانر
```
DELETE /api/admin/category-banners/{id}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "تم حذف البانر"
}
```

### 5. جلب بانر محدد
```
GET /api/admin/category-banners/{id}
Authorization: Bearer {token}
```

### 6. Public Endpoint (للفرونت إند)
```
GET /api/{categorySlug}/AdBanner
```
**مثال**: `/api/real_estate/AdBanner`

**Response:**
```json
{
  "data": {
    "id": 5,
    "banner_url": "https://...",
    "category": "العقارات"
  }
}
```

---

## التقنيات المستخدمة

### Frontend
- **Next.js 14** App Router
- **TypeScript** للأمان من الأخطاء
- **Client Component** للتفاعل الديناميكي
- **CSS-in-JS** styled-jsx

### Services & Models
**Services** (`services/makes.ts`):
- `fetchCategoryBanners()`: جلب جميع البنرات
- `fetchCategoryBanner(id)`: جلب بانر محدد
- `createCategoryBanner(data)`: إنشاء بانر جديد
- `updateCategoryBanner(id, data)`: تحديث بانر
- `deleteCategoryBanner(id)`: حذف بانر

**Models** (`models/makes.ts`):
- `CategoryBanner`: نموذج بيانات البانر
- `CategoryBannerCreateRequest`: طلب إنشاء
- `CategoryBannerUpdateRequest`: طلب تحديث
- `CategoryBannerResponse`: استجابة API
- `CategoryBannersListResponse`: قائمة البنرات

---

## الملفات ذات الصلة

```
/app/category-banners/
├── page.tsx                        # Server Component
└── CategoryBannersClient.tsx       # Client Component (الواجهة الكاملة)

/models/makes.ts                    # 5 interfaces جديدة
/services/makes.ts                  # 5 functions جديدة
/components/Sidebar.tsx             # تم إضافة رابط
```

---

## سيناريوهات الاستخدام

### 1. إضافة بانر جديد لقسم
1. اضغط على "➕ إضافة بانر جديد"
2. اختر القسم من القائمة المنسدلة
3. ارفع صورة البانر
4. حدد ترتيب العرض (مثلاً: 1، 2، 3...)
5. اختر الحالة (نشط/غير نشط)
6. اضغط "إضافة"

### 2. تعديل بانر موجود
1. ابحث عن البانر في الشبكة
2. اضغط "✏️ تعديل"
3. غيّر البيانات المطلوبة
4. اختياري: ارفع صورة جديدة
5. اضغط "تحديث"

### 3. حذف بانر
1. اضغط "🗑️ حذف" على البانر المراد حذفه
2. أكّد الحذف في النافذة المنبثقة
3. تم! البانر محذوف نهائياً

### 4. البحث عن بانر
1. استخدم شريط البحث أعلى الصفحة
2. ابحث بحسب اسم القسم أو slug
3. النتائج تُصفّى فوراً

---

## التصميم والواجهة

### الألوان
- **أخضر للإضافة**: `#27ae60`
- **أزرق للتعديل**: `#3498db`
- **أحمر للحذف**: `#e74c3c`
- **بنفسجي للأزرار الرئيسية**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`

### الأيقونات
- ➕ إضافة بانر جديد
- ✏️ تعديل
- 🗑️ حذف
- ✅ نشط
- ❌ غير نشط
- 🔍 بحث

### التخطيط
- **Grid Layout**: شبكة متجاوبة (350px cards)
- **Modal Overlays**: نوافذ منبثقة للإضافة/التعديل/الحذف
- **Toast Notifications**: إشعارات منسدلة من الأعلى

---

## الأمان

### Authentication
- جميع الطلبات تتطلب **Bearer Token**
- يتم استخراج Token من: `localStorage.getItem('authToken')`

### Authorization
- **Admin Role** مطلوب لجميع العمليات
- العمليات: إضافة، تعديل، حذف

### Validation
- التحقق من وجود الصورة قبل الإضافة
- التحقق من اختيار القسم
- حجم الصورة: Max 4MB (يتم التحقق من Backend)

---

## معالجة الأخطاء

### حالات الخطأ
- فشل جلب البيانات → Toast Error
- فشل رفع الصورة → Toast Error
- فشل الحذف → Toast Error
- خطأ في الاتصال → Toast Error

### رسائل النجاح
- ✅ "تم إضافة البانر بنجاح"
- ✅ "تم تحديث البانر بنجاح"
- ✅ "تم حذف البانر بنجاح"

### رسائل التحذير
- ⚠️ "يرجى اختيار صورة البانر"
- ⚠️ "يرجى اختيار القسم"

---

## ملخص التحديث

### ما تم إضافته:

✅ **Models** (5 interfaces جديدة):
- `CategoryBanner`
- `CategoryBannerCreateRequest`
- `CategoryBannerUpdateRequest`
- `CategoryBannerResponse`
- `CategoryBannersListResponse`

✅ **Services** (5 functions جديدة):
- `fetchCategoryBanners()`
- `fetchCategoryBanner(id)`
- `createCategoryBanner(data)`
- `updateCategoryBanner(id, data)`
- `deleteCategoryBanner(id)`

✅ **Pages**:
- `/app/category-banners/page.tsx`
- `/app/category-banners/CategoryBannersClient.tsx`

✅ **Navigation**:
- رابط في Sidebar تحت "الأقسام والتصنيفات"

---

## جاهز للاستخدام! 🚀

الصفحة جاهزة الآن والميزات الكاملة:
- ✅ إضافة بنرات جديدة
- ✅ تعديل البنرات الموجودة
- ✅ حذف البنرات
- ✅ البحث والتصفية
- ✅ واجهة مستخدم جميلة
- ✅ معالجة أخطاء قوية
- ✅ توثيق كامل

**للوصول**: `http://localhost:3000/category-banners` 🎉
