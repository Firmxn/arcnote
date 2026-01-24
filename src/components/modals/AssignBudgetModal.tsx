/**
 * AssignBudgetModal Component
 * Modal untuk assign transaction ke budget
 */

import { useState, useEffect } from 'react';
import { useFinanceStore } from '../../state/finance.store';
import type { FinanceTransaction, Budget } from '../../types/finance';

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

        // const txDate = new Date(transaction.date);
        // const now = new Date();

        return budgets.filter(budget => {
            if (budget.isArchived) return false;

            // Hanya tampilkan budget yang periode-nya masih relevan
            // Untuk simplicity, kita tampilkan semua budget aktif
            // Period filtering akan dilakukan di backend saat calculate summary
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

    if (!isOpen || !transaction) return null;

    const availableBudgets = getAvailableBudgets();

    return (
        <div className="modal modal-open">
            <div className="modal-box">
                <h3 className="font-bold text-lg mb-4">Assign ke Budget</h3>

                {/* Transaction Info */}
                <div className="card bg-base-200 mb-4">
                    <div className="card-body p-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className={`badge badge-sm ${transaction.type === 'income' ? 'badge-success' : 'badge-error'}`}>
                                    {transaction.category}
                                </span>
                                <p className="font-medium mt-1">{transaction.description || 'No description'}</p>
                                <p className="text-xs text-base-content/60">{formatDate(transaction.date)}</p>
                            </div>
                            <div className={`font-semibold ${transaction.type === 'income' ? 'text-success' : 'text-error'}`}>
                                {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Budget Selection */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {currentAssignment && (
                        <div className="alert alert-info">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span className="text-sm">Transaksi ini sudah di-assign ke budget</span>
                        </div>
                    )}

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Pilih Budget</span>
                        </label>

                        {availableBudgets.length === 0 ? (
                            <div className="text-center py-8 text-base-content/60">
                                <p>Belum ada budget tersedia</p>
                                <p className="text-sm mt-2">Buat budget terlebih dahulu</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {availableBudgets.map((budget) => (
                                    <label
                                        key={budget.id}
                                        className={`card bg-base-200 cursor-pointer hover:bg-base-300 transition-colors ${selectedBudgetId === budget.id ? 'ring-2 ring-primary' : ''
                                            }`}
                                    >
                                        <div className="card-body p-3 flex-row items-center gap-3">
                                            <input
                                                type="radio"
                                                name="budget"
                                                className="radio radio-primary"
                                                value={budget.id}
                                                checked={selectedBudgetId === budget.id}
                                                onChange={(e) => setSelectedBudgetId(e.target.value)}
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium">{budget.title}</div>
                                                <div className="text-xs text-base-content/60">
                                                    {getPeriodLabel(budget.period)} • Target: {formatCurrency(budget.targetAmount)}
                                                </div>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="modal-action">
                        <button
                            type="button"
                            className="btn"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting || !selectedBudgetId || availableBudgets.length === 0}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Menyimpan...
                                </>
                            ) : (
                                'Assign ke Budget'
                            )}
                        </button>
                    </div>
                </form>
            </div>
            <div className="modal-backdrop" onClick={onClose}></div>
        </div>
    );
}
