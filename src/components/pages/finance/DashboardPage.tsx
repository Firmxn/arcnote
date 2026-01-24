import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../../../state/finance.store';
import { SectionHeader } from '../../ui/SectionHeader';
import { PageHeader } from '../../ui/PageHeader';
import { ListCard } from '../../ui/ListCard';
import { FAB } from '../../ui/FAB';
import { AddTransactionModal } from '../../modals/AddTransactionModal';
import { CreateFinanceTrackerModal } from '../../modals/CreateFinanceTrackerModal';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { formatCurrency, formatCurrencyCompact } from '../../../utils/currency';
import { WalletCard } from '../../ui/WalletCard';
import { ActionSheet, type ActionSheetItem } from '../../ui/ActionSheet';

import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import BudgetModal from '../../modals/BudgetModal';
import type { Wallet } from '../../../types/finance';

dayjs.extend(relativeTime);

export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const {
        wallets,
        balances,
        globalSummary,
        monthlySummary,
        recentTransactions,
        loadWallets,
        loadBalances,
        loadGlobalSummary,
        loadMonthlySummary,
        loadRecentTransactions,
        createTransaction,
        createWallet,
        updateWallet,
        deleteWallet,
        // Budget state
        budgets,
        budgetSummaries,
        loadBudgets,
        loadBudgetSummary,
        isLoading
    } = useFinanceStore();

    // State untuk toggle compact/detail view
    const [showDetailView, setShowDetailView] = useState(false);
    // State untuk modal add transaction
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    // State untuk modal create wallet from dashboard
    const [isCreateWalletModalOpen, setIsCreateWalletModalOpen] = useState(false);

    // State untuk Action Sheet & Context Menu
    const [actionSheetWallet, setActionSheetWallet] = useState<Wallet | null>(null);


    // State untuk Edit/Delete
    const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [walletToDelete, setWalletToDelete] = useState<Wallet | null>(null);
    const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

    // Load data
    useEffect(() => {
        const loadData = async () => {
            await loadWallets();
            loadBalances();
            loadGlobalSummary();
            loadMonthlySummary();
            loadRecentTransactions(5);
            await loadBudgets(); // Load budgets
        };
        loadData();
    }, [loadWallets, loadBalances, loadGlobalSummary, loadMonthlySummary, loadRecentTransactions, loadBudgets]);

    // Active Wallets & Sorting Logic
    const activeWallets = wallets.filter(w => !w.isArchived);
    const sortedWallets = useMemo(() => {
        if (activeWallets.length === 0) return [];

        // Asumsikan wallet pertama di list asli adalah main wallet (atau user preference nanti)
        // Disini kita ambil index 0 sebagai main.
        const mainWallet = activeWallets[0];
        const otherWallets = activeWallets.slice(1);

        // Sort sisa wallet berdasarkan lastVisitedAt descending
        // Create copy array untuk sort
        const othersSorted = [...otherWallets].sort((a, b) => {
            const timeA = a.lastVisitedAt ? new Date(a.lastVisitedAt).getTime() : 0;
            const timeB = b.lastVisitedAt ? new Date(b.lastVisitedAt).getTime() : 0;
            return timeB - timeA;
        });

        // Ambil top 4 dari others
        const topOthers = othersSorted.slice(0, 4);

        return [mainWallet, ...topOthers];
    }, [wallets]); // Re-calc when wallets change (activeWallets derived from wallets)

    const currentMonth = dayjs().format('MMMM YYYY');

    // Handlers
    const handleEditStart = (wallet: Wallet) => {
        setEditingWallet(wallet);
        setEditTitle(wallet.title);
        setEditDesc(wallet.description || '');
        setActionSheetWallet(null); // Close sheet if open
    };

    const handleEditSave = async () => {
        if (!editingWallet || !editTitle.trim()) return;
        try {
            await updateWallet(editingWallet.id, {
                title: editTitle,
                description: editDesc.trim() || undefined
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
        setActionSheetWallet(null); // Close sheet if open
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

    const getActionSheetItems = (wallet: Wallet): ActionSheetItem[] => [
        {
            id: 'edit',
            label: 'Edit Info',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
            ),
            onClick: () => handleEditStart(wallet)
        },
        {
            id: 'delete',
            label: 'Delete',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            ),
            variant: 'danger',
            onClick: () => handleDelete(wallet)
        }
    ];

    return (
        <div
            className="flex-1 h-full overflow-y-auto bg-neutral [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"

        >
            <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 md:pt-12 pb-[100px]">
                {/* Header */}
                <PageHeader
                    title="Finance"
                    description="Overview keuangan kamu"
                />

                {/* Combined Balance & Summary Card */}
                <div className="bg-white dark:bg-secondary rounded-xl p-4 md:p-6 mb-6 border border-secondary/10 dark:border-white/5">
                    {/* Total Balance Section */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-text-neutral/60 dark:text-text-secondary">Total Balance</p>
                            <p className="text-xs text-text-neutral/50 dark:text-text-secondary/50">
                                {currentMonth}
                            </p>
                        </div>
                        <p className="text-3xl md:text-4xl font-bold font-mono tracking-tight text-primary dark:text-accent mb-1">
                            {globalSummary ? formatCurrency(globalSummary.balance) : 'Rp 0'}
                        </p>
                        <p className="text-xs text-text-neutral/50 dark:text-text-secondary/50">
                            {activeWallets.length} wallet aktif
                        </p>
                    </div>

                    {/* Monthly Summary */}
                    <div className="grid grid-cols-3 gap-2">
                        {/* Income */}
                        <button
                            onClick={() => setShowDetailView(!showDetailView)}
                            className="select-none bg-green-50 dark:bg-green-900/10 rounded-lg p-2 text-left active:scale-95 transition-transform"
                        >
                            <p className="text-[10px] text-green-600 dark:text-green-400 mb-1 flex items-center gap-0.5">
                                Income
                                <svg className="w-2.5 h-2.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </p>
                            <p className="select-text text-xs md:text-sm font-bold font-mono text-green-600 dark:text-green-400 wrap-break-word">
                                {showDetailView
                                    ? formatCurrency(monthlySummary?.totalIncome || 0)
                                    : formatCurrencyCompact(monthlySummary?.totalIncome || 0)
                                }
                            </p>
                        </button>

                        {/* Expense */}
                        <button
                            onClick={() => setShowDetailView(!showDetailView)}
                            className="select-none bg-red-50 dark:bg-red-900/10 rounded-lg p-2 text-left active:scale-95 transition-transform"
                        >
                            <p className="text-[10px] text-red-600 dark:text-red-400 mb-1 flex items-center gap-0.5">
                                Expense
                                <svg className="w-2.5 h-2.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </p>
                            <p className="select-text text-xs md:text-sm font-bold font-mono text-red-600 dark:text-red-400 wrap-break-word">
                                {showDetailView
                                    ? formatCurrency(monthlySummary?.totalExpense || 0)
                                    : formatCurrencyCompact(monthlySummary?.totalExpense || 0)
                                }
                            </p>
                        </button>

                        {/* Net */}
                        <button
                            onClick={() => setShowDetailView(!showDetailView)}
                            className={`select-none rounded-lg p-2 text-left active:scale-95 transition-transform ${(monthlySummary?.balance || 0) >= 0
                                ? 'bg-blue-50 dark:bg-blue-900/10'
                                : 'bg-red-50 dark:bg-red-900/10'
                                }`}
                        >
                            <p className={`text-[10px] mb-1 flex items-center gap-0.5 ${(monthlySummary?.balance || 0) >= 0
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-red-600 dark:text-red-400'
                                }`}>
                                Net
                                <svg className="w-2.5 h-2.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </p>
                            <p className={`select-text text-xs md:text-sm font-bold font-mono wrap-break-word ${(monthlySummary?.balance || 0) >= 0
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-red-600 dark:text-red-400'
                                }`}>
                                {showDetailView
                                    ? formatCurrency(monthlySummary?.balance || 0)
                                    : formatCurrencyCompact(monthlySummary?.balance || 0)
                                }
                            </p>
                        </button>
                    </div>
                </div>

                {/* Wallets Horizontal Scroll */}
                <SectionHeader
                    title="Wallets"
                    subtitle={`${activeWallets.length} wallet`}
                    actionLabel="View All"
                    onAction={() => navigate('/finance/wallets')}
                    icon={
                        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    }
                />
                <div className="flex gap-3 overflow-x-auto pb-4 mb-6 -mx-4 px-4 scrollbar-hide snap-x">
                    {/* Add Wallet Button - Landscape */}
                    <button
                        onClick={() => setIsCreateWalletModalOpen(true)}
                        className="snap-start select-none shrink-0 w-[42vw] md:w-[240px] aspect-[1.586/1] bg-accent/10 dark:bg-accent/20 rounded-xl border-2 border-dashed border-accent/30 dark:border-accent/40 flex flex-col items-center justify-center gap-2 hover:bg-accent/20 dark:hover:bg-accent/30 transition-colors"
                    >
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-accent flex items-center justify-center text-white">
                            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <p className="text-[10px] md:text-xs font-medium text-accent">Add Wallet</p>
                    </button>

                    {/* Wallet Cards - Landscape of active sortedWallets */}
                    {sortedWallets.length > 0 ? (
                        sortedWallets.map((wallet, index) => {
                            const isMainWallet = index === 0;
                            const balance = balances[wallet.id] || 0;

                            return (
                                <WalletCard
                                    key={wallet.id}
                                    title={wallet.title}
                                    balance={balance}
                                    currency={wallet.currency}
                                    id={wallet.id}
                                    onClick={() => navigate(`/finance/${wallet.id}`)}
                                    variant={isMainWallet ? 'primary' : 'accent'}
                                    className="snap-start w-[42vw] md:w-[240px] aspect-[1.586/1]"
                                    // Add Events for Action Sheet

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
                            );
                        })
                    ) : null}
                </div>

                {/* Budgets Overview */}
                <SectionHeader
                    title="Budgets"
                    subtitle={`${budgets.filter(b => !b.isArchived).length} budget aktif`}
                    actionLabel="View All"
                    onAction={() => navigate('/finance/budgets')}
                    icon={
                        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                    }
                />
                {budgets.filter(b => !b.isArchived).length > 0 ? (
                    <div className="space-y-2 mb-6">
                        {budgets
                            .filter(b => !b.isArchived)
                            .sort((a, b) => {
                                const summaryA = budgetSummaries[a.id];
                                const summaryB = budgetSummaries[b.id];
                                const percentA = summaryA?.percentageUsed || 0;
                                const percentB = summaryB?.percentageUsed || 0;
                                return percentB - percentA; // Sort by percentage descending
                            })
                            .slice(0, 3) // Top 3 budgets
                            .map(budget => {
                                const summary = budgetSummaries[budget.id];
                                const percentage = summary?.percentageUsed || 0;
                                const spent = summary?.totalSpent || 0;
                                const remaining = summary?.remainingAmount || budget.targetAmount;

                                // Load summary jika belum ada
                                if (!summary) {
                                    loadBudgetSummary(budget.id);
                                }

                                const getProgressColor = () => {
                                    if (percentage >= 100) return 'bg-red-500';
                                    if (percentage >= 90) return 'bg-red-500';
                                    if (percentage >= 70) return 'bg-yellow-500';
                                    return 'bg-green-500';
                                };

                                return (
                                    <div
                                        key={budget.id}
                                        onClick={() => navigate(`/finance/budgets/${budget.id}`)}
                                        className="bg-white dark:bg-secondary rounded-lg p-3 border border-secondary/10 dark:border-white/5 cursor-pointer hover:border-accent/30 transition-colors"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="font-medium text-sm text-text-neutral dark:text-text-primary">{budget.title}</p>
                                                <p className="text-xs text-text-neutral/60 dark:text-text-secondary">
                                                    {budget.period === 'weekly' ? 'Mingguan' : budget.period === 'monthly' ? 'Bulanan' : 'Tahunan'}
                                                </p>
                                            </div>
                                            <p className="text-xs font-mono text-text-neutral/60 dark:text-text-secondary">
                                                {formatCurrencyCompact(spent)} / {formatCurrencyCompact(budget.targetAmount)}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <div className="w-full bg-neutral/20 dark:bg-neutral/40 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-full ${getProgressColor()} transition-all duration-300`}
                                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <p className={`text-xs font-medium ${percentage >= 100 ? 'text-red-600 dark:text-red-400' : 'text-text-neutral/60 dark:text-text-secondary'
                                                    }`}>
                                                    {percentage.toFixed(1)}%
                                                </p>
                                                <p className={`text-xs font-medium ${remaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
                                                    }`}>
                                                    Sisa: {formatCurrencyCompact(remaining)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-text-neutral/60 dark:text-text-secondary mb-6">
                        <button
                            onClick={() => setIsBudgetModalOpen(true)}
                            className="mt-2 text-sm text-accent hover:underline"
                        >
                            Buat budget pertama
                        </button>
                    </div>
                )}

                {/* Recent Transactions */}
                <SectionHeader
                    title="Recent Transactions"
                    subtitle="5 transaksi terakhir"
                    icon={
                        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />
                {recentTransactions.length > 0 ? (
                    <div className="space-y-2">
                        {recentTransactions.map(tx => {
                            const wallet = wallets.find(w => w.id === tx.walletId);
                            return (
                                <ListCard
                                    key={tx.id}
                                    icon={
                                        tx.type === 'income' ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                                            </svg>
                                        )
                                    }
                                    iconVariant={tx.type === 'income' ? 'success' : 'error'}
                                    iconShape="circle"
                                    title={tx.category}
                                    subtitle={`${wallet?.title} • ${dayjs(tx.date).format('DD MMM')}`}
                                    rightContent={
                                        <p className={`select-text text-sm font-bold font-mono ${tx.type === 'income'
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-red-600 dark:text-red-400'
                                            }`}>
                                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, wallet?.currency)}
                                        </p>
                                    }
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-text-neutral/60 dark:text-text-secondary">
                        <p>Belum ada transaksi</p>
                    </div>
                )}

                {/* Loading Overlay */}
                {isLoading && wallets.length === 0 && (
                    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
                    </div>
                )}

                {/* FAB Add Transaction */}
                <FAB onClick={() => setIsTransactionModalOpen(true)} />

                {/* Add Transaction Modal */}
                <AddTransactionModal
                    isOpen={isTransactionModalOpen}
                    onClose={() => setIsTransactionModalOpen(false)}
                    wallets={activeWallets}
                    onSubmit={async (data) => {
                        if (data.walletId) {
                            await createTransaction({ ...data, walletId: data.walletId });
                        }
                    }}
                />

                {/* Create Tracker Modal */}
                <CreateFinanceTrackerModal
                    isOpen={isCreateWalletModalOpen}
                    onClose={() => setIsCreateWalletModalOpen(false)}
                    onSubmit={async (data) => {
                        await createWallet(data);
                    }}
                />

                {/* Edit Wallet Modal */}
                <Modal
                    isOpen={!!editingWallet}
                    onClose={() => setEditingWallet(null)}
                    title="Edit Wallet Info"
                >
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-text-neutral dark:text-text-primary">Wallet Name</label>
                            <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                placeholder="My Wallet"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-text-neutral dark:text-text-primary">Description (Optional)</label>
                            <Input
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                placeholder="e.g. For daily expenses"
                            />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setEditingWallet(null)}
                                className="px-4 py-2 text-sm text-text-neutral/60 hover:text-text-neutral dark:text-text-secondary dark:hover:text-text-primary transition-colors"
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

                {/* Delete Confirmation */}
                <ConfirmDialog
                    isOpen={!!walletToDelete}
                    title="Delete Finance Tracker"
                    message={`Are you sure you want to delete "${walletToDelete?.title}"? All transactions in this tracker will be lost forever.`}
                    confirmText="Delete Tracker"
                    cancelText="Cancel"
                    type="danger"
                    onConfirm={confirmDelete}
                    onCancel={() => setWalletToDelete(null)}
                />



                {/* Mobile Action Sheet */}
                <ActionSheet
                    isOpen={!!actionSheetWallet}
                    onClose={() => setActionSheetWallet(null)}
                    title={actionSheetWallet?.title}
                    items={actionSheetWallet ? getActionSheetItems(actionSheetWallet) : []}
                />

                {/* Budget Modal */}
                <BudgetModal
                    isOpen={isBudgetModalOpen}
                    onClose={() => setIsBudgetModalOpen(false)}
                />
            </div>
        </div>
    );
};
