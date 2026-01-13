import React, { useEffect } from 'react';
import { Modal } from './Modal';

export interface ActionSheetItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    variant?: 'default' | 'primary' | 'danger';
    onClick: () => void;
}

interface ActionSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    items: ActionSheetItem[];
}

/**
 * ActionSheet Component
 * Menampilkan action menu sebagai modal di mobile atau context menu di desktop
 * Digunakan untuk long press (mobile) atau right click (desktop)
 */
export const ActionSheet: React.FC<ActionSheetProps> = ({
    isOpen,
    onClose,
    title,
    items
}) => {
    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const handleItemClick = (item: ActionSheetItem) => {
        item.onClick();
        onClose();
    };

    const getVariantClasses = (variant?: string) => {
        switch (variant) {
            case 'primary':
                return 'text-accent hover:bg-accent/10';
            case 'danger':
                return 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20';
            default:
                return 'text-text-neutral dark:text-text-primary hover:bg-secondary/10 dark:hover:bg-white/5';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            noPadding
        >
            <div className="py-2">
                {items.map((item, index) => (
                    <React.Fragment key={item.id}>
                        <button
                            onClick={() => handleItemClick(item)}
                            className={`w-full px-4 py-3 flex items-center gap-3 transition-colors ${getVariantClasses(item.variant)}`}
                        >
                            {item.icon && (
                                <span className="shrink-0">
                                    {item.icon}
                                </span>
                            )}
                            <span className="text-sm font-medium">
                                {item.label}
                            </span>
                        </button>
                        {index < items.length - 1 && (
                            <div className="border-t border-secondary/10 dark:border-white/5 mx-4" />
                        )}
                    </React.Fragment>
                ))}
            </div>
        </Modal>
    );
};
