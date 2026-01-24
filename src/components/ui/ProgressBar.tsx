import React from 'react';

interface ProgressBarProps {
    value: number;
    max?: number;
    variant?: 'success' | 'warning' | 'error' | 'info';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    value,
    max = 100,
    variant = 'info',
    size = 'md',
    className = ''
}) => {
    const percentage = Math.min((value / max) * 100, 100);

    const sizeClasses = {
        sm: 'h-2',
        md: 'h-3',
        lg: 'h-4'
    };

    const variantClasses = {
        success: 'bg-green-500 dark:bg-green-400',
        warning: 'bg-yellow-500 dark:bg-yellow-400',
        error: 'bg-red-500 dark:bg-red-400',
        info: 'bg-accent dark:bg-accent'
    };

    return (
        <div className={`w-full bg-gray-200 dark:bg-neutral/40 rounded-full overflow-hidden ${sizeClasses[size]} ${className}`}>
            <div
                className={`h-full ${variantClasses[variant]} transition-all duration-300 ease-out`}
                style={{ width: `${percentage}%` }}
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={max}
            />
        </div>
    );
};
