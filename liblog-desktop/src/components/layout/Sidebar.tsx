/**
 * Sidebar.tsx
 * -----------
 * Admin navigation sidebar for the LibLog Librarian Dashboard.
 * Institution: Calauan Community College (CCC)
 *
 * Design tokens used:
 *   --color-sidebar-bg      → Deep purple-black background
 *   --color-sidebar-hover   → Hover state
 *   --color-ccc-purple      → Active indicator (#652D90)
 *
 * Nav items are defined in NAV_ITEMS — add new routes here.
 */
import { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BarChart3,
  LogOut,
  Library,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// ─── Type Definitions ──────────────────────────────────────────────────────────
interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  /** Future: replace with react-router-dom <Link to={path}> */
  path: string;
}

interface SidebarProps {
  /** Currently active nav item id */
  activePage: string;
  onNavigate: (id: string) => void;
}

// ─── Navigation Registry ───────────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',    label: 'Dashboard',      icon: LayoutDashboard, path: '/' },
  { id: 'student-logs', label: 'Student Logs',   icon: Users,           path: '/logs' },
  { id: 'inventory',    label: 'Book Inventory',  icon: BookOpen,        path: '/inventory' },
  { id: 'reports',      label: 'Reports',         icon: BarChart3,       path: '/reports' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      style={{
        width: collapsed ? '72px' : '240px',
        backgroundColor: 'var(--color-sidebar-bg)',
        transition: 'width 0.25s ease',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        boxShadow: '4px 0 20px rgba(101, 45, 144, 0.15)',
      }}
    >
      {/* ── Logo / Brand ─────────────────────────────────────────── */}
      <div style={{
        padding: collapsed ? '20px 0' : '20px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        minHeight: '72px',
      }}>
        <Library size={28} color="#652D90" style={{ flexShrink: 0 }} />
        {!collapsed && (
          <div>
            <p style={{ color: '#ffffff', fontWeight: 700, fontSize: '15px', lineHeight: 1.2 }}>
              LibLog
            </p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>
              CCC Library System
            </p>
          </div>
        )}
      </div>

      {/* ── Navigation Items ─────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                padding: collapsed ? '12px' : '12px 14px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                justifyContent: collapsed ? 'center' : 'flex-start',
                backgroundColor: isActive
                  ? 'var(--color-ccc-purple)'
                  : 'transparent',
                color: isActive ? '#ffffff' : 'rgba(255,255,255,0.55)',
                fontWeight: isActive ? 600 : 400,
                fontSize: '14px',
                transition: 'background-color 0.15s ease, color 0.15s ease',
                // Hover handled via inline onMouseEnter/Leave for no-CSS-module simplicity
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                    'var(--color-sidebar-hover)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.55)';
                }
              }}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* ── Collapse Toggle ──────────────────────────────────────── */}
      <div style={{ padding: '8px' }}>
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            backgroundColor: 'transparent',
            color: 'rgba(255,255,255,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={e =>
            ((e.currentTarget as HTMLButtonElement).style.backgroundColor =
              'rgba(255,255,255,0.06)')
          }
          onMouseLeave={e =>
            ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent')
          }
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && (
            <span style={{ marginLeft: '8px', fontSize: '13px' }}>Collapse</span>
          )}
        </button>
      </div>

      {/* ── Sign Out ─────────────────────────────────────────────── */}
      <div style={{ padding: '8px 8px 16px' }}>
        <button
          title="Sign out"
          onClick={() => alert('Sign out — wire to supabase.auth.signOut()')}
          style={{
            width: '100%',
            padding: collapsed ? '12px' : '12px 14px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer',
            backgroundColor: 'transparent',
            color: 'rgba(255,255,255,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: '12px',
            fontSize: '13px',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor =
              'rgba(255, 80, 80, 0.1)';
            (e.currentTarget as HTMLButtonElement).style.color = '#ff6b6b';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.4)';
          }}
        >
          <LogOut size={16} style={{ flexShrink: 0 }} />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
