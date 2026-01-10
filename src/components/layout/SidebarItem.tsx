import React, { useState } from 'react';
import type { Page } from '../../types/page';

interface SidebarItemProps {
    page: Page;
    allPages: Page[];
    currentPageId?: string;
    level?: number;
    onSelect: (page: Page) => void;
    onCreateSubPage: (parentId: string) => void;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
    page,
    allPages,
    currentPageId,
    level = 0,
    onSelect,
    onCreateSubPage
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    // Find children
    const children = allPages.filter(p => p.parentId === page.id);
    const hasChildren = children.length > 0;

    // Indentasi visual (internal padding)
    // Base padding 0.5rem (8px/tailwind px-2) + level indentation
    const paddingLeft = `${level * 12 + 8}px`;

    // Helper check if active page is inside this tree
    const isActiveDescendant = (parentId: string, targetId: string, pages: Page[]): boolean => {
        const children = pages.filter(p => p.parentId === parentId);
        if (children.some(c => c.id === targetId)) return true;
        return children.some(c => isActiveDescendant(c.id, targetId, pages));
    };

    // Active Logic: Active ID matches OR (Collapsed AND Child is Active)
    const isChildActive = currentPageId ? isActiveDescendant(page.id, currentPageId, allPages) : false;
    const isActive = currentPageId === page.id || (!isExpanded && isChildActive);

    const handleExpandToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const handleAddClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(true); // Auto expand when creating child
        onCreateSubPage(page.id);
    };

    return (
        <div className="select-none mb-0.5">
            <div
                className={`
                    group flex items-center py-1.5 pr-2 mx-3 rounded-md cursor-pointer transition-colors relative
                    ${isActive
                        ? 'bg-white/10 dark:bg-primary text-text-primary dark:text-text-secondary shadow-md font-medium'
                        : 'text-text-primary dark:text-text-secondary hover:bg-white/5 dark:hover:bg-primary/50 opacity-90 hover:opacity-100'}
                `}
                style={{ paddingLeft }}
                onClick={() => onSelect(page)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Expand Toggle Chevron */}
                <div
                    className={`
                        w-4 h-4 flex items-center justify-center mr-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors
                        ${hasChildren ? 'visible' : 'invisible'}
                    `}
                    onClick={handleExpandToggle}
                >
                    <svg
                        className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </div>

                {/* Page Icon (Optional, bisa diganti emoji nanti) */}
                <span className="mr-2 opacity-70">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </span>

                {/* Title */}
                <span className="flex-1 truncate text-sm font-medium" title={page.title || 'Untitled'}>
                    {(page.title || 'Untitled').length > 9
                        ? `${(page.title || 'Untitled').slice(0, 9)}...`
                        : (page.title || 'Untitled')}
                </span>

                {/* Add Subpage Button (Visible on Hover) */}
                {(isHovered || isActive) && (
                    <button
                        onClick={handleAddClick}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-all"
                        title="Add subpage"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Render Children Recursively */}
            {isExpanded && hasChildren && (
                <div className="flex flex-col">
                    {children.map(child => (
                        <SidebarItem
                            key={child.id}
                            page={child}
                            allPages={allPages}
                            currentPageId={currentPageId}
                            level={level + 1}
                            onSelect={onSelect}
                            onCreateSubPage={onCreateSubPage}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
