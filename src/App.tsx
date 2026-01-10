/**
 * ArcNote - Main Application Component
 * Block-based note-taking app dengan UI mirip Notion
 */

import { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { PageEditor } from './components/pages/PageEditor';
import { HomePage } from './components/pages/HomePage';
import { PagesListPage } from './components/pages/PagesListPage';
import { SettingsPage } from './components/pages/SettingsPage';
import { SchedulePage } from './components/pages/SchedulePage';
import { usePagesStore } from './state/pages.store';

type ViewState = 'home' | 'editor' | 'pages' | 'settings' | 'schedule';

function App() {
  const { loadPages, currentPage, setCurrentPage, pages, createPage } = usePagesStore();
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Load pages saat aplikasi pertama kali dibuka
  useEffect(() => {
    loadPages();
  }, [loadPages]);

  // Handler untuk membuat halaman baru
  const handleCreatePage = async () => {
    try {
      const newPage = await createPage('Untitled');
      setCurrentPage(newPage);
      setCurrentView('editor');
    } catch (error) {
      console.error('Failed to create page:', error);
    }
  };

  // Efek samping: Jika currentPage berubah, otomatis switch ke editor
  useEffect(() => {
    if (currentPage) {
      setCurrentView('editor');
    }
  }, [currentPage]);

  const renderContent = () => {
    switch (currentView) {
      case 'settings':
        return <SettingsPage />;
      case 'schedule':
        return <SchedulePage initialEventId={selectedEventId} />;
      case 'pages':
        return (
          <PagesListPage
            onPageSelect={(pageId) => {
              const page = pages.find(p => p.id === pageId);
              if (page) {
                setCurrentPage(page);
                setCurrentView('editor');
              }
            }}
          />
        );
      case 'home':
        return (
          <HomePage
            onPageSelect={(pageId) => {
              const page = pages.find(p => p.id === pageId);
              if (page) {
                setCurrentPage(page);
                setCurrentView('editor');
              }
            }}
            onScheduleClick={() => setCurrentView('schedule')}
            onEventSelect={(eventId) => {
              setSelectedEventId(eventId);
              setCurrentView('schedule');
            }}
            onNewPageClick={handleCreatePage}
          />
        );
      case 'editor':
      default:
        return currentPage ? (
          <PageEditor key={currentPage.id} page={currentPage} />
        ) : (
          <HomePage
            onPageSelect={(pageId) => {
              const page = pages.find(p => p.id === pageId);
              if (page) {
                setCurrentPage(page);
                setCurrentView('editor');
              }
            }}
            onScheduleClick={() => setCurrentView('schedule')}
            onEventSelect={(eventId) => {
              setSelectedEventId(eventId);
              setCurrentView('schedule');
            }}
            onNewPageClick={handleCreatePage}
          />
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-950">
      {/* Sidebar */}
      <Sidebar
        currentView={
          currentView === 'home' ? 'home' :
            currentView === 'pages' ? 'pages' :
              currentView === 'editor' && !currentPage ? undefined :
                currentView === 'editor' ? 'page' :
                  currentView
        }
        onHomeClick={() => setCurrentView('home')}
        onPagesClick={() => setCurrentView('pages')}
        onSettingsClick={() => setCurrentView('settings')}
        onScheduleClick={() => setCurrentView('schedule')}
        onPageSelect={() => setCurrentView('editor')}
      />

      {/* Main Content */}
      {renderContent()}
    </div>
  );
}

export default App;
