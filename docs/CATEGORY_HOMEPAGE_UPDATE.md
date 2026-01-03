# تحديث: إضافة صفحة "إدارة أقسام الصفحة الرئيسية"

## الملخص
تم إضافة صفحة فرعية جديدة تحت "الأقسام والتصنيفات" تسمى **"إدارة أقسام الصفحة الرئيسية"** تتيح للمسؤولين إدارة بيانات الأقسام (الاسم والأيقونة).

## الملفات المضافة/المعدلة

### ملفات جديدة:
1. **`/app/category-homepage-management/page.tsx`**
   - صفحة Server Component رئيسية

2. **`/app/category-homepage-management/CategoryHomepageClient.tsx`**
   - مكون Client Component يحتوي على كامل الوظائف والواجهة

3. **`/docs/category-homepage-management.md`**
   - توثيق شامل للصفحة

### ملفات معدلة:

1. **`/models/makes.ts`**
   - إضافة interfaces جديدة:
     - `CategoryHomepageItem`
     - `CategoryHomepageUpdateRequest`
     - `CategoryHomepageResponse`

2. **`/services/makes.ts`**
   - إضافة 3 دوال جديدة:
     - `fetchCategoryHomepage()`: جلب بيانات قسم محدد
     - `updateCategoryHomepage()`: تحديث بيانات القسم
     - `fetchCategoriesUsageReport()`: جلب تقرير استخدام الأقسام

3. **`/components/Sidebar.tsx`**
   - تحويل "الأقسام والتصنيفات" إلى قائمة منسدلة
   - إضافة رابط فرعي: "إدارة أقسام الصفحة الرئيسية"

## كيفية الاستخدام

### الوصول للصفحة:
1. افتح لوحة التحكم
2. من القائمة الجانبية، اضغط على "الأقسام والتصنيفات"
3. ستظهر قائمة فرعية، اختر "إدارة أقسام الصفحة الرئيسية"

### تعديل بيانات قسم:
1. ابحث عن القسم المطلوب (أو استخدم شريط البحث)
2. اضغط على "إدارة بيانات القسم"
3. عدّل البيانات:
   - **اسم القسم**: أدخل الاسم الجديد
   - **أيقونة القسم**: ارفع صورة جديدة
4. اضغط "حفظ التعديلات"

## API Endpoints المستخدمة

| Endpoint | Method | الوصف |
|----------|--------|-------|
| `/api/admin/categories` | GET | جلب جميع الأقسام |
| `/api/admin/categories/{id}` | GET | جلب بيانات قسم محدد |
| `/api/admin/categories/{id}` | POST | تحديث القسم (مع `_method=PUT`) |
| `/api/admin/categories/usage-report` | GET | تقرير الاستخدام |

## المميزات

✅ عرض جميع الأقسام في شبكة منظمة
✅ بحث سريع عن الأقسام
✅ تعديل اسم القسم
✅ رفع وتحديث أيقونة القسم
✅ معاينة فورية للأيقونة الجديدة
✅ رسائل تأكيد ونجاح/خطأ واضحة
✅ تصميم متجاوب وجميل
✅ نظام Toast للإشعارات
✅ دعم RTL كامل

## ملاحظات تقنية

### الأمان:
- جميع الطلبات تتطلب Bearer Token
- يتم استخراج Token من `localStorage.getItem('authToken')`

### رفع الملفات:
- يستخدم `FormData` لرفع الصور
- يتم إرسال `_method=PUT` في الـ body (لأن بعض الخوادم لا تدعم PUT مع multipart/form-data)

### التوافق:
- يعمل مع Next.js 14 App Router
- TypeScript بالكامل
- متوافق مع جميع المتصفحات الحديثة

## التوثيق الكامل
للمزيد من التفاصيل، راجع:
📄 `/docs/category-homepage-management.md`

## أوامر التشغيل

```bash
# تشغيل المشروع
npm run dev

# بناء المشروع
npm run build

# تشغيل النسخة المبنية
npm start
```

روابط مفيدة:
- الصفحة المحلية: http://localhost:3000/category-homepage-management
- التوثيق: `/docs/category-homepage-management.md`
