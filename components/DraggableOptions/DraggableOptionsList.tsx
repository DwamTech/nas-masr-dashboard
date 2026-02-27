'use client';

import React, { useState, useCallback } from 'react';
import {
    DndContext,
    closestCenter,
    DragOverlay,
    pointerWithin,
    rectIntersection,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { useRankCalculation } from '@/hooks/useRankCalculation';
import { DraggableOption } from './DraggableOption';

interface DraggableOptionsListProps {
    options: string[];
    onReorder: (newOrder: string[]) => void;
    onSave: (ranks: { option: string; rank: number }[]) => Promise<void>;
    renderOption: (option: string, dragHandleProps?: any) => React.ReactNode;
    otherOptionLabel?: string;
    disabled?: boolean;
}

// Custom collision detection for better UX
const customCollisionDetection = (args: any) => {
    // First, try pointer-based detection for more precise feedback
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) {
        return pointerCollisions;
    }

    // Fallback to rectangle intersection
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) {
        return rectCollisions;
    }

    // Final fallback to closest center
    return closestCenter(args);
};

export function DraggableOptionsList({
    options,
    onReorder,
    onSave,
    renderOption,
    otherOptionLabel = 'غير ذلك',
    disabled = false,
}: DraggableOptionsListProps) {
    const [isSaving, setIsSaving] = useState(false);
    const [previousOrder, setPreviousOrder] = useState<string[]>(options);

    const { calculateRanks, ensureOtherIsLast } = useRankCalculation({
        otherOptionLabel,
    });

    const handleReorder = useCallback(
        async (newOrder: string[]) => {
            // Store previous order for rollback
            setPreviousOrder(options);

            // Ensure "غير ذلك" is last
            const orderedOptions = ensureOtherIsLast(newOrder);

            // Update UI optimistically
            onReorder(orderedOptions);

            // Calculate ranks
            const ranks = calculateRanks(orderedOptions);

            // Save to backend
            try {
                setIsSaving(true);
                await onSave(ranks);
            } catch (error) {
                // Rollback on failure
                onReorder(previousOrder);
                console.error('Failed to save ranks:', error);
            } finally {
                setIsSaving(false);
            }
        },
        [options, onReorder, onSave, calculateRanks, ensureOtherIsLast, previousOrder]
    );

    const {
        sensors,
        activeId,
        handleDragStart,
        handleDragEnd,
        handleDragCancel,
    } = useDragAndDrop({
        items: options,
        onReorder: handleReorder,
        pinnedItem: otherOptionLabel,
    });

    if (disabled) {
        // Render without drag & drop
        return (
            <div className="models-list">
                {options.map((option) => renderOption(option))}
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={customCollisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <SortableContext items={options} strategy={verticalListSortingStrategy}>
                <div className={`models-list ${isSaving ? 'saving' : ''}`}>
                    {options.map((option) => {
                        const isDraggable = option !== otherOptionLabel;
                        return (
                            <DraggableOption
                                key={option}
                                id={option}
                                option={option}
                                isDraggable={isDraggable}
                            >
                                {renderOption(option)}
                            </DraggableOption>
                        );
                    })}
                </div>
            </SortableContext>

            <DragOverlay dropAnimation={{
                duration: 200,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
                {activeId ? (
                    <div className="drag-overlay">
                        {renderOption(activeId as string)}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
