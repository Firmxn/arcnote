import { useEffect } from 'react';
import { Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { HomePage } from './components/pages/HomePage';
import { PagesListPage } from './components/pages/PagesListPage';
import { SettingsPage } from './components/pages/SettingsPage';
import { SchedulePage } from './components/pages/SchedulePage';
import { FinanceListPage } from './components/pages/FinanceListPage';
import { FinanceDetailRoute } from './components/pages/FinanceDetailRoute';
import { EditorRoute } from './components/pages/EditorRoute';
import { usePagesStore } from './state/pages.store';
import { useSchedulesStore } from './state/schedules.store';
import { useFinanceStore } from './state/finance.store';

// --- Route Wrappers to Adapts Props to Router ---

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
  const { loadPages } = usePagesStore();
  const { loadEvents } = useSchedulesStore();
  const { loadAccounts } = useFinanceStore();

  // Load initial data
  // Note: loadTransactions removed because it depends on active account
  useEffect(() => {
    loadPages();
    loadEvents();
    loadAccounts();
    // loadSummary removed because it also depends on active account. 
    // It should be called when account is selected.
  }, [loadPages, loadEvents, loadAccounts]);

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomeWithNav />} />
        <Route path="/pages" element={<PagesListWithNav />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Finance Routes */}
        <Route path="/finance" element={<FinanceListPage />} />
        <Route path="/finance/:accountId" element={<FinanceDetailRoute />} />

        <Route path="/schedule" element={<ScheduleWithNav />} />
        <Route path="/page/:pageId" element={<EditorRoute />} />
        <Route path="*" element={<div className="p-10">404 Not Found</div>} />
      </Route>
    </Routes>
  );
}

export default App;
