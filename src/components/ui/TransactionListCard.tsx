
import React from 'react';
import type { FinanceTransaction } from '../../types/finance';
import { ListCard } from './ListCard';

interface TransactionListCardProps {
    transaction: FinanceTransaction;
    /** Optional: action button di kanan (default: nominal amount) */
    rightAction?: React.ReactNode;
    /** Optional: handler unassign khusus untuk budget detail */
    onUnassign?: () => void;
    onClick?: () => void;
    /** Style variant: 'icon' (left large icon) or 'badge' (category badge, no icon) */
    variant?: 'icon' | 'badge';
}

export function TransactionListCard({
    transaction,
    rightAction,
    onUnassign,
    onClick,
    variant = 'icon' // Default to icon style
}: TransactionListCardProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const isIncome = transaction.type === 'income';
    const amountColor = isIncome ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    const amountPrefix = isIncome ? '+' : '-';

    // Helper colors
    const badgeColors = isIncome
        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
        : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300';

    // Render Icon (Only for variant='icon')
    const renderIcon = () => {
        if (variant === 'badge') return undefined; // No icon for badge variant

        return (
            <div className={`
                w-full h-full flex items-center justify-center text-xs font-bold rounded-lg
                ${badgeColors}
            `}>
                {transaction.category.substring(0, 2).toUpperCase()}
            </div>
        );
    };

    // Render Text Content based on variant
    const renderTextContent = () => {
        if (variant === 'badge') {
            // Badge Style: Category Badge -> Description -> Date
            return (
                <div className="flex flex-col items-start gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${badgeColors}`}>
                        {transaction.category}
                    </span>
                    <h3 className="font-medium text-text-neutral dark:text-text-primary truncate w-full">
                        {transaction.description || 'No description'}
                    </h3>
                    <p className="text-xs text-text-neutral/60 dark:text-text-secondary">
                        {formatDate(transaction.date)}
                    </p>
                </div>
            );
        }

        // Default Icon Style: Title -> Subtitle
        return (
            <>
                <h3 className="text-sm font-semibold text-text-neutral dark:text-text-primary truncate">
                    {transaction.description || 'No description'}
                </h3>
                <p className="text-xs text-text-neutral/60 dark:text-text-secondary/60 truncate">
                    {formatDate(transaction.date)} • {transaction.category}
                </p>
            </>
        );
    };

    // Right Content: Nominal + Optional Action (Unassign)
    const renderRightContent = () => {
        if (rightAction) return rightAction;

        return (
            <div className="flex items-center gap-3">
                <div className={`font-semibold ${amountColor}`}>
                    {amountPrefix}{formatCurrency(transaction.amount)}
                </div>

                {onUnassign && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onUnassign();
                        }}
                        className="p-2 rounded-full hover:bg-neutral/10 dark:hover:bg-white/10 transition-colors text-text-neutral/60 hover:text-red-500"
                        title="Unassign form Budget"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        );
    };

    return (
        <ListCard
            icon={renderIcon()}
            // If icon is undefined (badge mode), ListCard usually hides the icon container?
            // We need to check ListCard implementation. If it renders empty container, we might need to adjust props.
            // Assuming ListCard handles null icon by hiding it or we pass iconShape='none'.
            iconShape="none"

            // We use custom textContent for full control
            textContent={renderTextContent()}

            rightContent={renderRightContent()}
            onClick={onClick}
            className={`cursor-default ${onClick ? 'cursor-pointer' : ''}`}
        />
    );
}
