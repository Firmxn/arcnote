import React from 'react';

interface SectionHeaderProps {
    title: string;
    icon?: React.ReactNode;
    className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, icon, className = '' }) => {
    return (
        <div className={`flex items-center gap-2 mb-3 px-1 ${className}`}>
            {icon && (
                <div className="w-4 h-4 text-text-neutral/60 dark:text-text-secondary/70 flex items-center justify-center">
                    {icon}
                </div>
            )}
            {/* <h2 className="text-xs font-semibold text-text-neutral/60 dark:text-text-secondary/70 uppercase tracking-wider"> */}
            <h2 className="text-xs font-semibold text-text-neutral/80 dark:text-text-secondary/70 tracking-wider">
                {title}
            </h2>
        </div>
    );
};
