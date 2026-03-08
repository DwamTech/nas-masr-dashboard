import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { ImagePreview } from './ImagePreview';
import type { AdminCategoryListItem } from '@/models/makes';
import { sanitizeCategoryName } from '@/utils/sanitize';
import styles from './UnifiedImagesTable.module.css';

interface UnifiedImagesTableProps {
    categories: AdminCategoryListItem[];
    onToggle: (categoryId: number, isActive: boolean) => Promise<void>;
    onUploadClick: (category: AdminCategoryListItem) => void;
}

// Decode HTML entities in icon strings
function decodeHtmlEntities(text: string | undefined): string {
    if (!text) return '';

    // If icon contains image file extension, it's not an emoji - return empty
    if (text.includes('.jpg') || text.includes('.jpeg') || text.includes('.png') || text.includes('.webp') || text.includes('.gif')) {
        return '';
    }

    // Create a temporary element to decode HTML entities
    if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text;
        return textarea.value;
    }

    // Fallback for server-side rendering
    return text
        .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

export function UnifiedImagesTable({
    categories,
    onToggle,
    onUploadClick,
}: UnifiedImagesTableProps) {
    return (
        <div className={styles.tableContainer}>
            <table className={styles.table}>
                <thead className={styles.tableHead}>
                    <tr>
                        <th className={styles.nameColumn}>القسم</th>
                        <th className={styles.imageColumn}>معاينة الصورة</th>
                        <th className={styles.toggleColumn}>
                            تفعيل الصورة الموحدة
                        </th>
                        <th className={styles.actionColumn}>
                            إدارة الصورة
                        </th>
                    </tr>
                </thead>
                <tbody className={styles.tableBody}>
                    {categories.map((category) => {
                        // Sanitize category name to prevent XSS
                        const safeName = sanitizeCategoryName(category.name || '');
                        // Decode HTML entities in icon
                        const decodedIcon = decodeHtmlEntities(category.icon);

                        return (
                            <tr key={category.id}>
                                <td className={styles.nameCell}>
                                    <div className={styles.categoryInfo}>
                                        <span className={styles.categoryIcon}>{decodedIcon}</span>
                                        <span className={styles.categoryName}>{safeName}</span>
                                    </div>
                                </td>
                                <td className={styles.imageCell}>
                                    {category.global_image_full_url ? (
                                        <ImagePreview
                                            imageUrl={category.global_image_full_url}
                                            categoryName={safeName}
                                        />
                                    ) : (
                                        <div className={styles.noImage}>
                                            <span className={styles.noImageIcon}>📷</span>
                                            <span className={styles.noImageText}>لا توجد صورة</span>
                                        </div>
                                    )}
                                </td>
                                <td className={styles.toggleCell}>
                                    <ToggleSwitch
                                        checked={category.is_global_image_active ?? false}
                                        onChange={(checked) => onToggle(category.id, checked)}
                                        ariaLabel={`تفعيل الصورة الموحدة لقسم ${safeName}`}
                                    />
                                </td>
                                <td className={styles.actionCell}>
                                    <button
                                        disabled={!category.is_global_image_active}
                                        onClick={() => onUploadClick(category)}
                                        className={`${styles.uploadButton} ${category.is_global_image_active
                                            ? styles.uploadButtonActive
                                            : styles.uploadButtonDisabled
                                            }`}
                                    >
                                        {category.global_image_url ? 'تعديل الصورة' : 'رفع صورة'}
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
