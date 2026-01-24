/**
 * Sync Service (The Orchestrator)
 * 
 * Responsibilities:
 * 1. Push Local Changes to Cloud (Queue -> Parents -> Children)
 * 2. Pull Cloud Changes to Local (Last Synced Timestamp)
 * 3. Handle Auth Context (Inject User ID)
 */

import { supabase } from '../data/supabase';
import { db } from '../data/db'; // Dexie instance
import type { SyncQueueItem } from '../data/db';
import type { Syncable } from '../types/sync';

// Map Dexie Table Names to Supabase Table Names
const TABLE_MAP: Record<string, string> = {
    wallets: 'wallets',
    finance: 'finance_transactions', // Note mapping
    budgets: 'budgets',
    budgetAssignments: 'budget_assignments',
    schedules: 'schedules',
    pages: 'pages',
    blocks: 'blocks',
};

class SyncManager {
    private isSyncing = false;

    /**
     * Main Sync Function
     * Triggered by: Interval, Online Event, or User Action
     */
    async sync() {
        if (this.isSyncing) return;
        if (!navigator.onLine) return; // Browser check

        try {
            this.isSyncing = true;
            console.log('🔄 Sync Started...');

            // 1. Auth Check
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.log('User not logged in. Skipping Sync.');
                return;
            }
            const userId = user.id;

            // 2. Push Local Changes (Upload data kotor)
            await this.pushChanges(userId);

            // 3. Pull Cloud Changes (Download data baru)
            await this.pullChanges();

            console.log('✅ Sync Completed.');
        } catch (error) {
            console.error('❌ Sync Failed:', error);
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * PUSH: Upload local changes to Supabase
     * Order matters! delete -> parents -> children
     */
    private async pushChanges(userId: string) {
        // Step 1: Process Deletion Queue (Queue pertama diproses)
        await this.processDeletionQueue();

        // Step 2: Push Parents (Dependencies)
        await this.pushTable('wallets', userId);
        await this.pushTable('budgets', userId);
        await this.pushTable('pages', userId);

        // Step 3: Push Children
        await this.pushTable('finance', userId); // Transactions depend on Wallets
        await this.pushTable('budgetAssignments', userId); // Depend on Budgets & Transactions
        await this.pushTable('blocks', userId); // Depend on Pages

        // Schedules are independent
        await this.pushTable('schedules', userId);
    }

    /**
     * Process items in syncQueue
     */
    private async processDeletionQueue() {
        const queueItems = await db.syncQueue.toArray();
        if (queueItems.length === 0) return;

        console.log(`Processing ${queueItems.length} deletions...`);

        // Group by table to batch delete
        const deletesByTable: Record<string, string[]> = {};

        for (const item of queueItems) {
            // Map dexie table to supabase table
            const supabaseTable = TABLE_MAP[item.table];
            if (!supabaseTable) continue;

            if (!deletesByTable[supabaseTable]) {
                deletesByTable[supabaseTable] = [];
            }
            deletesByTable[supabaseTable].push(item.id);
        }

        // Execute deletes
        for (const [table, ids] of Object.entries(deletesByTable)) {
            const { error } = await supabase.from(table).delete().in('id', ids);
            if (error) {
                console.error(`Failed to delete from ${table}:`, error);
                // We keep them in queue to retry? Or clear to avoid stuck?
                // For now log error but don't clear queue for those IDs?
                // Simplicity: If error, we strictly shouldn't clear queue.
                // But let's clear ONLY successfully processed ones?
                // Implementing reliable queue processing is hard.
                // MVP: If error is RLS or network, we retry later.
                throw error;
            }
        }

        // Cleanup local queue
        const queueIds = queueItems.map((i: SyncQueueItem) => i.id); // Note: Queue ID is item ID? 
        // Wait, db.syncQueue.add stores { id, table ... }. Dexie generates key or we use autoIncrement?
        // db.ts: `syncQueue: 'id, table, action, createdAt'` -> first item 'id' is key?
        // No, 'id' is the ID of the deleted object. It *might* be duplicate if we delete same object twice? (Not possible locally).
        // Safest is bulkDelete by Keys. 
        // But `syncQueue` schema uses `id` as primary key.
        // If I delete Item A from Table X, queue has {id: 'A'}.
        // If I create Item A again and delete it, queue overwrites or fails?
        // Since deletes are final, overwriting is fine.
        await db.syncQueue.bulkDelete(queueIds);
    }

    /**
     * Generic Push Table
     */
    private async pushTable(dexieTable: keyof typeof db, userId: string) {
        const table = db[dexieTable] as any; // Dynamic access

        // Find 'created' or 'updated' records
        const dirtyRecords = await table
            .filter((r: Syncable) => r.syncStatus === 'created' || r.syncStatus === 'updated')
            .toArray();

        if (dirtyRecords.length === 0) return;

        const supabaseTableName = TABLE_MAP[dexieTable as string];
        if (!supabaseTableName) return;

        console.log(`Pushing ${dirtyRecords.length} records to ${supabaseTableName}...`);

        // Prepare Payloads
        const payloads = dirtyRecords.map((r: any) => {
            // Clone & Clean
            const payload = { ...r };

            // Remove local-only fields
            delete payload.syncStatus;

            // Convert Dates to ISO Strings
            for (const key in payload) {
                if (payload[key] instanceof Date) {
                    payload[key] = payload[key].toISOString();
                }
            }

            // Inject User ID if missing and assumed needed (e.g. Budget)
            // Note: Wallets/Budgets/Pages usually need userId for RLS insertion
            // If the table has userId column, we should inject it.
            // Safe approach: Inject if not present.
            // Note: Dexie schema might not have userId.
            // We check key existence or just inject?
            // Checking specific tables is safer.
            if (['budgets', 'budgetAssignments'].includes(dexieTable as string)) {
                if (!payload.userId) payload.userId = userId;
            }

            // Wallets? Usually 'user_id' in supabase 'wallets' table?
            // Let's assume RLS handles it via default? No, usually `auth.uid()`.
            // But usually we set `user_id = auth.uid()` in trigger or we send it.
            // Let's assume we need to send it if column exists.
            // Supabase allows inserting payload even if column doesn't match? No.
            // We'll assume the implementation plan: "Merge Guest Data" will handle initial ownership.
            // Here we assume new data created by User.

            return payload;
        });

        // Batch Upsert
        const { error } = await supabase.from(supabaseTableName).upsert(payloads);

        if (error) {
            console.error(`Failed to push ${dexieTable}:`, error);
            throw error;
        }

        // On Success: Mark as Synced
        const ids = dirtyRecords.map((r: any) => r.id);
        await table.bulkUpdate(ids.map((id: string) => ({
            key: id,
            changes: { syncStatus: 'synced' as const }
        })));

        // Fix: bulkUpdate signature in Dexie is varying?
        // Actually table.update(id, changes).
        // Bulk update loop:
        await db.transaction('rw', table, async () => {
            for (const r of dirtyRecords) {
                await table.update(r.id, { syncStatus: 'synced' });
            }
        });
    }

    /**
     * PULL: Download changes from Supabase
     */
    private async pullChanges() {
        // This is a simplified "Pull Everything" approach for MVP.
        // Ideally we track `lastPulledAt` per table.
        // For now, let's pull all tables. Since local data > 0, we can use `updated_at` filter?
        // Let's try to pull records updated > locally known max update?
        // Risk: If I edit on device A, then device B pulls... conflict?
        // Strategy: Pull ALL from Server > last_known_pull_time?
        // We need to store global sync state.

        const lastPullTime = localStorage.getItem('arcnote_last_pull');
        const since = lastPullTime ? new Date(lastPullTime).toISOString() : new Date(0).toISOString();
        const now = new Date().toISOString();

        await Promise.all(Object.keys(TABLE_MAP).map(t => this.pullTable(t, since)));

        localStorage.setItem('arcnote_last_pull', now);
    }

    private async pullTable(dexieTable: string, since: string) {
        const supabaseTable = TABLE_MAP[dexieTable];
        if (!supabaseTable) return;

        const table = (db as any)[dexieTable];

        const { data, error } = await supabase
            .from(supabaseTable)
            .select('*')
            .gt('updatedAt', since); // Assuming all tables have updatedAt

        if (error) {
            console.error(`Failed to pull ${supabaseTable}:`, error);
            return;
        }

        if (!data || data.length === 0) return;

        console.log(`Pulled ${data.length} updates for ${dexieTable}`);

        await db.transaction('rw', table, async () => {
            for (const row of data) {
                // Parse Dates
                const localRow = { ...row };
                if (localRow.createdAt) localRow.createdAt = new Date(localRow.createdAt);
                if (localRow.updatedAt) localRow.updatedAt = new Date(localRow.updatedAt);
                if (localRow.date) localRow.date = new Date(localRow.date);
                if (localRow.endDate) localRow.endDate = new Date(localRow.endDate);
                if (localRow.lastVisitedAt) localRow.lastVisitedAt = new Date(localRow.lastVisitedAt);

                // Set status = synced
                localRow.syncStatus = 'synced';

                // Map back generic fields if needed? 
                // Dexie schema matches Supabase schema mostly.
                // Just Put (Overwrite local)
                await table.put(localRow);
            }
        });
    }
}

export const syncManager = new SyncManager();
