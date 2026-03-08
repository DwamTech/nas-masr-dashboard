'use client';

import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import { uploadCategoryGlobalImage } from '@/services/makes';
import { ImagePreview } from './ImagePreview';
import type { AdminCategoryListItem } from '@/models/makes';
import { sanitizeCategoryName, sanitizeFilename } from '@/utils/sanitize';
import styles from './ImageUploadModal.module.css';

interface ImageUploadModalProps {
    category: AdminCategoryListItem;
    onClose: () => void;
    onSuccess: (updatedCategory: AdminCategoryListItem) => void;
}

export function ImageUploadModal({
    category,
    onClose,
    onSuccess,
}: ImageUploadModalProps) {
    const [preview, setPreview] = useState<string | null>(
        category.global_image_full_url ?? null
    );
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [isDragActive, setIsDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sanitize category name to prevent XSS
    const safeCategoryName = sanitizeCategoryName(category.name || '');

    // Client-side validation
    const validateImage = (file: File): string | null => {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            return 'صيغة الصورة غير مدعومة. الصيغ المدعومة: JPEG, PNG, WebP';
        }

        if (file.size > 5242880) {
            // 5MB
            return 'حجم الصورة يتجاوز 5 ميجابايت';
        }

        // Sanitize filename to prevent path traversal
        const safeFilename = sanitizeFilename(file.name);
        if (!safeFilename) {
            return 'اسم الملف غير صالح';
        }

        return null;
    };

    const handleFile = useCallback((file: File) => {
        setError(null);

        const validationError = validateImage(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        setSelectedFile(file);
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
    }, []);

    const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    };

    const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        setError(null);

        try {
            const response = await uploadCategoryGlobalImage(category.id, selectedFile);
            onSuccess(response);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'فشل رفع الصورة';
            setError(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    const handleClearPreview = () => {
        setPreview(null);
        setSelectedFile(null);
        setError(null);
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <h2 className={styles.title}>
                    رفع صورة موحدة - {safeCategoryName}
                </h2>

                {preview && (
                    <ImagePreview
                        imageUrl={preview}
                        onClear={selectedFile ? handleClearPreview : undefined}
                    />
                )}

                <div
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`${styles.dropZone} ${isDragActive ? styles.dropZoneActive : ''
                        }`}
                >
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileInput}
                        className={styles.fileInput}
                        id="file-input"
                    />
                    <label htmlFor="file-input" className={styles.fileInputLabel}>
                        <p className={styles.dropZoneText}>
                            {isDragActive
                                ? 'أفلت الصورة هنا...'
                                : 'اسحب وأفلت صورة هنا، أو انقر للاختيار'}
                        </p>
                        <p className={styles.dropZoneHint}>
                            الحد الأقصى: 5MB | الصيغ المدعومة: JPEG, PNG, WebP
                        </p>
                    </label>
                </div>

                {error && (
                    <div className={styles.errorBox}>
                        <p>{error}</p>
                    </div>
                )}

                <div className={styles.actions}>
                    <button
                        onClick={onClose}
                        className={`${styles.button} ${styles.cancelButton}`}
                        disabled={uploading}
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                        className={`${styles.button} ${styles.uploadButton}`}
                    >
                        {uploading ? 'جاري الرفع...' : 'حفظ وتعميم'}
                    </button>
                </div>
            </div>
        </div>
    );
}
