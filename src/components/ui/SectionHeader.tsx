import React from 'react';

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    subtitle,
    icon,
    actionLabel,
    onAction,
    className = ''
}) => {
    return (
        <div className={`flex items-center justify-between mb-3 px-1 select-none ${className}`}>
            <div className="flex items-center gap-2">
                {icon && (
                    <div className="w-4 h-4 text-text-neutral/60 dark:text-text-secondary/70 flex items-center justify-center">
                        {icon}
                    </div>
                )}
                <div>
                    <h2 className="text-xs font-semibold text-text-neutral/80 dark:text-text-secondary/70 tracking-wider">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="text-[10px] text-text-neutral/50 dark:text-text-secondary/50">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="text-xs text-accent hover:text-accent-hover font-medium"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};
