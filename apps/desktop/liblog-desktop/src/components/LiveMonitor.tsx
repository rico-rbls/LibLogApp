/**
 * LiveMonitor.tsx  (Phase 3)
 * --------------------------
 * Real-time attendance sensor array for the LibLog Librarian Dashboard.
 * Institution: Calauan Community College (CCC)
 *
 * Architecture:
 *   1. React Query fetches today's logs on mount (initial state).
 *   2. Supabase Realtime channel subscribes to INSERT/UPDATE events on
 *      `library_logs`. When the mobile QR scanner creates a new row, it
 *      appears on this screen instantly — no polling.
 *   3. On new INSERT: prepend the new row to local state + trigger the
 *      "pulse" animation to visually alert the librarian.
 *   4. On UPDATE (e.g., time_out set by another client): invalidate React
 *      Query cache so the table refreshes with fresh data.
 *   5. useEffect cleanup: always unsubscribe the Realtime channel to prevent
 *      memory leaks. (Self-Annealing Rule from directive.)
 *
 * Manual Time-Out:
 *   Calls a direct Supabase UPDATE (time_out = now(), status = 'completed').
 *   No PostgreSQL function exists for this specific operation — the directive
 *   refers to `close_stale_library_sessions` which is a scheduled function
 *   for auto-closing at 5 PM. The manual button does a targeted single-row
 *   UPDATE instead, which is the correct approach for on-demand close.
 *
 * Visual conventions:
 *   Active   → green pulse dot, green badge
 *   Completed/Auto-closed → gray, muted row
 */
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MonitorPlay, LogOut, RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { supabase } from '../services/supabase';
import type { LogEntry } from '../types';
import { CCC_PURPLE } from '../utils/constants';

// ─── Constants ────────────────────────────────────────────────────────────────
const LOG_QUERY_KEY = ['live-logs'] as const;

// ─── Supabase Fetchers ────────────────────────────────────────────────────────
async function fetchTodayLogs(): Promise<LogEntry[]> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const { data, error } = await supabase
    .from('library_logs')
    .select('*, patrons(full_name, patron_type, unified_id)')
    .gte('time_in', `${today}T00:00:00+08:00`)
    .lte('time_in', `${today}T23:59:59+08:00`)
    .order('time_in', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as LogEntry[];
}

/** Manual time-out: set time_out = now() and status = 'completed' */
async function manualTimeOut(logId: string): Promise<void> {
  const { error } = await supabase
    .from('library_logs')
    .update({ time_out: new Date().toISOString(), status: 'completed' })
    .eq('id', logId);
  if (error) throw new Error(error.message);
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: LogEntry['status'] }) {
  const cfg = {
    active:      { bg: '#dcfce7', color: '#16a34a', label: 'Active'      },
    completed:   { bg: '#f3f4f6', color: '#6b7280', label: 'Completed'   },
    'auto-closed': { bg: '#fef3c7', color: '#d97706', label: 'Auto-Closed' },
  }[status];

  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
      display: 'inline-flex', alignItems: 'center', gap: '5px',
    }}>
      {status === 'active' && (
        <span style={{
          width: '7px', height: '7px', borderRadius: '50%',
          backgroundColor: '#16a34a',
          display: 'inline-block',
          animation: 'livePulse 1.8s ease-in-out infinite',
          flexShrink: 0,
        }} />
      )}
      {cfg.label}
    </span>
  );
}

// ─── Patron Type Pill ─────────────────────────────────────────────────────────
function PatronPill({ type }: { type: string }) {
  const color = type === 'student' ? '#3b82f6' : type === 'faculty' ? '#16a34a' : '#ea580c';
  const bg    = type === 'student' ? '#eff6ff' : type === 'faculty' ? '#f0fdf4' : '#fff7ed';
  return (
    <span style={{ background: bg, color, padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' }}>
      {type}
    </span>
  );
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div style={{
            height: '14px', borderRadius: '6px',
            backgroundColor: '#dcfce7', opacity: 0.5,
            animation: 'skeletonPulse 1.5s ease-in-out infinite',
            width: i === 6 ? '60px' : '80%',
          }} />
        </td>
      ))}
    </tr>
  );
}

