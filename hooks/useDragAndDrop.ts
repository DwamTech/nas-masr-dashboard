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

    // Setup sensors with better activation constraints for smoother UX
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Reduced from 8px for more responsive feel
            },
        }),
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 150, // Reduced from 200ms for faster response
                tolerance: 8, // Increased tolerance for better mobile UX
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
