/**
 * BudgetDetailPage Component
 * Halaman detail budget dengan list transactions
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../../../state/finance.store';
import { PageHeader } from '../../ui/PageHeader';
import BudgetModal from '../../modals/BudgetModal';
import type { FinanceTransaction } from '../../../types/finance';

export default function BudgetDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {
        currentBudget,
        budgetSummaries,
        budgetAssignments,
        transactions,
        selectBudget,
        loadAssignmentsForBudget,
        unassignTransactionFromBudget,
        deleteBudget,
        isLoading
    } = useFinanceStore();

    const [assignedTransactions, setAssignedTransactions] = useState<FinanceTransaction[]>([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        if (id) {
            selectBudget(id);
            loadAssignmentsForBudget(id);
        }
    }, [id, selectBudget, loadAssignmentsForBudget]);

    // Load transactions yang di-assign
    useEffect(() => {
        if (budgetAssignments.length > 0) {
            const transactionIds = budgetAssignments.map(a => a.transactionId);
            // Filter transactions yang ada di assignments
            const assigned = transactions.filter(t => transactionIds.includes(t.id));
            setAssignedTransactions(assigned);
        } else {
            setAssignedTransactions([]);
        }
    }, [budgetAssignments, transactions]);

    const handleUnassign = async (transactionId: string) => {
        if (!id) return;
        try {
            await unassignTransactionFromBudget(transactionId, id);
            await loadAssignmentsForBudget(id);
        } catch (error) {
            console.error('Failed to unassign transaction', error);
        }
    };

    const handleDelete = async () => {
        if (!id || !currentBudget) return;

        const confirmed = window.confirm(`Hapus budget "${currentBudget.title}"?`);
        if (!confirmed) return;

        try {
            await deleteBudget(id);
            navigate('/finance/budgets');
        } catch (error) {
            console.error('Failed to delete budget', error);
        }
    };

    const handleEdit = () => {
        setIsEditModalOpen(true);
    };

    if (!currentBudget) {
        return (
            <div className="min-h-screen bg-base-100 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    const summary = budgetSummaries[currentBudget.id];
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getPeriodLabel = (period: string) => {
        switch (period) {
            case 'weekly': return 'Mingguan';
            case 'monthly': return 'Bulanan';
            case 'yearly': return 'Tahunan';
            default: return period;
        }
    };

    const getProgressColor = (percentage: number) => {
        if (percentage >= 100) return 'progress-error';
        if (percentage >= 90) return 'progress-error';
        if (percentage >= 70) return 'progress-warning';
        return 'progress-success';
    };

    const spent = summary?.totalSpent || 0;
    const percentage = summary?.percentageUsed || 0;
    const remaining = summary?.remainingAmount || currentBudget.targetAmount;

    return (
        <div className="min-h-screen bg-base-100 pb-20">
            <PageHeader
                title={currentBudget.title}
                description={currentBudget.description}
                trailing={
                    <div className="dropdown dropdown-end">
                        <button tabIndex={0} className="btn btn-ghost btn-sm btn-circle">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                            </svg>
                        </button>
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-52">
                            <li><a onClick={handleEdit}>Edit Budget</a></li>
                            <li><a onClick={handleDelete} className="text-error">Hapus Budget</a></li>
                        </ul>
                    </div>
                }
            />

            <div className="p-4 space-y-6">
                {/* Summary Section */}
                <div className="card bg-base-200 shadow-sm">
                    <div className="card-body p-4">
                        {/* Period Badge */}
                        <div className="flex justify-between items-center mb-4">
                            <span className="badge badge-outline">
                                {getPeriodLabel(currentBudget.period)}
                            </span>
                            <div className="text-right">
                                <div className="text-sm text-base-content/60">Target</div>
                                <div className="text-xl font-bold">{formatCurrency(currentBudget.targetAmount)}</div>
                            </div>
                        </div>

                        {/* Large Progress Bar */}
                        <div className="space-y-3">
                            <progress
                                className={`progress ${getProgressColor(percentage)} w-full h-4`}
                                value={Math.min(percentage, 100)}
                                max="100"
                            ></progress>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <div className="text-xs text-base-content/60">Terpakai</div>
                                    <div className="font-semibold">{formatCurrency(spent)}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-base-content/60">Sisa</div>
                                    <div className={`font-semibold ${remaining < 0 ? 'text-error' : 'text-success'}`}>
                                        {formatCurrency(remaining)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-base-content/60">Transaksi</div>
                                    <div className="font-semibold">{summary?.transactionCount || 0}</div>
                                </div>
                            </div>

                            {/* Percentage */}
                            <div className="text-center">
                                <span className={`text-2xl font-bold ${percentage >= 100 ? 'text-error' : ''}`}>
                                    {percentage.toFixed(1)}%
                                </span>
                                <span className="text-sm text-base-content/60 ml-2">dari target</span>
                            </div>
                        </div>

                        {/* Over Budget Alert */}
                        {summary?.isOverBudget && (
                            <div className="alert alert-error mt-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span>Budget terlampaui! Pengeluaran melebihi target.</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Transactions List */}
                <div>
                    <h3 className="font-semibold text-lg mb-3">Transaksi Terkait</h3>

                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <span className="loading loading-spinner loading-md"></span>
                        </div>
                    ) : assignedTransactions.length === 0 ? (
                        <div className="text-center py-12 bg-base-200 rounded-lg">
                            <div className="text-4xl mb-2">📝</div>
                            <p className="text-base-content/60">Belum ada transaksi di budget ini</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {assignedTransactions.map((transaction) => (
                                <TransactionItem
                                    key={transaction.id}
                                    transaction={transaction}
                                    onUnassign={() => handleUnassign(transaction.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Budget Modal */}
            <BudgetModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                budget={currentBudget}
            />
        </div>
    );
}

/**
 * TransactionItem Component
 * Item untuk display transaction dengan unassign button
 */
interface TransactionItemProps {
    transaction: FinanceTransaction;
    onUnassign: () => void;
}

function TransactionItem({ transaction, onUnassign }: TransactionItemProps) {
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

    return (
        <div className="card bg-base-200 shadow-sm">
            <div className="card-body p-3 flex-row items-center justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className={`badge badge-sm ${transaction.type === 'income' ? 'badge-success' : 'badge-error'}`}>
                            {transaction.category}
                        </span>
                    </div>
                    <p className="font-medium mt-1">{transaction.description || 'No description'}</p>
                    <p className="text-xs text-base-content/60">{formatDate(transaction.date)}</p>
                </div>
                <div className="text-right flex items-center gap-3">
                    <div>
                        <div className={`font-semibold ${transaction.type === 'income' ? 'text-success' : 'text-error'}`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </div>
                    </div>
                    <button
                        onClick={onUnassign}
                        className="btn btn-ghost btn-sm btn-circle"
                        aria-label="Unassign"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