// ─── LiveMonitor ──────────────────────────────────────────────────────────────
export default function LiveMonitor() {
  const queryClient = useQueryClient();
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [pulsingId, setPulsingId] = useState<string | null>(null);

  // ── Initial load via React Query ──────────────────────────────────────────
  const { data: logs = [], isLoading, isError, error, refetch } = useQuery<LogEntry[], Error>({
    queryKey: LOG_QUERY_KEY,
    queryFn: fetchTodayLogs,
    // No staleTime/refetchInterval — Realtime handles live updates
  });

  // ── Manual Time-Out Mutation ──────────────────────────────────────────────
  const timeOutMutation = useMutation({
    mutationFn: manualTimeOut,
    onSuccess: () => {
      // Invalidate to get the updated row from DB (Realtime UPDATE event may
      // beat this or may not — invalidate is the safe fallback).
      queryClient.invalidateQueries({ queryKey: LOG_QUERY_KEY });
    },
  });

  const handleTimeOut = (logId: string, name: string) => {
    if (confirm(`Manually close session for ${name}?`)) {
      timeOutMutation.mutate(logId);
    }
  };

  // ── Supabase Realtime Subscription ───────────────────────────────────────
  // Wrapped in useCallback so we can reference it in useEffect cleanly.
  const setupRealtime = useCallback(() => {
    const channel = supabase
      .channel('live-monitor-logs')
      .on(
        'postgres_changes',
        {
          event: '*',           // INSERT and UPDATE
          schema: 'public',
          table: 'library_logs',
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // A student just scanned in — fetch the full row with patron join
            // because Realtime payloads don't include joined columns.
            const { data } = await supabase
              .from('library_logs')
              .select('*, patrons(full_name, patron_type, unified_id)')
              .eq('id', payload.new.id)
              .single();

            if (data) {
              const newEntry = data as LogEntry;
              // Prepend to cached list
              queryClient.setQueryData<LogEntry[]>(LOG_QUERY_KEY, (prev = []) => [
                newEntry,
                ...prev,
              ]);
              // Trigger pulse animation on this specific row
              setPulsingId(newEntry.id);
              setTimeout(() => setPulsingId(null), 3000);
            }
          } else if (payload.eventType === 'UPDATE') {
            // Session was updated (e.g., another client timed someone out)
            // Re-fetch to get accurate state rather than merging manually.
            queryClient.invalidateQueries({ queryKey: LOG_QUERY_KEY });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('connected');
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') setRealtimeStatus('error');
      });

    return channel;
  }, [queryClient]);

  useEffect(() => {
    const channel = setupRealtime();
    // ─── Cleanup: CRITICAL — prevents memory leaks on unmount ───────────────
    return () => {
      supabase.removeChannel(channel);
    };
  }, [setupRealtime]);

  // ── Derived counts ────────────────────────────────────────────────────────
  const activeCount    = logs.filter(l => l.status === 'active').length;
  const completedCount = logs.filter(l => l.status !== 'active').length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <MonitorPlay size={24} color={CCC_PURPLE} />
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e' }}>Live Monitor</h2>
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>
              {format(new Date(), 'MMMM d, yyyy')} — {logs.length} entries
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Realtime status indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', background: realtimeStatus === 'connected' ? '#dcfce7' : realtimeStatus === 'error' ? '#fef2f2' : '#f3f4f6', fontSize: '12px', fontWeight: 600, color: realtimeStatus === 'connected' ? '#16a34a' : realtimeStatus === 'error' ? '#ef4444' : '#6b7280' }}>
            {realtimeStatus === 'connected'
              ? <><Wifi size={13} /><span style={{ animation: 'none' }}>Live</span></>
              : realtimeStatus === 'error'
                ? <><WifiOff size={13} /> Disconnected</>
                : <><span style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2px solid #9ca3af', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Connecting…</>
            }
          </div>

          {/* Manual refresh */}
          <button
            onClick={() => refetch()}
            title="Refresh"
            style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#e5e7eb'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f3f4f6'; }}
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ── Stats Bar ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Currently Inside', value: activeCount,    bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
          { label: 'Checked Out Today', value: completedCount, bg: '#f9fafb', color: '#6b7280', border: '#e5e7eb' },
          { label: "Total Today",       value: logs.length,   bg: '#faf5ff', color: CCC_PURPLE, border: '#e9d5ff' },
        ].map(stat => (
          <div key={stat.label} style={{ background: stat.bg, border: `1.5px solid ${stat.border}`, borderRadius: '14px', padding: '16px 20px' }}>
            <p style={{ fontSize: '28px', fontWeight: 800, color: stat.color, lineHeight: 1 }}>{stat.value}</p>
            <p style={{ fontSize: '12px', color: stat.color, opacity: 0.75, marginTop: '4px', fontWeight: 500 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {isError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>
          ⚠️ {error.message}
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#faf5ff', borderBottom: '2px solid #f3e8ff' }}>
              {['Status', 'Patron Name', 'Unified ID', 'Type', 'Time In', 'Time Out', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: CCC_PURPLE, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : logs.length === 0
                ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
                      <MonitorPlay size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
                      No library entries today. Waiting for scans…
                    </td>
                  </tr>
                )
                : logs.map((log, idx) => {
                  const isPulsing  = pulsingId === log.id;
                  const isActive   = log.status === 'active';
                  const isEven     = idx % 2 === 0;

                  return (
                    <tr
                      key={log.id}
                      style={{
                        backgroundColor: isPulsing
                          ? '#dcfce7'   // flash green on new scan
                          : isActive
                            ? isEven ? '#fff' : '#f9fff9'
                            : isEven ? '#fff' : '#fafafa',
                        borderBottom: '1px solid #f3e8ff',
                        transition: 'background-color 0.4s ease',
                        opacity: isActive ? 1 : 0.65,
                      }}
                      onMouseEnter={e => {
                        if (!isPulsing) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#faf5ff';
                      }}
                      onMouseLeave={e => {
                        if (!isPulsing)
                          (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                            isActive ? (isEven ? '#fff' : '#f9fff9') : (isEven ? '#fff' : '#fafafa');
                      }}
                    >
                      <td style={{ padding: '13px 16px' }}>
                        <StatusBadge status={log.status} />
                      </td>
                      <td style={{ padding: '13px 16px', fontWeight: 600, color: '#1a1a2e' }}>
                        {log.patrons?.full_name ?? <span style={{ color: '#d1d5db' }}>—</span>}
                      </td>
                      <td style={{ padding: '13px 16px', fontFamily: 'monospace', fontSize: '13px', color: '#6b7280' }}>
                        {log.patrons?.unified_id ?? '—'}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        {log.patrons ? <PatronPill type={log.patrons.patron_type} /> : '—'}
                      </td>
                      <td style={{ padding: '13px 16px', color: '#374151', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Clock size={12} style={{ color: '#9ca3af', flexShrink: 0 }} />
                          {log.time_in && isToday(parseISO(log.time_in))
                            ? format(parseISO(log.time_in), 'h:mm a')
                            : log.time_in
                              ? format(parseISO(log.time_in), 'MMM d, h:mm a')
                              : '—'}
                        </div>
                      </td>
                      <td style={{ padding: '13px 16px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {log.time_out
                          ? format(parseISO(log.time_out), 'h:mm a')
                          : <span style={{ color: '#d1d5db' }}>—</span>}
                      </td>
                      <td style={{ padding: '13px 16px' }}>
                        {isActive ? (
                          <button
                            id={`timeout-${log.id}`}
                            onClick={() => handleTimeOut(log.id, log.patrons?.full_name ?? 'this patron')}
                            disabled={timeOutMutation.isPending}
                            title="Manual Time-Out"
                            style={{
                              display: 'flex', alignItems: 'center', gap: '6px',
                              padding: '6px 12px', borderRadius: '8px', border: 'none',
                              background: '#fef2f2', color: '#ef4444',
                              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                              fontFamily: 'inherit', whiteSpace: 'nowrap',
                              transition: 'background 0.15s',
                              opacity: timeOutMutation.isPending ? 0.6 : 1,
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fee2e2'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2'; }}
                          >
                            <LogOut size={13} />
                            Time Out
                          </button>
                        ) : (
                          <span style={{ color: '#d1d5db', fontSize: '13px' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
      </div>

      {/* ── Device feed info ────────────────────────────────────────────── */}
      <p style={{ marginTop: '12px', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
        New scans appear automatically via Supabase Realtime · Manual refresh available via ↻
      </p>

      {/* ── Global keyframes ────────────────────────────────────────────── */}
      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1;   transform: scale(1);    }
          50%       { opacity: 0.4; transform: scale(1.35); }
        }
        @keyframes skeletonPulse {
          0%, 100% { opacity: .35 }
          50%       { opacity: .75 }
        }
        @keyframes spin {
          from { transform: rotate(0deg) }
          to   { transform: rotate(360deg) }
        }
      `}</style>
    </div>
  );
}
