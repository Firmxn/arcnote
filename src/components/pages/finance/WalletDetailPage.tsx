import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../../../state/finance.store';
import { Button } from '../../ui/Button';
import { AddTransactionModal } from '../../modals/AddTransactionModal';
import { TransferModal } from '../../modals/TransferModal';
import { TransferDetailModal } from '../../modals/TransferDetailModal';
import dayjs from 'dayjs';
import type { FinanceTransaction } from '../../../types/finance';
import { formatCurrency, formatCurrencyCompact } from '../../../utils/currency';
import { FAB } from '../../ui/FAB';
import { MiniFAB } from '../../ui/MiniFAB';
import { PageHeader } from '../../ui/PageHeader';
import { ListCard } from '../../ui/ListCard';
import { EmptyStateAction } from '../../ui/EmptyStateAction';

export const WalletDetailPage: React.FC = () => {
    const {
        currentWallet,
        transactions,
        summary,
        createTransaction,
        updateTransaction,
        deleteTransaction,
        wallets,
        balances,
        loadBalances,
        transferBetweenWallets,
        isLoading,
        isBalanceHidden,
        toggleBalanceHidden
    } = useFinanceStore();

    const maskAmount = (amount: number, currency?: string) => {
        return isBalanceHidden ? '******' : formatCurrency(amount, currency);
    };

    const maskAmountCompact = (amount: number) => {
        return isBalanceHidden ? '******' : formatCurrencyCompact(amount);
    };

    const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
    const [showDetailView, setShowDetailView] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isTransferDetailOpen, setIsTransferDetailOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<FinanceTransaction | undefined>(undefined);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [isFabHidden, setIsFabHidden] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const navigate = useNavigate();

    const filteredTransactions = filter === 'all'
        ? transactions
        : transactions.filter(t => t.type === filter);



    const handleTransactionClick = (transaction: FinanceTransaction) => {
        // Cek apakah transaksi adalah transfer
        if (transaction.category === 'Transfer In' || transaction.category === 'Transfer Out') {
            setSelectedTransaction(transaction);
            setIsTransferDetailOpen(true);
        } else {
            setSelectedTransaction(transaction);
            setModalMode('edit');
            setIsModalOpen(true);
        }
    };

    // Ref for scroll to top
    const containerRef = useRef<HTMLDivElement>(null);

    const handleAddClick = () => {
        setSelectedTransaction(undefined);
        setModalMode('create');
        setIsModalOpen(true);
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        // Hide FAB when reached bottom (threshold 50px)
        const isBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
        setIsFabHidden(isBottom);
    };

    const scrollToTop = () => {
        containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div
            ref={containerRef}
            className="h-full w-full overflow-y-auto bg-neutral dark:bg-primary [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
            onScroll={handleScroll}
        >
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-12 pb-[100px] md:pb-12">
                {/* Header with Back Button */}
                <PageHeader
                    title={currentWallet?.title || 'Finance Tracker'}
                    description={currentWallet?.description || 'Track your income and expenses'}
                    className="md:mb-8"
                    leading={
                        <button
                            onClick={() => navigate('/finance')}
                            className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-text-neutral dark:text-text-secondary transition-colors"
                            title="Back to wallets"
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
                                title="Transfer ke wallet lain"
                            >
                                <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            </button>
                        )
                    }
                />

                {/* Combined Balance & Summary Card */}
                {summary && (
                    <div className="bg-white dark:bg-secondary rounded-xl p-4 md:p-6 mb-6 border border-secondary/10 dark:border-white/5">
                        {/* Total Balance Section */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-text-neutral/60 dark:text-text-secondary">Current Balance</p>
                                <p className="text-xs text-text-neutral/50 dark:text-text-secondary/50">
                                    {dayjs().format('MMMM YYYY')}
                                </p>
                            </div>
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-3xl md:text-4xl font-bold font-mono tracking-tight text-primary dark:text-accent">
                                    {maskAmount(summary.balance, currentWallet?.currency || 'IDR')}
                                </p>
                                <button
                                    onClick={toggleBalanceHidden}
                                    className="p-2 -mr-2 text-text-neutral/40 hover:text-text-neutral/80 dark:text-text-secondary/40 dark:hover:text-text-secondary transition-colors rounded-full hover:bg-neutral/10 dark:hover:bg-white/5"
                                    aria-label={isBalanceHidden ? "Show Balance" : "Hide Balance"}
                                >
                                    {isBalanceHidden ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Monthly Summary - Tap untuk toggle detail */}
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
                                        ? maskAmount(summary.totalIncome || 0, currentWallet?.currency || 'IDR')
                                        : maskAmountCompact(summary.totalIncome || 0)
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
                                        ? maskAmount(summary.totalExpense || 0, currentWallet?.currency || 'IDR')
                                        : maskAmountCompact(summary.totalExpense || 0)
                                    }
                                </p>
                            </button>

                            {/* Net */}
                            <button
                                onClick={() => setShowDetailView(!showDetailView)}
                                className={`select-none rounded-lg p-2 text-left active:scale-95 transition-transform ${(summary.balance || 0) >= 0
                                    ? 'bg-blue-50 dark:bg-blue-900/10'
                                    : 'bg-red-50 dark:bg-red-900/10'
                                    }`}
                            >
                                <p className={`text-[10px] mb-1 flex items-center gap-0.5 ${(summary.balance || 0) >= 0
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-red-600 dark:text-red-400'
                                    }`}>
                                    Net
                                    <svg className="w-2.5 h-2.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </p>
                                <p className={`select-text text-xs md:text-sm font-bold font-mono wrap-break-word ${(summary.balance || 0) >= 0
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : 'text-red-600 dark:text-red-400'
                                    }`}>
                                    {showDetailView
                                        ? maskAmount(summary.balance || 0, currentWallet?.currency || 'IDR')
                                        : maskAmountCompact(summary.balance || 0)
                                    }
                                </p>
                            </button>
                        </div>
                    </div>
                )}

                {/* Actions & Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-2 md:mb-6">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        <Button
                            variant={filter === 'all' ? 'accent' : 'ghost'}
                            size="sm"
                            onClick={() => setFilter('all')}
                        >
                            All
                        </Button>
                        <Button
                            variant={filter === 'income' ? 'accent' : 'ghost'}
                            size="sm"
                            onClick={() => setFilter('income')}
                        >
                            Income
                        </Button>
                        <Button
                            variant={filter === 'expense' ? 'accent' : 'ghost'}
                            size="sm"
                            onClick={() => setFilter('expense')}
                        >
                            Expense
                        </Button>
                    </div>

                    {!isMobile && (
                        <Button
                            variant="accent"
                            className="w-full lg:w-auto"
                            onClick={handleAddClick}
                            leftIcon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            }
                        >
                            Add Transaction
                        </Button>
                    )}
                </div>

                {/* Transactions List */}
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="text-center py-20">
                            <p className="text-text-neutral/60 dark:text-text-secondary">Loading...</p>
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="flex items-center justify-center min-h-[400px]">
                            <EmptyStateAction
                                label="Add Your First Transaction"
                                onClick={handleAddClick}
                            />
                        </div>
                    ) : (
                        filteredTransactions.map((transaction) => (
                            <ListCard
                                key={transaction.id}
                                onClick={() => handleTransactionClick(transaction)}
                                icon={
                                    transaction.type === 'income' ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                                        </svg>
                                    )
                                }
                                iconVariant={transaction.type === 'income' ? 'success' : 'error'}
                                iconShape="circle"
                                title={transaction.category}
                                subtitle={`${transaction.description || 'No description'} • ${dayjs(transaction.date).format('DD MMM')}`}
                                rightContent={
                                    <p className={`select-text text-sm font-bold font-mono ${transaction.type === 'income'
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {transaction.type === 'income' ? '+' : '-'}{maskAmount(transaction.amount, currentWallet?.currency || 'IDR')}
                                    </p>
                                }
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Floating Action Button - Mobile Only */}
            <FAB onClick={handleAddClick} title="Add Transaction" hide={isFabHidden} />
            <MiniFAB onClick={scrollToTop} show={isFabHidden} />

            {/* Add/Edit Transaction Modal */}
            <AddTransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialData={selectedTransaction}
                mode={modalMode}
                onDelete={modalMode === 'edit' && selectedTransaction ? async () => {
                    await deleteTransaction(selectedTransaction.id);
                } : undefined}
                onSubmit={async (data) => {
                    if (modalMode === 'create') {
                        if (!currentWallet) return;
                        await createTransaction({ ...data, walletId: currentWallet.id });
                    } else if (modalMode === 'edit' && selectedTransaction) {
                        await updateTransaction(selectedTransaction.id, data);
                    }
                }}
            />

            {/* Transfer Modal */}
            <TransferModal
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                wallets={wallets}
                balances={balances}
                defaultFromWalletId={currentWallet?.id}
                onSubmit={async (data) => {
                    await transferBetweenWallets(
                        data.fromWalletId,
                        data.toWalletId,
                        data.amount,
                        data.description,
                        data.date
                    );
                }}
            />

            {/* Transfer Detail Modal */}
            {selectedTransaction && (
                <TransferDetailModal
                    isOpen={isTransferDetailOpen}
                    onClose={() => setIsTransferDetailOpen(false)}
                    transaction={selectedTransaction}
                    currentWallet={currentWallet!}
                    linkedWallet={wallets.find(w => w.id === selectedTransaction.linkedWalletId)}
                    onNavigateToWallet={(walletId) => {
                        navigate(`/finance/${walletId}`);
                    }}
                    onCancel={async () => {
                        // Delete kedua transaksi (current dan linked)
                        await deleteTransaction(selectedTransaction.id);
                        if (selectedTransaction.linkedTransactionId) {
                            await deleteTransaction(selectedTransaction.linkedTransactionId);
                        }
                        // PENTING: Reload balances untuk mengembalikan saldo
                        await loadBalances();
                    }}
                />
            )}
        </div>
    );
};
