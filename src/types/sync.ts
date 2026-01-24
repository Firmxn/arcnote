/**
 * Common types for Synchronization
 */

export type SyncStatus = 'synced' | 'created' | 'updated';

export interface Syncable {
    syncStatus?: SyncStatus;
    lastSyncedAt?: Date;
}
