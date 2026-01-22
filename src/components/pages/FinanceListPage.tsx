import React, { useState, useEffect, useRef } from 'react';
import { useFinanceStore } from '../../state/finance.store';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { ContextMenu } from '../ui/ContextMenu';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Input } from '../ui/Input';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { FinanceAccount } from '../../types/finance';
import { formatCurrency } from '../../utils/currency';
import { FAB } from '../ui/FAB';
import { MiniFAB } from '../ui/MiniFAB';
import { SearchBar } from '../ui/SearchBar';
import type { SearchResult } from '../ui/SearchBar';
import { ActionGroup, ActionButton } from '../ui/ActionGroup';
import { SectionHeader } from '../ui/SectionHeader';
import { ActionSheet, type ActionSheetItem } from '../ui/ActionSheet';

dayjs.extend(relativeTime);

const WalletIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
);

export const FinanceListPage: React.FC = () => {
    const {
        accounts,
        loadAccounts,
        createAccount,
        updateAccount,
        deleteAccount,
        archiveAccount,
        isLoading,
        balances,
        loadBalances,
        syncAccountToCloud,
        syncAccountToLocal
    } = useFinanceStore();
    const navigate = useNavigate();
    const isBackendMode = localStorage.getItem('arcnote_storage_preference') === 'backend';

    // Create State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isFabHidden, setIsFabHidden] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [newAccountTitle, setNewAccountTitle] = useState('');
    const [newAccountDesc, setNewAccountDesc] = useState('');

    // Edit State
    const [editingAccount, setEditingAccount] = useState<FinanceAccount | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [accountToDelete, setAccountToDelete] = useState<FinanceAccount | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; accountId: string } | null>(null);
    const [actionSheetAccount, setActionSheetAccount] = useState<FinanceAccount | null>(null);

    useEffect(() => {
        loadAccounts();
    }, [loadAccounts]);

    useEffect(() => {
        if (accounts.length > 0) {
            loadBalances();
        }
    }, [accounts]); // loadBalances dependency is stable from zustand

    const handleCreate = async () => {
        if (!newAccountTitle.trim()) return;
        try {
            await createAccount({
                title: newAccountTitle,
                description: newAccountDesc.trim() || undefined,
                currency: 'IDR'
            });
            setIsCreateModalOpen(false);
            setNewAccountTitle('');
            setNewAccountDesc('');
            // Balances will auto-refresh via accounts effect
        } catch (error) {
            console.error('Failed to create account:', error);
        }
    };

    const listRef = useRef<HTMLDivElement>(null);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const isBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
        setIsFabHidden(isBottom);
    };

    const scrollToTop = () => {
        listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleEditStart = (account: FinanceAccount) => {
        setEditingAccount(account);
        setEditTitle(account.title);
        setEditDesc(account.description || '');
    };

    const handleEditSave = async () => {
        if (!editingAccount || !editTitle.trim()) return;
        try {
            await updateAccount(editingAccount.id, {
                title: editTitle,
                description: editDesc.trim() || undefined
            });
            setEditingAccount(null);
            setEditTitle('');
            setEditDesc('');
        } catch (error) {
            console.error('Failed to update account:', error);
        }
    };

    const handleDelete = (account: FinanceAccount) => {
        setAccountToDelete(account);
    };

    const confirmDelete = async () => {
        if (!accountToDelete) return;
        try {
            await deleteAccount(accountToDelete.id);
            setAccountToDelete(null);
        } catch (error) {
            console.error('Failed to delete account:', error);
        }
    };

    // Filter accounts berdasarkan search query
    const filteredAccounts = accounts
        .filter(account => !account.isArchived) // Exclude archived
        .filter(account =>
            !searchQuery.trim() ||
            account.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (account.description?.toLowerCase().includes(searchQuery.toLowerCase()))
        );

    // Convert filtered accounts to SearchResult format
    const searchResults: SearchResult[] = filteredAccounts.map(account => ({
        id: account.id,
        title: account.title,
        description: account.description,
        category: 'Finance Trackers',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
        ),
        metadata: dayjs(account.createdAt).fromNow()
    }));

    // Helper untuk generate action sheet items
    const getActionSheetItems = (account: FinanceAccount): ActionSheetItem[] => {
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
                navigate(`/finance/${account.id}`);
            }
        });

        // Edit Info Option
        items.push({
            id: 'edit_info',
            label: 'Edit Info',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            ),
            variant: 'default',
            onClick: () => {
                handleEditStart(account);
            }
        });

        // Archive Option
        items.push({
            id: 'archive',
            label: 'Archive',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
            ),
            variant: 'default',
            onClick: async () => {
                try {
                    await archiveAccount(account.id);
                    setActionSheetAccount(null);
                } catch (error) {
                    console.error('Error archiving account:', error);
                }
            }
        });

        // Delete Option
        items.push({
            id: 'delete',
            label: 'Delete',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            ),
            variant: 'danger',
            onClick: () => {
                setAccountToDelete(account);
            }
        });

        return items;
    };

    const handleSelectResult = (result: SearchResult) => {
        const account = accounts.find(acc => acc.id === result.id);
        if (account) {
            navigate(`/finance/${account.id}`);
        }
    };

    return (
        <div className="h-full w-full bg-neutral dark:bg-primary flex flex-col min-h-0">
            <div className="flex-1 flex flex-col min-h-0">
                {/* Header */}
                <div className="max-w-7xl w-full mx-auto px-4 md:px-8 pt-6 md:pt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8 shrink-0">
                    <div className="flex-1">
                        <h1 className="text-2xl md:text-3xl font-bold text-text-neutral dark:text-text-primary mb-2">
                            Finance Trackers
                        </h1>
                        <p className="text-sm md:text-base text-text-neutral/60 dark:text-text-secondary">
                            Manage your wallets, accounts, and budgets
                        </p>
                    </div>

                    {/* Search Bar */}
                    <SearchBar
                        onSearch={setSearchQuery}
                        onSelectResult={handleSelectResult}
                        results={searchResults}
                        placeholder="Search trackers..."
                        className="shrink-0"
                    />

                    {/* Desktop Button - Hidden on Mobile */}
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="hidden md:flex px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors items-center justify-center gap-2 font-medium"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        New Tracker
                    </button>
                </div>

                {/* Accounts Grid */}
                <div
                    ref={listRef}
                    className="flex-1 overflow-y-auto min-h-0 pb-[100px]"
                    onScroll={handleScroll}
                >
                    {filteredAccounts.length === 0 && !isLoading ? (
                        <div className="h-full max-w-7xl mx-auto w-full flex flex-col items-center justify-center text-center px-4">
                            <div className="text-6xl mb-4">
                                {searchQuery.trim() ? '🔍' : '💰'}
                            </div>
                            <h3 className="text-xl font-semibold text-text-neutral dark:text-text-primary mb-2">
                                {searchQuery.trim() ? 'No trackers found' : 'No trackers yet'}
                            </h3>
                            <p className="text-text-neutral/60 dark:text-text-secondary cursor-pointer" onClick={() => searchQuery.trim() ? setSearchQuery('') : setIsCreateModalOpen(true)}>
                                {searchQuery.trim()
                                    ? `No results for "${searchQuery}". Clear search to see all trackers.`
                                    : 'Create your first finance tracker to get started'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="max-w-7xl mx-auto w-full px-4 md:px-8">
                            <SectionHeader
                                title="Your Trackers"
                                icon={
                                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                }
                            />
                            {/* Grid: 2 kolom di mobile, 3 di tablet, 4 di desktop */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                                {filteredAccounts.map(account => {
                                    const balance = balances[account.id] || 0;
                                    const formattedBalance = formatCurrency(balance, account.currency || 'IDR');

                                    return (
                                        <div key={account.id} className="relative group">
                                            <div
                                                onClick={() => navigate(`/finance/${account.id}`)}
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    setActionSheetAccount(account);
                                                }}
                                                onTouchStart={(e) => {
                                                    const timer = setTimeout(() => {
                                                        setActionSheetAccount(account);
                                                    }, 500);
                                                    (e.currentTarget as any)._longPressTimer = timer;
                                                }}
                                                onTouchEnd={(e) => {
                                                    const timer = (e.currentTarget as any)._longPressTimer;
                                                    if (timer) clearTimeout(timer);
                                                }}
                                                onTouchMove={(e) => {
                                                    const timer = (e.currentTarget as any)._longPressTimer;
                                                    if (timer) clearTimeout(timer);
                                                }}
                                            >
                                                <Card
                                                    icon={<WalletIcon />}
                                                    title={account.title}
                                                    description={account.description || `${account.currency} Account`}
                                                    extra={
                                                        <div className="text-xl font-bold text-primary dark:text-accent font-mono tracking-tight">
                                                            {formattedBalance}
                                                        </div>
                                                    }
                                                    updatedAt={dayjs(account.updatedAt).fromNow()}
                                                    createdAt={dayjs(account.createdAt).format('MMM D, YYYY')}
                                                    onContextMenu={(e) => {
                                                        e.preventDefault();
                                                        setContextMenu({ x: e.pageX, y: e.pageY, accountId: account.id });
                                                    }}
                                                />
                                            </div>

                                            {/* Action Buttons Overlay - Hidden di mobile */}
                                            <div className="absolute top-3 right-3 opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                                                <ActionGroup>
                                                    <ActionButton
                                                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}
                                                        variant="primary"
                                                        onClick={(e) => { e.stopPropagation(); handleEditStart(account); }}
                                                        title="Edit Info"
                                                    />
                                                    <ActionButton
                                                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                                                        variant="danger"
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(account); }}
                                                        title="Delete"
                                                    />
                                                </ActionGroup>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Account Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create Finance Tracker"
            >
                <div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-neutral dark:text-text-secondary mb-1">
                                Tracker Title
                            </label>
                            <Input
                                autoFocus
                                placeholder="e.g. Personal Wallet"
                                value={newAccountTitle}
                                onChange={(e) => setNewAccountTitle(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-neutral dark:text-text-secondary mb-1">
                                Description (Optional)
                            </label>
                            <Input
                                placeholder="e.g. Daily expenses and savings"
                                value={newAccountDesc}
                                onChange={(e) => setNewAccountDesc(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreate();
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-6">
                        <button
                            onClick={() => setIsCreateModalOpen(false)}
                            className="px-4 py-2 text-sm text-text-neutral dark:text-text-secondary hover:bg-neutral-100 dark:hover:bg-white/5 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            className="px-4 py-2 text-sm bg-accent hover:bg-accent-hover text-white rounded-md transition-colors font-medium"
                        >
                            Create Tracker
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Edit Account Modal */}
            <Modal
                isOpen={!!editingAccount}
                onClose={() => setEditingAccount(null)}
                title="Edit Tracker Info"
            >
                <div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-neutral dark:text-text-secondary mb-1">
                                Tracker Title
                            </label>
                            <Input
                                autoFocus
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-neutral dark:text-text-secondary mb-1">
                                Description
                            </label>
                            <Input
                                placeholder="Add a description..."
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleEditSave();
                                }}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-6">
                        <button
                            onClick={() => setEditingAccount(null)}
                            className="px-4 py-2 text-sm text-text-neutral dark:text-text-secondary hover:bg-neutral-100 dark:hover:bg-white/5 rounded-md transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleEditSave}
                            className="px-4 py-2 text-sm bg-accent hover:bg-accent-hover text-white rounded-md transition-colors font-medium"
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </Modal>
            {/* Delete Account Confirmation */}
            <ConfirmDialog
                isOpen={!!accountToDelete}
                title="Delete Finance Tracker"
                message={`Are you sure you want to delete "${accountToDelete?.title}"? All transactions in this tracker will be lost forever.`}
                confirmText="Delete Tracker"
                cancelText="Keep Rule"
                type="danger"
                onConfirm={confirmDelete}
                onCancel={() => setAccountToDelete(null)}
            />
            {/* Context Menu */}
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    items={[
                        {
                            label: isBackendMode ? 'Save Tracker to Local' : 'Sync Tracker to Cloud',
                            onClick: async () => {
                                const action = isBackendMode ? 'Save to Local' : 'Upload to Cloud';
                                const msg = isBackendMode
                                    ? 'Save this tracker and ALL transactions to Local Storage? This will overwrite local data.'
                                    : 'Sync this tracker and ALL its transactions to Cloud? This will overwrite existing cloud data.';

                                if (window.confirm(msg)) {
                                    try {
                                        if (isBackendMode) {
                                            await syncAccountToLocal(contextMenu.accountId);
                                        } else {
                                            await syncAccountToCloud(contextMenu.accountId);
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
                                        ? "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                        : "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                    } />
                                </svg>
                            )
                        }
                    ]}
                />
            )}

            {/* Action Sheet for mobile long press */}
            <ActionSheet
                isOpen={!!actionSheetAccount}
                onClose={() => setActionSheetAccount(null)}
                title={actionSheetAccount?.title}
                items={actionSheetAccount ? getActionSheetItems(actionSheetAccount) : []}
            />

            {/* Floating Action Button - Mobile Only */}
            <FAB onClick={() => setIsCreateModalOpen(true)} title="New Tracker" hide={isFabHidden} />
            <MiniFAB onClick={scrollToTop} show={isFabHidden} />
        </div>
    );
};
