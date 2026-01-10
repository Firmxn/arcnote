import React from 'react';
import clsx from 'clsx';

export type BadgeVariant = 'solid' | 'soft' | 'outline' | 'ghost';
export type BadgeColor = 'primary' | 'secondary' | 'neutral' | 'accent' | 'success' | 'warning' | 'error' | 'info' | 'purple' | 'pink';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    color?: BadgeColor;
    size?: BadgeSize;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
    children,
    className,
    variant = 'soft',
    color = 'neutral',
    size = 'md',
    leftIcon,
    rightIcon,
    onClick,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full transition-colors whitespace-nowrap';
    const cursorStyles = onClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default';

    const colorStyles = {
        primary: {
            solid: 'bg-primary text-primary-content',
            soft: 'bg-primary/10 text-primary',
            outline: 'bg-transparent text-primary border border-primary',
            ghost: 'bg-transparent text-primary hover:bg-primary/10'
        },
        secondary: {
            solid: 'bg-secondary text-secondary-content',
            soft: 'bg-secondary/10 text-secondary',
            outline: 'bg-transparent text-secondary border border-secondary',
            ghost: 'bg-transparent text-secondary hover:bg-secondary/10'
        },
        accent: {
            solid: 'bg-accent text-accent-content',
            soft: 'bg-accent/10 text-accent',
            outline: 'bg-transparent text-accent border border-accent',
            ghost: 'bg-transparent text-accent hover:bg-accent/10'
        },
        neutral: {
            solid: 'bg-neutral text-neutral-content',
            soft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
            outline: 'bg-transparent text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600',
            ghost: 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        },
        success: {
            solid: 'bg-green-500 text-white',
            soft: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            outline: 'bg-transparent text-green-600 dark:text-green-400 border border-green-500',
            ghost: 'bg-transparent text-green-600 dark:text-green-400 hover:bg-green-100'
        },
        warning: {
            solid: 'bg-yellow-500 text-white',
            soft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            outline: 'bg-transparent text-yellow-600 dark:text-yellow-400 border border-yellow-500',
            ghost: 'bg-transparent text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100'
        },
        error: {
            solid: 'bg-red-500 text-white',
            soft: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            outline: 'bg-transparent text-red-600 dark:text-red-400 border border-red-500',
            ghost: 'bg-transparent text-red-600 dark:text-red-400 hover:bg-red-100'
        },
        info: {
            solid: 'bg-blue-500 text-white',
            soft: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            outline: 'bg-transparent text-blue-600 dark:text-blue-400 border border-blue-500',
            ghost: 'bg-transparent text-blue-600 dark:text-blue-400 hover:bg-blue-100'
        },
        purple: {
            solid: 'bg-purple-500 text-white',
            soft: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            outline: 'bg-transparent text-purple-600 dark:text-purple-400 border border-purple-500',
            ghost: 'bg-transparent text-purple-600 dark:text-purple-400 hover:bg-purple-100'
        },
        pink: {
            solid: 'bg-pink-500 text-white',
            soft: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
            outline: 'bg-transparent text-pink-600 dark:text-pink-400 border border-pink-500',
            ghost: 'bg-transparent text-pink-600 dark:text-pink-400 hover:bg-pink-100'
        }
    };

    const sizes = {
        sm: 'h-5 px-2 text-[10px]',
        md: 'h-6 px-2.5 text-xs',
        lg: 'h-8 px-3 text-sm'
    };

    const styles = colorStyles[color][variant];
    const sizeStyles = sizes[size];

    return (
        <span
            className={clsx(
                baseStyles,
                cursorStyles,
                styles,
                sizeStyles,
                className
            )}
            onClick={onClick}
            {...props}
        >
            {leftIcon && <span className="mr-1.5 -ml-0.5">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-1.5 -mr-0.5">{rightIcon}</span>}
        </span>
    );
};
