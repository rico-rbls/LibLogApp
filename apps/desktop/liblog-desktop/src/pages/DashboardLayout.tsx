/**
 * DashboardLayout.tsx
 * -------------------
 * Main content area for the LibLog Librarian Dashboard.
 * Uses local state to switch between the Books and Logbook views.
 *
 * Tab indicator uses CCC Purple (#652D90) as the active underline border,
 * conforming to the design mandate in mvp_crud_tables.md.
 *
 * To add a new view:
 *   1. Add an entry to TABS
 *   2. Add a case to renderView()
 */
import { useState } from 'react';
import { BookCopy, ClipboardList } from 'lucide-react';
import BooksManager from '../components/BooksManager';
import LogbookManager from '../components/LogbookManager';

// ─── Constants ────────────────────────────────────────────────────────────────
import { CCC_PURPLE } from '../utils/constants';

type TabId = 'books' | 'logbook';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
  description: string;
}

const TABS: Tab[] = [
  {
    id: 'logbook',
    label: 'Attendance Logbook',
    icon: ClipboardList,
    description: 'Real-time student & patron check-ins',
  },
  {
    id: 'books',
    label: 'Book Inventory',
    icon: BookCopy,
    description: 'Manage titles, copies, and availability',
  },
];

// ─── View Router ──────────────────────────────────────────────────────────────
function renderView(tab: TabId) {
  switch (tab) {
    case 'books':   return <BooksManager />;
    case 'logbook': return <LogbookManager />;
  }
}

// ─── DashboardLayout ──────────────────────────────────────────────────────────
export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState<TabId>('logbook');

  return (
    <div>
      {/* ── Page Title ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1a1a2e', marginBottom: '4px' }}>
          Librarian Dashboard
        </h1>
        <p style={{ fontSize: '14px', color: '#9ca3af' }}>
          Calauan Community College — Library Management System
        </p>
      </div>

      {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
      <div
        role="tablist"
        style={{
          display: 'flex',
          gap: '4px',
          borderBottom: '2px solid #f3e8ff',
          marginBottom: '28px',
        }}
      >
        {TABS.map(({ id, label, icon: Icon, description }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(id)}
              title={description}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? CCC_PURPLE : '#6b7280',
                // Active indicator: bottom border rendered via outline trick
                borderBottom: isActive ? `2px solid ${CCC_PURPLE}` : '2px solid transparent',
                marginBottom: '-2px', // overlap the tab bar border
                transition: 'color 0.15s, border-color 0.15s',
                borderRadius: '0',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = CCC_PURPLE;
              }}
              onMouseLeave={e => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = '#6b7280';
              }}
            >
              <Icon
                size={16}
                style={{
                  color: isActive ? CCC_PURPLE : '#9ca3af',
                  transition: 'color 0.15s',
                }}
              />
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Active View ─────────────────────────────────────────────────── */}
      <div role="tabpanel">
        {renderView(activeTab)}
      </div>
    </div>
  );
}
