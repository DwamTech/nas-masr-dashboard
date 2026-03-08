import { useEffect, useRef } from 'react';

/**
 * Custom hook for returning focus to trigger element when modal closes
 * 
 * Stores the currently focused element when modal opens and returns focus
 * to it when the modal closes.
 * 
 * Requirements: 11.6 (Return focus to trigger element on modal close)
 * 
 * @param isOpen - Whether the modal is currently open
 */
export function useFocusReturn(isOpen: boolean) {
    const previousActiveElementRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        // Store the currently focused element when modal opens
        if (isOpen) {
            previousActiveElementRef.current = document.activeElement as HTMLElement;
        }
        // Return focus when modal closes
        else if (previousActiveElementRef.current) {
            previousActiveElementRef.current.focus();
            previousActiveElementRef.current = null;
        }
    }, [isOpen]);
}
