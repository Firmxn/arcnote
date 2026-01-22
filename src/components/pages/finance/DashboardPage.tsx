import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../../../state/finance.store';
import { SectionHeader } from '../../ui/SectionHeader';
import { ListCard } from '../../ui/ListCard';
import { FAB } from '../../ui/FAB';
import { AddTransactionModal } from '../../modals/AddTransactionModal';
import { CreateFinanceTrackerModal } from '../../modals/CreateFinanceTrackerModal';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { formatCurrency, formatCurrencyCompact } from '../../../utils/currency';

dayjs.extend(relativeTime);

// Reuse WalletIcon dari WalletsPage
const WalletIcon = ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
);





export const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const {
        wallets,
        balances,
        globalSummary,
        monthlySummary,
        recentTransactions,
        loadWallets,
        loadBalances,
        loadGlobalSummary,
        loadMonthlySummary,
        loadRecentTransactions,
        createTransaction,
        createWallet,
        isLoading
    } = useFinanceStore();

    // State untuk toggle compact/detail view
    const [showDetailView, setShowDetailView] = React.useState(false);
    // State untuk modal add transaction
    const [isTransactionModalOpen, setIsTransactionModalOpen] = React.useState(false);
    // State untuk modal create wallet from dashboard
    const [isCreateWalletModalOpen, setIsCreateWalletModalOpen] = React.useState(false);

    // Load data saat mount - Optimized untuk menghindari loading flash
    useEffect(() => {
        const loadData = async () => {
            // Load wallets dulu
            await loadWallets();

            // Kemudian load data dashboard lainnya secara parallel
            // Kita panggil ini di sini agar flows-nya jelas: Wallet -> Data lain
            loadBalances();
            loadGlobalSummary();
            loadMonthlySummary();
            loadRecentTransactions(5);
        };

        loadData();
    }, [loadWallets, loadBalances, loadGlobalSummary, loadMonthlySummary, loadRecentTransactions]);

    // Filter active wallets
    const activeWallets = wallets.filter(w => !w.isArchived);
    const currentMonth = dayjs().format('MMMM YYYY');

    return (
        <div className="flex-1 h-full overflow-y-auto bg-neutral [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 md:pt-12">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-text-neutral dark:text-text-primary">
                        Finance
                    </h1>
                    <p className="text-sm md:text-base text-text-neutral/60 dark:text-text-secondary">
                        Overview keuangan kamu
                    </p>
                </div>

                {/* Combined Balance & Summary Card */}
                <div className="bg-white dark:bg-secondary rounded-xl p-4 md:p-6 mb-6 border border-secondary/10 dark:border-white/5">
                    {/* Total Balance Section */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-text-neutral/60 dark:text-text-secondary">Total Balance</p>
                            <p className="text-xs text-text-neutral/50 dark:text-text-secondary/50">
                                {currentMonth}
                            </p>
                        </div>
                        <p className="text-3xl md:text-4xl font-bold font-mono tracking-tight text-primary dark:text-accent mb-1">
                            {globalSummary ? formatCurrency(globalSummary.balance) : 'Rp 0'}
                        </p>
                        <p className="text-xs text-text-neutral/50 dark:text-text-secondary/50">
                            {activeWallets.length} wallet aktif
                        </p>
                    </div>

                    {/* Monthly Summary - Tap untuk toggle detail */}
                    <div className="grid grid-cols-3 gap-2">
                        {/* Income */}
                        <button
                            onClick={() => setShowDetailView(!showDetailView)}
                            className="select-none bg-green-50 dark:bg-green-900/10 rounded-lg p-2 text-left active:scale-95 transition-transform"
                        >
                            <p className="text-[10px] text-green-600 dark:text-green-400 mb-1 flex items-center gap-0.5">
                                Income
                                <svg className="w-2.5 h-2.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </p>
                            <p className="select-text text-xs md:text-sm font-bold font-mono text-green-600 dark:text-green-400 wrap-break-word">
                                {showDetailView
                                    ? formatCurrency(monthlySummary?.totalIncome || 0)
                                    : formatCurrencyCompact(monthlySummary?.totalIncome || 0)
                                }
                            </p>
                        </button>

                        {/* Expense */}
                        <button
                            onClick={() => setShowDetailView(!showDetailView)}
                            className="select-none bg-red-50 dark:bg-red-900/10 rounded-lg p-2 text-left active:scale-95 transition-transform"
                        >
                            <p className="text-[10px] text-red-600 dark:text-red-400 mb-1 flex items-center gap-0.5">
                                Expense
                                <svg className="w-2.5 h-2.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </p>
                            <p className="select-text text-xs md:text-sm font-bold font-mono text-red-600 dark:text-red-400 wrap-break-word">
                                {showDetailView
                                    ? formatCurrency(monthlySummary?.totalExpense || 0)
                                    : formatCurrencyCompact(monthlySummary?.totalExpense || 0)
                                }
                            </p>
                        </button>

                        {/* Net */}
                        <button
                            onClick={() => setShowDetailView(!showDetailView)}
                            className={`select-none rounded-lg p-2 text-left active:scale-95 transition-transform ${(monthlySummary?.balance || 0) >= 0
                                ? 'bg-blue-50 dark:bg-blue-900/10'
                                : 'bg-red-50 dark:bg-red-900/10'
                                }`}
                        >
                            <p className={`text-[10px] mb-1 flex items-center gap-0.5 ${(monthlySummary?.balance || 0) >= 0
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-red-600 dark:text-red-400'
                                }`}>
                                Net
                                <svg className="w-2.5 h-2.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </p>
                            <p className={`select-text text-xs md:text-sm font-bold font-mono wrap-break-word ${(monthlySummary?.balance || 0) >= 0
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-red-600 dark:text-red-400'
                                }`}>
                                {showDetailView
                                    ? formatCurrency(monthlySummary?.balance || 0)
                                    : formatCurrencyCompact(monthlySummary?.balance || 0)
                                }
                            </p>
                        </button>
                    </div>
                </div>

                {/* Wallets Horizontal Scroll */}
                <SectionHeader
                    title="Wallets"
                    subtitle={`${activeWallets.length} wallet`}
                    actionLabel="View All"
                    onAction={() => navigate('/finance/wallets')}
                    icon={
                        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    }
                />
                <div className="flex gap-3 overflow-x-auto pb-4 mb-6 -mx-4 px-4 scrollbar-hide">
                    {/* Add Wallet Button */}
                    <button
                        onClick={() => setIsCreateWalletModalOpen(true)}
                        className="select-none shrink-0 w-32 h-40 bg-accent/10 dark:bg-accent/20 rounded-xl border-2 border-dashed border-accent/30 dark:border-accent/40 flex flex-col items-center justify-center gap-2 hover:bg-accent/20 dark:hover:bg-accent/30 transition-colors"
                    >
                        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <p className="text-xs font-medium text-accent">Add Wallet</p>
                    </button>

                    {/* Wallet Cards - tampil 2.25 cards untuk hint scrollable */}
                    {activeWallets.length > 0 ? (
                        activeWallets.map((wallet, index) => {
                            // Main wallet (pertama) = primary-secondary, lainnya = accent
                            const isMainWallet = index === 0;
                            const colorClass = isMainWallet
                                ? 'from-primary to-secondary'
                                : 'from-accent to-accent';

                            return (
                                <button
                                    key={wallet.id}
                                    onClick={() => navigate(`/finance/${wallet.id}`)}
                                    className={`select-none shrink-0 w-32 h-40 bg-linear-to-br ${colorClass} rounded-xl p-3 text-left text-white shadow-md hover:shadow-lg transition-shadow relative overflow-hidden`}
                                >
                                    {/* Decorative pattern */}
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />

                                    {/* Wallet Icon */}
                                    <div className="relative z-10">
                                        <WalletIcon className="w-6 h-6 mb-2 opacity-90" />
                                    </div>

                                    {/* Title */}
                                    <p className="relative z-10 text-xs font-semibold mb-1 line-clamp-1 opacity-90">
                                        {wallet.title}
                                    </p>

                                    {/* Balance */}
                                    <p className="select-text relative z-10 text-sm font-bold font-mono mt-auto">
                                        {formatCurrency(balances[wallet.id] || 0, wallet.currency)}
                                    </p>

                                    {/* Card number style decoration */}
                                    <p className="relative z-10 text-[8px] font-mono opacity-60 mt-1">
                                        •••• {wallet.id.slice(-4)}
                                    </p>
                                </button>
                            );
                        })
                    ) : (
                        <div className="shrink-0 w-full text-center py-8">
                            <p className="text-text-neutral/60 dark:text-text-secondary text-sm">
                                Belum ada wallet
                            </p>
                        </div>
                    )}
                </div>

                {/* Recent Transactions */}
                <SectionHeader
                    title="Recent Transactions"
                    subtitle="5 transaksi terakhir"
                    icon={
                        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />
                {recentTransactions.length > 0 ? (
                    <div className="space-y-2">
                        {recentTransactions.map(tx => {
                            const wallet = wallets.find(w => w.id === tx.walletId);
                            return (
                                <ListCard
                                    key={tx.id}
                                    icon={
                                        tx.type === 'income' ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                                            </svg>
                                        )
                                    }
                                    iconVariant={tx.type === 'income' ? 'success' : 'error'}
                                    iconShape="circle"
                                    title={tx.category}
                                    subtitle={`${wallet?.title} • ${dayjs(tx.date).format('DD MMM')}`}
                                    rightContent={
                                        <p className={`select-text text-sm font-bold font-mono ${tx.type === 'income'
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-red-600 dark:text-red-400'
                                            }`}>
                                            {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, wallet?.currency)}
                                        </p>
                                    }
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-text-neutral/60 dark:text-text-secondary">
                        <p>Belum ada transaksi</p>
                    </div>
                )}

                {/* Loading Overlay - Hanya tampil jika belum ada data sama sekali */}
                {isLoading && wallets.length === 0 && (
                    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent"></div>
                    </div>
                )}

                {/* FAB Add Transaction */}
                <FAB onClick={() => setIsTransactionModalOpen(true)} />

                {/* Add Transaction Modal */}
                <AddTransactionModal
                    isOpen={isTransactionModalOpen}
                    onClose={() => setIsTransactionModalOpen(false)}
                    wallets={activeWallets}
                    onSubmit={async (data) => {
                        if (data.walletId) {
                            await createTransaction({ ...data, walletId: data.walletId });
                        }
                    }}
                />

                {/* Create Tracker Modal */}
                <CreateFinanceTrackerModal
                    isOpen={isCreateWalletModalOpen}
                    onClose={() => setIsCreateWalletModalOpen(false)}
                    onSubmit={async (data) => {
                        await createWallet(data);
                        // Data refresh handled by store updates or existing effects
                    }}
                />
            </div>
        </div>
    );
};
