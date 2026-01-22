/**
 * Format nuber to currency string (IDR default)
 * Standard format: -Rp 10.000
 */
export const formatCurrency = (amount: number, currency: string = 'IDR') => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

/**
 * Format currency to compact string (e.g. 1.5M, 10K)
 * Output format: -Rp 10K
 */
export const formatCurrencyCompact = (amount: number) => {
    const isNegative = amount < 0;
    const absAmount = Math.abs(amount);
    let formatted = '';

    if (absAmount >= 1000000000) {
        formatted = `${(absAmount / 1000000000).toFixed(1)}B`;
    } else if (absAmount >= 1000000) {
        formatted = `${(absAmount / 1000000).toFixed(1)}M`;
    } else if (absAmount >= 1000) {
        formatted = `${(absAmount / 1000).toFixed(0)}K`;
    } else {
        formatted = absAmount.toString();
    }
    return `${isNegative ? '-' : ''}Rp ${formatted}`;
};
