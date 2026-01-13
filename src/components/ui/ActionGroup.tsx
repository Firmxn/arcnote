import React from 'react';
import { clsx } from 'clsx';

interface ActionGroupProps {
    children: React.ReactNode;
    className?: string;
}

export const ActionGroup: React.FC<ActionGroupProps> = ({ children, className }) => {
    return (
        <div className={clsx(
            "flex bg-white dark:bg-primary rounded-lg shadow-md border border-secondary/20  dark:border-secondary divide-x divide-secondary/20 dark:divide-secondary overflow-hidden",
            className
        )}>
            {children}
        </div>
    );
};

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    icon?: React.ReactNode;
    variant?: 'default' | 'danger' | 'primary';
}

export const ActionButton: React.FC<ActionButtonProps> = ({
    children,
    className,
    icon,
    variant = 'default',
    ...props
}) => {
    const variantClasses = {
        default: "text-text-neutral hover:text-text-primary",
        primary: "text-primary hover:text-primary-hover",
        danger: "text-red-500 hover:text-red-600"
    };

    return (
        <button
            className={clsx(
                "p-2 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors flex items-center justify-center",
                variantClasses[variant],
                className
            )}
            type="button"
            {...props}
        >
            {icon && <span className={clsx("w-4 h-4", children ? "mr-2" : "")}>{icon}</span>}
            {children}
        </button>
    );
};
