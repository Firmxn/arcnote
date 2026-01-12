import React, { useState } from 'react';
import { usePagesStore } from '../../state/pages.store';
import { Card } from '../ui/Card';
import { ActionGroup, ActionButton } from '../ui/ActionGroup';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ContextMenu } from '../ui/ContextMenu';
import type { Page } from '../../types/page';
import dayjs from 'dayjs';

interface PagesListPageProps {
    onPageSelect?: (pageId: string) => void;
}

export const PagesListPage: React.FC<PagesListPageProps> = ({ onPageSelect }) => {
    const { pages, setCurrentPage, syncToCloud, syncToLocal, deletePage } = usePagesStore();
    const isBackendMode = localStorage.getItem('arcnote_storage_preference') === 'backend';
    const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; pageId: string } | null>(null);
    const [pageToDelete, setPageToDelete] = useState<Page | null>(null);

    // Filter root pages (pages without parentId)
    const rootPages = pages.filter(p => !p.parentId);

    const handlePageClick = (page: Page, hasSubPages: boolean) => {
        if (hasSubPages) {
            // Toggle expand/collapse
            setExpandedPages(prev => {
                const newSet = new Set(prev);
                if (newSet.has(page.id)) {
                    newSet.delete(page.id);
                } else {
                    newSet.add(page.id);
                }
                return newSet;
            });
        } else {
            // Open page in editor
            setCurrentPage(page);
            if (onPageSelect) {
                onPageSelect(page.id);
            }
        }
    };

    const getSubPages = (parentId: string): Page[] => {
        return pages.filter(p => p.parentId === parentId);
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
                                    <svg
                                        className={`w-4 h-4 transition-transform text-text-neutral/50 dark:text-text-secondary ${isExpanded ? 'rotate-90' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                )}
                            </div>
                        }
                        badge={hasSubPages ? `${subPages.length} ${subPages.length === 1 ? 'subpage' : 'subpages'}` : undefined}
                        description={page.description || 'No description'}
                        type="page"
                        onClick={() => handlePageClick(page, hasSubPages)}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({ x: e.pageX, y: e.pageY, pageId: page.id });
                        }}
                        updatedAt={dayjs(page.updatedAt || page.createdAt).format('MMM D, YYYY')}
                        createdAt={dayjs(page.createdAt).format('MMM D, YYYY')}
                    />

                    {/* Action Overlay */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <ActionGroup>
                            <ActionButton
                                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>}
                                variant="primary"
                                onClick={(e) => { e.stopPropagation(); /* Archive Feature */ }}
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
                <div className="max-w-7xl w-full mx-auto px-4 md:px-8 pt-6 md:pt-12 mb-6 md:mb-8 shrink-0">
                    <h1 className="text-2xl md:text-3xl font-bold text-text-neutral dark:text-text-primary mb-2">
                        All Pages
                    </h1>
                    <p className="text-sm md:text-base text-text-neutral/60 dark:text-text-secondary">
                        Manage and organize your pages
                    </p>
                </div>

                {/* Pages List */}
                <div className="flex-1 overflow-y-auto min-h-0 pb-[100px]">
                    {rootPages.length === 0 ? (
                        <div className="max-w-7xl w-full mx-auto px-4 flex flex-col items-center justify-center text-center py-20">
                            <div className="text-6xl mb-4">📝</div>
                            <h3 className="text-xl font-semibold text-text-neutral dark:text-text-primary mb-2">
                                No pages yet
                            </h3>
                            <p className="text-text-neutral/60 dark:text-text-secondary">
                                Create your first page to get started
                            </p>
                        </div>
                    ) : (
                        <div className="max-w-7xl w-full mx-auto px-4 md:px-8">
                            <h2 className="text-sm font-bold text-text-neutral dark:text-text-secondary uppercase tracking-wider mb-4 opacity-80">
                                Your Pages
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {rootPages.map(page => renderPageCard(page))}
                            </div>
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

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    items={[
                        {
                            label: isBackendMode ? 'Save to Local' : 'Sync to Cloud',
                            onClick: async () => {
                                const action = isBackendMode ? 'Save to Local' : 'Upload to Cloud';
                                const msg = isBackendMode
                                    ? 'Save this page to Local Storage? This will overwrite the local copy with the current cloud version.'
                                    : 'Upload this page to Cloud Storage? Current content will overwrite cloud version.';

                                if (window.confirm(msg)) {
                                    try {
                                        if (isBackendMode) {
                                            await syncToLocal(contextMenu.pageId);
                                        } else {
                                            await syncToCloud(contextMenu.pageId);
                                        }
                                        alert(`${action} successful!`);
                                    } catch (e: any) {
                                        alert(`${action} failed: ` + e.message);
                                    }
                                }
                            },
                            icon: (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isBackendMode
                                        ? "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" // Download icon
                                        : "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" // Cloud Upload icon
                                    } />
                                </svg>
                            )
                        }
                    ]}
                />
            )}
        </div>
    );
};
