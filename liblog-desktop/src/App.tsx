/**
 * App.tsx
 * -------
 * Root application component for the LibLog Librarian Dashboard.
 *
 * Providers wired here (top-level, never re-create lower in the tree):
 *   - QueryClientProvider  → React Query (server state)
 *   - AppShell             → Layout (sidebar + content area)
 *
 * Routing note: Currently uses simple useState for active page.
 * Replace with react-router-dom when page count grows beyond 4.
 */
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppShell from './components/layout/AppShell';
import DashboardPage from './pages/DashboardPage';

// ─── React Query Client ────────────────────────────────────────────────────────
// staleTime: 30s — balances freshness vs network calls on slow connections
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,       // 30 seconds
      retry: 2,                    // retry failed requests twice (offline resilience)
      refetchOnWindowFocus: false, // avoid jarring refetches on alt-tab
    },
  },
});

// ─── Page Registry ────────────────────────────────────────────────────────────
// Add new page components here as the app grows
function renderPage(page: string) {
  switch (page) {
    case 'dashboard':    return <DashboardPage />;
    case 'student-logs': return <div style={{padding:'32px'}}><h1>Student Logs</h1><p style={{color:'#6b7280',marginTop:'8px'}}>Coming next sprint.</p></div>;
    case 'inventory':    return <div style={{padding:'32px'}}><h1>Book Inventory</h1><p style={{color:'#6b7280',marginTop:'8px'}}>Coming next sprint.</p></div>;
    case 'reports':      return <div style={{padding:'32px'}}><h1>Reports</h1><p style={{color:'#6b7280',marginTop:'8px'}}>Coming next sprint.</p></div>;
    default:             return <DashboardPage />;
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [activePage, setActivePage] = useState('dashboard');

  return (
    <QueryClientProvider client={queryClient}>
      <AppShell activePage={activePage} onNavigate={setActivePage}>
        {renderPage(activePage)}
      </AppShell>
    </QueryClientProvider>
  );
}
