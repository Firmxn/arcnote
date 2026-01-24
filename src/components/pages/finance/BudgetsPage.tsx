/**
 * BudgetsPage Component
 * Halaman list semua budgets dengan progress tracking
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../../../state/finance.store';
import { PageHeader } from '../../ui/PageHeader';
import BudgetModal from '../../modals/BudgetModal';
import type { Budget } from '../../../types/finance';

export default function BudgetsPage() {
    const navigate = useNavigate();
    const { budgets, budgetSummaries, loadBudgets, loadBudgetSummary, isLoading } = useFinanceStore();
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadBudgets();
    }, [loadBudgets]);

    // Load summaries untuk semua budgets
    useEffect(() => {
        budgets.forEach(budget => {
            if (!budgetSummaries[budget.id]) {
                loadBudgetSummary(budget.id);
            }
        });
    }, [budgets, budgetSummaries, loadBudgetSummary]);

    const handleCreateBudget = () => {
        setIsModalOpen(true);
    };

    const handleBudgetClick = (budgetId: string) => {
        navigate(`/finance/budgets/${budgetId}`);
    };

    // Filter hanya budget yang tidak di-archive
    const activeBudgets = budgets.filter(b => !b.isArchived);

    return (
        <div className="h-full w-full bg-neutral dark:bg-primary flex flex-col min-h-0">
            <div className="flex-1 flex flex-col min-h-0">
                {/* Header */}
                <div className="max-w-7xl w-full mx-auto px-4 md:px-8 pt-6 md:pt-12 shrink-0">
                    <PageHeader
                        title="Budgets"
                        description="Track your spending against targets"
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
                    />

                    {/* Desktop Button - Hidden on Mobile */}
                    <button
                        onClick={handleCreateBudget}
                        className="hidden md:flex px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors items-center justify-center gap-2 font-medium mb-6"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        New Budget
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto min-h-0 pb-[100px]">
                    {isLoading && budgets.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
                        </div>
                    ) : activeBudgets.length === 0 ? (
                        <div className="h-full max-w-7xl mx-auto w-full flex flex-col items-center justify-center text-center px-4">
                            <div className="text-6xl mb-4">💰</div>
                            <h3 className="text-xl font-semibold text-text-neutral dark:text-text-primary mb-2">
                                Belum Ada Budget
                            </h3>
                            <p className="text-text-neutral/60 dark:text-text-secondary mb-6">
                                Buat budget untuk tracking pengeluaran Anda
                            </p>
                            <button
                                onClick={handleCreateBudget}
                                className="px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors font-medium"
                            >
                                Buat Budget Pertama
                            </button>
                        </div>
                    ) : (
                        <div className="max-w-7xl mx-auto w-full px-4 md:px-8">
                            <div className="space-y-3">
                                {activeBudgets.map((budget) => (
                                    <BudgetCard
                                        key={budget.id}
                                        budget={budget}
                                        summary={budgetSummaries[budget.id]}
                                        onClick={() => handleBudgetClick(budget.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Action Button - Mobile Only */}
            <button
                onClick={handleCreateBudget}
                className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-accent hover:bg-accent-hover text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-50"
                aria-label="Create Budget"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-6 h-6"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
            </button>

            {/* Budget Modal */}
            <BudgetModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}

/**
 * BudgetCard Component
 * Card untuk display budget dengan progress bar
 */
interface BudgetCardProps {
    budget: Budget;
    summary?: {
        totalSpent: number;
        percentageUsed: number;
        remainingAmount: number;
        isOverBudget: boolean;
    };
    onClick: () => void;
}

function BudgetCard({ budget, summary, onClick }: BudgetCardProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getPeriodLabel = (period: string) => {
        switch (period) {
            case 'weekly': return 'Mingguan';
            case 'monthly': return 'Bulanan';
            case 'yearly': return 'Tahunan';
            default: return period;
        }
    };

    // Color coding berdasarkan percentage
    const getProgressColor = (percentage: number) => {
        if (percentage >= 100) return 'bg-red-500';
        if (percentage >= 90) return 'bg-red-500';
        if (percentage >= 70) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const spent = summary?.totalSpent || 0;
    const percentage = summary?.percentageUsed || 0;
    const remaining = summary?.remainingAmount || budget.targetAmount;

    return (
        <div
            onClick={onClick}
            className="bg-white dark:bg-secondary rounded-lg p-4 border border-secondary/10 dark:border-white/5 cursor-pointer hover:border-accent/30 transition-colors"
        >
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-semibold text-lg text-text-neutral dark:text-text-primary">{budget.title}</h3>
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-accent/10 text-accent">
                        {getPeriodLabel(budget.period)}
                    </span>
                </div>
                <div className="text-right">
                    <div className="text-sm text-text-neutral/60 dark:text-text-secondary">Target</div>
                    <div className="font-semibold text-text-neutral dark:text-text-primary">{formatCurrency(budget.targetAmount)}</div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="w-full bg-neutral/20 dark:bg-neutral/40 rounded-full h-3 overflow-hidden">
                    <div
                        className={`h-full ${getProgressColor(percentage)} transition-all duration-300`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                </div>

                {/* Stats */}
                <div className="flex justify-between items-center text-sm">
                    <div>
                        <span className="text-text-neutral/60 dark:text-text-secondary">Terpakai: </span>
                        <span className="font-semibold text-text-neutral dark:text-text-primary">{formatCurrency(spent)}</span>
                    </div>
                    <div className={percentage >= 100 ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-text-neutral/60 dark:text-text-secondary'}>
                        {percentage.toFixed(1)}%
                    </div>
                </div>

                {/* Remaining */}
                <div className="text-sm">
                    <span className="text-text-neutral/60 dark:text-text-secondary">Sisa: </span>
                    <span className={`font-semibold ${remaining < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {formatCurrency(remaining)}
                    </span>
                </div>
            </div>

            {/* Over Budget Warning */}
            {summary?.isOverBudget && (
                <div className="mt-3 flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="shrink-0 h-5 w-5 text-red-600 dark:text-red-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                    </svg>
                    <span className="text-sm text-red-600 dark:text-red-400 font-medium">Budget terlampaui!</span>
                </div>
            )}
        </div>
    );
}
