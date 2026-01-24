import React from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    className?: string;
    leading?: React.ReactNode;
    trailing?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    description,
    className = '',
    leading,
    trailing
}) => {
    return (
        <div className={`flex items-start justify-between gap-4 mb-6 ${className}`}>
            <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                {leading && (
                    <div className="shrink-0">
                        {leading}
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl md:text-3xl font-bold text-text-neutral dark:text-text-primary truncate">
                        {title}
                    </h1>
                    {description && (
                        <p className="text-sm md:text-base text-text-neutral/60 dark:text-text-secondary truncate">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            {trailing && (
                <div className="shrink-0 pt-1">
                    {trailing}
                </div>
            )}
        </div>
    );
};
