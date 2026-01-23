import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import type { FinanceTransaction, Wallet } from '../../types/finance';
import { formatCurrency } from '../../utils/currency';
import dayjs from 'dayjs';

interface TransferDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: FinanceTransaction;
    currentWallet: Wallet;
    linkedWallet: Wallet | undefined;
    onNavigateToWallet: (walletId: string) => void;
    onDelete: () => Promise<void>;
}

export const TransferDetailModal: React.FC<TransferDetailModalProps> = ({
    isOpen,
    onClose,
    transaction,
    currentWallet,
    linkedWallet,
    onNavigateToWallet,
    onDelete
}) => {
    const [isDeleting, setIsDeleting] = React.useState(false);

    const isTransferOut = transaction.category === 'Transfer Out';
    const fromWallet = isTransferOut ? currentWallet : linkedWallet;
    const toWallet = isTransferOut ? linkedWallet : currentWallet;

    const handleDelete = async () => {
        if (!confirm('Hapus transfer ini? Kedua transaksi (Transfer In & Out) akan dihapus.')) {
            return;
        }

        setIsDeleting(true);
        try {
            await onDelete();
            onClose();
        } catch (error) {
            console.error('Failed to delete transfer:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleNavigate = () => {
        if (!linkedWallet) return;
        onNavigateToWallet(linkedWallet.id);
        onClose();
    };

    const footerContent = (
        <div className="bg-white dark:bg-secondary border-t border-gray-200 dark:border-primary/20 px-6 py-4 flex gap-3">
            {linkedWallet && (
                <Button
                    variant="secondary"
                    onClick={handleNavigate}
                    className="flex-1"
                >
                    Buka {linkedWallet.title}
                </Button>
            )}
            <Button
                variant="error"
                onClick={handleDelete}
                disabled={isDeleting}
                className={linkedWallet ? 'flex-1' : 'w-full'}
            >
                {isDeleting ? 'Menghapus...' : 'Hapus Transfer'}
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Detail Transfer"
            className="max-w-2xl bg-white dark:bg-secondary"
            noPadding
            footer={footerContent}
        >
            <div className="px-6 pt-6 space-y-5 pb-6">
                {/* Transfer Direction Icon */}
                <div className="flex items-center justify-center">
                    <div className={`p-3 rounded-full ${isTransferOut ? 'bg-red-100 dark:bg-red-900/20' : 'bg-green-100 dark:bg-green-900/20'}`}>
                        <svg className={`w-8 h-8 ${isTransferOut ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                    </div>
                </div>

                {/* Transfer Type */}
                <div className="text-center">
                    <p className={`text-lg font-semibold ${isTransferOut ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {isTransferOut ? '↓ Transfer Out' : '↑ Transfer In'}
                    </p>
                </div>

                {/* From Wallet */}
                <div>
                    <label className="block text-sm font-medium text-text-neutral dark:text-text-primary mb-2">
                        Dari Wallet
                    </label>
                    <div className="px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-primary/10 border border-gray-200 dark:border-primary/20">
                        <p className="text-text-neutral dark:text-text-primary font-medium">
                            {fromWallet?.title || 'Unknown Wallet'}
                        </p>
                    </div>
                </div>

                {/* To Wallet */}
                <div>
                    <label className="block text-sm font-medium text-text-neutral dark:text-text-primary mb-2">
                        Ke Wallet
                    </label>
                    <button
                        onClick={handleNavigate}
                        disabled={!linkedWallet}
                        className={`w-full px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-primary/10 border border-gray-200 dark:border-primary/20 text-left flex items-center justify-between transition-colors ${linkedWallet ? 'hover:bg-gray-200 dark:hover:bg-primary/20 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                            }`}
                    >
                        <p className="text-text-neutral dark:text-text-primary font-medium">
                            {toWallet?.title || 'Unknown Wallet'}
                        </p>
                        {linkedWallet && (
                            <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-sm font-medium text-text-neutral dark:text-text-primary mb-2">
                        Jumlah
                    </label>
                    <div className="px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-primary/10 border border-gray-200 dark:border-primary/20">
                        <p className={`text-xl font-bold font-mono ${isTransferOut ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {isTransferOut ? '-' : '+'}{formatCurrency(transaction.amount, currentWallet.currency)}
                        </p>
                    </div>
                </div>

                {/* Date */}
                <div>
                    <label className="block text-sm font-medium text-text-neutral dark:text-text-primary mb-2">
                        Tanggal
                    </label>
                    <div className="px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-primary/10 border border-gray-200 dark:border-primary/20">
                        <p className="text-text-neutral dark:text-text-primary">
                            {dayjs(transaction.date).format('DD MMMM YYYY')}
                        </p>
                    </div>
                </div>

                {/* Description */}
                {transaction.description && (
                    <div>
                        <label className="block text-sm font-medium text-text-neutral dark:text-text-primary mb-2">
                            Keterangan
                        </label>
                        <div className="px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-primary/10 border border-gray-200 dark:border-primary/20">
                            <p className="text-text-neutral dark:text-text-primary">
                                {transaction.description}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
