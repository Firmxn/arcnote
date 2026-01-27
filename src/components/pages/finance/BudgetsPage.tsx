/**
 * BudgetsPage Component
 * Halaman list semua budgets dengan progress tracking
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../../../state/finance.store';
import { PageHeader } from '../../ui/PageHeader';
import { FAB } from '../../ui/FAB';
import BudgetModal from '../../modals/BudgetModal';
import { BudgetCard } from '../../ui/BudgetCard';

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
            <FAB
                onClick={handleCreateBudget}
                aria-label="Create Budget"
                icon={
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
                }
            />

            {/* Budget Modal */}
            <BudgetModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
