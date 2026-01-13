import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
    onLongPress: (e: React.TouchEvent | React.MouseEvent) => void;
    onClick?: (e: React.TouchEvent | React.MouseEvent) => void;
    delay?: number;
}

/**
 * Custom hook untuk mendeteksi long press
 * Digunakan untuk mobile touch events
 */
export const useLongPress = ({
    onLongPress,
    onClick,
    delay = 500
}: UseLongPressOptions) => {
    const timeoutRef = useRef<NodeJS.Timeout>();
    const targetRef = useRef<EventTarget | null>(null);
    const isLongPressTriggered = useRef(false);

    const start = useCallback((e: React.TouchEvent | React.MouseEvent) => {
        isLongPressTriggered.current = false;
        targetRef.current = e.target;
        timeoutRef.current = setTimeout(() => {
            isLongPressTriggered.current = true;
            onLongPress(e);
        }, delay);
    }, [onLongPress, delay]);

    const clear = useCallback((e: React.TouchEvent | React.MouseEvent, shouldTriggerClick = true) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = undefined;
        }

        // Only trigger click if:
        // 1. shouldTriggerClick is true
        // 2. onClick is provided
        // 3. target is the same
        // 4. Long press was NOT triggered
        if (shouldTriggerClick && onClick && targetRef.current === e.target && !isLongPressTriggered.current) {
            onClick(e);
        }

        isLongPressTriggered.current = false;
        targetRef.current = null;
    }, [onClick]);

    return {
        onMouseDown: start,
        onMouseUp: (e: React.MouseEvent) => clear(e, true),
        onMouseLeave: (e: React.MouseEvent) => clear(e, false),
        onTouchStart: start,
        onTouchEnd: (e: React.TouchEvent) => clear(e, true),
        onTouchMove: (e: React.TouchEvent) => clear(e, false),
    };
};
