import React, { useState, useRef, useEffect } from 'react';

interface SwipeableItemProps {
    children: React.ReactNode;
    onEdit?: () => void;
    onDelete?: () => void;
    className?: string;
    threshold?: number;
}

export const SwipeableItem: React.FC<SwipeableItemProps> = ({
    children,
    onEdit,
    onDelete,
    className = '',
    threshold = 50
}) => {
    const [offset, setOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startX = useRef(0);
    const currentOffset = useRef(0);
    const itemRef = useRef<HTMLDivElement>(null);

    // 75px button + 8px right offset + 8px gap = 91px (Single)
    // 154px buttons + 8px right offset + 8px gap = 170px (Double)
    const maxSwipe = (onEdit && onDelete) ? 170 : 91;

    const handleTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
        currentOffset.current = offset;
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;

        const touchX = e.touches[0].clientX;
        const diff = touchX - startX.current;
        const newOffset = currentOffset.current + diff;

        // Limit dragging: only left swipe (negative offset) up to maxSwipe
        // Add rubber banding effect when pulling right
        if (newOffset > 0) {
            setOffset(newOffset * 0.2);
        } else {
            setOffset(Math.max(newOffset, -maxSwipe * 1.2)); // Allow slight overdrag
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);

        if (offset < -threshold) {
            // Snap to open
            setOffset(-maxSwipe);
        } else {
            // Snap to closed
            setOffset(0);
        }
    };

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: Event) => {
            if (itemRef.current && !itemRef.current.contains(e.target as Node)) {
                setOffset(0);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    return (
        <div className={`relative overflow-hidden ${className}`} ref={itemRef}>
            {/* Background Actions */}
            <div className="absolute inset-y-1 right-2 flex items-center h-[calc(100%-8px)] gap-1">
                {onEdit && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit();
                            setOffset(0);
                        }}
                        className="h-full w-[75px] bg-warning text-white flex flex-col items-center justify-center gap-1 active:brightness-90 transition-all rounded-lg shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="text-xs font-medium">Edit</span>
                    </button>
                )}
                {onDelete && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                            setOffset(0);
                        }}
                        className="h-full w-[75px] bg-danger text-white flex flex-col items-center justify-center gap-1 active:brightness-90 transition-all rounded-lg shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="text-xs font-medium">Delete</span>
                    </button>
                )}
            </div>

            {/* Content */}
            <div
                className="relative bg-neutral dark:bg-primary transition-transform duration-200 ease-out will-change-transform z-10"
                style={{
                    transform: `translateX(${offset}px)`
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {children}
            </div>
        </div>
    );
};
