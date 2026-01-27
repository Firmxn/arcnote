import React, { useState, useEffect, useRef } from 'react';
import { useFinanceStore } from '../../../state/finance.store';

import { WalletCard, WALLET_THEMES } from '../../ui/WalletCard';
import { TransferModal } from '../../modals/TransferModal';
import { Modal } from '../../ui/Modal';

import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { Input } from '../../ui/Input';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { Wallet } from '../../../types/finance';

import { FAB } from '../../ui/FAB';
import { MiniFAB } from '../../ui/MiniFAB';
import { SearchBar } from '../../ui/SearchBar';
import type { SearchResult } from '../../ui/SearchBar';
import { ActionGroup, ActionButton } from '../../ui/ActionGroup';
import { SectionHeader } from '../../ui/SectionHeader';
import { PageHeader } from '../../ui/PageHeader';
import { ActionSheet, type ActionSheetItem } from '../../ui/ActionSheet';

dayjs.extend(relativeTime);



export const WalletsPage: React.FC = () => {
    const {
        wallets,
        loadWallets,
        createWallet,
        updateWallet,
        deleteWallet,
        archiveWallet,
        isLoading,
        balances,
        loadBalances,
        transferBetweenWallets,
        isBalanceHidden
    } = useFinanceStore();
    const navigate = useNavigate();

    // Create State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isFabHidden, setIsFabHidden] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [newWalletTitle, setNewWalletTitle] = useState('');
    const [newWalletDesc, setNewWalletDesc] = useState('');
    const [newWalletTheme, setNewWalletTheme] = useState('blue');

    // Edit State
    const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editTheme, setEditTheme] = useState('blue');
    const [walletToDelete, setWalletToDelete] = useState<Wallet | null>(null);

    const [actionSheetWallet, setActionSheetWallet] = useState<Wallet | null>(null);

    useEffect(() => {
        loadWallets();
    }, [loadWallets]);

    useEffect(() => {
        if (wallets.length > 0) {
            loadBalances();
        }
    }, [wallets]); // loadBalances dependency is stable from zustand

    const handleCreate = async () => {
        if (!newWalletTitle.trim()) return;
        try {
            await createWallet({
                title: newWalletTitle,
                description: newWalletDesc.trim() || undefined,
                currency: 'IDR',
                theme: newWalletTheme
            });
            setIsCreateModalOpen(false);
            setNewWalletTitle('');
            setNewWalletDesc('');
            setNewWalletTheme('blue');
            setNewWalletTheme('blue');
            // Balances will auto-refresh via wallets effect
        } catch (error) {
            console.error('Failed to create wallet:', error);
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

    const handleEditStart = (wallet: Wallet) => {
        setEditingWallet(wallet);
        setEditTitle(wallet.title);
        setEditDesc(wallet.description || '');
        setEditTheme(wallet.theme || 'blue');
    };

    const handleEditSave = async () => {
        if (!editingWallet || !editTitle.trim()) return;
        try {
            await updateWallet(editingWallet.id, {
                title: editTitle,
                description: editDesc.trim() || undefined,
                theme: editTheme
            });
            setEditingWallet(null);
            setEditTitle('');
            setEditDesc('');
        } catch (error) {
            console.error('Failed to update wallet:', error);
        }
    };

    const handleDelete = (wallet: Wallet) => {
        setWalletToDelete(wallet);
    };

    const confirmDelete = async () => {
        if (!walletToDelete) return;
        try {
            await deleteWallet(walletToDelete.id);
            setWalletToDelete(null);
        } catch (error) {
            console.error('Failed to delete wallet:', error);
        }
    };

    // Filter wallets berdasarkan search query
    const filteredWallets = wallets
        .filter(wallet => !wallet.isArchived) // Exclude archived
        .filter(wallet =>
            !searchQuery.trim() ||
            wallet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (wallet.description?.toLowerCase().includes(searchQuery.toLowerCase()))
        );

    // Convert filtered wallets to SearchResult format
    const searchResults: SearchResult[] = filteredWallets.map(wallet => ({
        id: wallet.id,
        title: wallet.title,
        description: wallet.description,
        category: 'Wallets',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
        ),
        metadata: dayjs(wallet.createdAt).fromNow()
    }));

    // Helper untuk generate action sheet items
    const getActionSheetItems = (wallet: Wallet): ActionSheetItem[] => {
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
                navigate(`/finance/${wallet.id}`);
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
                handleEditStart(wallet);
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
                    await archiveWallet(wallet.id);
                    setActionSheetWallet(null);
                } catch (error) {
                    console.error('Error archiving wallet:', error);
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
                setWalletToDelete(wallet);
            }
        });

        return items;
    };

    const handleSelectResult = (result: SearchResult) => {
        const wallet = wallets.find(w => w.id === result.id);
        if (wallet) {
            navigate(`/finance/${wallet.id}`);
        }
    };

    return (
        <div className="h-full w-full bg-neutral dark:bg-primary flex flex-col min-h-0">
            <div className="flex-1 flex flex-col min-h-0">
                {/* Header */}
                <div className="max-w-7xl w-full mx-auto px-4 md:px-8 pt-6 md:pt-12 shrink-0">
                    <PageHeader
                        title="My Wallets"
                        description="Manage your wallets and budgets"
                        className="mb-4 md:mb-8"
                        leading={
                            <button
                                onClick={() => navigate('/finance')}
                                className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-text-neutral dark:text-text-secondary transition-colors"
                                title="Back to Finance Dashboard"
                            >
                                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        }
                        trailing={
                            wallets.filter(w => !w.isArchived).length > 1 && (
                                <button
                                    onClick={() => setIsTransferModalOpen(true)}
                                    className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-text-neutral dark:text-text-secondary transition-colors"
                                    title="Transfer antar wallet"
                                >
                                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                </button>
                            )
                        }
                    />


                    {/* Search Bar Area */}
                    <div className="mb-6 flex justify-end">
                        <SearchBar
                            onSearch={setSearchQuery}
                            onSelectResult={handleSelectResult}
                            results={searchResults}
                            placeholder="Search wallets..."
                            className="w-full sm:max-w-md"
                        />
                    </div>

                    {/* Desktop Button - Hidden on Mobile */}
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="hidden md:flex px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors items-center justify-center gap-2 font-medium"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        New Wallet
                    </button>
                </div>

                {/* Accounts Grid */}
                <div
                    ref={listRef}
                    className="flex-1 overflow-y-auto min-h-0 pb-[100px]"
                    onScroll={handleScroll}
                >
                    {filteredWallets.length === 0 && !isLoading ? (
                        <div className="h-full max-w-7xl mx-auto w-full flex flex-col items-center justify-center text-center px-4">
                            <div className="text-6xl mb-4">
                                {searchQuery.trim() ? '🔍' : '💰'}
                            </div>
                            <h3 className="text-xl font-semibold text-text-neutral dark:text-text-primary mb-2">
                                {searchQuery.trim() ? 'No wallets found' : 'No wallets yet'}
                            </h3>
                            <p className="text-text-neutral/60 dark:text-text-secondary cursor-pointer" onClick={() => searchQuery.trim() ? setSearchQuery('') : setIsCreateModalOpen(true)}>
                                {searchQuery.trim()
                                    ? `No results for "${searchQuery}". Clear search to see all wallets.`
                                    : 'Create your first wallet to get started'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="max-w-7xl mx-auto w-full px-4 md:px-8">
                            <SectionHeader
                                title="Your Wallets"
                                icon={
                                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                }
                            />
                            {/* Grid: 2 kolom di mobile, 3 di tablet, 4 di desktop */}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
                                {filteredWallets.map((wallet, index) => {
                                    const balance = balances[wallet.id] || 0;

                                    return (
                                        <div key={wallet.id} className="relative group">
                                            <WalletCard
                                                title={wallet.title}
                                                balance={balance}
                                                currency={wallet.currency}
                                                id={wallet.id}
                                                variant={index === 0 ? 'primary' : 'accent'}
                                                theme={wallet.theme}
                                                className="w-full aspect-[1.586/1]"
                                                isHidden={isBalanceHidden}
                                                onClick={() => navigate(`/finance/${wallet.id}`)}
                                                onContextMenu={(e) => {
                                                    e.preventDefault();
                                                    setActionSheetWallet(wallet);
                                                }}
                                                onTouchStart={(e) => {
                                                    const timer = setTimeout(() => {
                                                        setActionSheetWallet(wallet);
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
                                            />

                                            {/* Action Buttons Overlay - Hidden di mobile */}
                                            <div className="absolute top-3 right-3 opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
                                                <ActionGroup>
                                                    <ActionButton
                                                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}
                                                        variant="primary"
                                                        onClick={(e) => { e.stopPropagation(); handleEditStart(wallet); }}
                                                        title="Edit Info"
                                                    />
                                                    <ActionButton
                                                        icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                                                        variant="danger"
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(wallet); }}
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
                title="Create Wallet"
            >
                <div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-neutral dark:text-text-secondary mb-1">
                                Wallet Name
                            </label>
                            <Input
                                autoFocus
                                placeholder="e.g. Personal Wallet"
                                value={newWalletTitle}
                                onChange={(e) => setNewWalletTitle(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-neutral dark:text-text-secondary mb-1">
                                Description (Optional)
                            </label>
                            <Input
                                placeholder="e.g. Daily expenses and savings"
                                value={newWalletDesc}
                                onChange={(e) => setNewWalletDesc(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleCreate();
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-neutral dark:text-text-secondary mb-2">
                                Theme Color
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {Object.keys(WALLET_THEMES).map((theme) => {
                                    if (theme === 'primary' || theme === 'accent') return null; // Skip system themes
                                    return (
                                        <button
                                            key={theme}
                                            onClick={() => setNewWalletTheme(theme)}
                                            className={`w-8 h-8 rounded-full bg-linear-to-br ${WALLET_THEMES[theme]} transition-transform ${newWalletTheme === theme ? 'ring-2 ring-offset-2 ring-accent scale-110' : 'hover:scale-105'}`}
                                            title={theme.charAt(0).toUpperCase() + theme.slice(1)}
                                        />
                                    );
                                })}
                            </div>
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
                            Create Wallet
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Edit Wallet Modal */}
            <Modal
                isOpen={!!editingWallet}
                onClose={() => setEditingWallet(null)}
                title="Edit Wallet Info"
            >
                <div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-text-neutral dark:text-text-secondary mb-1">
                                Wallet Name
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
                        <div>
                            <label className="block text-sm font-medium text-text-neutral dark:text-text-secondary mb-2">
                                Theme Color
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {Object.keys(WALLET_THEMES).map((theme) => {
                                    if (theme === 'primary' || theme === 'accent') return null; // Skip system themes
                                    return (
                                        <button
                                            key={theme}
                                            onClick={() => setEditTheme(theme)}
                                            className={`w-8 h-8 rounded-full bg-linear-to-br ${WALLET_THEMES[theme]} transition-transform ${editTheme === theme ? 'ring-2 ring-offset-2 ring-accent scale-110' : 'hover:scale-105'}`}
                                            title={theme.charAt(0).toUpperCase() + theme.slice(1)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-6">
                        <button
                            onClick={() => setEditingWallet(null)}
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

            {/* Delete Wallet Confirmation */}
            <ConfirmDialog
                isOpen={!!walletToDelete}
                title="Delete Wallet"
                message={`Are you sure you want to delete "${walletToDelete?.title}"? All transactions in this wallet will be lost forever.`}
                confirmText="Delete Wallet"
                cancelText="Keep Rule"
                type="danger"
                onConfirm={confirmDelete}
                onCancel={() => setWalletToDelete(null)}
            />


            {/* Action Sheet for mobile long press */}
            <ActionSheet
                isOpen={!!actionSheetWallet}
                onClose={() => setActionSheetWallet(null)}
                title={actionSheetWallet?.title}
                items={actionSheetWallet ? getActionSheetItems(actionSheetWallet) : []}
            />

            {/* Floating Action Button - Mobile Only */}
            <FAB onClick={() => setIsCreateModalOpen(true)} title="New Wallet" hide={isFabHidden} />
            <MiniFAB onClick={scrollToTop} show={isFabHidden} />

            {/* Transfer Modal */}
            <TransferModal
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                wallets={wallets.filter(w => !w.isArchived)}
                balances={balances}
                onSubmit={async ({ fromWalletId, toWalletId, amount, description, date }) => {
                    await transferBetweenWallets(fromWalletId, toWalletId, amount, description, date);
                    await loadBalances();
                    setIsTransferModalOpen(false);
                }}
            />
        </div>
    );
};
