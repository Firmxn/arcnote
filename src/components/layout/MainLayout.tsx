import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { usePagesStore } from '../../state/pages.store';

export const MainLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { createPage, setCurrentPage } = usePagesStore();

    // Mapping URL path to ViewState for navigation highlighting
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

    const handleCreatePage = async () => {
        try {
            const page = await createPage('Untitled');
            setCurrentPage(page);
            navigate(`/page/${page.id}`);
        } catch (error) {
            console.error('Failed to create page:', error);
        }
    };

    return (
        <div className="flex h-dvh w-screen overflow-hidden bg-white dark:bg-gray-950" style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)',
        }}>
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <Sidebar
                    currentView={getCurrentView()}
                    onHomeClick={() => navigate('/')}
                    onPagesClick={() => navigate('/pages')}
                    onSettingsClick={() => navigate('/settings')}
                    onScheduleClick={() => navigate('/schedule')}
                    onFinanceClick={() => navigate('/finance')}
                    onPageSelect={(id) => navigate(`/page/${id}`)}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 h-full overflow-hidden relative min-h-0">
                <Outlet />
            </div>

            {/* Mobile Bottom Navigation */}
            <BottomNav
                currentView={getCurrentView()}
                onHomeClick={() => navigate('/')}
                onPagesClick={() => navigate('/pages')}
                onCreatePageClick={handleCreatePage}
                onScheduleClick={() => navigate('/schedule')}
                onFinanceClick={() => navigate('/finance')}
                onSettingsClick={() => navigate('/settings')}
            />
        </div>
    );
};
