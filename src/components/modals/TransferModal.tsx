import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { DatePicker } from '../ui/DatePicker';
import { Dropdown } from '../ui/Dropdown';
import type { Wallet } from '../../types/finance';
import { formatCurrency } from '../../utils/currency';

interface TransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        fromWalletId: string;
        toWalletId: string;
        amount: number;
        description?: string;
        date: Date;
    }) => Promise<void>;
    wallets: Wallet[];
    balances: Record<string, number>;
    defaultFromWalletId?: string;
}

export const TransferModal: React.FC<TransferModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    wallets,
    balances,
    defaultFromWalletId
}) => {
    const [fromWalletId, setFromWalletId] = useState<string>('');
    const [toWalletId, setToWalletId] = useState<string>('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Filter wallet yang tidak archived
    const activeWallets = wallets.filter(w => !w.isArchived);

    // Konversi wallet ke dropdown options format
    const fromWalletOptions = activeWallets.map(w => ({
        value: w.id,
        label: `${w.title} (${formatCurrency(balances[w.id] || 0, w.currency)})`
    }));

    // Wallet tujuan tidak boleh sama dengan sumber
    const toWalletOptions = activeWallets
        .filter(w => w.id !== fromWalletId)
        .map(w => ({
            value: w.id,
            label: `${w.title} (${formatCurrency(balances[w.id] || 0, w.currency)})`
        }));

    // Reset state saat modal dibuka
    const prevIsOpen = React.useRef(isOpen);
    useEffect(() => {
        if (isOpen && !prevIsOpen.current) {
            setError('');
            setFromWalletId(defaultFromWalletId || (activeWallets.length > 0 ? activeWallets[0].id : ''));
            setToWalletId('');
            setAmount('');
            setDescription('');
            setDate(new Date());
        }
        prevIsOpen.current = isOpen;
    }, [isOpen, defaultFromWalletId, activeWallets]);

    // Cek balance cukup
    const currentBalance = balances[fromWalletId] || 0;
    const parsedAmount = parseFloat(amount) || 0;
    const isBalanceSufficient = parsedAmount <= currentBalance;
    const fromWallet = activeWallets.find(w => w.id === fromWalletId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validasi
        if (!fromWalletId) {
            setError('Pilih wallet sumber');
            return;
        }
        if (!toWalletId) {
            setError('Pilih wallet tujuan');
            return;
        }
        if (fromWalletId === toWalletId) {
            setError('Wallet sumber dan tujuan tidak boleh sama');
            return;
        }
        if (!parsedAmount || parsedAmount <= 0) {
            setError('Masukkan jumlah yang valid');
            return;
        }
        if (!isBalanceSufficient) {
            setError('Saldo tidak mencukupi');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({
                fromWalletId,
                toWalletId,
                amount: parsedAmount,
                description: description.trim() || undefined,
                date,
            });
            onClose();
        } catch (err) {
            setError('Gagal melakukan transfer');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Transfer Antar Wallet"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error Message */}
                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* From Wallet */}
                <Dropdown
                    label="Dari Wallet"
                    options={fromWalletOptions}
                    value={fromWalletId}
                    onChange={(value) => {
                        setFromWalletId(value);
                        // Reset wallet tujuan jika sama
                        if (value === toWalletId) {
                            setToWalletId('');
                        }
                    }}
                    placeholder="Pilih wallet sumber"
                />
                {fromWalletId && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 -mt-2">
                        Saldo: {formatCurrency(currentBalance, fromWallet?.currency || 'IDR')}
                    </p>
                )}

                {/* To Wallet */}
                <Dropdown
                    label="Ke Wallet"
                    options={toWalletOptions}
                    value={toWalletId}
                    onChange={setToWalletId}
                    placeholder={fromWalletId ? 'Pilih wallet tujuan' : 'Pilih wallet sumber dulu'}
                    disabled={!fromWalletId || toWalletOptions.length === 0}
                />

                {/* Amount */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-neutral dark:text-text-secondary">
                        Jumlah
                    </label>
                    <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        min="0"
                        step="any"
                    />
                    {parsedAmount > 0 && !isBalanceSufficient && (
                        <p className="text-xs text-red-500">
                            Saldo tidak mencukupi
                        </p>
                    )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-text-neutral dark:text-text-secondary">
                        Keterangan (opsional)
                    </label>
                    <Input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Contoh: Pindah dana tabungan"
                    />
                </div>

                {/* Date */}
                <DatePicker
                    label="Tanggal"
                    value={date}
                    onChange={setDate}
                />

                {/* Submit Button */}
                <div className="pt-4">
                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        disabled={isSubmitting || !fromWalletId || !toWalletId || !parsedAmount || !isBalanceSufficient}
                    >
                        {isSubmitting ? 'Memproses...' : 'Transfer'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
