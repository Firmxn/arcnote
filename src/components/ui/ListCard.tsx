import React from 'react';

interface ListCardProps {
    /** Icon yang ditampilkan di sebelah kiri */
    icon: React.ReactNode;
    /** Judul utama card (required jika textContent tidak ada) */
    title?: string;
    /** Subtitle atau deskripsi (opsional) */
    subtitle?: string;
    /** Custom content untuk area text (menggantikan title/subtitle jika ada) */
    textContent?: React.ReactNode;
    /** Custom content untuk area kanan (menggantikan button jika ada) */
    rightContent?: React.ReactNode;
    /** Text untuk button default */
    buttonText?: string;
    /** Handler ketika button diklik */
    onButtonClick?: () => void;
    /** Handler ketika card diklik (seluruh area) */
    onClick?: () => void;
    /** Variant warna icon background */
    iconVariant?: 'accent' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
    /** Bentuk container icon */
    iconShape?: 'square' | 'circle' | 'none';
    /** Custom className untuk card container */
    className?: string;
    /** Disabled state */
    disabled?: boolean;
}

/**
 * ListCard - Komponen card landscape untuk list items
 */
export const ListCard: React.FC<ListCardProps> = ({
    icon,
    title,
    subtitle,
    textContent,
    rightContent,
    buttonText,
    onButtonClick,
    onClick,
    iconVariant = 'accent',
    iconShape = 'square',
    className = '',
    disabled = false
}) => {
    // Icon background color mapping
    const iconBgColors = {
        accent: 'bg-accent/10 dark:bg-accent/20 text-accent',
        primary: 'bg-primary/10 dark:bg-primary/20 text-primary',
        secondary: 'bg-secondary/10 dark:bg-secondary/20 text-secondary',
        success: 'bg-success/10 dark:bg-success/20 text-success',
        warning: 'bg-warning/10 dark:bg-warning/20 text-warning',
        error: 'bg-danger/10 dark:bg-danger/20 text-danger'
    };

    // Shape styles
    const shapeStyles = {
        square: 'rounded-lg',
        circle: 'rounded-full',
        none: 'bg-transparent p-0'
    };

    const containerStyle = iconShape === 'none'
        ? 'text-text-neutral dark:text-text-primary'
        : `${iconBgColors[iconVariant]} ${shapeStyles[iconShape]}`;

    const handleCardClick = () => {
        if (!disabled && onClick) {
            onClick();
        }
    };

    const handleButtonClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card onClick from firing
        if (!disabled && onButtonClick) {
            onButtonClick();
        }
    };

    return (
        <div
            onClick={handleCardClick}
            className={`
                flex items-center justify-between p-4 
                bg-white dark:bg-secondary 
                rounded-xl 
                border border-secondary/10 dark:border-white/5 
                hover:border-secondary/20 dark:hover:border-white/10 
                transition-all duration-200 
                group
                ${onClick && !disabled ? 'cursor-pointer' : ''}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${className}
            `.trim()}
        >
            {/* Left: Icon + Text */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Icon */}
                <div className={`w-10 h-10 flex items-center justify-center shrink-0 ${containerStyle}`}>
                    {icon}
                </div>

                {/* Text Content */}
                <div className="flex-1 min-w-0">
                    {textContent ? (
                        // Custom text content
                        textContent
                    ) : (
                        // Default text content
                        <>
                            <h3 className="text-sm font-semibold text-text-neutral dark:text-text-primary truncate">
                                {title}
                            </h3>
                            {subtitle && (
                                <p className="text-xs text-text-neutral/60 dark:text-text-secondary/60 truncate">
                                    {subtitle}
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Right: Button or Custom Content */}
            {rightContent ? (
                // Custom right content
                <div className="shrink-0">
                    {rightContent}
                </div>
            ) : buttonText && onButtonClick ? (
                // Default button
                <button
                    onClick={handleButtonClick}
                    disabled={disabled}
                    className="px-4 py-1.5 text-xs font-medium text-accent hover:text-accent-hover border border-accent/20 hover:border-accent/40 rounded-full transition-all duration-200 hover:bg-accent/5 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {buttonText}
                </button>
            ) : null}
        </div>
    );
};
