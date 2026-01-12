import React from 'react';
import { useKeyboardStatus } from '../../hooks/useKeyboardStatus';

interface MiniFABProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: React.ReactNode;
    show?: boolean; // Control visibility from parent (e.g. show after scroll 200px)
}

export const MiniFAB: React.FC<MiniFABProps> = ({ className, children, icon, show = false, ...props }) => {
    const isKeyboardOpen = useKeyboardStatus();

    // Mini FAB visible only when 'show' is true AND keyboard is closed
    const shouldShow = show && !isKeyboardOpen;

    const visibilityClass = shouldShow
        ? 'translate-y-0 opacity-100 scale-100'
        : 'translate-y-12 opacity-0 scale-75 pointer-events-none';

    return (
        <button
            className={`fixed bottom-32 right-8 z-40 w-10 h-10 bg-white/90 dark:bg-secondary/90 backdrop-blur-sm text-primary dark:text-white border border-secondary/20 rounded-full shadow-md flex items-center justify-center transition-all duration-300 active:scale-90 hover:shadow-lg md:hidden ${visibilityClass} ${className || ''}`}
            aria-label="Scroll to top"
            {...props}
        >
            {icon ? icon : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
            )}
        </button>
    );
};
