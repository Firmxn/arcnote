import React, { useState } from 'react';
import { usePagesStore } from '../../state/pages.store';
import { Card } from '../ui/Card';
import { ActionGroup, ActionButton } from '../ui/ActionGroup';
import { ConfirmDialog } from '../ui/ConfirmDialog';

import type { Page } from '../../types/page';
import dayjs from 'dayjs';
import { SearchBar } from '../ui/SearchBar';
import type { SearchResult } from '../ui/SearchBar';
import { SectionHeader } from '../ui/SectionHeader';

interface PagesListPageProps {
    onPageSelect?: (pageId: string) => void;
}

export const PagesListPage: React.FC<PagesListPageProps> = ({ onPageSelect }) => {
    const { pages, setCurrentPage, deletePage, archivePage } = usePagesStore();
    const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());

    const [pageToDelete, setPageToDelete] = useState<Page | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Filter root pages (pages without parentId)
    const rootPages = pages.filter(p => !p.parentId && !p.isArchived);

    // Helper function to get sub pages
    const getSubPages = (parentId: string): Page[] => {
        return pages.filter(p => p.parentId === parentId);
    };

    // Filter pages based on search query (search in ALL pages, including subpages)
    const filteredPages = searchQuery.trim()
        ? pages.filter(page =>
            page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (page.description?.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        : rootPages; // When no search, show only root pages

    // For display in the list (only show root pages)
    const filteredRootPages = searchQuery.trim()
        ? rootPages.filter(page =>
            page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (page.description?.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        : rootPages;

    // Convert ALL filtered pages to SearchResult format (including subpages for search modal)
    const searchResults: SearchResult[] = filteredPages.map(page => {
        const subPages = getSubPages(page.id);
        const hasSubPages = subPages.length > 0;
        const parentPage = page.parentId ? pages.find(p => p.id === page.parentId) : null;

        return {
            id: page.id,
            title: page.title,
            description: page.description || 'No description',
            category: page.parentId
                ? `Subpage of ${parentPage?.title || 'Unknown'}`
                : (hasSubPages ? 'Folders' : 'Pages'),
            icon: hasSubPages ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
            ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            metadata: hasSubPages ? `${subPages.length} subpage${subPages.length !== 1 ? 's' : ''}` : dayjs(page.updatedAt).fromNow()
        };
    });

    const handleSelectResult = (result: SearchResult) => {
        const page = pages.find(p => p.id === result.id);
        if (page) {
            handlePageClick(page);
        }
    };

    const handlePageClick = (page: Page) => {
        // Always open page/folder, never toggle expand
        setCurrentPage(page);
        if (onPageSelect) {
            onPageSelect(page.id);
        }
    };

    const handleToggleExpand = (pageId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        setExpandedPages(prev => {
            const newSet = new Set(prev);
            if (newSet.has(pageId)) {
                newSet.delete(pageId);
            } else {
                newSet.add(pageId);
            }
            return newSet;
        });
    };

    const renderPageCard = (page: Page, level: number = 0) => {
        const subPages = getSubPages(page.id);
        const hasSubPages = subPages.length > 0;
        const isExpanded = expandedPages.has(page.id);

        // Icon component
        const PageIcon = () => {
            if (hasSubPages) {
                return isExpanded ? (
                    // Folder Open
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                    </svg>
                ) : (
                    // Folder Closed
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                );
            }
            // Document
            return (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            );
        };

        return (
            <div key={page.id}>
                <div className="relative group">
                    <Card
                        icon={<PageIcon />}
                        title={
                            <div className="flex items-center justify-between w-full">
                                <span>{page.title}</span>
                                {hasSubPages && (
                                    <button
                                        onClick={(e) => handleToggleExpand(page.id, e)}
                                        className="p-1 hover:bg-secondary/10 dark:hover:bg-white/5 rounded transition-colors"
                                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                    >
                                        <svg
                                            className={`w-4 h-4 transition-transform text-text-neutral/50 dark:text-text-secondary ${isExpanded ? 'rotate-90' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        }
                        badge={hasSubPages ? `${subPages.length} ${subPages.length === 1 ? 'subpage' : 'subpages'}` : undefined}
                        description={page.description || 'No description'}
                        type="page"
                        onClick={() => handlePageClick(page)}

                        updatedAt={dayjs(page.updatedAt || page.createdAt).format('MMM D, YYYY')}
                        createdAt={dayjs(page.createdAt).format('MMM D, YYYY')}
                    />

                    {/* Action Overlay */}
                    <div className="absolute top-3 right-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                        <ActionGroup>
                            <ActionButton
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>}
                                variant="primary"
                                onClick={(e) => { e.stopPropagation(); archivePage(page.id); }}
                                title="Archive"
                            />
                            <ActionButton
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                                variant="danger"
                                onClick={(e) => { e.stopPropagation(); setPageToDelete(page); }}
                                title="Delete"
                            />
                        </ActionGroup>
                    </div>
                </div>

                {/* Render subpages if expanded */}
                {hasSubPages && isExpanded && (
                    <div className="mt-3 pl-6 space-y-3">
                        {subPages.map(subPage => renderPageCard(subPage, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="h-full w-full bg-neutral dark:bg-primary flex flex-col min-h-0">
            <div className="flex-1 flex flex-col min-h-0">
                {/* Header */}
                <div className="max-w-7xl w-full mx-auto px-4 md:px-8 pt-6 md:pt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8 shrink-0">
                    <div className="flex-1">
                        <h1 className="text-2xl md:text-3xl font-bold text-text-neutral dark:text-text-primary mb-2">
                            All Pages
                        </h1>
                        <p className="text-sm md:text-base text-text-neutral/60 dark:text-text-secondary">
                            Manage and organize your pages
                        </p>
                    </div>

                    {/* Search Bar */}
                    <SearchBar
                        onSearch={setSearchQuery}
                        onSelectResult={handleSelectResult}
                        results={searchResults}
                        placeholder="Search pages..."
                        className="shrink-0"
                    />
                </div>

                {/* Pages List */}
                <div className="flex-1 overflow-y-auto min-h-0 pb-[100px] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                    {filteredRootPages.length === 0 ? (
                        <div className="max-w-7xl w-full mx-auto px-4 flex flex-col items-center justify-center text-center py-20">
                            <div className="text-6xl mb-4">{searchQuery.trim() ? '🔍' : '📝'}</div>
                            <h3 className="text-xl font-semibold text-text-neutral dark:text-text-primary mb-2">
                                {searchQuery.trim() ? 'No pages found' : 'No pages yet'}
                            </h3>
                            <p className="text-text-neutral/60 dark:text-text-secondary">
                                {searchQuery.trim()
                                    ? `No results for "${searchQuery}". Clear search to see all pages.`
                                    : 'Create your first page to get started'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="max-w-7xl w-full mx-auto px-4 md:px-8 pb-10 space-y-8">
                            {/* Directories Section */}
                            {filteredRootPages.filter(page => getSubPages(page.id).length > 0).length > 0 && (
                                <div>
                                    <SectionHeader
                                        title="Directories"
                                        icon={
                                            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                            </svg>
                                        }
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {filteredRootPages
                                            .filter(page => getSubPages(page.id).length > 0)
                                            .map(page => renderPageCard(page))
                                        }
                                    </div>
                                </div>
                            )}

                            {/* Pages Section */}
                            {filteredRootPages.filter(page => getSubPages(page.id).length === 0).length > 0 && (
                                <div>
                                    <SectionHeader
                                        title="Documents"
                                        icon={
                                            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        }
                                    />
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        {filteredRootPages
                                            .filter(page => getSubPages(page.id).length === 0)
                                            .map(page => renderPageCard(page))
                                        }
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmDialog
                isOpen={!!pageToDelete}
                title="Delete Page"
                message={`Are you sure you want to delete "${pageToDelete?.title}"? This action cannot be undone.`}
                confirmText="Delete"
                danger
                onConfirm={async () => {
                    if (pageToDelete) {
                        await deletePage(pageToDelete.id);
                        setPageToDelete(null);
                    }
                }}
                onCancel={() => setPageToDelete(null)}
            />


        </div>
    );
};
