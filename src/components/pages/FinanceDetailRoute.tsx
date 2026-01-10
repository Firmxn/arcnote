import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../../state/finance.store';
import { FinancePage } from './FinancePage';

export const FinanceDetailRoute: React.FC = () => {
    const { accountId } = useParams<{ accountId: string }>();
    const { currentAccount, selectAccount, markAccountAsVisited, isLoading, error } = useFinanceStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (accountId) {
            selectAccount(accountId);
            markAccountAsVisited(accountId);
        }
    }, [accountId, selectAccount, markAccountAsVisited]);

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
