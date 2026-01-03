# صفحة إدارة بنارات التطبيق

## نظرة عامة
صفحة شاملة لإدارة وتحديث البانرات الإعلانية المعروضة في التطبيق، بما في ذلك البانرات الرئيسية وبانرات الأقسام المختلفة.

## المسار
`/app-banners`

## الميزات الرئيسية

### 1. Hero Section
- عنوان جذاب مع أيقونة
- وصف مختصر للصفحة
- تصميم gradient بألوان جميلة

### 2. البانرات الرئيسية (Section 1)
يحتوي على بانرين رئيسيين في صف واحد:
- **بانر الصفحة الرئيسية** (home)
- **بانر صفحة إضافة إعلان** (home_ads)

التصميم:
- Grid ثنائي الأعمدة على الشاشات الكبيرة
- عمود واحد على الشاشات الصغيرة (responsive)
- عرض حالة البانر (مفعل/غير مفعل)
- زر تغيير لكل بانر

### 3. بانرات الأقسام (Section 2)
يحتوي على 36 بانر للأقسام المختلفة:

**الأقسام المتاحة:**
- عقارات (real_estate)
- سيارات (cars)
- تأجير سيارات (cars_rent)
- قطع غيار (spare-parts)
- محلات (stores)
- مطاعم (restaurants)
- بقالة (groceries)
- منتجات غذائية (food-products)
- إلكترونيات (electronics)
- أجهزة منزلية (home-appliances)
- أدوات منزلية (home-tools)
- أثاث (furniture)
- أطباء (doctors)
- صحة (health)
- معلمون (teachers)
- تعليم (education)
- وظائف (jobs)
- شحن (shipping)
- ملابس رجالي (mens-clothes)
- ساعات ومجوهرات (watches-jewelry)
- مهن حرة (free-professions)
- ألعاب أطفال (kids-toys)
- صالة رياضية (gym)
- إنشاءات (construction)
- صيانة (maintenance)
- خدمات سيارات (car-services)
- خدمات منزلية (home-services)
- إضاءة وديكور (lighting-decor)
- حيوانات (animals)
- منتجات زراعية (farm-products)
- جملة (wholesale)
- خطوط إنتاج (production-lines)
- مركبات خفيفة (light-vehicles)
- نقل ثقيل (heavy-transport)
- أدوات (tools)
- مفقودات (missing)

التصميم:
- Grid رباعي الأعمدة على الشاشات الكبيرة (Laptop)
- Grid ثلاثي الأعمدة على الشاشات المتوسطة
- Grid ثنائي الأعمدة على الأجهزة اللوحية
- عمود واحد على الموبايل
- معاينة للبانر (صورة أو placeholder)
- اسم القسم بالعربية
- زر تغيير

### 4. Modal التعديل
عند الضغط على زر "تغيير":
- يفتح نافذة منبثقة (Modal) جميلة
- عرض اسم البانر المراد تعديله
- حقل لاختيار صورة جديدة
- معاينة مباشرة للصورة المختارة
- أزرار الحفظ والإلغاء
- رسائل تحميل أثناء الرفع

### 5. Toast Notifications
- رسائل نجاح عند التحديث بنجاح
- رسائل خطأ عند فشل العملية
- رسائل تحذير عند عدم اختيار صورة
- تصميم جذاب مع animation

## API Integration

### GET: جلب جميع البانرات
**Endpoint:** `{{MasURL}}/api/admin/banners`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "slug": "home",
      "banner_url": "https://example.com/banner.jpg"
    },
    {
      "slug": "home_ads",
      "banner_url": null
    },
    ...
  ]
}
```

### POST: إضافة بانر جديد
**Endpoint:** `{{MasURL}}/api/admin/banners`

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body (form-data):
  - `slug`: string (e.g., "home", "cars")
  - `image`: File

**Response:**
```json
{
  "success": true,
  "message": "تم إضافة البانر بنجاح",
  "data": {
    "slug": "home",
    "banner_url": "https://example.com/new-banner.jpg"
  }
}
```

### POST: تعديل بانر موجود
**Endpoint:** `{{MasURL}}/api/admin/banners/{slug}`

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body (form-data):
  - `slug`: string (نفس الـ slug في الـ URL)
  - `image`: File
  - `_method`: "PUT" (Laravel method spoofing)

**Response:**
```json
{
  "success": true,
  "message": "تم تحديث البانر بنجاح",
  "data": {
    "slug": "cars",
    "banner_url": "https://example.com/updated-banner.jpg"
  }
}
```

## الملفات المرتبطة

### Models
- `models/banners.ts` - TypeScript interfaces للبانرات

### Services
- `services/banners.ts` - دوال التواصل مع API

### Components
- `app/app-banners/page.tsx` - Server Component wrapper
- `app/app-banners/BannersManagementClient.tsx` - Client Component الرئيسي

### Sidebar
- تم إضافة الرابط تحت قسم "الأقسام والتصنيفات"

## التصميم

### الألوان
- Primary: Gradient (667eea → 764ba2)
- Success: #27ae60
- Error: #e74c3c
- Warning: #f39c12
- Info: #3498db

### Responsive Breakpoints
- Desktop: 4 columns (> 1200px)
- Large Tablet: 3 columns (900px - 1200px)
- Tablet: 2 columns (600px - 900px)
- Mobile: 1 column (< 600px)

### Animations
- Card hover effects
- Modal slide-in animation
- Toast notifications slide-in
- Button hover effects
- File input hover effects

## الأمان
- استخدام Bearer Token للمصادقة
- التحقق من نوع الملفات (images only)
- رسائل خطأ واضحة

## تجربة المستخدم (UX)
- تصميم نظيف وواضح
- معاينة فورية للصور
- رسائل تأكيد واضحة
- حالات تحميل واضحة
- Responsive على جميع الأجهزة
- Accessibility considerations

## الاستخدام
1. الانتقال للصفحة من القائمة الجانبية
2. اختيار البانر المراد تعديله
3. الضغط على زر "تغيير"
4. اختيار صورة جديدة
5. معاينة الصورة
6. الضغط على "حفظ التعديلات"
7. انتظار رسالة النجاح
