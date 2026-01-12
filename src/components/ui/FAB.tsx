import React from 'react';
import { useKeyboardStatus } from '../../hooks/useKeyboardStatus';

interface FABProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: React.ReactNode;
    hide?: boolean;
}

export const FAB: React.FC<FABProps> = ({ className, children, icon, hide, ...props }) => {
    const isKeyboardOpen = useKeyboardStatus();
    const shouldHide = isKeyboardOpen || hide;

    const visibilityClass = shouldHide
        ? 'translate-y-24 opacity-0 pointer-events-none'
        : 'translate-y-0 opacity-100';

    return (
        <button
            className={`fixed bottom-32 right-6 z-50 w-14 h-14 bg-accent hover:bg-accent-hover text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 active:scale-95 hover:shadow-xl md:hidden ${visibilityClass} ${className || ''}`}
            {...props}
        >
            {icon ? icon : children}
            {/* Fallback internal icon if none provided? No, user should provide icon. */}
            {!icon && !children && (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
            )}
        </button>
    );
};
