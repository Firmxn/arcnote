/**
 * AssignTransactionModal Component
 * Modal untuk memilih transaksi yang akan di-assign ke budget tertentu
 */

import { useState, useEffect } from 'react';
import { useFinanceStore } from '../../state/finance.store';
import { financeRepository } from '../../data/finance.repository'; // Direct access to repo
import type { FinanceTransaction } from '../../types/finance';
import { Radio } from '../ui/Radio';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';

interface AssignTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    budgetId: string; // Budget yang akan menerima assignment
}

export default function AssignTransactionModal({ isOpen, onClose, budgetId }: AssignTransactionModalProps) {
    const { wallets, assignTransactionToBudget } = useFinanceStore();
    const [selectedWalletId, setSelectedWalletId] = useState<string>('');
    const [selectedTransactionId, setSelectedTransactionId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Local state to hold loaded transactions for selected wallet
    const [loadedTransactions, setLoadedTransactions] = useState<FinanceTransaction[]>([]);
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

    // Reset selection saat modal dibuka
    useEffect(() => {
        if (isOpen) {
            setSelectedWalletId('');
            setSelectedTransactionId('');
            setLoadedTransactions([]);
        }
    }, [isOpen]);

    // Load transactions when wallet is selected
    useEffect(() => {
        const loadWalletTransactions = async () => {
            if (!selectedWalletId) {
                setLoadedTransactions([]);
                return;
            }

            setIsLoadingTransactions(true);
            try {
                // Fetch transactions directly from repository
                // We cannot rely on store.transactions because it only holds currentWallet's data
                const txs = await financeRepository.getAll(selectedWalletId);

                // Filter expense transactions locally
                const expenseTxs = txs.filter(tx => tx.type === 'expense');

                // Filter out transactions that are already assigned to THIS budget
                const { getAssignmentsForTransaction } = useFinanceStore.getState();
                const unassignedTxs: FinanceTransaction[] = [];

                for (const tx of expenseTxs) {
                    const assignments = await getAssignmentsForTransaction(tx.id);
                    // Hanya tampilkan jika belum di-assign ke budget ini
                    const isAssignedToThisBudget = assignments.some(a => a.budgetId === budgetId);
                    if (!isAssignedToThisBudget) {
                        unassignedTxs.push(tx);
                    }
                }

                // Sort by date desc
                unassignedTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                setLoadedTransactions(unassignedTxs);
            } catch (error) {
                console.error('Failed to load wallet transactions', error);
                setLoadedTransactions([]);
            } finally {
                setIsLoadingTransactions(false);
            }
        };

        loadWalletTransactions();
    }, [selectedWalletId, budgetId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Submit clicked', { selectedTransactionId, budgetId });

        if (!selectedTransactionId || !budgetId) {
            console.error('Validation failed: Missing transaction or budget ID');
            return;
        }

        setIsSubmitting(true);
        try {
            await assignTransactionToBudget(selectedTransactionId, budgetId);
            onClose();
        } catch (error) {
            console.error('Failed to assign transaction to budget', error);
        } finally {
            setIsSubmitting(false);
        }
    };

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

    const activeWallets = wallets.filter(w => !w.isArchived);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Assign Transaksi ke Budget"
            className="[&_.overflow-y-auto]:[&::-webkit-scrollbar]:hidden [&_.overflow-y-auto]:[scrollbar-width:none] [&_.overflow-y-auto]:[-ms-overflow-style:none]"
            footer={
                <div className="p-6 border-t border-secondary/10 flex gap-3 justify-end">
                    <button
                        type="button"
                        className="px-4 py-2 rounded-lg border border-neutral/30 dark:border-white/20 hover:bg-neutral/10 dark:hover:bg-white/10 transition-colors text-text-neutral dark:text-text-primary font-medium"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Batal
                    </button>
                    {/* BUTTON SEKARANG DILUAR FORM KARENA DI FOOTER MODAL - PERLU TRIGGER FORM ATAU CLICK HANDLER */}
                    <button
                        type="button" // Diubah ke button untuk menghindari kebingungan submit form karena di luar form
                        className="px-4 py-2 rounded-lg bg-accent hover:bg-accent/90 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        disabled={isSubmitting || !selectedTransactionId}
                        onClick={(e) => handleSubmit(e as any)} // Panggilan explicit
                    >
                        {isSubmitting ? (
                            <>
                                <LoadingSpinner size="sm" />
                                Menyimpan...
                            </>
                        ) : (
                            'Assign ke Budget'
                        )}
                    </button>
                </div>
            }
        >
            <div className="space-y-4"> {/* Diubah dari form ke div karena tombol submit di luar */}
                {/* Step 1: Pilih Wallet */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-neutral dark:text-text-primary">
                        1. Pilih Wallet
                    </label>
                    <p className="text-xs text-text-neutral/60 dark:text-text-secondary mb-2">
                        Pilih wallet untuk melihat transaksi yang bisa di-assign
                    </p>

                    {activeWallets.length === 0 ? (
                        <EmptyState
                            icon="💳"
                            title="Tidak ada wallet"
                            description="Buat wallet terlebih dahulu"
                        />
                    ) : (
                        <div className="grid grid-cols-2 gap-2">
                            {activeWallets.map((wallet) => (
                                <button
                                    key={wallet.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedWalletId(wallet.id);
                                        setSelectedTransactionId(''); // Reset transaction selection
                                    }}
                                    className={`p-3 rounded-lg border text-left transition-colors ${selectedWalletId === wallet.id
                                        ? 'border-accent bg-accent/5'
                                        : 'border-neutral/10 dark:border-white/10 hover:bg-neutral/5 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <div className="font-medium text-sm text-text-neutral dark:text-text-primary truncate">
                                        {wallet.title}
                                    </div>
                                    {wallet.description && (
                                        <div className="text-xs text-text-neutral/60 dark:text-text-secondary mt-1 truncate">
                                            {wallet.description}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Step 2: Pilih Transaksi (hanya muncul jika wallet sudah dipilih) */}
                {selectedWalletId && (
                    <div className="space-y-2 pt-4 border-t border-secondary/10">
                        <label className="block text-sm font-medium text-text-neutral dark:text-text-primary">
                            2. Pilih Transaksi
                        </label>
                        <p className="text-xs text-text-neutral/60 dark:text-text-secondary mb-2">
                            Pilih transaksi pengeluaran yang ingin di-assign ke budget ini
                        </p>

                        {isLoadingTransactions ? (
                            <div className="py-8 flex justify-center">
                                <LoadingSpinner size="md" />
                            </div>
                        ) : loadedTransactions.length === 0 ? (
                            <EmptyState
                                icon="📝"
                                title="Tidak ada transaksi"
                                description="Belum ada transaksi pengeluaran di wallet ini"
                            />
                        ) : (
                            <div className="space-y-2 max-h-80 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
                                {loadedTransactions.map((transaction) => (
                                    <label
                                        key={transaction.id}
                                        className={`block bg-neutral/5 dark:bg-white/5 rounded-xl border cursor-pointer hover:bg-neutral/10 dark:hover:bg-white/10 transition-colors ${selectedTransactionId === transaction.id
                                            ? 'border-accent bg-accent/5'
                                            : 'border-neutral/10 dark:border-white/10'
                                            }`}
                                    >
                                        <div className="p-3 flex flex-row items-center gap-3">
                                            <Radio
                                                name="transaction"
                                                value={transaction.id}
                                                checked={selectedTransactionId === transaction.id}
                                                onChange={(e) => setSelectedTransactionId(e.target.value)}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300">
                                                                {transaction.category}
                                                            </span>
                                                        </div>
                                                        <p className="font-medium text-text-neutral dark:text-text-primary truncate">
                                                            {transaction.description || 'No description'}
                                                        </p>
                                                        <p className="text-xs text-text-neutral/60 dark:text-text-secondary">
                                                            {formatDate(transaction.date)}
                                                        </p>
                                                    </div>
                                                    <div className="font-semibold text-red-600 dark:text-red-400 shrink-0">
                                                        -{formatCurrency(transaction.amount)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}
