/**
 * SidebarLayout.tsx
 * -----------------
 * Persistent sidebar navigation shell for authenticated librarian sessions.
 * Institution: Calauan Community College (CCC)
 *
 * Nav items: Dashboard, Books, Patrons, Live Monitor, Reports
 * Active state highlighted with CCC Purple (#652D90).
 * Sign Out button wired to authStore.signOut() → triggers onAuthStateChange
 * → App.tsx automatically returns to AuthGate.
 *
 * This replaces the old AppShell + Sidebar composition.
 * The `page` prop / `onNavigate` callback integrate with App.tsx state router.
 */
import { type ReactNode } from 'react';
import {
  LayoutDashboard,
  BookCopy,
  Users,
  MonitorPlay,
  BarChart3,
  Library,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';

// ─── Constants ────────────────────────────────────────────────────────────────
const CCC_PURPLE = '#652D90';
const SIDEBAR_BG = '#1E1030';
const SIDEBAR_HOVER = '#2D1A4A';

// ─── Nav Registry ─────────────────────────────────────────────────────────────
type PageId = 'dashboard' | 'books' | 'patrons' | 'live-monitor' | 'reports';

interface NavItem {
  id: PageId;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'books',        label: 'Books',          icon: BookCopy        },
  { id: 'patrons',      label: 'Patrons',        icon: Users           },
  { id: 'live-monitor', label: 'Live Monitor',   icon: MonitorPlay     },
  { id: 'reports',      label: 'Reports',        icon: BarChart3       },
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface SidebarLayoutProps {
  activePage: PageId;
  onNavigate: (id: PageId) => void;
  children: ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function SidebarLayout({ activePage, onNavigate, children }: SidebarLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { signOut, session } = useAuthStore();

  const userEmail = session?.user?.email ?? 'Librarian';

  const handleSignOut = async () => {
    if (confirm('Sign out of LibLog?')) {
      await signOut();
      // App.tsx onAuthStateChange → session = null → renders AuthGate
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside style={{
        width: collapsed ? '72px' : '248px',
        backgroundColor: SIDEBAR_BG,
        transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        boxShadow: '4px 0 24px rgba(101,45,144,0.18)',
        zIndex: 10,
        overflow: 'hidden',
      }}>

        {/* ── Brand ──────────────────────────────────────────────────────── */}
        <div style={{
          padding: collapsed ? '20px 0' : '20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          minHeight: '72px',
          flexShrink: 0,
        }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: `linear-gradient(135deg, ${CCC_PURPLE} 0%, #8B4DBF 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: `0 4px 12px ${CCC_PURPLE}44`,
          }}>
            <Library size={20} color="#fff" />
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: '15px', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                LibLog
              </p>
              <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '11px', whiteSpace: 'nowrap' }}>
                CCC Library System
              </p>
            </div>
          )}
        </div>

        {/* ── Navigation ─────────────────────────────────────────────────── */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activePage === id;
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                title={collapsed ? label : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: collapsed ? '12px' : '11px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  backgroundColor: isActive ? CCC_PURPLE : 'transparent',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.52)',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '14px',
                  transition: 'background-color 0.15s ease, color 0.15s ease',
                  fontFamily: 'inherit',
                  boxShadow: isActive ? `0 4px 16px ${CCC_PURPLE}44` : 'none',
                  position: 'relative',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = SIDEBAR_HOVER;
                    (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.52)';
                  }
                }}
              >
                <Icon size={18} style={{ flexShrink: 0 }} />
                {!collapsed && <span>{label}</span>}
              </button>
            );
          })}
        </nav>

        {/* ── Collapse Toggle ─────────────────────────────────────────────── */}
        <div style={{ padding: '4px 8px' }}>
          <button
            onClick={() => setCollapsed(c => !c)}
            title={collapsed ? 'Expand' : 'Collapse'}
            style={{
              width: '100%', padding: '9px', borderRadius: '10px', border: 'none',
              cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              fontSize: '12px', fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            {collapsed ? <ChevronRight size={15} /> : <><ChevronLeft size={15} /><span>Collapse</span></>}
          </button>
        </div>

        {/* ── User / Sign Out ─────────────────────────────────────────────── */}
        <div style={{ padding: '8px 8px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: '4px' }}>
          {!collapsed && (
            <div style={{ padding: '8px 10px 10px', marginBottom: '4px' }}>
              <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '11px', marginBottom: '2px' }}>Signed in as</p>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {userEmail}
              </p>
            </div>
          )}
          <button
            onClick={handleSignOut}
            title="Sign out"
            style={{
              width: '100%',
              padding: collapsed ? '12px' : '10px 14px',
              borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer',
              background: 'transparent',
              color: 'rgba(255,255,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: '10px',
              fontSize: '13px',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)';
              (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,0.25)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)';
            }}
          >
            <LogOut size={15} style={{ flexShrink: 0 }} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        backgroundColor: '#F8F5FD',
        padding: '32px',
      }}>
        {children}
      </main>
    </div>
  );
}

// Export PageId so App.tsx can use it as a type without re-defining
export type { PageId };
