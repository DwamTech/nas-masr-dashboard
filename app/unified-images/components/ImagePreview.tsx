import Image from 'next/image';
import { useState } from 'react';

interface ImagePreviewProps {
    imageUrl: string;
    onClear?: () => void;
}

export function ImagePreview({ imageUrl, onClear }: ImagePreviewProps) {
    const [isZoomed, setIsZoomed] = useState(false);

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">الصورة الحالية:</p>
                {onClear && (
                    <button
                        onClick={onClear}
                        className="text-sm text-red-600 hover:text-red-800 transition-colors"
                        type="button"
                    >
                        مسح
                    </button>
                )}
            </div>

            <div className="relative">
                <Image
                    src={imageUrl}
                    alt="Preview"
                    width={200}
                    height={200}
                    className={`rounded cursor-pointer transition-transform ${isZoomed ? 'scale-150' : 'scale-100'
                        }`}
                    onClick={() => setIsZoomed(!isZoomed)}
                />
                {isZoomed && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
                        onClick={() => setIsZoomed(false)}
                    >
                        <Image
                            src={imageUrl}
                            alt="Zoomed Preview"
                            width={800}
                            height={800}
                            className="max-w-full max-h-full object-contain"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
