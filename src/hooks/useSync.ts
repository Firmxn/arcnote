import { useEffect, useState, useCallback } from 'react';
import { syncManager } from '../lib/sync';

export function useSync() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);

    const triggerSync = useCallback(async () => {
        if (!navigator.onLine) return;
        setIsSyncing(true);
        try {
            await syncManager.sync();
        } finally {
            setIsSyncing(false);
        }
    }, []);

    useEffect(() => {
        // Initial Sync and Realtime Setup on Mount (if online)
        if (navigator.onLine) {
            triggerSync();
            syncManager.initializeRealtime();
        }

        const handleOnline = () => {
            setIsOnline(true);
            triggerSync();
            syncManager.initializeRealtime();
        };

        const handleOffline = () => {
            setIsOnline(false);
            syncManager.cleanupRealtime();
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Interval Sync (e.g. every 2 minutes)
        const interval = setInterval(() => {
            if (navigator.onLine) triggerSync();
        }, 2 * 60 * 1000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
            syncManager.cleanupRealtime();
        };
    }, [triggerSync]);

    return {
        isOnline,
        isSyncing,
        syncNow: triggerSync
    };
}
