import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const MainLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Mapping URL path to ViewState for Sidebar highlighting
    const getCurrentView = () => {
        const path = location.pathname;
        if (path === '/') return 'home';
        if (path.startsWith('/pages')) return 'pages';
        if (path.startsWith('/page')) return 'page';
        if (path.startsWith('/schedule')) return 'schedule';
        if (path.startsWith('/finance')) return 'finance';
        if (path.startsWith('/settings')) return 'settings';
        return 'home';
    };

    return (
        <div className="flex h-dvh w-screen overflow-hidden bg-white dark:bg-gray-950" style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)',
        }}>
            <Sidebar
                currentView={getCurrentView()}
                onHomeClick={() => navigate('/')}
                onPagesClick={() => navigate('/pages')}
                onSettingsClick={() => navigate('/settings')}
                onScheduleClick={() => navigate('/schedule')}
                onFinanceClick={() => navigate('/finance')}
                onPageSelect={(id) => navigate(`/page/${id}`)}
            />
            {/* Main Content Area - margin-left untuk sidebar collapsed di mobile */}
            <div className="flex-1 ml-16 md:ml-0 h-full overflow-y-auto">
                <Outlet />
            </div>
        </div>
    );
};
