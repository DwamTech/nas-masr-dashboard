# دليل استخدام Options Helper

## المشكلة
كان خيار "غير ذلك" يُضاف في أماكن متعددة في الكود، وأحياناً يظهر في منتصف القائمة أو يتكرر.

## الحل
تم إنشاء **Options Helper** موحد يضمن أن "غير ذلك" دائماً في آخر كل قائمة options.

---

## الاستخدام في Frontend (TypeScript/React)

### 1. استيراد الـ Helper

```typescript
import { 
  processOptions, 
  processOptionsMap, 
  ensureOtherAtEnd 
} from '@/utils/optionsHelper';
```

### 2. معالجة قائمة بسيطة

```typescript
// قبل
const yearOptions = ['2024', '2023', 'غير ذلك', '2022'];

// بعد
const yearOptions = processOptions(['2024', '2023', 'غير ذلك', '2022']);
// النتيجة: ['2024', '2023', '2022', 'غير ذلك']
```

### 3. معالجة مع الترتيب الأبجدي

```typescript
const fuelOptions = processOptions(
  ['ديزل', 'غير ذلك', 'بنزين', 'كهرباء'], 
  true // shouldSort = true
);
// النتيجة: ['بنزين', 'ديزل', 'كهرباء', 'غير ذلك']
```

### 4. معالجة Record (مثل BRANDS_MODELS)

```typescript
const BRANDS_MODELS = {
  'تويوتا': ['كامري', 'غير ذلك', 'كورولا'],
  'هيونداي': ['إلنترا', 'توسان', 'غير ذلك']
};

const processed = processOptionsMap(BRANDS_MODELS);
// النتيجة:
// {
//   'تويوتا': ['كامري', 'كورولا', 'غير ذلك'],
//   'هيونداي': ['إلنترا', 'توسان', 'غير ذلك']
// }
```

### 5. استخدام React Hooks

```typescript
import { useProcessedOptions } from '@/app/categories/hooks/useProcessedOptions';

function MyComponent() {
  const [rawOptions, setRawOptions] = useState(['option1', 'غير ذلك', 'option2']);
  
  // معالجة تلقائية مع memoization
  const processedOptions = useProcessedOptions(rawOptions);
  
  return (
    <select>
      {processedOptions.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  );
}
```

### 6. معالجة Options من API

```typescript
useEffect(() => {
  fetchCategoryFields('cars', token)
    .then(fields => {
      const yearField = fields.find(f => f.field_name === 'year');
      if (yearField?.options) {
        // معالجة تلقائية
        setYearOptions(processOptions(yearField.options));
      }
    });
}, []);
```

---

## الاستخدام في Backend (PHP/Laravel)

### 1. استيراد الـ Helper

```php
use App\Support\OptionsHelper;
```

### 2. معالجة قائمة بسيطة

```php
// قبل
$options = ['2024', '2023', 'غير ذلك', '2022'];

// بعد
$options = OptionsHelper::processOptions($options);
// النتيجة: ['2024', '2023', '2022', 'غير ذلك']
```

### 3. معالجة مع الترتيب

```php
$fuelOptions = OptionsHelper::processOptions(
    ['ديزل', 'غير ذلك', 'بنزين', 'كهرباء'],
    true // shouldSort
);
// النتيجة: ['بنزين', 'ديزل', 'كهرباء', 'غير ذلك']
```

### 4. معالجة Collection من CategoryField

```php
$fields = CategoryField::where('category_slug', 'cars')->get();

// معالجة تلقائية لكل الـ options
$fields = OptionsHelper::processFieldsCollection($fields);

return response()->json(['data' => $fields]);
```

### 5. معالجة في Controller

```php
public function update(Request $request)
{
    $data = $request->validated();
    
    // معالجة options قبل الحفظ
    if (isset($data['options'])) {
        $data['options'] = OptionsHelper::processOptions($data['options']);
    }
    
    $field->update($data);
}
```

### 6. معالجة Array من Options

