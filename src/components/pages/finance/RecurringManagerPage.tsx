/**
 * Recurring Manager Page
 * Lists all recurring transaction templates
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecurringStore } from '../../../state/recurring.store';
import { useFinanceStore } from '../../../state/finance.store';
import { PageHeader } from '../../ui/PageHeader';
import dayjs from 'dayjs';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { ConfirmDialog } from '../../ui/ConfirmDialog';
import type { RecurringTemplate, RecurringInterval } from '../../../types/finance';

export const RecurringManagerPage: React.FC = () => {
    const navigate = useNavigate();
    const { templates, loadTemplates, toggleActive, deleteTemplate, updateTemplate } = useRecurringStore();
    const { wallets } = useFinanceStore();

    const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | null>(null);
    const [deletingTemplate, setDeletingTemplate] = useState<RecurringTemplate | null>(null);

    // Edit State
    const [editAmount, setEditAmount] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editInterval, setEditInterval] = useState<RecurringInterval>('monthly');

    useEffect(() => {
        loadTemplates();
    }, [loadTemplates]);

    const handleEditStart = (template: RecurringTemplate) => {
        setEditingTemplate(template);
        setEditAmount(template.amount.toString());
        setEditDesc(template.description || '');
        setEditInterval(template.interval);
    };

    const handleEditSave = async () => {
        if (!editingTemplate) return;
        try {
            await updateTemplate(editingTemplate.id, {
                amount: parseFloat(editAmount),
                description: editDesc,
                interval: editInterval
            });
            setEditingTemplate(null);
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async () => {
        if (!deletingTemplate) return;
        await deleteTemplate(deletingTemplate.id);
        setDeletingTemplate(null);
    };

    const getWalletName = (id: string) => wallets.find(w => w.id === id)?.title || 'Unknown Wallet';

    return (
        <div className="h-full bg-neutral dark:bg-primary flex flex-col">
            <div className="max-w-3xl w-full mx-auto px-4 pt-6 md:pt-12 flex-1 overflow-y-auto pb-24">
                <PageHeader
                    title="Recurring Transactions"
                    description="Manage your automated scheduled transactions"
                    leading={
                        <button
                            onClick={() => navigate('/finance')}
                            className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    }
                />

                {/* List */}
                <div className="space-y-4 mt-6">
                    {templates.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            <p>No recurring transactions found.</p>
                            <p className="text-sm">Create one when adding a new transaction.</p>
                        </div>
                    ) : (
                        templates.map(template => (
                            <div
                                key={template.id}
                                className={`
                                    relative overflow-hidden bg-white dark:bg-secondary rounded-xl p-4 border transition-all
                                    ${template.isActive
                                        ? 'border-gray-100 dark:border-white/5 shadow-sm'
                                        : 'border-transparent opacity-70 bg-gray-50 dark:bg-white/5'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-semibold text-text-neutral dark:text-text-primary line-clamp-1">
                                            {template.description}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-text-neutral/60 dark:text-text-secondary mt-1">
                                            <span className={`px-2 py-0.5 rounded-full capitalize ${template.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {template.type}
                                            </span>
                                            <span>•</span>
                                            <span className="capitalize">{template.interval}</span>
                                            <span>•</span>
                                            <span>{getWalletName(template.walletId)}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-bold ${template.type === 'income' ? 'text-green-600' : 'text-red-500' // Fixed color for expense
                                            }`}>
                                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(template.amount)}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
                                    <div className="text-xs text-gray-500">
                                        Next: {dayjs(template.nextRunDate).format('DD MMM YYYY')}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleActive(template.id, !template.isActive)}
                                            className={`
                                                px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                                                ${template.isActive
                                                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                                    : 'bg-green-100 text-green-700 hover:bg-green-200'}
                                            `}
                                        >
                                            {template.isActive ? 'Pause' : 'Resume'}
                                        </button>
                                        <button
                                            onClick={() => handleEditStart(template)}
                                            className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        <button
                                            onClick={() => setDeletingTemplate(template)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            <Modal
                isOpen={!!editingTemplate}
                onClose={() => setEditingTemplate(null)}
                title="Edit Recurring Rule"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Amount</label>
                        <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Interval</label>
                        <div className="flex gap-2">
                            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(int => (
                                <button
                                    key={int}
                                    onClick={() => setEditInterval(int)}
                                    className={`
                                        px-3 py-1.5 rounded-lg text-sm capitalize border
                                        ${editInterval === int
                                            ? 'bg-accent text-white border-accent'
                                            : 'bg-transparent border-gray-200 dark:border-white/10'}
                                    `}
                                >
                                    {int}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <button onClick={() => setEditingTemplate(null)} className="px-4 py-2 text-sm">Cancel</button>
                        <button onClick={handleEditSave} className="px-4 py-2 text-sm bg-accent text-white rounded-lg">Save</button>
                    </div>
                </div>
            </Modal>

            <ConfirmDialog
                isOpen={!!deletingTemplate}
                title="Delete Recurring Rule?"
                message="This will stop future transactions from being created. Past transactions will remain."
                confirmText="Delete"
                onConfirm={handleDelete}
                onCancel={() => setDeletingTemplate(null)}
                type="danger"
            />
        </div>
    );
}
