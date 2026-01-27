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
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { EmptyState } from '../../ui/EmptyState';
import { ActionSheet } from '../../ui/ActionSheet';
import AssignTransactionModal from '../../modals/AssignTransactionModal';
import { BudgetCard } from '../../ui/BudgetCard';
import { TransactionListCard } from '../../ui/TransactionListCard';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import { financeRepository } from '../../../data/finance.repository';

export default function BudgetDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {
        currentBudget,
        budgetSummaries,
        budgetAssignments,

        selectBudget,
        loadAssignmentsForBudget,
        unassignTransactionFromBudget,
        deleteBudget,
        isLoading
    } = useFinanceStore();

    const [assignedTransactions, setAssignedTransactions] = useState<FinanceTransaction[]>([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [showActionSheet, setShowActionSheet] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);

    // Unassign Confirmation State
    const [isConfirmUnassignOpen, setIsConfirmUnassignOpen] = useState(false);
    const [transactionToUnassign, setTransactionToUnassign] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            selectBudget(id);
            loadAssignmentsForBudget(id);
        }
    }, [id, selectBudget, loadAssignmentsForBudget]);

    // Reset assigned transactions saat budget berubah untuk mencegah stale state
    useEffect(() => {
        setAssignedTransactions([]);
    }, [id]);

    // Cleanup saat component unmount (keluar dari BudgetDetailPage)
    useEffect(() => {
        return () => {
            // Clear assigned transactions saat unmount
            setAssignedTransactions([]);
            // Clear assignments di store juga
            useFinanceStore.getState().clearBudgetAssignments();
        };
    }, []);

    useEffect(() => {
        const fetchAssignedTransactions = async () => {
            if (budgetAssignments.length > 0) {
                const transactionIds = budgetAssignments.map(a => a.transactionId);
                // Load directly from DB to ensure we get them even if not in current wallet view
                try {
                    const assigned = await financeRepository.getTransactionsByIds(transactionIds);
                    // Sort details by date desc
                    assigned.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    setAssignedTransactions(assigned);
                } catch (error) {
                    console.error('Failed to load assigned transactions details', error);
                }
            } else {
                setAssignedTransactions([]);
            }
        };

        fetchAssignedTransactions();
    }, [budgetAssignments]);

    const handleUnassignClick = (transactionId: string) => {
        setTransactionToUnassign(transactionId);
        setIsConfirmUnassignOpen(true);
    };

    const confirmUnassign = async () => {
        if (!id || !transactionToUnassign) return;

        try {
            await unassignTransactionFromBudget(transactionToUnassign, id);
            await loadAssignmentsForBudget(id);
        } catch (error) {
            console.error('Failed to unassign transaction', error);
        } finally {
            setIsConfirmUnassignOpen(false);
            setTransactionToUnassign(null);
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
        setShowActionSheet(false);
        setIsEditModalOpen(true);
    };

    const handleAssignTransaction = () => {
        setShowAssignModal(true);
    };

    if (!currentBudget) {
        return (
            <div className="min-h-screen bg-background dark:bg-background flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const summary = budgetSummaries[currentBudget.id];

    return (
        <div className="h-full w-full overflow-y-auto bg-neutral dark:bg-primary [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-12 pb-[100px] md:pb-12">
                <PageHeader
                    title={currentBudget.title}
                    description={currentBudget.description}
                    className="md:mb-8"
                    leading={
                        <button
                            onClick={() => navigate('/finance/budgets')}
                            className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-text-neutral dark:text-text-secondary transition-colors"
                            title="Back to budgets"
                        >
                            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    }
                    trailing={
                        <button
                            onClick={() => setShowActionSheet(true)}
                            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-text-neutral dark:text-text-secondary transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 md:w-6 md:h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                            </svg>
                        </button>
                    }
                />

                <div className="space-y-6">
                    {/* Summary Section - Using DRY BudgetCard */}
                    <BudgetCard
                        budget={currentBudget}
                        summary={summary}
                    // onClick is undefined so it won't be clickable/hoverable like list item
                    />

                    {/* Transactions List */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-lg text-text-neutral dark:text-text-primary">Transaksi Terkait</h3>
                            <button
                                onClick={handleAssignTransaction}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/10 rounded-lg transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Assign Transaction
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <LoadingSpinner size="md" />
                            </div>
                        ) : assignedTransactions.length === 0 ? (
                            <EmptyState
                                icon="📝"
                                description="Belum ada transaksi di budget ini"
                            />
                        ) : (
                            <div className="space-y-2">
                                {assignedTransactions.map((transaction) => (
                                    <TransactionListCard
                                        key={transaction.id}
                                        transaction={transaction}
                                        onUnassign={() => handleUnassignClick(transaction.id)}
                                        variant="badge"
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

                {/* Assign Transaction Modal */}
                <AssignTransactionModal
                    isOpen={showAssignModal}
                    onClose={() => {
                        setShowAssignModal(false);
                        // Reload assignments after assign
                        if (id) loadAssignmentsForBudget(id);
                    }}
                    budgetId={id || ''}
                />

                {/* Confirm Unassign Dialog */}
                <ConfirmDialog
                    isOpen={isConfirmUnassignOpen}
                    title="Hapus Transaksi dari Budget?"
                    message="Transaksi ini tidak akan dihapus dari wallet, hanya dihapus dari list budget ini."
                    confirmText="Ya, Hapus"
                    cancelText="Batal"
                    type="danger"
                    onConfirm={confirmUnassign}
                    onCancel={() => setIsConfirmUnassignOpen(false)}
                />

                {/* Action Sheet */}
                <ActionSheet
                    isOpen={showActionSheet}
                    onClose={() => setShowActionSheet(false)}
                    title={currentBudget?.title || 'Budget Options'}
                    items={[
                        {
                            id: 'edit',
                            label: 'Edit Budget',
                            icon: (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            ),
                            onClick: handleEdit
                        },
                        {
                            id: 'delete',
                            label: 'Hapus Budget',
                            icon: (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            ),
                            variant: 'danger',
                            onClick: handleDelete
                        }
                    ]}
                />
            </div>
        </div>
    );
}
