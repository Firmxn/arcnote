import React, { useState } from 'react';
import { usePagesStore } from '../../state/pages.store';
import { useTheme } from '../../hooks/useTheme';
import { SidebarItem } from './SidebarItem';

interface SidebarProps {
    onPageSelect?: (pageId: string) => void;
    onSettingsClick?: () => void;
    onScheduleClick?: () => void;
    onHomeClick?: () => void;
    onPagesClick?: () => void;
    currentView?: 'home' | 'page' | 'pages' | 'settings' | 'schedule';
}

export const Sidebar: React.FC<SidebarProps> = ({ onPageSelect, onSettingsClick, onScheduleClick, onHomeClick, onPagesClick, currentView }) => {
    const { pages, createPage, currentPage, setCurrentPage } = usePagesStore();
    const [isCreating, setIsCreating] = useState(false);
    const [newPageTitle, setNewPageTitle] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { theme, toggleTheme } = useTheme();

    // Filter root pages (pages without parentId)
    const rootPages = pages.filter(p => !p.parentId);

    const handleCreatePage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPageTitle.trim()) return;

        try {
            const page = await createPage(newPageTitle);
            setCurrentPage(page);
            setNewPageTitle('');
            setIsCreating(false);
            if (onPageSelect) {
                onPageSelect(page.id);
            }
        } catch (error) {
            console.error('Failed to create page:', error);
        }
    };

    const handleCreateSubPage = async (parentId: string) => {
        try {
            const page = await createPage('Untitled', parentId);
            setCurrentPage(page);
            if (onPageSelect) {
                onPageSelect(page.id);
            }
        } catch (error) {
            console.error('Failed to create subpage:', error);
        }
    };

    return (
        <aside
            className={`
                h-screen bg-primary dark:bg-secondary border-r border-secondary flex flex-col transition-all duration-300
                ${isCollapsed ? 'w-16' : 'w-56'}
            `}
        >
            {/* Header with Toggle */}
            <div className={`
                border-b border-secondary/50 flex items-center transition-all
                ${isCollapsed ? 'justify-center py-4 px-3' : 'justify-between px-4 py-4'}
            `}>
                {!isCollapsed && (
                    <h2 className="text-sm font-bold text-text-primary dark:text-text-secondary tracking-tight">
                        ArcNote
                    </h2>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`
                        rounded hover:bg-white/10 dark:hover:bg-primary/20 text-text-primary dark:text-text-secondary transition-colors
                        ${isCollapsed ? 'w-10 h-10 flex items-center justify-center' : 'p-1'}
                    `}
                    title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <svg
                        className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto">
                {/* Apps Section */}
                <div className="px-3 py-3 space-y-1">
                    {/* Home Button */}
                    <button
                        onClick={onHomeClick}
                        className={`
                            flex items-center gap-2 transition-all font-medium
                            ${isCollapsed
                                ? 'w-10 h-10 rounded justify-center'
                                : 'w-full px-3 py-1.5 text-left text-sm rounded'
                            }
                            ${currentView === 'home'
                                ? 'bg-white/10 dark:bg-primary text-text-primary dark:text-text-secondary shadow-md'
                                : 'text-text-primary dark:text-text-secondary hover:bg-white/5 dark:hover:bg-primary/50 opacity-90 hover:opacity-100'
                            }
                        `}
                        title={isCollapsed ? 'Home' : ''}
                    >
                        <svg className="w-4 h-4 opacity-70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        {!isCollapsed && <span>Home</span>}
                    </button>

                    {/* Schedule Button */}
                    <button
                        onClick={onScheduleClick}
                        className={`
                            flex items-center gap-2 transition-all font-medium
                            ${isCollapsed
                                ? 'w-10 h-10 rounded justify-center'
                                : 'w-full px-3 py-1.5 text-left text-sm rounded'
                            }
                            ${currentView === 'schedule'
                                ? 'bg-white/10 dark:bg-primary text-text-primary dark:text-text-secondary shadow-md'
                                : 'text-text-primary dark:text-text-secondary hover:bg-white/5 dark:hover:bg-primary/50 opacity-90 hover:opacity-100'
                            }
                        `}
                        title={isCollapsed ? 'Schedule' : ''}
                    >
                        <svg className="w-4 h-4 opacity-70 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {!isCollapsed && <span>Schedule</span>}
                    </button>
                </div>

                {/* Pages Section */}
                {!isCollapsed && (
                    <div className="pt-3 border-t border-secondary/50">
                        <div className="px-4 flex items-center justify-between mb-2">
                            <button
                                onClick={onPagesClick}
                                className="text-xs font-bold text-text-primary dark:text-text-secondary uppercase tracking-wider opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                                title="View all pages"
                            >
                                Pages
                            </button>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="text-text-primary dark:text-text-secondary hover:text-white dark:hover:text-white transition-opacity opacity-80 hover:opacity-100"
                                title="New page"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            </button>
                        </div>

                        {/* New Page Form (Root) */}
                        {isCreating && (
                            <div className="px-4 mb-2">
                                <form onSubmit={handleCreatePage}>
                                    <input
                                        type="text"
                                        value={newPageTitle}
                                        onChange={(e) => setNewPageTitle(e.target.value)}
                                        onBlur={() => {
                                            if (!newPageTitle.trim()) {
                                                setIsCreating(false);
                                            }
                                        }}
                                        placeholder="Page name"
                                        autoFocus
                                        className="w-full px-3 py-1.5 text-sm bg-primary dark:bg-secondary border border-secondary rounded focus:outline-none focus:border-white text-text-primary dark:text-text-secondary placeholder-white/50"
                                    />
                                </form>
                            </div>
                        )}

                        {/* Pages List */}
                        {pages.length === 0 && !isCreating && (
                            <div className="px-4 py-6 text-xs text-text-primary dark:text-text-secondary text-center opacity-60">
                                No pages
                            </div>
                        )}

                        <div className="flex flex-col">
                            {rootPages.map((page) => (
                                <SidebarItem
                                    key={page.id}
                                    page={page}
                                    allPages={pages}
                                    currentPageId={currentView === 'page' ? currentPage?.id : undefined}
                                    onSelect={(p) => {
                                        setCurrentPage(p);
                                        if (onPageSelect) onPageSelect(p.id);
                                    }}
                                    onCreateSubPage={handleCreateSubPage}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Collapsed Pages - Show only 2 buttons */}
                {isCollapsed && (
                    <div className="py-3 flex flex-col items-center gap-1 border-t border-secondary/50">
                        {/* Pages Button */}
                        <button
                            onClick={onPagesClick}
                            className={`
                                w-10 h-10 rounded flex items-center justify-center transition-all
                                ${currentView === 'pages'
                                    ? 'bg-white/10 dark:bg-primary text-text-primary dark:text-text-secondary shadow-md'
                                    : 'text-text-primary dark:text-text-secondary hover:bg-white/5 dark:hover:bg-primary/50 opacity-80 hover:opacity-100'
                                }
                            `}
                            title="All Pages"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </button>

                        {/* New Page Button */}
                        <button
                            onClick={() => {
                                setIsCreating(true);
                                setIsCollapsed(false); // Expand to show input
                            }}
                            className="w-10 h-10 rounded flex items-center justify-center transition-all text-text-primary dark:text-text-secondary hover:bg-white/5 dark:hover:bg-primary/50 opacity-80 hover:opacity-100"
                            title="New page"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            <div className={`border-t border-secondary/50 flex items-center bg-primary dark:bg-secondary/10 transition-all ${isCollapsed ? 'justify-center py-3 px-3' : 'justify-between px-4 py-3'}`}>
                {!isCollapsed && (
                    <div className="text-xs text-text-primary dark:text-text-secondary font-medium opacity-80">
                        {pages.length} {pages.length === 1 ? 'page' : 'pages'}
                    </div>
                )}

                <div className={`flex items-center gap-1 ${isCollapsed ? 'flex-col' : ''}`}>
                    <button
                        onClick={onSettingsClick}
                        className={`
                            rounded-md transition-all flex items-center justify-center
                            ${isCollapsed ? 'w-10 h-10' : 'p-1.5'}
                            ${currentView === 'settings'
                                ? 'bg-white/10 dark:bg-primary text-text-primary dark:text-text-secondary shadow-md'
                                : 'text-text-primary dark:text-text-secondary hover:bg-white/5 dark:hover:bg-primary/50 opacity-80 hover:opacity-100'
                            }
                        `}
                        title="Settings"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>

                    <button
                        onClick={toggleTheme}
                        className={`
                            rounded-md transition-all flex items-center justify-center
                            ${isCollapsed ? 'w-10 h-10' : 'p-1.5'}
                            text-text-primary dark:text-text-secondary hover:bg-white/5 dark:hover:bg-primary/50 opacity-80 hover:opacity-100
                        `}
                        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    >
                        {theme === 'light' ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </aside>
    );
};
