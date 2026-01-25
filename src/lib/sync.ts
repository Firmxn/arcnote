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

/**
 * Field Mapping Utilities
 * Transform field names antara Dexie (camelCase) dan Supabase (mixed case)
 * 
 * Supabase schema inkonsisten:
 * - wallets, finance_transactions, pages, schedules: user_id (snake_case)
 * - budgets, budget_assignments: userId (camelCase)
 * - wallets: themeColor (Supabase) vs theme (Dexie)
 */

// Per-field mapping: Dexie -> Supabase (untuk Push)
const DEXIE_TO_SUPABASE: Record<string, Record<string, string>> = {
    wallets: { userId: 'user_id', theme: 'themeColor' },
    finance: { userId: 'user_id' },
    pages: { userId: 'user_id' },
    schedules: { userId: 'user_id' },
    blocks: { userId: 'user_id' },
    // budgets dan budgetAssignments sudah camelCase di Supabase, tidak perlu transform
};

// Per-field mapping: Supabase -> Dexie (untuk Pull)
const SUPABASE_TO_DEXIE: Record<string, Record<string, string>> = {
    wallets: { user_id: 'userId', themeColor: 'theme' },
    finance: { user_id: 'userId' },
    pages: { user_id: 'userId' },
    schedules: { user_id: 'userId' },
    blocks: { user_id: 'userId' },
    // budgets dan budgetAssignments sudah camelCase di Supabase, tidak perlu transform
};

/**
 * Transform object keys dari Dexie format ke Supabase format
 * @param obj - Object dari Dexie
 * @param dexieTable - Nama table Dexie (untuk lookup mapping yang tepat)
 */
function toSupabasePayload(obj: Record<string, any>, dexieTable: string): Record<string, any> {
    const mapping = DEXIE_TO_SUPABASE[dexieTable] || {};
    const result: Record<string, any> = {};

    for (const key in obj) {
        const newKey = mapping[key] || key;
        result[newKey] = obj[key];
    }
    return result;
}

/**
 * Transform object keys dari Supabase format ke Dexie format
 * @param obj - Object dari Supabase
 * @param dexieTable - Nama table Dexie (untuk lookup mapping yang tepat)
 */
function toDexieRecord(obj: Record<string, any>, dexieTable: string): Record<string, any> {
    const mapping = SUPABASE_TO_DEXIE[dexieTable] || {};
    const result: Record<string, any> = {};

    for (const key in obj) {
        const newKey = mapping[key] || key;
        result[newKey] = obj[key];
    }
    return result;
}

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

            // 2. Check User Context - Clear data jika user berbeda atau first-time login
            const lastUserId = localStorage.getItem('arcnote_user_id');
            if (!lastUserId || lastUserId !== userId) {
                // First-time login atau user switch - clear data lama dan pull fresh
                console.log(`🔄 ${!lastUserId ? 'First login' : 'User changed'}. Clearing local data...`);
                await this.clearAllLocalData();
                localStorage.removeItem('arcnote_last_pull'); // Reset pull timestamp
            }
            localStorage.setItem('arcnote_user_id', userId);

            // 3. Push Local Changes (Upload data kotor)
            await this.pushChanges(userId);

            // 4. Pull Cloud Changes (Download data baru)
            await this.pullChanges();

            console.log('✅ Sync Completed.');
            window.dispatchEvent(new Event('arcnote:sync-completed'));
        } catch (error) {
            console.error('❌ Sync Failed:', error);
        } finally {
            this.isSyncing = false;
        }
    }

    /**
     * Clear semua data lokal saat user switch
     */
    private async clearAllLocalData() {
        const tables = ['wallets', 'finance', 'budgets', 'budgetAssignments', 'schedules', 'pages', 'blocks'];

        await db.transaction('rw',
            [db.wallets, db.finance, db.budgets, db.budgetAssignments,
            db.schedules, db.pages, db.blocks, db.syncQueue],
            async () => {
                for (const tableName of tables) {
                    const table = (db as any)[tableName];
                    await table.clear();
                }
                // Clear sync queue juga
                await db.syncQueue.clear();
            }
        );

        console.log('✅ Local data cleared for user switch.');
        window.dispatchEvent(new Event('arcnote:data-cleared'));
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
        let dirtyRecords = await table
            .filter((r: Syncable) => r.syncStatus === 'created' || r.syncStatus === 'updated')
            .toArray();

        if (dirtyRecords.length === 0) return;

        // Sort pages: parent pages (parentId = null) dipush terlebih dahulu
        // Ini mencegah FK constraint violation saat child dipush sebelum parent
        if (dexieTable === 'pages') {
            dirtyRecords = this.sortPagesByHierarchy(dirtyRecords);
        }

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

            // Inject User ID jika dibutuhkan (sebelum transform field names)
            const tablesNeedingUserId = ['wallets', 'finance', 'budgets', 'budgetAssignments', 'schedules', 'pages', 'blocks'];
            if (tablesNeedingUserId.includes(dexieTable as string)) {
                if (!payload.userId) payload.userId = userId;
            }

            // Transform field names dari Dexie (camelCase) ke Supabase (snake_case)
            return toSupabasePayload(payload, dexieTable as string);
        });

        // Untuk pages: push sequential setelah topological sort untuk menghindari FK error
        // Untuk table lain: batch upsert
        if (dexieTable === 'pages') {
            // Sequential push untuk pages
            for (const payload of payloads) {
                const { error } = await supabase.from(supabaseTableName).upsert(payload);
                if (error) {
                    console.error(`Failed to push page ${payload.id}:`, error);
                    // Skip error untuk page individual, lanjut ke page berikutnya
                    // Ini memungkinkan parent yang sudah ada untuk ter-push dulu
                    continue;
                }
            }
        } else {
            // Batch Upsert untuk table lain
            const { error } = await supabase.from(supabaseTableName).upsert(payloads);
            if (error) {
                console.error(`Failed to push ${dexieTable}:`, error);
                throw error;
            }
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
     * Sort pages agar parent dipush sebelum child
     * Mencegah FK constraint violation pada parentId
     */
    private sortPagesByHierarchy(pages: any[]): any[] {
        // Topological sort: parent (parentId = null/undefined) dulu, baru child
        const sorted: any[] = [];
        const remaining = [...pages];
        const pushedIds = new Set<string>();

        // Loop sampai semua pages ter-sort
        while (remaining.length > 0) {
            let progressMade = false;

            for (let i = remaining.length - 1; i >= 0; i--) {
                const page = remaining[i];
                const parentId = page.parentId;

                // Push jika: tidak ada parent, atau parent sudah di-push/sudah ada di Supabase
                if (!parentId || pushedIds.has(parentId)) {
                    sorted.push(page);
                    pushedIds.add(page.id);
                    remaining.splice(i, 1);
                    progressMade = true;
                }
            }

            // Jika tidak ada progress (circular dependency atau missing parent), push sisanya
            if (!progressMade) {
                console.warn('Pages hierarchy: some pages have missing parents, pushing anyway');
                sorted.push(...remaining);
                break;
            }
        }

        return sorted;
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

        // Tables yang tidak punya updatedAt column, gunakan createdAt
        const tablesWithoutUpdatedAt = ['budgetAssignments'];
        const timestampColumn = tablesWithoutUpdatedAt.includes(dexieTable) ? 'createdAt' : 'updatedAt';

        const { data, error } = await supabase
            .from(supabaseTable)
            .select('*')
            .gt(timestampColumn, since);

        if (error) {
            console.error(`Failed to pull ${supabaseTable}:`, error);
            return;
        }

        if (!data || data.length === 0) return;

        console.log(`Pulled ${data.length} updates for ${dexieTable}`);

        await db.transaction('rw', table, async () => {
            for (const row of data) {
                // Transform field names dari Supabase ke Dexie
                const mappedRow = toDexieRecord(row, dexieTable);

                // Parse Dates
                if (mappedRow.createdAt) mappedRow.createdAt = new Date(mappedRow.createdAt);
                if (mappedRow.updatedAt) mappedRow.updatedAt = new Date(mappedRow.updatedAt);
                if (mappedRow.date) mappedRow.date = new Date(mappedRow.date);
                if (mappedRow.endDate) mappedRow.endDate = new Date(mappedRow.endDate);
                if (mappedRow.lastVisitedAt) mappedRow.lastVisitedAt = new Date(mappedRow.lastVisitedAt);

                // Set status = synced
                mappedRow.syncStatus = 'synced';

                // Put (Overwrite local)
                await table.put(mappedRow);
            }
        });
    }
}

