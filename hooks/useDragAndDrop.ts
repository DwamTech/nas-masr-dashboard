import { useState, useMemo } from 'react';
import {
    DragEndEvent,
    DragStartEvent,
    MouseSensor,
    TouchSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    PointerSensor,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';

interface UseDragAndDropOptions {
    items: string[];
    onReorder: (newOrder: string[]) => void;
    pinnedItem?: string; // "غير ذلك"
}

export function useDragAndDrop({
    items,
    onReorder,
    pinnedItem = 'غير ذلك',
}: UseDragAndDropOptions) {
    const [activeId, setActiveId] = useState<string | null>(null);

    // Setup sensors for mouse, touch, and keyboard
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement required before drag starts
            },
        }),
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200,
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Get index of pinned item
    const pinnedIndex = useMemo(() => {
        return items.findIndex(item => item === pinnedItem);
    }, [items, pinnedItem]);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const draggedItem = items.find(item => item === active.id);

        // Prevent dragging the pinned item
        if (draggedItem === pinnedItem) {
            return;
        }

        setActiveId(active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        setActiveId(null);

        if (!over) {
            // Dropped outside valid zone
            return;
        }

        const activeIndex = items.findIndex(item => item === active.id);
        const overIndex = items.findIndex(item => item === over.id);

        if (activeIndex === -1 || overIndex === -1) {
            return;
        }

        // Prevent dropping after pinned item
        if (pinnedIndex !== -1 && overIndex >= pinnedIndex) {
            return;
        }

        // Prevent dragging pinned item
        if (items[activeIndex] === pinnedItem) {
            return;
        }

        if (activeIndex !== overIndex) {
            const newOrder = arrayMove(items, activeIndex, overIndex);
            onReorder(newOrder);
        }
    };

    const handleDragCancel = () => {
        setActiveId(null);
    };

    return {
        sensors,
        activeId,
        handleDragStart,
        handleDragEnd,
        handleDragCancel,
    };
}
