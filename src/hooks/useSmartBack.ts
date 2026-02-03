import { useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';

/**
 * Custom Hook for Smart Back Navigation
 * Centralizes the logic for "Back" behavior so both Native Back Button
 * and In-App Back Button behave identically.
 */
export const useSmartBack = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleBack = () => {
        const currentPath = location.pathname;
        console.log('🔙 SmartBack Triggered on:', currentPath);

        // 1. Login -> Exits
        if (currentPath === '/login') {
            console.log('EXIT: Login page');
            if (confirmExit()) {
                CapacitorApp.exitApp();
            }
            return;
        }

        // 2. Home -> Exits
        if (currentPath === '/') {
            console.log('EXIT: Home root');
            if (confirmExit()) {
                CapacitorApp.exitApp();
            }
            return;
        }

        // 3. Finance Subpages (Lists) -> Dashboard
        // Saat di list page (wallets/budgets), back ke dashboard
        if (currentPath === '/finance/wallets' || currentPath === '/finance/budgets') {
            console.log('NAV: Finance Subpage -> Dashboard');
            navigate('/finance');
            return;
        }

        // 4. Main Tabs -> Home
        // If we are on a main tab root, go back to Home
        const mainTabs = ['/finance', '/schedule', '/pages', '/settings', '/archive'];
        if (mainTabs.includes(currentPath)) {
            console.log('NAV: Main tab -> Home');
            navigate('/');
            return;
        }

        // 5. Default Fallback: Go Back in History
        // This handles "Sub-subpages" (e.g., Wallet Detail, Budget Detail)
        // They will naturally pop to their previous page (e.g., Wallet List or Dashboard)
        if (window.history.state && window.history.state.idx > 0) {
            console.log('NAV: History Back');
            navigate(-1);
        } else {
            // Fallback if no history (e.g. direct link open), go to parent or home
            console.log('NAV: No History -> Fallback Home');
            navigate('/', { replace: true });
        }
    };

    // Helper to allow simple confirm logic if needed (can be expanded)
    const confirmExit = () => {
        // Implement double-tap to exit or simple return true
        return true;
    };

    return { handleBack };
};
