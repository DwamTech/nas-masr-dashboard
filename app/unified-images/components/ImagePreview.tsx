import Image from 'next/image';
import { useState } from 'react';
import styles from './ImagePreview.module.css';

interface ImagePreviewProps {
    imageUrl: string;
    categoryName?: string;
    onClear?: () => void;
}

export function ImagePreview({ imageUrl, categoryName, onClear }: ImagePreviewProps) {
    const [isZoomed, setIsZoomed] = useState(false);
    const [imageError, setImageError] = useState(false);

    if (imageError) {
        return (
            <div className={styles.errorContainer}>
                <span className={styles.errorIcon}>⚠️</span>
                <span className={styles.errorText}>فشل تحميل الصورة</span>
            </div>
        );
    }

    return (
        <>
            <div className={styles.thumbnailContainer}>
                <Image
                    src={imageUrl}
                    alt={categoryName || 'صورة القسم'}
                    width={80}
                    height={80}
                    className={styles.thumbnail}
                    onClick={() => setIsZoomed(true)}
                    onError={() => setImageError(true)}
                />
                {onClear && (
                    <button
                        onClick={onClear}
                        className={styles.clearButton}
                        type="button"
                        title="مسح الصورة"
                    >
                        ×
                    </button>
                )}
            </div>

            {isZoomed && (
                <div
                    className={styles.zoomOverlay}
                    onClick={() => setIsZoomed(false)}
                >
                    <div className={styles.zoomContent}>
                        <button
                            className={styles.closeButton}
                            onClick={() => setIsZoomed(false)}
                        >
                            ×
                        </button>
                        <Image
                            src={imageUrl}
                            alt={categoryName || 'صورة القسم'}
                            width={600}
                            height={600}
                            className={styles.zoomedImage}
                            onError={() => setImageError(true)}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
