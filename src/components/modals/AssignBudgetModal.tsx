/**
 * AssignBudgetModal Component
 * Modal untuk assign transaction ke budget
 */

import { useState, useEffect } from 'react';
import { useFinanceStore } from '../../state/finance.store';
import type { FinanceTransaction, Budget } from '../../types/finance';
import { Radio } from '../ui/Radio';
import { Alert } from '../ui/Alert';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Modal } from '../ui/Modal';

interface AssignBudgetModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: FinanceTransaction | null;
}

export default function AssignBudgetModal({ isOpen, onClose, transaction }: AssignBudgetModalProps) {
    const { budgets, assignTransactionToBudget, getAssignmentsForTransaction } = useFinanceStore();
    const [selectedBudgetId, setSelectedBudgetId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentAssignment, setCurrentAssignment] = useState<string | null>(null);

    // Load current assignment saat modal dibuka
    useEffect(() => {
        if (isOpen && transaction) {
            loadCurrentAssignment();
        }
    }, [isOpen, transaction]);

    const loadCurrentAssignment = async () => {
        if (!transaction) return;

        const assignments = await getAssignmentsForTransaction(transaction.id);
        if (assignments.length > 0) {
            setCurrentAssignment(assignments[0].budgetId);
            setSelectedBudgetId(assignments[0].budgetId);
        } else {
            setCurrentAssignment(null);
            setSelectedBudgetId('');
        }
    };

    // Filter budgets yang periode-nya cover transaction date
    const getAvailableBudgets = (): Budget[] => {
        if (!transaction) return [];

        return budgets.filter(budget => {
            if (budget.isArchived) return false;
            // Hanya tampilkan budget yang periode-nya masih relevan
            // Untuk simplicity, kita tampilkan semua budget aktif
            return true;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!transaction || !selectedBudgetId) return;

        setIsSubmitting(true);
        try {
            await assignTransactionToBudget(transaction.id, selectedBudgetId);
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
            month: 'long',
            year: 'numeric'
        });
    };

    const getPeriodLabel = (period: string) => {
        switch (period) {
            case 'weekly': return 'Mingguan';
            case 'monthly': return 'Bulanan';
            case 'yearly': return 'Tahunan';
            default: return period;
        }
    };

    if (!transaction) return null;

    const availableBudgets = getAvailableBudgets();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Assign ke Budget"
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
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-accent hover:bg-accent/90 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        disabled={isSubmitting || !selectedBudgetId || availableBudgets.length === 0}
                        onClick={handleSubmit}
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
            {/* Transaction Info */}
            <div className="bg-neutral/5 dark:bg-white/5 rounded-xl border border-neutral/10 dark:border-white/10 mb-4">
                <div className="p-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${transaction.type === 'income' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
                                {transaction.category}
                            </span>
                            <p className="font-medium mt-1 text-text-neutral dark:text-text-primary">{transaction.description || 'No description'}</p>
                            <p className="text-xs text-text-neutral/60 dark:text-text-secondary">{formatDate(transaction.date)}</p>
                        </div>
                        <div className={`font-semibold ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Budget Selection */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {currentAssignment && (
                    <Alert variant="info">
                        <span className="text-sm">Transaksi ini sudah di-assign ke budget</span>
                    </Alert>
                )}

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-neutral dark:text-text-primary">
                        Pilih Budget
                    </label>

                    {availableBudgets.length === 0 ? (
                        <div className="text-center py-8 text-text-neutral/60 dark:text-text-secondary">
                            <p>Belum ada budget tersedia</p>
                            <p className="text-sm mt-2">Buat budget terlebih dahulu</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {availableBudgets.map((budget) => (
                                <label
                                    key={budget.id}
                                    className={`block bg-neutral/5 dark:bg-white/5 rounded-xl border cursor-pointer hover:bg-neutral/10 dark:hover:bg-white/10 transition-colors ${selectedBudgetId === budget.id
                                        ? 'border-accent bg-accent/5'
                                        : 'border-neutral/10 dark:border-white/10'
                                        }`}
                                >
                                    <div className="p-3 flex flex-row items-center gap-3">
                                        <Radio
                                            name="budget"
                                            value={budget.id}
                                            checked={selectedBudgetId === budget.id}
                                            onChange={(e) => setSelectedBudgetId(e.target.value)}
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium text-text-neutral dark:text-text-primary">{budget.title}</div>
                                            <div className="text-xs text-text-neutral/60 dark:text-text-secondary">
                                                {getPeriodLabel(budget.period)} • Target: {formatCurrency(budget.targetAmount)}
                                            </div>
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </form>
        </Modal>
    );
}