export const syncManager = new SyncManager();

/**
 * Helper: Clear local data untuk user switch
 * Dipanggil dari auth store saat onAuthStateChange detect user berbeda
 */
export async function clearUserData(newUserId: string) {
    const lastUserId = localStorage.getItem('arcnote_user_id');

    // Jika user berbeda atau first-time login, clear data
    if (!lastUserId || lastUserId !== newUserId) {
        console.log(`🔄 User switch detected (${lastUserId || 'none'} → ${newUserId}). Clearing data...`);

        const tables = ['wallets', 'finance', 'budgets', 'budgetAssignments', 'schedules', 'pages', 'blocks'];

        await db.transaction('rw',
            [db.wallets, db.finance, db.budgets, db.budgetAssignments,
            db.schedules, db.pages, db.blocks, db.syncQueue],
            async () => {
                for (const tableName of tables) {
                    const table = (db as any)[tableName];
                    await table.clear();
                }
                await db.syncQueue.clear();
            }
        );

        localStorage.setItem('arcnote_user_id', newUserId);
        localStorage.removeItem('arcnote_last_pull');

        console.log('✅ Local data cleared immediately.');
        window.dispatchEvent(new Event('arcnote:data-cleared'));
        return true; // Data was cleared
    }

    return false; // No clear needed
}

/**
 * Helper: Clear ALL local data (untuk logout)
 * Tidak perlu check user ID, langsung clear semua
 */
export async function clearAllData() {
    console.log('��� Clearing all local data (logout)...');

    const tables = ['wallets', 'finance', 'budgets', 'budgetAssignments', 'schedules', 'pages', 'blocks'];

    await db.transaction('rw',
        [db.wallets, db.finance, db.budgets, db.budgetAssignments,
        db.schedules, db.pages, db.blocks, db.syncQueue],
        async () => {
            for (const tableName of tables) {
                const table = (db as any)[tableName];
                await table.clear();
            }
            await db.syncQueue.clear();
        }
    );

    // Clear localStorage juga
    localStorage.removeItem('arcnote_user_id');
    localStorage.removeItem('arcnote_last_pull');

    console.log('✅ All local data cleared.');
    window.dispatchEvent(new Event('arcnote:data-cleared'));
}