```php
$brandsModels = [
    'تويوتا' => ['كامري', 'غير ذلك', 'كورولا'],
    'هيونداي' => ['إلنترا', 'توسان', 'غير ذلك']
];

$processed = OptionsHelper::processOptionsMap($brandsModels);
```

---

## الأماكن التي تم تحديثها

### Backend
- ✅ `app/Support/OptionsHelper.php` - الـ Helper الرئيسي
- ✅ `app/Http/Controllers/Admin/CategoryFieldsController.php`
- ✅ `app/Support/Section.php`

### Frontend
- ✅ `utils/optionsHelper.ts` - الـ Helper الرئيسي
- ✅ `app/categories/hooks/useProcessedOptions.ts` - React Hooks

---

## الفوائد

1. **كود موحد**: حل واحد في كل المشروع
2. **سهولة الصيانة**: تعديل واحد يؤثر على كل الأماكن
3. **ضمان الجودة**: "غير ذلك" دائماً في الآخر
4. **أداء محسّن**: استخدام memoization في React
5. **قابلية الاختبار**: دوال pure يسهل اختبارها

---

## أمثلة واقعية

### مثال 1: قائمة سنوات السيارات

```typescript
// في CategoriesClient.tsx
const [yearOptions, setYearOptions] = useState<string[]>([]);

useEffect(() => {
  const years = Array.from(
    { length: 35 }, 
    (_, i) => String(2025 - i)
  );
  
  // معالجة تلقائية - "غير ذلك" سيكون في الآخر
  setYearOptions(processOptions(years));
}, []);
```

### مثال 2: قائمة التخصصات الهرمية

```typescript
const [JOBS_MAIN_SUBS, setJOBS_MAIN_SUBS] = useState<Record<string, string[]>>({});

useEffect(() => {
  fetchCategoryMainSubs('jobs', token)
    .then(data => {
      // معالجة كل الأقسام الفرعية
      setJOBS_MAIN_SUBS(processHierarchicalOptions(data));
    });
}, []);
```

### مثال 3: API Response

```php
// في CategoryFieldsController.php
public function index(Request $request)
{
    $fields = CategoryField::where('category_slug', $request->slug)->get();
    
    // معالجة تلقائية قبل الإرجاع
    $fields = OptionsHelper::processFieldsCollection($fields);
    
    return response()->json(['data' => $fields]);
}
```

---

## الاختبارات

### Frontend Tests

```typescript
import { processOptions, ensureOtherAtEnd } from '@/utils/optionsHelper';

describe('OptionsHelper', () => {
  test('يضع "غير ذلك" في الآخر', () => {
    const result = processOptions(['A', 'غير ذلك', 'B']);
    expect(result).toEqual(['A', 'B', 'غير ذلك']);
  });
  
  test('يزيل التكرار', () => {
    const result = processOptions(['A', 'غير ذلك', 'B', 'غير ذلك']);
    expect(result).toEqual(['A', 'B', 'غير ذلك']);
  });
  
  test('يرتب أبجدياً مع "غير ذلك" في الآخر', () => {
    const result = processOptions(['ج', 'غير ذلك', 'أ', 'ب'], true);
    expect(result).toEqual(['أ', 'ب', 'ج', 'غير ذلك']);
  });
});
```

### Backend Tests

```php
use App\Support\OptionsHelper;
use Tests\TestCase;

class OptionsHelperTest extends TestCase
{
    public function test_ensures_other_at_end()
    {
        $result = OptionsHelper::processOptions(['A', 'غير ذلك', 'B']);
        $this->assertEquals(['A', 'B', 'غير ذلك'], $result);
    }
    
    public function test_removes_duplicates()
    {
        $result = OptionsHelper::processOptions(['A', 'غير ذلك', 'B', 'غير ذلك']);
        $this->assertEquals(['A', 'B', 'غير ذلك'], $result);
    }
}
```

---

## الخلاصة

الآن كل قوائم الـ options في المشروع تستخدم نفس المنطق الموحد، مما يضمن:
- ✅ "غير ذلك" دائماً في الآخر
- ✅ لا تكرار
- ✅ كود نظيف وسهل الصيانة
- ✅ أداء محسّن
