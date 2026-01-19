import React, { useEffect, useState, useRef } from 'react';
import { usePagesStore } from '../../state/pages.store';
import { useSchedulesStore } from '../../state/schedules.store';
import { useFinanceStore } from '../../state/finance.store';
import { Button } from '../ui/Button';
import { SchedulePickerModal } from '../modals/SchedulePickerModal';
import { QuickActions } from '../ui/QuickActions';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import type { Page } from '../../types/page';
import type { ScheduleEvent } from '../../types/schedule';
import type { FinanceAccount } from '../../types/finance';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { SearchBar } from '../ui/SearchBar';
import type { SearchResult } from '../ui/SearchBar';
import { ActionSheet, type ActionSheetItem } from '../ui/ActionSheet';
import { RecentItemCard } from '../ui/RecentItemCard';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { SectionHeader } from '../ui/SectionHeader';

dayjs.extend(relativeTime);

interface RecentItem {
    id: string;
    type: 'page' | 'schedule' | 'finance';
    title: string;
    date: Date;
    icon: React.ReactNode;
    data: Page | ScheduleEvent | FinanceAccount;
}

interface HomePageProps {
    onPageSelect?: (pageId: string) => void;
    onScheduleClick?: () => void;  // Navigate to schedule page
    onEventSelect?: (eventId: string) => void;  // Open specific event
    onFinanceClick?: (accountId: string) => void; // Open specific finance account
    onFinanceListClick?: () => void; // Navigate to finance list
    onNewPageClick?: () => void; // Create new page
    onViewArchive?: () => void; // Navigate to archive page
}

const WalletIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
);

