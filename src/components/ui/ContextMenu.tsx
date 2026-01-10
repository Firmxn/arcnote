import React, { useEffect, useRef } from 'react';

interface ContextMenuItem {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: 'default' | 'danger';
}

interface ContextMenuProps {
    x: number;
    y: number;
    items: ContextMenuItem[];
    onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onClose();
            }
        };
        // Use mousedown to capture click before it triggers other events
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div
            ref={ref}
            className="fixed z-50 min-w-[180px] bg-white dark:bg-[#1C1C1E] border border-black/5 dark:border-white/10 rounded-lg shadow-2xl py-1 overflow-hidden"
            style={{ top: y, left: x }}
        >
            {items.map((item, index) => (
                <button
                    key={index}
                    onClick={() => {
                        item.onClick();
                        onClose();
                    }}
                    className={`
                        w-full text-left px-3 py-2.5 text-sm flex items-center gap-2.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors
                        ${item.variant === 'danger' ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}
                    `}
                >
                    {item.icon}
                    <span>{item.label}</span>
                </button>
            ))}
        </div>
    );
};
