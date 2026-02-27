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
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: isDraggable ? 'grab' : 'default',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`draggable-option ${isDragging ? 'dragging' : ''} ${isOver ? 'over' : ''}`}
        >
            {isDraggable && (
                <span
                    {...attributes}
                    {...listeners}
                    className="drag-handle"
                    title="اسحب لإعادة الترتيب"
                >
                    ⋮⋮
                </span>
            )}
            {children}
        </div>
    );
}
