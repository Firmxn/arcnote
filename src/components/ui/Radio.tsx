import React from 'react';

interface RadioProps {
    name: string;
    value: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    label?: string;
    disabled?: boolean;
    className?: string;
}

export const Radio: React.FC<RadioProps> = ({
    name,
    value,
    checked,
    onChange,
    label,
    disabled = false,
    className = ''
}) => {
    return (
        <label className={`inline-flex items-center gap-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
            <input
                type="radio"
                name={name}
                value={value}
                checked={checked}
                onChange={onChange}
                disabled={disabled}
                className="w-4 h-4 text-accent bg-white dark:bg-secondary border-neutral/30 dark:border-white/20 focus:ring-2 focus:ring-accent focus:ring-offset-0 disabled:cursor-not-allowed"
            />
            {label && (
                <span className="text-sm text-text-neutral dark:text-text-primary select-none">
                    {label}
                </span>
            )}
        </label>
    );
};
