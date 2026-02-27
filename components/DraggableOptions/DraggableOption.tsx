'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DraggableOptionProps {
    id: string;
    option: string;
    isDraggable: boolean;
    children: React.ReactNode;
}

export function DraggableOption({
    id,
    option,
    isDraggable,
    children,
}: DraggableOptionProps) {
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

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: isDragging ? 1000 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`draggable-option ${isDragging ? 'dragging' : ''} ${isOver ? 'over' : ''} ${!isDraggable ? 'disabled' : ''}`}
        >
            {isDraggable && (
                <span
                    {...attributes}
                    {...listeners}
                    className="drag-handle"
                    title="اسحب لإعادة الترتيب"
                    role="button"
                    aria-label="اسحب لإعادة الترتيب"
                    tabIndex={0}
                >
                    ⋮⋮
                </span>
            )}
            {children}
        </div>
    );
}
