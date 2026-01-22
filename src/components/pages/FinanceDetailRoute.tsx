import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../../state/finance.store';
import { FinancePage } from './FinancePage';

export const FinanceDetailRoute: React.FC = () => {
    const { walletId } = useParams<{ walletId: string }>();
    const { currentWallet, wallets, selectWallet, markWalletAsVisited, isLoading, error } = useFinanceStore();
    const navigate = useNavigate();
    const hasLoadedRef = useRef(false);

    useEffect(() => {
        if (walletId && !hasLoadedRef.current) {
            // Check if wallet exists
            const walletExists = wallets.find(w => w.id === walletId);
            if (!walletExists && wallets.length > 0) {
                // Wallet not found (deleted), redirect to list
                navigate('/finance', { replace: true });
                return;
            }

            // Mark as loaded to prevent re-running
            hasLoadedRef.current = true;

            selectWallet(walletId);
            markWalletAsVisited(walletId);
        }
    }, [walletId, wallets, selectWallet, markWalletAsVisited, navigate]);

    // Reset ref when walletId changes
    useEffect(() => {
        hasLoadedRef.current = false;
    }, [walletId]);

    // Handle Loading State or Error
    // While loading wallet, maybe show loading spinner
    if (isLoading && !currentWallet) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-gray-950 text-text-neutral dark:text-text-secondary">
                Loading tracker...
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-white dark:bg-gray-950 text-red-500 gap-4">
                <div className="text-xl font-bold">Error loading tracker</div>
                <div>{error}</div>
                <button onClick={() => navigate('/finance')} className="underline">Back to list</button>
            </div>
        );
    }

    // If loaded but ID mismatch (should rarely happen due to effect), wait or show 404
    if (!currentWallet || currentWallet.id !== walletId) {
        // Fallback for initial render before effect runs
        return null;
    }

    return <FinancePage />;
};
