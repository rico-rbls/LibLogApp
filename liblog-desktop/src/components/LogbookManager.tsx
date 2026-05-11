/**
 * LogbookManager.tsx
 * ------------------
 * Real-time attendance tracking for the LibLog Librarian Dashboard.
 * Institution: Calauan Community College (CCC)
 *
 * Features:
 *   - Supabase relational query joining library_logs → patrons
 *   - Columns: Full Name, Role (Student/Faculty/Visitor), Time-In, Status
 *   - "Force Time-Out" button for active sessions (useMutation)
 *   - Skeleton loaders during fetch, error banner on failure
 *   - 30s auto-refetch interval for near-real-time updates
 *
 * SELF-ANNEALING NOTE:
 *   The `.select('*, patrons(full_name, patron_type)')` query returns the
 *   nested `patrons` field as `Patron | null` (single object), NOT an array.
 *   This is because patron_id is a many-to-one FK. The LogEntry interface
 *   in src/types/index.ts correctly types this as:
 *     patrons: Pick<Patron, 'full_name' | 'patron_type'> | null
 *   Accessing it as `entry.patrons?.full_name` is safe and type-correct.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, UserCheck, Clock, LogOut as ForceOut, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../services/supabase';
import type { LogEntry } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────
const QUERY_KEY = ['library_logs'] as const;
const CCC_PURPLE = '#652D90';
/** Auto-refetch every 30s for near-real-time attendance tracking */
const REFETCH_INTERVAL = 30_000;

// ─── Supabase Fetchers ────────────────────────────────────────────────────────
async function fetchLogs(): Promise<LogEntry[]> {
  const { data, error } = await supabase
    .from('library_logs')
    // Relational select: patrons is returned as a single nested object (not array)
    // because patron_id is a many-to-one FK → patrons.id
    .select('*, patrons(full_name, patron_type)')
    .order('time_in', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return data as LogEntry[];
}

async function forceTimeOut(id: string): Promise<void> {
  const { error } = await supabase
    .from('library_logs')
    .update({ time_out: new Date().toISOString(), status: 'completed' })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Helper: Role badge ───────────────────────────────────────────────────────
function RoleBadge({ type }: { type: string | null | undefined }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    student:  { label: 'Student',  bg: '#eff6ff', color: '#3b82f6' },
    faculty:  { label: 'Faculty',  bg: '#f0fdf4', color: '#16a34a' },
    visitor:  { label: 'Visitor',  bg: '#fff7ed', color: '#ea580c' },
  };
  const cfg = config[type ?? ''] ?? { label: 'Unknown', bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '12px', fontWeight: 600,
    }}>
      {cfg.label}
    </span>
  );
}

// ─── Helper: Status badge ─────────────────────────────────────────────────────
function StatusBadge({ status }: { status: LogEntry['status'] }) {
  const isActive = status === 'active';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: isActive ? '#faf5ff' : '#f0fdf4',
      color: isActive ? CCC_PURPLE : '#16a34a',
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '12px', fontWeight: 600,
    }}>
      <span style={{
        width: '6px', height: '6px', borderRadius: '50%',
        backgroundColor: isActive ? CCC_PURPLE : '#16a34a',
        display: 'inline-block',
        animation: isActive ? 'blink 1.5s ease-in-out infinite' : 'none',
      }} />
      {isActive ? 'Active' : 'Completed'}
    </span>
  );
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5].map(i => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div style={{
            height: '14px', borderRadius: '6px',
            backgroundColor: '#e9d5ff', opacity: 0.5,
            animation: 'pulse 1.5s ease-in-out infinite',
            width: i === 5 ? '60px' : '80%',
          }} />
        </td>
      ))}
    </tr>
  );
}

