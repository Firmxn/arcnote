import React, { forwardRef } from 'react';

interface CleanInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    // No additional props needed, extends all standard input props
}

/**
 * CleanInput - Input field without any focus ring, border, or outline
 * Perfect for search bars and embedded inputs where visual feedback is handled by parent container
 */
export const CleanInput = forwardRef<HTMLInputElement, CleanInputProps>(
    ({ className = '', ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={`flex-1 bg-transparent outline-none focus:outline-none focus:ring-0 focus:ring-offset-0 border-0 focus:border-0 shadow-none focus:shadow-none text-text-neutral dark:text-text-primary placeholder:text-text-neutral/40 dark:placeholder:text-text-secondary/40 ${className}`}
                style={{ outline: 'none', boxShadow: 'none', border: 'none' }}
                {...props}
            />
        );
    }
);

CleanInput.displayName = 'CleanInput';
