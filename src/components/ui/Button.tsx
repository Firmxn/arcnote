import React from 'react';
import clsx from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'neutral' | 'error' | 'warning' | 'info' | 'success' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    circle?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    className,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    disabled,
    circle = false,
    ...props
}) => {
    // Base styles dengan focus effect menggunakan accent color
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

    // Focus effect: ganti background dan text dengan accent color
    const focusStyles = 'focus:bg-accent focus:text-text-accent focus:hover:bg-accent/90 focus:hover:text-text-accent';

    const variants = {
        primary: 'bg-primary text-white hover:bg-primary/90 focus:ring-primary',
        secondary: 'bg-secondary text-white hover:bg-secondary/90 focus:ring-secondary',
        accent: 'bg-accent text-white hover:bg-accent/90 focus:ring-accent',
        neutral: 'bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 focus:ring-gray-500',
        error: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
        warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500',
        info: 'bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500',
        success: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500',
        ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
        outline: 'bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
    };

    const sizes = {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-8 w-8 p-1', // For icon-only buttons
    };

    return (
        <button
            className={clsx(
                baseStyles,
                focusStyles,
                circle ? 'rounded-full' : 'rounded-lg',
                variants[variant],
                sizes[size],
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
        </button>
    );
};
