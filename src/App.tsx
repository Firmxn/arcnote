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
import { UpdatePasswordPage } from './components/pages/UpdatePasswordPage';
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

import { useBackButton } from './hooks/useBackButton';
import { useSync } from './hooks/useSync';

function App() {
  // Setup Back Button Handling
  useBackButton();

  // Auth State (for cloud sync only)
  const { initialize: initAuth } = useAuthStore();

  // Data State
  const { loadPages } = usePagesStore();
  const { loadEvents } = useSchedulesStore();
  const {
    loadWallets,
    loadBudgets,
    loadTransactions,
    loadBalances,
    loadSummary,
    loadGlobalSummary,
    loadMonthlySummary,
    loadRecentTransactions
  } = useFinanceStore();

  // Setup Sync Engine (Auto Sync + Realtime)
  useSync();

  // Initialize Auth (for cloud sync)
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Load Data - Always load from local (local-first architecture)
  useEffect(() => {
    loadPages();
    loadEvents();
    loadWallets();
    loadBudgets();
  }, [loadPages, loadEvents, loadWallets, loadBudgets]);

  // Listen for Sync/Clear Events to Reload UI
  useEffect(() => {
    const handleSyncCompleted = () => {
      console.log('🔄 Reloading data from stores...');
      loadPages();
      loadEvents();
      loadWallets();
      loadBudgets();
      loadBalances();

      // Reload active view data if applicable
      loadTransactions();
      loadSummary();
      loadGlobalSummary();
      loadMonthlySummary();
      loadRecentTransactions();
    };

    const handleDataCleared = () => {
      console.log('🗑️ Clearing UI state...');
      usePagesStore.getState().resetState();
      useSchedulesStore.getState().resetState();
      useFinanceStore.getState().resetState();
    };

    window.addEventListener('arcnote:sync-completed', handleSyncCompleted);
    window.addEventListener('arcnote:data-cleared', handleDataCleared);

    return () => {
      window.removeEventListener('arcnote:sync-completed', handleSyncCompleted);
      window.removeEventListener('arcnote:data-cleared', handleDataCleared);
    };
  }, [
    loadPages, loadEvents, loadWallets, loadBudgets, loadBalances,
    loadTransactions, loadSummary, loadGlobalSummary, loadMonthlySummary, loadRecentTransactions
  ]);

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

      {/* Login Route (outside MainLayout) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/update-password" element={<UpdatePasswordPage />} />
    </Routes>
  );
}

export default App;
