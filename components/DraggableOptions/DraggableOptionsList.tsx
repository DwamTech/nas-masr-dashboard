'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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
import { throttle } from '@/utils/performance';

interface DraggableOptionsListProps {
    options: string[];
    onReorder: (newOrder: string[]) => void;
    onSave: (ranks: { option: string; rank: number }[]) => Promise<void>;
    renderOption: (option: string, dragHandleProps?: any) => React.ReactNode;
    otherOptionLabel?: string;
    disabled?: boolean;
}

// Custom collision detection for better UX with throttling
// Task 21.3: Throttle drag move events (16ms for 60fps)
// Requirement 12.3
const createThrottledCollisionDetection = () => {
    // Create a throttled version that limits collision checks to 60fps
    const throttledDetection = throttle((args: any) => {
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
    }, 16); // 16ms = 60fps

    // Return a function that calls the throttled version
    return (args: any) => {
        return throttledDetection(args) || closestCenter(args);
    };
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
    const [announcement, setAnnouncement] = useState<string>('');
    const announcementTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Create throttled collision detection (Task 21.3)
    const collisionDetection = useMemo(() => createThrottledCollisionDetection(), []);

    const { calculateRanks, ensureOtherIsLast } = useRankCalculation({
        otherOptionLabel,
    });

    // Announce changes to screen readers
    const announce = useCallback((message: string) => {
        setAnnouncement(message);

        // Clear previous timeout
        if (announcementTimeoutRef.current) {
            clearTimeout(announcementTimeoutRef.current);
        }

        // Clear announcement after 3 seconds
        announcementTimeoutRef.current = setTimeout(() => {
            setAnnouncement('');
        }, 3000);
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (announcementTimeoutRef.current) {
                clearTimeout(announcementTimeoutRef.current);
            }
        };
    }, []);

    const handleReorder = useCallback(
        async (newOrder: string[]) => {
            // Store previous order for rollback
            setPreviousOrder(options);

            // Ensure "غير ذلك" is last
            const orderedOptions = ensureOtherIsLast(newOrder);

            // Update UI optimistically
            onReorder(orderedOptions);

            // Announce the reorder to screen readers
            const movedItem = orderedOptions.find((opt, idx) => opt !== options[idx]);
            if (movedItem) {
                const newPosition = orderedOptions.indexOf(movedItem) + 1;
                announce(`تم نقل ${movedItem} إلى الموضع ${newPosition}`);
            }

            // Calculate ranks
            const ranks = calculateRanks(orderedOptions);

            // Save to backend
            try {
                setIsSaving(true);
                announce('جاري حفظ الترتيب الجديد...');
                await onSave(ranks);
                announce('تم حفظ الترتيب بنجاح');
            } catch (error) {
                // Rollback on failure
                onReorder(previousOrder);
                announce('فشل حفظ الترتيب. تم التراجع عن التغييرات.');
                console.error('Failed to save ranks:', error);
            } finally {
                setIsSaving(false);
            }
        },
        [options, onReorder, onSave, calculateRanks, ensureOtherIsLast, previousOrder, announce]
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
            <div className="models-list" role="list" aria-label="قائمة الخيارات">
                {options.map((option) => (
                    <div key={option} role="listitem">
                        {renderOption(option)}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <>
            {/* ARIA live region for screen reader announcements */}
            <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
                style={{
                    position: 'absolute',
                    left: '-10000px',
                    width: '1px',
                    height: '1px',
                    overflow: 'hidden',
                }}
            >
                {announcement}
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={collisionDetection}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <SortableContext items={options} strategy={verticalListSortingStrategy}>
                    <div
                        className={`models-list ${isSaving ? 'saving' : ''}`}
                        role="list"
                        aria-label="قائمة الخيارات القابلة لإعادة الترتيب"
                        aria-describedby="drag-instructions"
                    >
                        {/* Instructions for screen readers */}
                        <div id="drag-instructions" className="sr-only">
                            استخدم مفاتيح الأسهم لإعادة ترتيب العناصر. اضغط مسافة أو Enter لبدء السحب، ثم استخدم الأسهم للتحرك، واضغط مسافة أو Enter مرة أخرى للإفلات.
                        </div>

                        {options.map((option) => {
                            const isDraggable = option !== otherOptionLabel;
                            const position = options.indexOf(option) + 1;
                            const totalItems = options.length;

                            return (
                                <DraggableOption
                                    key={option}
                                    id={option}
                                    option={option}
                                    isDraggable={isDraggable}
                                    ariaLabel={
                                        isDraggable
                                            ? `${option}، العنصر ${position} من ${totalItems}، قابل للسحب`
                                            : `${option}، العنصر ${position} من ${totalItems}، غير قابل للسحب`
                                    }
                                >
                                    {renderOption(option)}
                                </DraggableOption>
                            );
                        })}
                    </div>
                </SortableContext>

                <DragOverlay
                    dropAnimation={{
                        duration: 200,
                        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                >
                    {activeId ? (
                        <div
                            className="drag-overlay"
                            role="img"
                            aria-label={`جاري سحب ${activeId}`}
                        >
                            {renderOption(activeId as string)}
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </>
    );
}
