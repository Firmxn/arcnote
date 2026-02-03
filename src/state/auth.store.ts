import { create } from 'zustand';
import { supabase } from '../data/supabase';
import type { User, AuthError } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    error: AuthError | null;

    isGuest: boolean;

    // Actions
    initialize: () => Promise<void>;
    setUser: (user: User | null) => void;
    setGuest: (isGuest: boolean) => void;
    signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isGuest: false,
    isLoading: true,
    error: null,

    initialize: async () => {
        set({ isLoading: true });

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        set({ user: session?.user || null, error: error, isLoading: false });

        // Listen for changes
        supabase.auth.onAuthStateChange(async (_event, session) => {
            const newUser = session?.user || null;

            // Clear data immediately jika user berbeda
            if (newUser) {
                const { clearUserData } = await import('../lib/sync');
                await clearUserData(newUser.id);
                // If user logs in, they are no longer a guest
                set({ user: newUser, isGuest: false, isLoading: false });
            } else {
                set({ user: null, isLoading: false });
            }
        });
    },

    setUser: (user) => set({ user }),
    setGuest: (isGuest) => set({ isGuest }),

    signOut: async () => {
        // Clear local data saat logout (best practice untuk privacy & security)
        const { clearAllData } = await import('../lib/sync');
        await clearAllData();

        await supabase.auth.signOut();

        // Sign out from Google Plugin if on native platform
        if (Capacitor.isNativePlatform()) {
            try {
                await GoogleAuth.signOut();
            } catch (e) {
                console.error('Failed to sign out from Google Auth Plugin', e);
            }
        }

        set({ user: null, isGuest: false });
    },
}));
