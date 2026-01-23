import React from 'react';
import { formatCurrency } from '../../utils/currency';

interface WalletCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    title: string;
    balance: number;
    currency?: string;
    id: string; // Used for "card number" decoration
    variant?: 'primary' | 'accent';
}

const WalletIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
);

export const WalletCard: React.FC<WalletCardProps> = ({
    title,
    balance,
    currency = 'IDR',
    id,
    variant = 'accent',
    className = 'w-32 h-40',
    ...props
}) => {
    const colorClass = variant === 'primary'
        ? 'from-primary to-secondary'
        : 'from-accent to-accent';

    return (
        <button
            className={`select-none shrink-0 bg-linear-to-br ${colorClass} rounded-xl p-3 text-left text-white shadow-md hover:shadow-lg transition-shadow relative overflow-hidden flex flex-col ${className}`}
            {...props}
        >
            {/* Decorative pattern */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />

            {/* Wallet Icon */}
            <div className="relative z-10 flex-shrink-0">
                <WalletIcon className="w-6 h-6 mb-2 opacity-90" />
            </div>

            {/* Title */}
            <p className="relative z-10 text-xs font-semibold mb-1 line-clamp-1 opacity-90 w-full">
                {title}
            </p>

            {/* Balance */}
            <div className="mt-auto relative z-10 w-full">
                <p className="select-text text-sm font-bold font-mono truncate">
                    {formatCurrency(balance, currency)}
                </p>

                {/* Card number style decoration */}
                <p className="text-[8px] font-mono opacity-60 mt-1 truncate">
                    •••• {id.slice(-4)}
                </p>
            </div>
        </button>
    );
};
