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

// ─── React Query Client ────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,       // 30s — balanced for slow/unstable networks
      retry: 2,                   // offline resilience
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
    case 'live-monitor': return (
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a2e', marginBottom: '8px' }}>Live Monitor</h1>
        <p style={{ color: '#9ca3af' }}>Real-time attendance feed — coming in Phase 3.</p>
      </div>
    );
    case 'reports':      return (
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a2e', marginBottom: '8px' }}>Reports</h1>
        <p style={{ color: '#9ca3af' }}>CHED compliance export — coming in Phase 4.</p>
      </div>
    );
  }
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────
function InitializingScreen() {
  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1E1030 0%, #2D1A4A 100%)',
      flexDirection: 'column', gap: '16px',
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%',
        border: '3px solid rgba(101,45,144,0.3)',
        borderTopColor: '#652D90',
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
