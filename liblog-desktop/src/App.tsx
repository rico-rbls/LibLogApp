/**
 * App.tsx
 * -------
 * Root application component for the LibLog Librarian Dashboard.
 * Institution: Calauan Community College (CCC)
 *
 * Auth Flow:
 *   1. authStore.ts bootstraps onAuthStateChange at module load.
 *   2. On first render, isInitialized = false → show a centered loading spinner
 *      (prevents the flash of the login screen on page refresh).
 *   3. Once onAuthStateChange fires its first event (INITIAL_SESSION):
 *      - isInitialized = true
 *      - session = null  → render AuthGate
 *      - session = {...} → render SidebarLayout + active page
 *
 * Session Persistence:
 *   Supabase JS v2 stores the session in localStorage automatically.
 *   On page refresh, onAuthStateChange fires immediately with the stored
 *   session, so the user is never forced to log in again.
 */
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import AuthGate from './components/auth/AuthGate';
import SidebarLayout, { type PageId } from './components/layout/SidebarLayout';
import DashboardLayout from './pages/DashboardLayout';
import PatronManager from './components/PatronManager';
import LiveMonitor from './components/LiveMonitor';
import ReportGenerator from './components/ReportGenerator';
import CirculationManager from './components/CirculationManager';
import OverdueDashboard from './components/OverdueDashboard';
import { CCC_PURPLE, CCC_AUTH_BG_START, CCC_AUTH_BG_END, QUERY_STALE_TIME, QUERY_RETRY_COUNT } from './utils/constants';

// ─── React Query Client ────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME,
      retry: QUERY_RETRY_COUNT,
      refetchOnWindowFocus: false,
    },
  },
});

// ─── Page Registry ────────────────────────────────────────────────────────────
function renderPage(page: PageId) {
  switch (page) {
    case 'dashboard':    return <DashboardLayout />;
    case 'books':        return <DashboardLayout />;
    case 'patrons':      return <PatronManager />;
    case 'circulation':  return <CirculationManager />;
    case 'overdue':      return <OverdueDashboard />;
    case 'live-monitor': return <LiveMonitor />;
    case 'reports':      return <ReportGenerator />;
  }
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
function InitializingScreen() {
  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(135deg, ${CCC_AUTH_BG_START} 0%, ${CCC_AUTH_BG_END} 100%)`,
      flexDirection: 'column', gap: '16px',
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%',
        border: `3px solid ${CCC_PURPLE}4D`,
        borderTopColor: CCC_PURPLE,
        animation: 'spin 0.9s linear infinite',
      }} />
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', fontFamily: "'Inter', system-ui, sans-serif" }}>
        Loading LibLog…
      </p>
      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const { session, isInitialized } = useAuthStore();
  const [activePage, setActivePage] = useState<PageId>('dashboard');

  // Phase 1: Wait for Supabase to resolve the stored session
  if (!isInitialized) return <InitializingScreen />;

  // Phase 2: Not authenticated → show login
  if (!session) return <AuthGate />;

  // Phase 3: Authenticated → show dashboard
  return (
    <QueryClientProvider client={queryClient}>
      <SidebarLayout activePage={activePage} onNavigate={setActivePage}>
        {renderPage(activePage)}
      </SidebarLayout>
    </QueryClientProvider>
  );
}
