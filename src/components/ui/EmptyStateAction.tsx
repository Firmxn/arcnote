import React from 'react';

interface EmptyStateActionProps {
    label: string;
    onClick: () => void;
    className?: string;
}

export const EmptyStateAction: React.FC<EmptyStateActionProps> = ({ label, onClick, className }) => {
    return (
        <div className={`text-center py-8 text-text-neutral/60 dark:text-text-secondary ${className || ''}`}>
            <button
                onClick={onClick}
                className="mt-2 text-sm text-accent hover:underline focus:outline-none"
            >
                {label}
            </button>
        </div>
    );
};
