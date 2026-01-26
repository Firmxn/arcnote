import { useEffect, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * useBackButton Hook
 * Menangani tombol back native Android dengan logic hierarkis
 */
export const useBackButton = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const locationRef = useRef(location);

    // Update ref setiap kali location berubah
    useEffect(() => {
        locationRef.current = location;
    }, [location]);

    useEffect(() => {
        let isMounted = true;
        let handler: any = null;

        const setupListener = async () => {
            console.log('🔄 Setting up Back Button Listener...');

            try {
                const listener = await CapacitorApp.addListener('backButton', (data) => {
                    if (!isMounted) return;

                    const currentPath = locationRef.current.pathname;
                    console.log('📱 Native Back Pressed:', { currentPath, canGoBack: data.canGoBack });

                    // 1. Explicit Hierarchy: Finance Subpages -> Finance Dashboard
                    // Prioritas tinggi: handle subpage spesifik dulu sebelum logic umum
                    if (currentPath === '/finance/wallets' || currentPath === '/finance/budgets') {
                        console.log('NAV: Finance Subpage -> Dashboard');
                        navigate('/finance');
                        return;
                    }

                    // 2. Login -> Exits
                    if (currentPath === '/login') {
                        console.log('EXIT: Login page');
                        CapacitorApp.exitApp();
                        return;
                    }

                    // 3. Home -> Exits
                    if (currentPath === '/') {
                        console.log('EXIT: Home root');
                        CapacitorApp.exitApp();
                        return;
                    }

                    // 4. Main Tabs -> Home
                    const mainTabs = ['/finance', '/schedule', '/pages', '/settings', '/archive'];

                    // Cek exact match, ATAU jika path diawali main tab tapi BUKAN subpage yang sudah dihandle di atas
                    if (mainTabs.some(path => currentPath.startsWith(path)) && (
                        mainTabs.includes(currentPath)
                        || currentPath === '/finance'
                    )) {
                        console.log('NAV: Main tab -> Home');
                        navigate('/');
                        return;
                    }

                    // 5. Default: Subpage -> Back
                    console.log('NAV: Subpage -> Back');
                    navigate(-1);
                });

                if (isMounted) {
                    handler = listener;
                    console.log('✅ Back Button Listener Attached Successfully');
                } else {
                    console.log('⚠️ Component unmounted before listener attached, removing immediately');
                    listener.remove();
                }
            } catch (err) {
                console.error('❌ Failed to setup back button listener:', err);
            }
        };

        setupListener();

        return () => {
            isMounted = false;
            if (handler) {
                console.log('🗑️ Removing Back Button Listener');
                handler.remove();
            }
        };
    }, []); // Empty dependency array = run once on mount
};