export const HomePage: React.FC<HomePageProps> = ({
    onPageSelect,
    onScheduleClick,
    onEventSelect,
    onFinanceClick,
    onFinanceListClick,
    onNewPageClick,
    onViewArchive
}) => {
    const { pages, deletePage, archivePage } = usePagesStore();
    const { events, markEventAsVisited, deleteEvent, archiveEvent } = useSchedulesStore();
    const {
        accounts,
        loadAccounts,
        createAccount,
        deleteAccount,
        updateAccount,
        archiveAccount,
        balances,
        loadBalances,
        markAccountAsVisited
    } = useFinanceStore();

    const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
    const [itemToDelete, setItemToDelete] = useState<RecentItem | null>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionSheetItem, setActionSheetItem] = useState<RecentItem | null>(null);

    // Edit State
    const [itemToEdit, setItemToEdit] = useState<RecentItem | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');

    // Create Finance Modal State
    const [isCreateFinanceModalOpen, setIsCreateFinanceModalOpen] = useState(false);
    const [newAccountTitle, setNewAccountTitle] = useState('');
    const [newAccountDesc, setNewAccountDesc] = useState('');
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

    // Check Scroll Logic
    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, [recentItems]);

    // Load Accounts
    useEffect(() => {
        loadAccounts();
    }, [loadAccounts]);

    useEffect(() => {
        if (accounts.length > 0) {
            loadBalances();
        }
    }, [accounts, loadBalances]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const { current } = scrollContainerRef;
            const scrollAmount = 300;
            if (direction === 'left') {
                current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    useEffect(() => {
        // Combine pages, schedules, and accounts into recent items
        const items: RecentItem[] = [];

        // Add pages
        pages.filter(p => !p.isArchived).forEach(page => {
            items.push({
                id: page.id,
                type: 'page',
                title: page.title,
                date: page.lastVisitedAt || page.updatedAt || page.createdAt,
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                ),
                data: page,
            });
        });

        // Add schedule events
        events.filter(e => !e.isArchived).forEach((event: ScheduleEvent) => {
            items.push({
                id: event.id,
                type: 'schedule',
                title: event.title || 'Untitled Event',
                date: event.lastVisitedAt || event.updatedAt || event.createdAt,
                icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                ),
                data: event,
            });
        });

        // Add finance accounts
        accounts.filter(a => !a.isArchived).forEach((acc: FinanceAccount) => {
            items.push({
                id: acc.id,
                type: 'finance',
                title: acc.title,
                date: acc.lastVisitedAt || acc.updatedAt || acc.createdAt,
                icon: <WalletIcon />,
                data: acc
            });
        });

        // Sort by date (most recent first)
        const sorted = items
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 12);

        setRecentItems(sorted);
    }, [pages, events, accounts]);

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            if (itemToDelete.type === 'page') {
                await deletePage(itemToDelete.id);
            } else if (itemToDelete.type === 'schedule') {
                await deleteEvent(itemToDelete.id);
            } else if (itemToDelete.type === 'finance') {
                await deleteAccount(itemToDelete.id);
            }
            setItemToDelete(null);
        } catch (error) {
            console.error('Failed to delete item:', error);
        }
    };

    // Reset scroll when items change
    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = 0;
        }
    }, [recentItems]);

    const handleItemClick = (item: RecentItem) => {
        if (item.type === 'page' && onPageSelect) {
            onPageSelect(item.id);
        } else if (item.type === 'schedule' && onEventSelect) {
            markEventAsVisited(item.id);
            onEventSelect(item.id);
        } else if (item.type === 'finance' && onFinanceClick) {
            markAccountAsVisited(item.id);
            onFinanceClick(item.id);
        }
    };

    const getRelativeTime = (date: Date) => {
        const now = dayjs();
        const itemDate = dayjs(date);
        const diffMinutes = now.diff(itemDate, 'minute');
        // ... logic
        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        const diffHours = now.diff(itemDate, 'hour');
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = now.diff(itemDate, 'day');
        if (diffDays < 7) return `${diffDays}d ago`;
        return itemDate.format('MMM D');
    };

    // Helper for formatting balance
    const formatBalance = (account: FinanceAccount) => {
        const amount = balances[account.id] || 0;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: account.currency || 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Filter recent items based on search query
    const filteredRecentItems = searchQuery.trim()
        ? recentItems.filter(item =>
            item.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : recentItems;

    // Convert ALL data to SearchResult format (not just recent items)
    const searchResults: SearchResult[] = [];

    // Add all pages
    if (searchQuery.trim()) {
        pages
            .filter(page => page.title.toLowerCase().includes(searchQuery.toLowerCase()))
            .forEach(page => {
                searchResults.push({
                    id: page.id,
                    title: page.title,
                    description: page.description || 'No description',
                    category: 'Pages',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    ),
                    metadata: dayjs(page.updatedAt).fromNow()
                });
            });

        // Add all schedules
        events
            .filter(event => event.title.toLowerCase().includes(searchQuery.toLowerCase()))
            .forEach(event => {
                searchResults.push({
                    id: event.id,
                    title: event.title,
                    description: event.description || event.type || 'No description',
                    category: 'Schedules',
                    icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    ),
                    metadata: dayjs(event.date).format('MMM D, YYYY')
                });
            });

        // Add all finance accounts
        accounts
            .filter(account => account.title.toLowerCase().includes(searchQuery.toLowerCase()))
            .forEach(account => {
                const amount = balances[account.id] || 0;
                searchResults.push({
                    id: account.id,
                    title: account.title,
                    description: account.description || 'Finance Tracker',
                    category: 'Finance',
                    icon: <WalletIcon className="w-5 h-5" />,
                    metadata: new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: account.currency || 'IDR',
                        minimumFractionDigits: 0
                    }).format(amount)
                });
            });
    }

    const handleSelectResult = (result: SearchResult) => {
        // Find the item in the appropriate store
        const page = pages.find(p => p.id === result.id);
        if (page && onPageSelect) {
            onPageSelect(page.id);
            return;
        }

        const event = events.find(e => e.id === result.id);
        if (event && onEventSelect) {
            onEventSelect(event.id);
            return;
        }

        const account = accounts.find(a => a.id === result.id);
        if (account && onFinanceClick) {
            onFinanceClick(account.id);
            return;
        }
    };

    // Get action sheet items for an item
    const getActionSheetItems = (item: RecentItem): ActionSheetItem[] => {
        const items: ActionSheetItem[] = [];

        // View Option
        items.push({
            id: 'view',
            label: 'View',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            ),
            variant: 'default',
            onClick: () => {
                // UI only
                console.log('View clicked', item);
            }
        });

        // Edit Option
        items.push({
            id: 'edit',
            label: 'Edit',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            ),
            variant: 'default',
            onClick: () => {
                // UI only
                console.log('Edit clicked', item);
            }
        });

        // Edit options for Finance
        if (item.type === 'finance') {
            items.push({
                id: 'edit_info',
                label: 'Edit Info (Finance)',
                icon: (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                ),
                variant: 'default',
                onClick: () => {
                    setItemToEdit(item);
                    setEditName(item.title);
                    setEditDescription((item.data as FinanceAccount).description || '');
                }
            });
        }

        items.push({
            id: 'archive',
            label: 'Archive',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
            ),
            variant: 'default', // Changed from primary to default to match style
            onClick: async () => {
                console.log('Archiving item:', item); // Debug log
                try {
                    if (item.type === 'page') {
                        await archivePage(item.id);
                        console.log('Archived page:', item.id);
                    } else if (item.type === 'schedule') {
                        await archiveEvent(item.id);
                        console.log('Archived schedule:', item.id);
                    } else if (item.type === 'finance') {
                        await archiveAccount(item.id);
                        console.log('Archived finance:', item.id);
                    }
                } catch (error) {
                    console.error('Error archiving item:', error);
                }

                // Force reload of related lists just in case
                // (Stores should handle this internally in load*, but extra safety for UX)

                // Close action sheet implicitly by state update (re-render)
                setActionSheetItem(null);
            }
        });

        items.push({
            id: 'delete',
            label: 'Delete',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            ),
            variant: 'danger',
            onClick: () => setItemToDelete(item)
        });

        return items;
    };

    // Handle long press (mobile)
    const handleLongPress = (item: RecentItem) => {
        setActionSheetItem(item);
    };

    // Handle context menu (desktop right click)
    const handleContextMenu = (item: RecentItem, e: React.MouseEvent) => {
        e.preventDefault();
        setActionSheetItem(item);
    };

    // Save Edit
    const handleSaveEdit = async () => {
        if (!itemToEdit) return;

        if (itemToEdit.type === 'finance') {
            await updateAccount(itemToEdit.id, {
                title: editName,
                description: editDescription
            });
            // Reload accounts to refresh UI
            await loadAccounts();
        }

        setItemToEdit(null);
    };

    // Handle Create Finance Account
    const handleCreateFinanceSubmission = async () => {
        if (!newAccountTitle.trim()) return;
        try {
            await createAccount({
                title: newAccountTitle,
                description: newAccountDesc.trim() || undefined,
                currency: 'IDR'
            });
            setIsCreateFinanceModalOpen(false);
            setNewAccountTitle('');
            setNewAccountDesc('');
            await loadAccounts(); // Refresh list
        } catch (error) {
            console.error('Failed to create account:', error);
        }
    };

    return (
        <div className="h-full w-full bg-neutral dark:bg-primary flex flex-col overflow-y-auto">
            <div className="max-w-7xl w-full mx-auto px-4 md:px-8 py-6 md:py-12 pb-[70px] flex-1 flex flex-col">
                {/* Header */}
                <div className="mb-6 md:mb-8 shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1">
                        <h1 className="text-2xl md:text-3xl font-bold text-text-neutral dark:text-text-primary mb-2">
                            Welcome back! 👋
                        </h1>
                        <p className="text-sm md:text-base text-text-neutral/60 dark:text-text-secondary">
                            Here's what you've been working on recently
                        </p>
                    </div>

                    {/* Search Bar */}
                    <SearchBar
                        onSearch={setSearchQuery}
                        onSelectResult={handleSelectResult}
                        results={searchResults}
                        placeholder="Search pages, schedules, finance..."
                        className="shrink-0"
                    />
                </div>

                {/* Recent Items Grid */}
                {filteredRecentItems.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center pb-20">
                        <div className="text-6xl mb-4">📝</div>
                        <h3 className="text-xl font-semibold text-text-neutral dark:text-text-primary mb-2">
                            Nothing here yet
                        </h3>
                        <p className="text-text-neutral/60 dark:text-text-secondary">
                            {searchQuery.trim()
                                ? `No results found for "${searchQuery}"`
                                : 'Create a page or schedule an event to get started'
                            }
                        </p>
                    </div>
                ) : (
                    <>
                        <SectionHeader
                            title="Recently visited"
                            icon={
                                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            }
                        />
                        <div className="relative group -mx-2 md:-mx-4 px-0.5">
                            {/* Navigation Buttons - Hidden on mobile */}
                            {canScrollLeft && (
                                <Button
                                    onClick={() => scroll('left')}
                                    variant="ghost"
                                    size="icon"
                                    circle
                                    className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-secondary border border-secondary/10 dark:border-primary/10 p-0"
                                    aria-label="Scroll left"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </Button>
                            )}

                            {canScrollRight && (
                                <Button
                                    onClick={() => scroll('right')}
                                    variant="ghost"
                                    size="icon"
                                    circle
                                    className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-secondary border border-secondary/10 dark:border-primary/10 p-0"
                                    aria-label="Scroll right"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </Button>
                            )}

                            {/* Scroll Container */}
                            <div
                                ref={scrollContainerRef}
                                onScroll={checkScroll}
                                className="flex overflow-x-auto gap-3 md:gap-4 pb-4 mx-1 snap-x scroll-pl-2 md:scroll-pl-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
                                style={{
                                    maskImage: `linear-gradient(to right, ${canScrollLeft ? 'transparent, black 48px' : 'black 0%'}, ${canScrollRight ? 'black calc(100% - 48px), transparent' : 'black 100%'})`,
                                    WebkitMaskImage: `linear-gradient(to right, ${canScrollLeft ? 'transparent, black 48px' : 'black 0%'}, ${canScrollRight ? 'black calc(100% - 48px), transparent' : 'black 100%'})`
                                }}
                            >
                                {filteredRecentItems.map((item) => (
                                    <RecentItemCard
                                        key={`${item.type}-${item.id}`}
                                        item={item}
                                        onItemClick={() => handleItemClick(item)}
                                        onLongPress={() => handleLongPress(item)}
                                        onContextMenu={(e) => handleContextMenu(item, e)}
                                        onArchive={() => { /* Archive Feature */ }}
                                        onDelete={() => setItemToDelete(item)}
                                        formatBalance={formatBalance}
                                        getRelativeTime={getRelativeTime}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Quick Actions */}
                <div className="mb-8">
                    <SectionHeader
                        title="Quick Actions"
                        icon={
                            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        }
                    />
                    <QuickActions
                        onAddFinance={() => setIsCreateFinanceModalOpen(true)}
                        onAddPage={onNewPageClick}
                        onAddSchedule={() => setIsScheduleModalOpen(true)}
                        onViewArchive={onViewArchive}
                    />
                </div>

                <ConfirmDialog
                    isOpen={!!itemToDelete}
                    title={`Delete ${itemToDelete?.type === 'finance' ? 'Tracker' : itemToDelete?.type === 'schedule' ? 'Event' : 'Page'}`}
                    message={`Are you sure you want to delete "${itemToDelete?.title}"? This action cannot be undone.`}
                    confirmText="Delete"
                    danger
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setItemToDelete(null)}
                />

                {/* Action Sheet for mobile long press and desktop right click */}
                <ActionSheet
                    isOpen={!!actionSheetItem}
                    onClose={() => setActionSheetItem(null)}
                    title={actionSheetItem?.title}
                    items={actionSheetItem ? getActionSheetItems(actionSheetItem) : []}
                />

                {/* Edit Modal */}
                <Modal
                    isOpen={!!itemToEdit}
                    onClose={() => setItemToEdit(null)}
                    title={`Edit ${itemToEdit?.type === 'finance' ? 'Wallet' : 'Item'}`}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-neutral dark:text-text-primary mb-1">
                                Name
                            </label>
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Enter name..."
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-neutral dark:text-text-primary mb-1">
                                Description
                            </label>
                            <Input
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                placeholder="Enter description (optional)..."
                            />
                        </div>
                        <div className="flex justify-end pt-4 gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => setItemToEdit(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleSaveEdit}
                                disabled={!editName.trim()}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Create Finance Modal */}
                <Modal
                    isOpen={isCreateFinanceModalOpen}
                    onClose={() => setIsCreateFinanceModalOpen(false)}
                    title="Create Finance Tracker"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-neutral dark:text-text-primary mb-1">
                                Account Name
                            </label>
                            <Input
                                value={newAccountTitle}
                                onChange={(e) => setNewAccountTitle(e.target.value)}
                                placeholder="e.g. Personal Wallet, Business Account"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-neutral dark:text-text-primary mb-1">
                                Description
                            </label>
                            <Input
                                value={newAccountDesc}
                                onChange={(e) => setNewAccountDesc(e.target.value)}
                                placeholder="e.g. Daily expenses"
                            />
                        </div>
                        <div className="flex justify-end pt-4 gap-3">
                            <Button
                                variant="ghost"
                                onClick={() => setIsCreateFinanceModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleCreateFinanceSubmission}
                                disabled={!newAccountTitle.trim()}
                            >
                                Create Tracker
                            </Button>
                        </div>
                    </div>
                </Modal>

                <SchedulePickerModal
                    isOpen={isScheduleModalOpen}
                    onClose={() => setIsScheduleModalOpen(false)}
                />
            </div>
        </div>
    );
};
