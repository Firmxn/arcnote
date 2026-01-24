import React, { useEffect, useState } from 'react';
import { usePagesStore } from '../../state/pages.store';
import { useSchedulesStore } from '../../state/schedules.store';
import { useFinanceStore } from '../../state/finance.store';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { SectionHeader } from '../ui/SectionHeader';
import dayjs from 'dayjs';

export const ArchivePage: React.FC = () => {
    const { pages, restorePage, deletePage, loadPages } = usePagesStore();
    const { events, restoreEvent, deleteEvent, loadEvents } = useSchedulesStore();
    const { wallets, restoreWallet, deleteWallet, loadWallets } = useFinanceStore();

    const [activeTab, setActiveTab] = useState<'pages' | 'schedules' | 'finance'>('pages');

    // Deletion State
    const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'pages' | 'schedules' | 'finance', title: string } | null>(null);

    // Initial Load
    useEffect(() => {
        loadPages();
        loadEvents();
        loadWallets();
    }, []);

    // Filter Items
    const archivedPages = pages.filter(p => p.isArchived);
    const archivedEvents = events.filter(e => e.isArchived);
    const archivedWallets = wallets.filter(w => w.isArchived);

    const activeCount = {
        pages: archivedPages.length,
        schedules: archivedEvents.length,
        finance: archivedWallets.length,
    };

    const handleRestore = async (id: string, type: 'pages' | 'schedules' | 'finance') => {
        if (type === 'pages') await restorePage(id);
        else if (type === 'schedules') await restoreEvent(id);
        else if (type === 'finance') await restoreWallet(id);
    };

    const handleDelete = async () => {
        if (!itemToDelete) return;

        if (itemToDelete.type === 'pages') await deletePage(itemToDelete.id);
        else if (itemToDelete.type === 'schedules') await deleteEvent(itemToDelete.id);
        else if (itemToDelete.type === 'finance') await deleteWallet(itemToDelete.id);

        setItemToDelete(null);
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
            <SectionHeader
                title="Archive"
                icon={
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                }
            />

            <p className="text-text-neutral/70 text-sm mb-6 -mt-4">
                Items in the archive are hidden from your main views but can be restored at any time.
            </p>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 border-b border-secondary/20">
                {(['pages', 'schedules', 'finance'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`
                            px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize
                            ${activeTab === tab
                                ? 'bg-primary text-white shadow-md'
                                : 'text-text-neutral/60 hover:text-text-neutral hover:bg-neutral-100 dark:hover:bg-white/5'}
                        `}
                    >
                        {tab} <span className="ml-1 opacity-70 text-xs">({activeCount[tab]})</span>
                    </button>
                ))}
            </div>

            {/* Content List */}
            <div className="space-y-3">
                {activeTab === 'pages' && archivedPages.length === 0 && (
                    <EmptyState message="No archived pages" />
                )}
                {activeTab === 'schedules' && archivedEvents.length === 0 && (
                    <EmptyState message="No archived events" />
                )}
                {activeTab === 'finance' && archivedWallets.length === 0 && (
                    <EmptyState message="No archived wallets" />
                )}

                {activeTab === 'pages' && archivedPages.map(page => (
                    <ArchiveItem
                        key={page.id}
                        title={page.title}
                        date={page.updatedAt}
                        onRestore={() => handleRestore(page.id, 'pages')}
                        onDelete={() => setItemToDelete({ id: page.id, type: 'pages', title: page.title })}
                    />
                ))}

                {activeTab === 'schedules' && archivedEvents.map(event => (
                    <ArchiveItem
                        key={event.id}
                        title={event.title}
                        date={event.date}
                        onRestore={() => handleRestore(event.id, 'schedules')}
                        onDelete={() => setItemToDelete({ id: event.id, type: 'schedules', title: event.title })}
                    />
                ))}

                {activeTab === 'finance' && archivedWallets.map(wallet => (
                    <ArchiveItem
                        key={wallet.id}
                        title={wallet.title}
                        date={wallet.updatedAt}
                        onRestore={() => handleRestore(wallet.id, 'finance')}
                        onDelete={() => setItemToDelete({ id: wallet.id, type: 'finance', title: wallet.title })}
                    />
                ))}
            </div>

            <ConfirmDialog
                isOpen={!!itemToDelete}
                title="Permanently Delete"
                message={`Are you sure you want to permanently delete "${itemToDelete?.title}"? This action cannot be undone.`}
                confirmText="Delete Forever"
                danger
                onConfirm={handleDelete}
                onCancel={() => setItemToDelete(null)}
            />
        </div>
    );
};

const ArchiveItem = ({ title, date, onRestore, onDelete }: { title: string, date: Date, onRestore: () => void, onDelete: () => void }) => (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-secondary/20 border border-secondary/10 rounded-xl shadow-sm">
        <div>
            <h3 className="font-semibold text-text-neutral dark:text-text-primary">{title || 'Untitled'}</h3>
            <p className="text-xs text-text-neutral/50">
                {dayjs(date).format('MMM D, YYYY')}
            </p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onRestore}>
                Restore
            </Button>
            <button
                onClick={onDelete}
                className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                title="Delete Permanently"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </div>
    </div>
);

const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 dark:bg-white/5 mb-4 text-text-neutral/40">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
        </div>
        <p className="text-text-neutral/50">{message}</p>
    </div>
);
