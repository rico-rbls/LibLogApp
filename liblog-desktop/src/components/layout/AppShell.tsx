/**
 * AppShell.tsx
 * ------------
 * Root layout component for the LibLog Librarian Dashboard.
 * Composes Sidebar + main content area.
 *
 * Usage:
 *   <AppShell activePage="dashboard" onNavigate={setPage}>
 *     <DashboardPage />
 *   </AppShell>
 */
import type { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface AppShellProps {
  activePage: string;
  onNavigate: (id: string) => void;
  children: ReactNode;
}

export default function AppShell({ activePage, onNavigate, children }: AppShellProps) {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Left: Sticky sidebar */}
      <Sidebar activePage={activePage} onNavigate={onNavigate} />

      {/* Right: Scrollable main content */}
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px',
          backgroundColor: '#F8F5FD',
        }}
      >
        {children}
      </main>
    </div>
  );
}
