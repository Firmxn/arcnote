import React, { forwardRef, type ReactNode } from 'react';
import { clsx } from 'clsx';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    variant?: 'default' | 'ghost';
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    fullWidth?: boolean;
    containerClassName?: string; // Untuk styling wrapper div jika diperlukan
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    className,
    containerClassName,
    variant = 'default',
    leftIcon,
    rightIcon,
    fullWidth = true,
    ...props
}, ref) => {
    // Base classes yang selalu diterapkan
    // !outline-none !ring-0 digunakan untuk memaksa bersih dari focus ring browser/global
    const baseInputClasses = "transition-all disabled:opacity-50 disabled:cursor-not-allowed !outline-none !ring-0";

    // Style per variant
    const variantClasses = {
        // Default: Box style dengan shadow tipis, tanpa border, background bersih
        default: "bg-white dark:bg-secondary/20 shadow-sm rounded-lg border-none placeholder-gray-500 text-text-neutral py-2.5",

        // Ghost: Transparent, muncul background tipis saat focus (cocok untuk inline edit)
        ghost: "bg-transparent border-none p-0 focus:bg-primary/5 rounded px-1 text-text-neutral",
    };

    // Padding untuk icon (terutama untuk variant default)
    const iconPaddingClasses = variant === 'default' ? clsx(
        leftIcon ? "pl-10" : "pl-3",
        rightIcon ? "pr-10" : "pr-3"
    ) : "";

    return (
        <div className={clsx("relative", fullWidth ? "w-full" : "inline-block", containerClassName)}>
            {/* Left Icon */}
            {leftIcon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-neutral/50 z-10">
                    {leftIcon}
                </div>
            )}

            <input
                ref={ref}
                className={clsx(
                    baseInputClasses,
                    variantClasses[variant],
                    iconPaddingClasses,
                    "w-full", // Input mengisi wrapper
                    className
                )}
                {...props}
            />

            {/* Right Icon */}
            {rightIcon && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-text-neutral/50 z-10">
                    {rightIcon}
                </div>
            )}
        </div>
    );
});

Input.displayName = 'Input';
