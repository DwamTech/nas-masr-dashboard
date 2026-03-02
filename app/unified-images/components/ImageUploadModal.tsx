'use client';

import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import { uploadCategoryGlobalImage } from '@/services/makes';
import { ImagePreview } from './ImagePreview';
import type { AdminCategoryListItem } from '@/models/makes';

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">
                    رفع صورة موحدة - {category.name}
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
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                        }`}
                >
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileInput}
                        className="hidden"
                        id="file-input"
                    />
                    <label htmlFor="file-input" className="cursor-pointer">
                        <p className="text-gray-600">
                            {isDragActive
                                ? 'أفلت الصورة هنا...'
                                : 'اسحب وأفلت صورة هنا، أو انقر للاختيار'}
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                            الحد الأقصى: 5MB | الصيغ المدعومة: JPEG, PNG, WebP
                        </p>
                    </label>
                </div>

                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded hover:bg-gray-50 transition-colors"
                        disabled={uploading}
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {uploading ? 'جاري الرفع...' : 'حفظ وتعميم'}
                    </button>
                </div>
            </div>
        </div>
    );
}
