import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../../state/finance.store';
import { Button } from '../ui/Button';
import { AddTransactionModal } from '../modals/AddTransactionModal';
import dayjs from 'dayjs';
import type { FinanceTransaction } from '../../types/finance';
import { FAB } from '../ui/FAB';
import { MiniFAB } from '../ui/MiniFAB';

export const FinancePage: React.FC = () => {
    const {
        currentAccount,
        transactions,
        summary,
        createTransaction,
        updateTransaction,
        deleteTransaction,
        isLoading
    } = useFinanceStore();

    const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: currentAccount?.currency || 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handleTransactionClick = (transaction: FinanceTransaction) => {
        setSelectedTransaction(transaction);
        setModalMode('edit');
        setIsModalOpen(true);
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
            className="h-full w-full overflow-y-auto bg-neutral dark:bg-primary"
            onScroll={handleScroll}
        >
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-12 pb-[100px] md:pb-12">
                {/* Header with Back Button */}
                <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
                    <button
                        onClick={() => navigate('/finance')}
                        className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-text-neutral dark:text-text-secondary transition-colors"
                        title="Back to wallets"
                    >
                        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-text-neutral dark:text-text-primary mb-1">
                            {currentAccount?.title || 'Finance Tracker'}
                        </h1>
                        <p className="text-sm md:text-base text-text-neutral/60 dark:text-text-secondary">
                            {currentAccount?.description || 'Track your income and expenses'}
                        </p>
                    </div>
                </div>

                {/* Summary Cards */}
                {summary && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        {/* Total Income */}
                        <div className="bg-white dark:bg-secondary rounded-2xl p-4 md:p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
                                    <svg className="w-4 h-4 md:w-5 md:h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <h3 className="text-xs md:text-sm font-medium text-text-neutral/60 dark:text-text-secondary">Total Income</h3>
                            </div>
                            <p className="text-xl md:text-2xl font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(summary.totalIncome)}
                            </p>
                        </div>

                        {/* Total Expense */}
                        <div className="bg-white dark:bg-secondary rounded-2xl p-4 md:p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center">
                                    <svg className="w-4 h-4 md:w-5 md:h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                    </svg>
                                </div>
                                <h3 className="text-xs md:text-sm font-medium text-text-neutral/60 dark:text-text-secondary">Total Expense</h3>
                            </div>
                            <p className="text-xl md:text-2xl font-bold text-red-600 dark:text-red-400">
                                {formatCurrency(summary.totalExpense)}
                            </p>
                        </div>

                        {/* Balance */}
                        <div className="bg-white dark:bg-secondary rounded-2xl p-4 md:p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                                    <svg className="w-4 h-4 md:w-5 md:h-5 text-primary dark:text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xs md:text-sm font-medium text-text-neutral/60 dark:text-text-secondary">Balance</h3>
                            </div>
                            <p className={`text-xl md:text-2xl font-bold ${summary.balance >= 0 ? 'text-primary dark:text-accent' : 'text-red-600 dark:text-red-400'}`}>
                                {formatCurrency(summary.balance)}
                            </p>
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
                        <div className="text-center py-20">
                            <div className="text-6xl mb-4">💸</div>
                            <h3 className="text-xl font-semibold text-text-neutral dark:text-text-primary mb-2">
                                No transactions yet
                            </h3>
                            <p className="text-text-neutral/60 dark:text-text-secondary mb-4">
                                Start tracking your finances by adding a transaction
                            </p>
                            {!isMobile && (
                                <Button variant="accent" onClick={handleAddClick}>
                                    Add Your First Transaction
                                </Button>
                            )}
                        </div>
                    ) : (
                        filteredTransactions.map((transaction) => (
                            <div
                                key={transaction.id}
                                onClick={() => handleTransactionClick(transaction)}
                                className="bg-white dark:bg-secondary rounded-xl p-4 shadow-sm hover:shadow-md cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 active:scale-[0.99] transition-all duration-200"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${transaction.type === 'income'
                                            ? 'bg-green-500/10 dark:bg-green-500/20'
                                            : 'bg-red-500/10 dark:bg-red-500/20'
                                            }`}>
                                            <svg className={`w-6 h-6 ${transaction.type === 'income'
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-red-600 dark:text-red-400'
                                                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                    d={transaction.type === 'income' ? "M12 4v16m8-8H4" : "M20 12H4"}
                                                />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-text-neutral dark:text-text-primary">
                                                {transaction.category}
                                            </h4>
                                            <p className="text-sm text-text-neutral/60 dark:text-text-secondary">
                                                {transaction.description || 'No description'}
                                            </p>
                                            <p className="text-xs text-text-neutral/50 dark:text-text-secondary/70 mt-1">
                                                {dayjs(transaction.date).format('DD MMM YYYY')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-xl font-bold ${transaction.type === 'income'
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-red-600 dark:text-red-400'
                                            }`}>
                                            {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                                        </p>
                                    </div>
                                </div>
                            </div>
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
                        if (!currentAccount) return;
                        await createTransaction({ ...data, accountId: currentAccount.id });
                    } else if (modalMode === 'edit' && selectedTransaction) {
                        await updateTransaction(selectedTransaction.id, data);
                    }
                }}
            />
        </div>
    );
};
