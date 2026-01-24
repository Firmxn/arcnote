import { useEffect } from 'react';
import { Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { HomePage } from './components/pages/HomePage';
import { ArchivePage } from './components/pages/ArchivePage';
import { PagesListPage } from './components/pages/PagesListPage';
import { SettingsPage } from './components/pages/SettingsPage';
import { SchedulePage } from './components/pages/SchedulePage';
import { DashboardPage } from './components/pages/finance/DashboardPage';
import { WalletsPage } from './components/pages/finance/WalletsPage';
import { WalletDetailRoute } from './components/pages/finance/WalletDetailRoute';
import BudgetsPage from './components/pages/finance/BudgetsPage';
import BudgetDetailPage from './components/pages/finance/BudgetDetailPage';
import { EditorRoute } from './components/pages/EditorRoute';
import { LoginPage } from './components/pages/LoginPage';
import { usePagesStore } from './state/pages.store';
import { useSchedulesStore } from './state/schedules.store';
import { useFinanceStore } from './state/finance.store';
import { useAuthStore } from './state/auth.store';

// --- Route Wrappers to Adapt Props to Router ---

const HomeWithNav = () => {
  const navigate = useNavigate();
  const { createPage, setCurrentPage } = usePagesStore();

  const handleCreate = async () => {
    try {
      const page = await createPage('Untitled');
      setCurrentPage(page);
      navigate(`/page/${page.id}`);
    } catch (error) {
      console.error('Failed to create page:', error);
    }
  };

  return (
    <HomePage
      onPageSelect={(id) => {
        navigate(`/page/${id}`);
      }}
      onScheduleClick={() => navigate('/schedule')}
      onEventSelect={(id) => navigate(`/schedule?eventId=${id}`)}
      onFinanceClick={(id) => navigate(`/finance/${id}`)}
      onNewPageClick={handleCreate}
      onViewArchive={() => navigate('/archive')}
    />
  );
};

const PagesListWithNav = () => {
  const navigate = useNavigate();
  return (
    <PagesListPage
      onPageSelect={(id) => navigate(`/page/${id}`)}
    />
  );
};

const ScheduleWithNav = () => {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId') || null;
  return <SchedulePage initialEventId={eventId} />;
};

function App() {
  // Auth State
  const { user, initialize: initAuth, isLoading: isAuthLoading } = useAuthStore();

  // Data State
  const { loadPages } = usePagesStore();
  const { loadEvents } = useSchedulesStore();
  const { loadWallets } = useFinanceStore();

  const isBackend = localStorage.getItem('arcnote_storage_preference') === 'backend';

  // Initialize Auth
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Load Data only when ready
  useEffect(() => {
    // If backend, wait for user. If local, load immediately.
    const canLoad = !isBackend || (isBackend && user);

    if (canLoad) {
      loadPages();
      loadEvents();
      loadWallets();
    }
  }, [loadPages, loadEvents, loadWallets, user, isBackend]);

  // Auth Guard for Backend Mode
  if (isBackend) {
    if (isAuthLoading) {
      return (
        <div className="h-screen w-full flex items-center justify-center bg-primary text-white">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand"></div>
        </div>
      );
    }
    if (!user) {
      return <LoginPage />;
    }
  }

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomeWithNav />} />
        <Route path="/pages" element={<PagesListWithNav />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/archive" element={<ArchivePage />} />

        {/* Finance Routes */}
        <Route path="/finance">
          <Route index element={<DashboardPage />} />
          <Route path="wallets" element={<WalletsPage />} />
          <Route path="budgets" element={<BudgetsPage />} />
          <Route path="budgets/:id" element={<BudgetDetailPage />} />
          <Route path=":walletId" element={<WalletDetailRoute />} />
        </Route>

        <Route path="/schedule" element={<ScheduleWithNav />} />
        <Route path="/page/:pageId" element={<EditorRoute />} />
        <Route path="*" element={<div className="p-10 dark:text-white">404 Not Found</div>} />
      </Route>
    </Routes>
  );
}

export default App;
