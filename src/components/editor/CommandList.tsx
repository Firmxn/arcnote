import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

export interface CommandItemProps {
    title: string;
    icon?: React.ReactNode;
    command?: (props: any) => void;
    submenu?: CommandItemProps[]; // Support nested menu
}

interface CommandListProps {
    items: CommandItemProps[];
    command: (item: CommandItemProps) => void;
}

export const CommandList = forwardRef((props: CommandListProps, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [activeSubmenu, setActiveSubmenu] = useState<CommandItemProps[] | null>(null);
    const [parentTitle, setParentTitle] = useState<string | null>(null);

    // List yang sedang aktif (Main atau Submenu)
    const currentItems = activeSubmenu || props.items;

    useEffect(() => {
        setSelectedIndex(0);
        // Reset submenu jika items utama berubah drastis (misal user mengetik query baru)
        // Kecuali jika items kosong (sedang transisi)
        if (!activeSubmenu && props.items.length > 0) {
            // Keep default behavior
        }
    }, [props.items]);

    const selectItem = (index: number) => {
        const item = currentItems[index];
        if (item) {
            if (item.submenu) {
                // Masuk ke submenu
                setActiveSubmenu(item.submenu);
                setParentTitle(item.title);
                setSelectedIndex(0);
            } else if (item.command) {
                // Eksekusi command
                props.command(item);
            }
        }
    };

    const backToParent = () => {
        if (activeSubmenu) {
            setActiveSubmenu(null);
            setParentTitle(null);
            setSelectedIndex(0);
            return true;
        }
        return false;
    };

    const upHandler = () => {
        setSelectedIndex((selectedIndex + currentItems.length - 1) % currentItems.length);
    };

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % currentItems.length);
    };

    const enterHandler = () => {
        selectItem(selectedIndex);
    };

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                upHandler();
                return true;
            }

            if (event.key === 'ArrowDown') {
                downHandler();
                return true;
            }

            if (event.key === 'Enter') {
                enterHandler();
                return true;
            }

            if (event.key === 'ArrowRight') {
                // Jika item punya submenu, masuk
                const item = currentItems[selectedIndex];
                if (item?.submenu) {
                    enterHandler();
                    return true;
                }
            }

            if (event.key === 'ArrowLeft' || event.key === 'Backspace') {
                // Jika query kosong (menghapus slash) biasanya ditangani editor
                // Tapi jika di submenu, back ke parent
                if (activeSubmenu) {
                    return backToParent();
                }
            }

            return false;
        },
    }));

    return (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden py-1 min-w-[240px]">
            {/* Header jika di submenu */}
            {/* Header Back Button jika di submenu */}
            {activeSubmenu && parentTitle && (
                <button
                    onClick={backToParent}
                    className="w-full text-left px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800 mb-1 flex items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                    <span className="mr-1.5 text-gray-400">←</span>
                    <span className="opacity-75">Back to </span>
                    <span className="ml-1 text-gray-900 dark:text-gray-200">{parentTitle}</span>
                </button>
            )}

            {currentItems.length ? (
                currentItems.map((item, index) => (
                    <button
                        key={index}
                        className={`flex items-center w-full px-3 py-1.5 text-sm text-left transition-colors
              ${index === selectedIndex
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }
            `}
                        onClick={() => selectItem(index)}
                    >
                        {item.icon && (
                            <span className="mr-2.5 w-5 h-5 flex items-center justify-center flex-shrink-0 text-gray-500 rounded-sm">
                                {item.icon}
                            </span>
                        )}
                        <span className="truncate flex-1">{item.title}</span>

                        {/* Arrow indicator untuk submenu */}
                        {item.submenu && (
                            <span className="ml-2 text-gray-400 text-xs">▶</span>
                        )}
                    </button>
                ))
            ) : (
                <div className="px-3 py-2 text-sm text-gray-400">No result</div>
            )}
        </div>
    );
});

CommandList.displayName = 'CommandList';
