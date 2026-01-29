/**
 * Recurring Transaction Service (The Engine)
 * Handles auto-generation of transactions based on templates.
 */

import { recurringRepository } from '../data/recurring.repository';
import { transactionRepository } from '../data/transaction.repository';
import type { RecurringInterval } from '../types/finance';
import dayjs from 'dayjs';

class RecurringService {
    /**
     * Deterministic ID Generation
     * Format: "rec_[templateId]_[date_timestamp]"
     * Ensures we don't duplicate transactions if engine runs on multiple devices
     */
    private generateTransactionId(templateId: string, scheduledDate: Date): string {
        // Date format YYYY-MM-DD makes it unique per day
        const dateStr = dayjs(scheduledDate).format('YYYY-MM-DD');
        // Simple but effective deterministic ID
        // Note: In real app with millions user maybe md5 hashed, but for local-first string concat is fine & debuggable
        return `rec_${templateId}_${dateStr}`;
    }

    private getNextDate(currentDate: Date, interval: RecurringInterval): Date {
        const date = dayjs(currentDate);
        switch (interval) {
            case 'daily': return date.add(1, 'day').toDate();
            case 'weekly': return date.add(1, 'week').toDate();
            case 'monthly': return date.add(1, 'month').toDate();
            case 'yearly': return date.add(1, 'year').toDate();
            default: return date.add(1, 'month').toDate();
        }
    }

    /**
     * Main Engine Function
     * Should be called on App mount
     */
    async processTemplates(): Promise<{ generatedCount: number }> {
        console.log('🔄 Recurring Engine: Checking for due transactions...');
        const now = new Date();
        const dueTemplates = await recurringRepository.getActiveDue(now);

        if (dueTemplates.length === 0) {
            console.log('✅ Recurring Engine: No due transactions.');
            return { generatedCount: 0 };
        }

        let generatedCount = 0;

        for (const template of dueTemplates) {
            let nextRun = new Date(template.nextRunDate);

            // Loop while nextRun is in the past (catch up missed cycles)
            while (nextRun <= now) {
                const transactionId = this.generateTransactionId(template.id, nextRun); // Custom ID!

                // Check if transaction already exists (Idempotency)
                const exists = await transactionRepository.getById(transactionId);

                if (!exists) {
                    // Create Transaction
                    await transactionRepository.create({
                        id: transactionId, // Force deterministic ID
                        walletId: template.walletId,
                        type: template.type,
                        amount: template.amount,
                        category: template.category,
                        description: template.description || 'Recurring Transaction',
                        date: nextRun,
                        // Override created to match "run time" but date is "scheduled time"
                    } as any); // Type cast needed because create() usually generates ID

                    generatedCount++;
                    console.log(`✨ Generated Recurring Tx: ${template.description} (${dayjs(nextRun).format('YYYY-MM-DD')})`);
                } else {
                    console.log(`⚠️ Transaction already exists, skipping: ${transactionId}`);
                }

                // Advance nextRun
                nextRun = this.getNextDate(nextRun, template.interval);

                // Safety break to prevent infinite loop if data corruption
                // e.g. if nextRun doesn't advance
                const safetyLimit = dayjs().add(1, 'year').toDate();
                if (nextRun > safetyLimit) break;
            }

            // Update Template with new nextRunDate
            await recurringRepository.update(template.id, {
                nextRunDate: nextRun,
                lastGeneratedId: `rec_${template.id}_${dayjs(now).format('YYYY-MM-DD')}` // Just marker
            });
        }

        return { generatedCount };
    }
}

export const recurringService = new RecurringService();
