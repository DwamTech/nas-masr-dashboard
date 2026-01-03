# API Testing Guide - Banners Management

## تعليمات اختبار API البانرات

### 1. اختبار جلب جميع البانرات

**Request:**
```bash
curl --location '{{MasURL}}/api/admin/banners' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer YOUR_TOKEN_HERE'
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "slug": "home",
      "banner_url": "https://api.nasmasr.app/storage/banners/home.jpg"
    },
    {
      "slug": "home_ads",
      "banner_url": null
    },
    {
      "slug": "real_estate",
      "banner_url": "https://api.nasmasr.app/storage/banners/real_estate.jpg"
    }
    // ... باقي البانرات
  ]
}
```

---

### 2. اختبار إضافة بانر جديد

**Request:**
```bash
curl --location '{{MasURL}}/api/admin/banners' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer YOUR_TOKEN_HERE' \
--form 'slug="home"' \
--form 'image=@"/path/to/image.jpg"'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "تم إضافة البانر بنجاح",
  "data": {
    "slug": "home",
    "banner_url": "https://api.nasmasr.app/storage/banners/home_1234567890.jpg"
  }
}
```

---

### 3. اختبار تعديل بانر موجود

**Request:**
```bash
curl --location --request POST '{{MasURL}}/api/admin/banners/home' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer YOUR_TOKEN_HERE' \
--form 'slug="home"' \
--form 'image=@"/path/to/new-image.jpg"' \
--form '_method="PUT"'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "تم تحديث البانر بنجاح",
  "data": {
    "slug": "home",
    "banner_url": "https://api.nasmasr.app/storage/banners/home_9876543210.jpg"
  }
}
```

---

### 4. اختبار تحديث بانر صفحة إضافة إعلان

**Request:**
```bash
curl --location --request POST '{{MasURL}}/api/admin/banners/home_ads' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer YOUR_TOKEN_HERE' \
--form 'slug="home_ads"' \
--form 'image=@"/path/to/banner.jpg"' \
--form '_method="PUT"'
```

---

### 5. اختبار تحديث بانر قسم معين (مثال: سيارات)

**Request:**
```bash
curl --location --request POST '{{MasURL}}/api/admin/banners/cars' \
--header 'Accept: application/json' \
--header 'Authorization: Bearer YOUR_TOKEN_HERE' \
--form 'slug="cars"' \
--form 'image=@"/path/to/cars-banner.jpg"' \
--form '_method="PUT"'
```

---

## Slugs المتاحة للأقسام

### البانرات الرئيسية
- `home` - بانر الصفحة الرئيسية
- `home_ads` - بانر صفحة إضافة إعلان

### بانرات الأقسام (36 قسم)
- `real_estate` - عقارات
- `cars` - سيارات
- `cars_rent` - تأجير سيارات
- `spare-parts` - قطع غيار
- `stores` - محلات
- `restaurants` - مطاعم
- `groceries` - بقالة
- `food-products` - منتجات غذائية
- `electronics` - إلكترونيات
- `home-appliances` - أجهزة منزلية
- `home-tools` - أدوات منزلية
- `furniture` - أثاث
- `doctors` - أطباء
- `health` - صحة
- `teachers` - معلمون
- `education` - تعليم
- `jobs` - وظائف
- `shipping` - شحن
- `mens-clothes` - ملابس رجالي
- `watches-jewelry` - ساعات ومجوهرات
- `free-professions` - مهن حرة
- `kids-toys` - ألعاب أطفال
- `gym` - صالة رياضية
- `construction` - إنشاءات
- `maintenance` - صيانة
- `car-services` - خدمات سيارات
- `home-services` - خدمات منزلية
- `lighting-decor` - إضاءة وديكور
- `animals` - حيوانات
- `farm-products` - منتجات زراعية
- `wholesale` - جملة
- `production-lines` - خطوط إنتاج
- `light-vehicles` - مركبات خفيفة
- `heavy-transport` - نقل ثقيل
- `tools` - أدوات
- `missing` - مفقودات
- `unified` - موحد

---

## ملاحظات مهمة

### متطلبات الصور
- نوع الملف: JPG, PNG, WEBP
- الحجم الموصى به: 1920x400 بكسل (للبانرات الأفقية)
- حجم الملف: أقل من 2MB

### الأمان
- يجب إرسال Bearer Token صالح في كل طلب
- فقط المسؤولون (Admins) يمكنهم تحديث البانرات

### رسائل الخطأ المحتملة

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthenticated."
}
```
**الحل:** تأكد من إرسال Bearer Token صحيح

#### 404 Not Found
```json
{
  "success": false,
  "message": "Banner not found"
}
```
**الحل:** تأكد من استخدام slug صحيح من القائمة أعلاه

#### 422 Unprocessable Entity
```json
{
  "success": false,
  "message": "The banner field is required."
}
```
**الحل:** تأكد من إرفاق ملف الصورة في الطلب

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to upload banner"
}
```
**الحل:** تحقق من صحة الملف وحجمه

---

## اختبار من خلال Postman

### إضافة بانر جديد

#### الإعدادات
1. **Method:** POST
2. **URL:** `{{MasURL}}/api/admin/banners`
3. **Headers:**
   - `Accept: application/json`
   - `Authorization: Bearer YOUR_TOKEN`
4. **Body:**
   - Type: form-data
   - Keys:
     - `slug` (Type: Text) - Value: "home" أو "cars" إلخ
     - `image` (Type: File) - اختر الصورة

#### الخطوات
1. افتح Postman
2. أنشئ طلب جديد
3. اختر POST method
4. أدخل الـ URL: `{{MasURL}}/api/admin/banners`
5. أضف الـ Headers
6. في Body اختر form-data
7. أضف key اسمه `slug` واختر نوعه Text وأدخل القيمة (مثل "home")
8. أضف key اسمه `image` واختر نوعه File واختر الصورة
9. اضغط Send
10. انظر للـ Response

---

### تعديل بانر موجود

#### الإعدادات
1. **Method:** POST
2. **URL:** `{{MasURL}}/api/admin/banners/{slug}` (مثل: `/api/admin/banners/cars`)
3. **Headers:**
   - `Accept: application/json`
   - `Authorization: Bearer YOUR_TOKEN`
4. **Body:**
   - Type: form-data
   - Keys:
     - `slug` (Type: Text) - نفس القيمة في الـ URL
     - `image` (Type: File) - اختر الصورة الجديدة
     - `_method` (Type: Text) - Value: "PUT"

#### الخطوات
1. افتح Postman
2. أنشئ طلب جديد
3. اختر POST method
4. أدخل الـ URL مع slug المطلوب (مثل: `.../banners/cars`)
5. أضف الـ Headers
6. في Body اختر form-data
7. أضف key اسمه `slug` واختر نوعه Text وأدخل القيمة (مثل "cars")
8. أضف key اسمه `image` واختر نوعه File واختر الصورة
9. أضف key اسمه `_method` واختر نوعه Text وأدخل القيمة "PUT"
10. اضغط Send
11. انظر للـ Response

**ملاحظة مهمة:** الـ `_method: PUT` ضروري لأن Laravel يستخدم method spoofing مع form-data.

---

## نصائح للاختبار

1. **ابدأ بالبانرات الرئيسية** (home و home_ads) لأنها الأهم
2. **اختبر بصورة صغيرة أولاً** للتأكد من عمل API
3. **تحقق من الـ Response** للتأكد من رفع الصورة بنجاح
4. **افتح الـ URL المُرجع** للتأكد من ظهور الصورة
5. **جرب GET request** بعد كل تحديث للتأكد من التغييرات
