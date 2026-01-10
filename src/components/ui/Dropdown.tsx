import React, { useState, useEffect, useRef } from 'react';

interface DropdownOption {
    value: string;
    label: string;
}

interface DropdownProps {
    options: DropdownOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    className?: string;
    disabled?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export const Dropdown: React.FC<DropdownProps> = ({
    options,
    value,
    onChange,
    placeholder = 'Select an option',
    label,
    className = '',
    disabled = false,
    open,
    onOpenChange,
}) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalIsOpen;

    const handleOpenChange = (newOpen: boolean) => {
        if (!isControlled) {
            setInternalIsOpen(newOpen);
        }
        onOpenChange?.(newOpen);
    };

    const [position, setPosition] = useState<'top' | 'bottom'>('bottom');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Get selected option label
    const selectedOption = options.find(opt => opt.value === value);
    const displayText = selectedOption?.label || placeholder;

    // Auto-position detection (sama seperti DatePicker)
    useEffect(() => {
        if (!isOpen) return;

        const detectPosition = () => {
            if (buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const spaceBelow = viewportHeight - rect.bottom;
                const spaceAbove = rect.top;
                const dropdownHeight = Math.min(options.length * 48 + 16, 320); // Max 320px

                if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
                    setPosition('top');
                } else {
                    setPosition('bottom');
                }
            }
        };

        detectPosition();
        window.addEventListener('scroll', detectPosition, true);
        window.addEventListener('resize', detectPosition);

        return () => {
            window.removeEventListener('scroll', detectPosition, true);
            window.removeEventListener('resize', detectPosition);
        };
    }, [isOpen, options.length]);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                handleOpenChange(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        handleOpenChange(false);
    };

    return (
        <div
            className={`relative transition-all duration-200 ease-in-out ${className}`}
            ref={dropdownRef}
        >
            {/* Label */}
            {label && (
                <label className="block text-sm font-medium text-text-neutral dark:text-text-primary mb-2">
                    {label}
                </label>
            )}

            {/* Trigger Button */}
            <button
                ref={buttonRef}
                type="button"
                onClick={() => !disabled && handleOpenChange(!isOpen)}
                disabled={disabled}
                className={`
                    w-full px-3 py-2.5 rounded-lg text-left flex items-center justify-between
                    transition-all
                    bg-white dark:bg-secondary/20 shadow-sm
                    placeholder-gray-500 text-text-neutral
                    outline-none! ring-0!
                    ${disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : ''
                    }
                    ${isOpen ? 'ring-2 ring-accent' : ''}
                `}
            >
                <span className={`${!selectedOption ? 'text-gray-500' : 'text-text-neutral dark:text-text-primary'}`}>
                    {displayText}
                </span>
                <svg
                    className={`w-5 h-5 text-text-neutral/50 dark:text-text-secondary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div
                    className={`
                        absolute left-0 right-0 z-50 
                        bg-white dark:bg-secondary 
                        border border-gray-200 dark:border-primary/20 
                        rounded-lg shadow-xl 
                        max-h-80 overflow-y-auto
                        animate-in fade-in zoom-in-95 duration-200
                        ${position === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'}
                    `}
                >
                    {/* Options List */}
                    <div>
                        {options.map((option) => {
                            const isSelected = option.value === value;
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => handleSelect(option.value)}
                                    className={`
                                        w-full px-4 py-2.5 text-left flex items-center justify-between
                                        transition-colors duration-150
                                        ${isSelected
                                            ? 'bg-accent/10 dark:bg-accent/20 text-accent font-medium'
                                            : 'text-text-neutral dark:text-text-primary hover:bg-gray-100 dark:hover:bg-primary/20'
                                        }
                                    `}
                                >
                                    <span>{option.label}</span>
                                    {isSelected && (
                                        <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Empty State */}
                    {options.length === 0 && (
                        <div className="px-4 py-8 text-center text-text-neutral/50 dark:text-text-secondary/50 text-sm">
                            No options available
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
