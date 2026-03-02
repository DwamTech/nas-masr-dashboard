import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import type { AdminCategoryListItem } from '@/models/makes';

interface UnifiedImagesTableProps {
    categories: AdminCategoryListItem[];
    onToggle: (categoryId: number, isActive: boolean) => Promise<void>;
    onUploadClick: (category: AdminCategoryListItem) => void;
}

export function UnifiedImagesTable({
    categories,
    onToggle,
    onUploadClick,
}: UnifiedImagesTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white shadow-sm rounded-lg">
                <thead>
                    <tr className="bg-gray-100 border-b">
                        <th className="p-3 text-right font-semibold text-gray-700">القسم</th>
                        <th className="p-3 text-right font-semibold text-gray-700">الأيقونة</th>
                        <th className="p-3 text-center font-semibold text-gray-700">
                            تفعيل الصورة الموحدة
                        </th>
                        <th className="p-3 text-center font-semibold text-gray-700">
                            إدارة الصورة
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map((category) => (
                        <tr key={category.id} className="border-b hover:bg-gray-50">
                            <td className="p-3 text-gray-800">{category.name}</td>
                            <td className="p-3 text-2xl">{category.icon}</td>
                            <td className="p-3 text-center">
                                <div className="flex justify-center">
                                    <ToggleSwitch
                                        checked={category.is_global_image_active ?? false}
                                        onChange={(checked) => onToggle(category.id, checked)}
                                        ariaLabel={`تفعيل الصورة الموحدة لقسم ${category.name}`}
                                    />
                                </div>
                            </td>
                            <td className="p-3 text-center">
                                <button
                                    disabled={!category.is_global_image_active}
                                    onClick={() => onUploadClick(category)}
                                    className={`
                    px-4 py-2 rounded-md font-medium transition-colors
                    ${category.is_global_image_active
                                            ? 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }
                  `}
                                >
                                    {category.global_image_url ? 'تعديل الصورة' : 'رفع صورة'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
