import React from 'react';
import { useSmartBack } from '../../hooks/useSmartBack';

interface BackButtonProps {
    className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ className = '' }) => {
    const { handleBack } = useSmartBack();

    return (
        <button
            onClick={handleBack}
            className={`p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-text-neutral dark:text-text-secondary transition-colors ${className}`}
            title="Go Back"
        >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
        </button>
    );
};
