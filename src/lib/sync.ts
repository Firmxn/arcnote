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
import type { RealtimeChannel } from '@supabase/supabase-js';

// ... (existing helper maps and functions)

// Map Dexie Table Names to Supabase Table Names
const TABLE_MAP: Record<string, string> = {
    wallets: 'wallets',
    finance: 'finance',
    budgets: 'budgets',
    budgetAssignments: 'budgetAssignments',
    schedules: 'schedules',
    pages: 'pages',
    blocks: 'blocks',
};

// ... (helpers)

// Per-field mapping: Dexie -> Supabase (untuk Push)
const DEXIE_TO_SUPABASE: Record<string, Record<string, string>> = {
    wallets: {},
    finance: {},
    pages: {},
    schedules: {},
    blocks: {},
    budgets: {},
    budgetAssignments: {},
};

// Per-field mapping: Supabase -> Dexie (untuk Pull)
const SUPABASE_TO_DEXIE: Record<string, Record<string, string>> = {
    wallets: {},
    finance: {},
    pages: {},
    schedules: {},
    blocks: {},
    budgets: {},
    budgetAssignments: {},
};

/**
 * Transform object keys dari Dexie format ke Supabase format
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
    private realtimeChannel: RealtimeChannel | null = null;
    private syncDebounceTimer: any = null;

    /**
     * Trigger Sync with Debounce
     */
    private triggerDebouncedSync() {
        if (this.syncDebounceTimer) clearTimeout(this.syncDebounceTimer);

        console.log('⚡ Realtime change detected. Scheduling sync...');
        this.syncDebounceTimer = setTimeout(() => {
            console.log('⚡ Executing debounced sync now.');
            this.sync();
        }, 2000); // 2s debounce
    }

    /**
     * Initialize Realtime Subscription
     */
    initializeRealtime() {
        if (this.realtimeChannel) return;

        console.log('📡 Initializing Realtime Subscription...');
        const channel = supabase.channel('db-changes');

        // Listen to changes on all mapped tables
        const tables = Object.values(TABLE_MAP);

        tables.forEach(tableName => {
            channel.on(
                'postgres_changes',
                { event: '*', schema: 'public', table: tableName },
                () => {
                    this.triggerDebouncedSync();
                }
            );
        });

        channel.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('✅ Realtime Connected.');
            }
        });

        this.realtimeChannel = channel;
    }

    /**
     * Cleanup Realtime Subscription
     */
    cleanupRealtime() {
        if (this.realtimeChannel) {
            console.log('🔌 Disconnecting Realtime...');
            supabase.removeChannel(this.realtimeChannel);
            this.realtimeChannel = null;
        }
        if (this.syncDebounceTimer) {
            clearTimeout(this.syncDebounceTimer);
            this.syncDebounceTimer = null;
        }
    }

    /**
     * Main Sync Function
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
                throw error;
            }
        }

        // Cleanup local queue
        const queueIds = queueItems.map((i: SyncQueueItem) => i.id);
        await db.syncQueue.bulkDelete(queueIds);
    }

    /**
     * Generic Push Table with Batching
     */
    private async pushTable(dexieTable: keyof typeof db, userId: string) {
        const table = db[dexieTable] as any; // Dynamic access
        const CHUNK_SIZE = 50; // Batch size to prevent payload too large

        // Find 'created' or 'updated' records
        let dirtyRecords = await table
            .filter((r: Syncable) => r.syncStatus === 'created' || r.syncStatus === 'updated')
            .toArray();

        if (dirtyRecords.length === 0) return;

        // Sort pages: parent pages (parentId = null) dipush terlebih dahulu
        if (dexieTable === 'pages') {
            dirtyRecords = this.sortPagesByHierarchy(dirtyRecords);
        }

        const supabaseTableName = TABLE_MAP[dexieTable as string];
        if (!supabaseTableName) return;

        console.log(`Pushing ${dirtyRecords.length} records to ${supabaseTableName}...`);

        // Prepare Payloads
        const allPayloads = dirtyRecords.map((r: any) => {
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

            // Inject User ID jika dibutuhkan
            const tablesNeedingUserId = ['wallets', 'finance', 'budgets', 'budgetAssignments', 'schedules', 'pages', 'blocks'];
            if (tablesNeedingUserId.includes(dexieTable as string)) {
                if (!payload.userId) payload.userId = userId;
            }

            // Transform field names
            return toSupabasePayload(payload, dexieTable as string);
        });

        // Loop per Chunk
        for (let i = 0; i < allPayloads.length; i += CHUNK_SIZE) {
            const chunk = allPayloads.slice(i, i + CHUNK_SIZE);
            console.log(`Uploading chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(allPayloads.length / CHUNK_SIZE)} for ${dexieTable}`);

            if (dexieTable === 'pages') {
                // Sequential push upsert untuk pages (karena hierarchy)
                // Batch upsert might fail if parent is in same batch but processed after child?
                // Supabase upsert is atomic per row or per batch? 
                // It's safer to do sequential for pages generally, OR carefully sorted batch.
                // Since we sorted topologically, batch upsert SHOULD be fine if Postgres processes sequentially.
                // But to be 100% safe for Pages: sequential or small batches.
                // Let's stick to batch upsert for all, assuming topological sort helps.
                // If deep nesting exists > CHUNK_SIZE, we might split parent and child into different chunks.
                // Correct. Since we loop chunks sequentially, Parent (chk 1) will be saved before Child (chk 2).

                const { error } = await supabase.from(supabaseTableName).upsert(chunk);
                if (error) {
                    console.error(`Failed to push pages batch ${i}:`, error);
                    // For pages, we might want to continue best effort? Or stop?
                    // Stop preserves consistency.
                    throw error;
                }
            } else {
                // Batch Upsert for others
                const { error } = await supabase.from(supabaseTableName).upsert(chunk);
                if (error) {
                    console.error(`Failed to push ${dexieTable} batch ${i}:`, error);
                    throw error;
                }
            }
        }

        // On Success: Mark as Synced
        // We mark ALL as synced only if all chunks succeed.
        // Optimized: Mark synced per chunk? No, complexity.
        // Simple: Mark all synced at end.
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
     * Updated: Granular Checkpoints (Per-table timestamp)
     */
    private async pullChanges() {
        const lastGlobalPull = localStorage.getItem('arcnote_last_pull');
        const now = new Date().toISOString();

        // Define pull order priority: Parents -> Children
        const tablesOrdered = [
            'wallets',
            'budgets',
            'pages',
            'finance',
            'budgetAssignments',
            'blocks',
            'schedules'
        ];

        for (const dexieTable of tablesOrdered) {
            // Get per-table timestamp or fallback to global/epoch
            const storageKey = `arcnote_last_pull_${dexieTable}`;
            const lastTablePull = localStorage.getItem(storageKey);

            // Prioritize table-specific tick, then global tick, then 0
            const sinceValues = [lastTablePull, lastGlobalPull, new Date(0).toISOString()];
            // Valid valid is non-null.
            const since = sinceValues.find(v => v !== null) as string;

            try {
                await this.pullTable(dexieTable, since);
                // On success, update timestamp for THIS table
                localStorage.setItem(storageKey, now);
            } catch (error) {
                console.error(`Partial sync failed for ${dexieTable}. Continuing others...`, error);
                // Continue loop to try other tables = Partial Recovery
            }
        }

        // Update global pull time just as a reference, though less used now
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
            throw error; // Let parent catch it
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
