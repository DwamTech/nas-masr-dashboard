# توضيح الفرق بين `icon` و `homepage_image`

## البيانات في النموذج `AdminCategoryListItem`

```typescript
interface AdminCategoryListItem {
  id: number;
  name: string;
  slug?: string;
  icon?: string;              // ← الأيقونة (غالباً emoji مثل 🏠، ⌚)
  homepage_image?: string;    // ← صورة القسم الفعلية (URL للصورة)
  is_active?: boolean;
  sort_order?: number;
  // ... باقي الحقول
}
```

## الفرق بينهما:

### 1. `icon` (الأيقونة)
- **النوع**: غالباً emoji (🏠، 🚙، ⌚، إلخ)
- **الاستخدام**: أيقونة صغيرة رمزية للقسم
- **مثال**: `"🏠"` أو `"⌚"` أو `"🚙"`

### 2. `homepage_image` (صورة القسم)
- **النوع**: رابط URL لصورة فعلية
- **الاستخدام**: الصورة/البانر الكاملة للقسم
- **مثال**: `"https://api.nasmasr.app/storage/categories/real-estate.jpg"`

## الحل المطبق

تم تحديث منطق العرض ليكون كالتالي (بالترتيب):

1. **أولاً**: إذا كان `homepage_image` موجود → عرض الصورة
2. **ثانياً**: إذا لم يكن `homepage_image` موجود لكن `icon` موجود:
   - إذا كان `icon` emoji → عرض emoji
   - إذا كان `icon` URL صورة → عرض الصورة
3. **أخيراً**: إذا لم يكن هناك شيء → عرض 📦 (أيقونة افتراضية)

## الكود الجديد

```typescript
<div className="category-icon">
  {/* الأولوية لصورة القسم */}
  {category.homepage_image && getImageSrc(category.homepage_image) ? (
    <img src={getImageSrc(category.homepage_image)!} alt={category.name} />
  ) : category.icon && isIconEmoji(category.icon) ? (
    <span>{category.icon}</span>
  ) : category.icon && getImageSrc(category.icon) ? (
    <img src={getImageSrc(category.icon)!} alt={category.name} />
  ) : (
    <span>📦</span>
  )}
</div>
```

## مثال من البيانات الحقيقية

```json
{
  "id": 1,
  "name": "العقارات",
  "slug": "real_estate",
  "icon": "🏠",                    // ← emoji فقط
  "homepage_image": "https://...", // ← صورة كاملة للقسم
  "is_active": 1
}
```

في هذه الحالة:
- **سيتم عرض**: `homepage_image` (الصورة الكاملة)
- **لن يتم عرض**: `icon` (الـ emoji) إلا إذا فشلت الصورة

## ملخص التحديث

✅ الآن صور الأقسام (`homepage_image`) تظهر بشكل صحيح
✅ إذا لم توجد صورة، يتم عرض الأيقونة/emoji
✅ نظام fallback قوي للتعامل مع الأخطاء
