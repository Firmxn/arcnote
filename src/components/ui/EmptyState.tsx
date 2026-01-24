import React from 'react';

interface EmptyStateProps {
    /**
     * Emoji atau icon yang ditampilkan
     */
    icon?: string | React.ReactNode;

    /**
     * Judul pesan empty state
     */
    title?: string;

    /**
     * Deskripsi atau pesan tambahan
     */
    description?: string;

    /**
     * Action button (opsional)
     */
    action?: React.ReactNode;

    /**
     * Ukuran icon
     */
    iconSize?: 'sm' | 'md' | 'lg';

    /**
     * Custom className untuk container
     */
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon = '📝',
    title,
    description,
    action,
    iconSize = 'md',
    className = ''
}) => {
    const iconSizeClasses = {
        sm: 'text-3xl',
        md: 'text-4xl',
        lg: 'text-5xl'
    };

    return (
        <div className={`text-center py-12 ${className}`}>
            {/* Icon */}
            <div className={`${iconSizeClasses[iconSize]} mb-3`}>
                {typeof icon === 'string' ? icon : icon}
            </div>

            {/* Title */}
            {title && (
                <h3 className="text-base font-semibold text-text-neutral dark:text-text-primary mb-2">
                    {title}
                </h3>
            )}

            {/* Description */}
            {description && (
                <p className="text-sm text-text-neutral/60 dark:text-text-secondary max-w-md mx-auto">
                    {description}
                </p>
            )}

            {/* Action */}
            {action && (
                <div className="mt-4">
                    {action}
                </div>
            )}
        </div>
    );
};
