'use client';

import React, { useState, useCallback } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DraggableOptionProps {
    id: string;
    option: string;
    isDraggable: boolean;
    children: React.ReactNode;
    ariaLabel?: string;
}

export function DraggableOption({
    id,
    option,
    isDraggable,
    children,
    ariaLabel,
}: DraggableOptionProps) {
    const [isTouchActive, setIsTouchActive] = useState(false);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
        isOver,
    } = useSortable({
        id,
        disabled: !isDraggable,
    });

    // Touch feedback handlers (Requirement 4.18, 11.3)
    const handleTouchStart = useCallback(() => {
        setIsTouchActive(true);
    }, []);

    const handleTouchEnd = useCallback(() => {
        setIsTouchActive(false);
    }, []);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: isDragging ? 1000 : 'auto',
    };

    // Combine listeners with touch feedback
    const dragHandleProps = isDraggable ? {
        ...attributes,
        ...listeners,
        onTouchStart: (e: React.TouchEvent) => {
            handleTouchStart();
            listeners?.onTouchStart?.(e as any);
        },
        onTouchEnd: (e: React.TouchEvent) => {
            handleTouchEnd();
            listeners?.onTouchEnd?.(e as any);
        },
    } : {};

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`draggable-option ${isDragging ? 'dragging' : ''} ${isOver ? 'over' : ''} ${!isDraggable ? 'disabled' : ''}`}
            role="listitem"
            aria-label={ariaLabel}
        >
            {isDraggable && (
                <span
                    {...dragHandleProps}
                    className={`drag-handle ${isTouchActive ? 'touch-active' : ''}`}
                    title="اسحب لإعادة الترتيب"
                    role="button"
                    aria-label="مقبض السحب - اسحب لإعادة الترتيب"
                    aria-describedby="drag-instructions"
                    tabIndex={0}
                >
                    ⋮⋮
                </span>
            )}
            {children}
        </div>
    );
}
