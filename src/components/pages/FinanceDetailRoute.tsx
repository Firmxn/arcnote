import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../../state/finance.store';
import { FinancePage } from './FinancePage';

export const FinanceDetailRoute: React.FC = () => {
    const { accountId } = useParams<{ accountId: string }>();
    const { currentAccount, accounts, selectAccount, markAccountAsVisited, isLoading, error } = useFinanceStore();
    const navigate = useNavigate();
    const hasLoadedRef = useRef(false);

    useEffect(() => {
        if (accountId && !hasLoadedRef.current) {
            // Check if account exists
            const accountExists = accounts.find(acc => acc.id === accountId);
            if (!accountExists && accounts.length > 0) {
                // Account not found (deleted), redirect to list
                navigate('/finance', { replace: true });
                return;
            }

            // Mark as loaded to prevent re-running
            hasLoadedRef.current = true;

            selectAccount(accountId);
            markAccountAsVisited(accountId);
        }
    }, [accountId, accounts, selectAccount, markAccountAsVisited, navigate]);

    // Reset ref when accountId changes
    useEffect(() => {
        hasLoadedRef.current = false;
    }, [accountId]);

    // Handle Loading State or Error
    // While loading account, maybe show loading spinner
    if (isLoading && !currentAccount) {
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
    if (!currentAccount || currentAccount.id !== accountId) {
        // Fallback for initial render before effect runs
        return null;
    }

    return <FinancePage />;
};
