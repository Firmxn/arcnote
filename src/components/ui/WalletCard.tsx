import React, { useMemo } from 'react';
import { formatCurrency } from '../../utils/currency';

interface WalletCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    title: string;
    balance: number;
    currency?: string;
    id: string; // Used for "card number" decoration
    theme?: string;
    variant?: 'primary' | 'accent';
    className?: string; // Add explicit className to props
}

export const WALLET_THEMES: Record<string, string> = {
    'blue': 'from-blue-600 to-blue-400',
    'red': 'from-red-600 to-red-400',
    'green': 'from-green-600 to-green-400',
    'orange': 'from-orange-600 to-orange-400',
    'purple': 'from-purple-600 to-purple-400',
    'pink': 'from-pink-600 to-pink-400',
    'teal': 'from-teal-600 to-teal-400',
    'slate': 'from-slate-600 to-slate-400',
    'amber': 'from-amber-600 to-amber-400',
    'indigo': 'from-indigo-600 to-indigo-400',
    'cyan': 'from-cyan-600 to-cyan-400',
    'emerald': 'from-emerald-600 to-emerald-400',
    'rose': 'from-rose-600 to-rose-400',
    'violet': 'from-violet-600 to-violet-400',
    'fuchsia': 'from-fuchsia-600 to-fuchsia-400',
    'lime': 'from-lime-600 to-lime-400',
    // Default system themes
    'primary': 'from-[var(--color-bg-primary)] to-[var(--color-bg-secondary)]',
    'accent': 'from-[var(--color-bg-accent)] to-[var(--color-bg-accent)]', // Fallback
};

export const WalletCard: React.FC<WalletCardProps> = ({
    title,
    balance,
    currency = 'IDR',
    id,
    variant = 'accent',
    theme,
    className = 'w-32 h-40',
    ...props
}) => {
    const backgroundClass = useMemo(() => {
        // 1. If theme is provided and exists in our map, use it
        if (theme && WALLET_THEMES[theme]) {
            return WALLET_THEMES[theme];
        }

        // 2. Fallback to variant logic
        if (variant === 'primary') {
            return 'from-primary to-secondary';
        }

        // Default accent
        return 'from-accent to-accent';
    }, [theme, variant]);

    return (
        <button
            className={`select-none shrink-0 bg-linear-to-br ${backgroundClass} rounded-xl p-3 text-left text-white shadow-md hover:shadow-lg transition-shadow relative overflow-hidden flex flex-col ${className}`}
            {...props}
        >
            {/* Decorative pattern */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />

            {/* Wallet Icon */}
            <div className="relative z-10 flex-shrink-0">
                <svg className="w-6 h-6 mb-2 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
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
