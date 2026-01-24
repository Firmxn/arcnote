

import type { Budget } from '../../types/finance';

interface BudgetCardProps {
    budget: Budget;
    summary?: {
        totalSpent: number;
        percentageUsed: number;
        remainingAmount: number;
        isOverBudget: boolean;
    };
    onClick?: () => void;
    className?: string;
    showOverBudgetWarning?: boolean;
}

export function BudgetCard({
    budget,
    summary,
    onClick,
    className = '',
    showOverBudgetWarning = true
}: BudgetCardProps) {
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
    const remaining = summary?.remainingAmount ?? budget.targetAmount;
    const isClickable = !!onClick;

    return (
        <div
            onClick={onClick}
            className={`bg-white dark:bg-secondary rounded-lg p-4 border border-secondary/10 dark:border-white/5 ${isClickable ? 'cursor-pointer hover:border-accent/30 transition-colors' : ''
                } ${className}`}
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
            {showOverBudgetWarning && summary?.isOverBudget && (
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