// ─── LogbookManager ───────────────────────────────────────────────────────────
export default function LogbookManager() {
  const queryClient = useQueryClient();

  // ── Fetch — refetches every 30s automatically ──────────────────────────────
  const { data: logs, isLoading, isError, error, dataUpdatedAt } = useQuery<LogEntry[], Error>({
    queryKey: QUERY_KEY,
    queryFn: fetchLogs,
    refetchInterval: REFETCH_INTERVAL,
  });

  // ── Force Time-Out Mutation ────────────────────────────────────────────────
  const timeOutMutation = useMutation({
    mutationFn: forceTimeOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const handleForceOut = (id: string, name: string) => {
    if (confirm(`Force time-out for ${name}?`)) {
      timeOutMutation.mutate(id);
    }
  };

  // ── Derived stats ──────────────────────────────────────────────────────────
  const activeCount = logs?.filter(l => l.status === 'active').length ?? 0;
  const lastUpdated = dataUpdatedAt
    ? format(new Date(dataUpdatedAt), 'h:mm:ss a')
    : '—';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ClipboardList size={24} color={CCC_PURPLE} />
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e' }}>Attendance Logbook</h2>
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>
              {isLoading ? 'Loading…' : (
                <>
                  <span style={{ color: CCC_PURPLE, fontWeight: 600 }}>{activeCount} active</span>
                  {' '}· Last updated: {lastUpdated}
                </>
              )}
            </p>
          </div>
        </div>
        {/* Manual refresh */}
        <button
          onClick={() => queryClient.invalidateQueries({ queryKey: QUERY_KEY })}
          title="Refresh now"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            border: `1.5px solid ${CCC_PURPLE}`, color: CCC_PURPLE,
            background: 'transparent',
            padding: '9px 18px', borderRadius: '10px',
            cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#faf5ff'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Active session stat card */}
      <div style={{
        background: `linear-gradient(135deg, ${CCC_PURPLE} 0%, #8B4DBF 100%)`,
        borderRadius: '16px', padding: '20px 24px',
        display: 'flex', alignItems: 'center', gap: '16px',
        marginBottom: '20px', color: '#fff',
        boxShadow: '0 8px 24px rgba(101,45,144,0.3)',
      }}>
        <UserCheck size={32} style={{ opacity: 0.9 }} />
        <div>
          <p style={{ fontSize: '13px', opacity: 0.75, marginBottom: '4px' }}>Currently Inside Library</p>
          <p style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1 }}>
            {isLoading ? '…' : activeCount}
          </p>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>
          ⚠️ Failed to load logs: {error.message}
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#faf5ff', borderBottom: '2px solid #f3e8ff' }}>
              {['Full Name', 'Role', 'Time In', 'Time Out', 'Status', 'Action'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: CCC_PURPLE, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              : logs?.map((entry, idx) => (
                <tr
                  key={entry.id}
                  style={{
                    backgroundColor: idx % 2 === 0 ? '#fff' : '#fdfbff',
                    borderBottom: '1px solid #f3e8ff',
                    transition: 'background-color 0.12s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#faf5ff'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = idx % 2 === 0 ? '#fff' : '#fdfbff'; }}
                >
                  {/* Full Name — safe: patrons is Patron | null per LogEntry type */}
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1a1a2e' }}>
                    {entry.patrons?.full_name ?? (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Unknown Patron</span>
                    )}
                  </td>

                  {/* Role badge */}
                  <td style={{ padding: '14px 16px' }}>
                    <RoleBadge type={entry.patrons?.patron_type} />
                  </td>

                  {/* Time In */}
                  <td style={{ padding: '14px 16px', color: '#4b5563' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={13} style={{ color: '#9ca3af' }} />
                      {format(new Date(entry.time_in), 'MMM d, h:mm a')}
                    </span>
                  </td>

                  {/* Time Out */}
                  <td style={{ padding: '14px 16px', color: '#4b5563' }}>
                    {entry.time_out
                      ? format(new Date(entry.time_out), 'MMM d, h:mm a')
                      : <span style={{ color: '#9ca3af' }}>—</span>}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '14px 16px' }}>
                    <StatusBadge status={entry.status} />
                  </td>

                  {/* Force Time-Out action */}
                  <td style={{ padding: '14px 16px' }}>
                    {entry.status === 'active' ? (
                      <button
                        onClick={() => handleForceOut(entry.id, entry.patrons?.full_name ?? 'this patron')}
                        disabled={timeOutMutation.isPending}
                        title="Force time-out"
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          background: '#fff7ed', border: '1px solid #fed7aa',
                          borderRadius: '8px', padding: '6px 12px',
                          cursor: 'pointer', color: '#ea580c',
                          fontSize: '12px', fontWeight: 600,
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#ffedd5'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fff7ed'; }}
                      >
                        <ForceOut size={12} />
                        Force Out
                      </button>
                    ) : (
                      <span style={{ color: '#d1d5db', fontSize: '13px' }}>—</span>
                    )}
                  </td>
                </tr>
              ))
            }
            {!isLoading && logs?.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
                  <ClipboardList size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
                  No log entries found for today.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes pulse { 0%,100%{opacity:.4}50%{opacity:.8} }
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:.3} }
      `}</style>
    </div>
  );
}
