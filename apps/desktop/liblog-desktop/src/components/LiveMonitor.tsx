/**
 * LiveMonitor.tsx  (Phase 3)
 * --------------------------
 * Real-time attendance sensor array (v1.0 Schema).
 */
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MonitorPlay, LogOut, RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { supabase } from '../services/supabase';
import type { AttendanceLog, UserRole } from '../types';
import { CCC_PURPLE } from '../utils/constants';

const LOG_QUERY_KEY = ['live-logs'] as const;

async function fetchTodayLogs(): Promise<AttendanceLog[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('*, patrons(full_name, role, university_id)')
    .eq('date', today)
    .order('time_in', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as AttendanceLog[];
}

async function manualTimeOut(logId: string): Promise<void> {
  const { error } = await supabase
    .from('attendance_logs')
    .update({ time_out: new Date().toISOString() })
    .eq('id', logId);
  if (error) throw new Error(error.message);
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  const color = isActive ? '#16a34a' : '#6b7280';
  const bg    = isActive ? '#dcfce7' : '#f3f4f6';
  const label = isActive ? 'Active' : 'Completed';

  return (
    <span style={{ background: bg, color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
      {isActive && <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: color, animation: 'livePulse 1.8s infinite' }} />}
      {label}
    </span>
  );
}

function RolePill({ role }: { role: UserRole | undefined }) {
  const config: Record<string, { bg: string; color: string }> = {
    STUDENT:   { bg: '#eff6ff', color: '#3b82f6' },
    FACULTY:   { bg: '#f0fdf4', color: '#16a34a' },
    VISITOR:   { bg: '#fff7ed', color: '#ea580c' },
    LIBRARIAN: { bg: '#faf5ff', color: '#652d90' },
  };
  const cfg = config[role ?? ''] ?? { bg: '#f3f4f6', color: '#6b7280' };
  return <span style={{ background: cfg.bg, color: cfg.color, padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>{role?.toLowerCase() ?? 'unknown'}</span>;
}

export default function LiveMonitor() {
  const queryClient = useQueryClient();
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [pulsingId, setPulsingId] = useState<string | null>(null);

  const { data: logs = [], isLoading, isError, error, refetch } = useQuery<AttendanceLog[], Error>({
    queryKey: LOG_QUERY_KEY,
    queryFn: fetchTodayLogs,
  });

  const timeOutMutation = useMutation({
    mutationFn: manualTimeOut,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: LOG_QUERY_KEY }),
  });

  const setupRealtime = useCallback(() => {
    return supabase
      .channel('live-monitor-logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_logs' }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          const { data } = await supabase
            .from('attendance_logs')
            .select('*, patrons(full_name, role, university_id)')
            .eq('id', payload.new.id)
            .single();
          if (data) {
            const newEntry = data as AttendanceLog;
            queryClient.setQueryData<AttendanceLog[]>(LOG_QUERY_KEY, (prev = []) => [newEntry, ...prev]);
            setPulsingId(newEntry.id);
            setTimeout(() => setPulsingId(null), 3000);
          }
        } else {
          queryClient.invalidateQueries({ queryKey: LOG_QUERY_KEY });
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('connected');
        else if (status === 'CHANNEL_ERROR') setRealtimeStatus('error');
      });
  }, [queryClient]);

  useEffect(() => {
    const channel = setupRealtime();
    return () => { supabase.removeChannel(channel); };
  }, [setupRealtime]);

  const activeCount = logs.filter(l => !l.time_out).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <MonitorPlay size={24} color={CCC_PURPLE} />
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e' }}>Live Monitor</h2>
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>{format(new Date(), 'MMMM d, yyyy')} — {logs.length} entries</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '6px 12px', borderRadius: '20px', background: realtimeStatus === 'connected' ? '#dcfce7' : '#f3f4f6', fontSize: '12px', fontWeight: 600, color: realtimeStatus === 'connected' ? '#16a34a' : '#6b7280' }}>
            {realtimeStatus === 'connected' ? <><Wifi size={13} /> Live</> : 'Connecting…'}
          </div>
          <button onClick={() => refetch()} style={{ background: '#f3f4f6', padding: '8px', borderRadius: '8px' }}><RefreshCw size={15} /></button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Inside Library', value: activeCount, color: '#16a34a', bg: '#f0fdf4' },
          { label: 'Checked Out', value: logs.length - activeCount, color: '#6b7280', bg: '#f9fafb' },
          { label: 'Total Scans', value: logs.length, color: CCC_PURPLE, bg: '#faf5ff' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: '14px', padding: '16px 20px' }}>
            <p style={{ fontSize: '28px', fontWeight: 800, color: s.color }}>{s.value}</p>
            <p style={{ fontSize: '12px', color: s.color, opacity: 0.8 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#faf5ff', borderBottom: '2px solid #f3e8ff' }}>
              {['Status', 'Patron Name', 'University ID', 'Role', 'Time In', 'Time Out', 'Actions'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: CCC_PURPLE, fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} style={{ borderBottom: '1px solid #f3e8ff', opacity: log.time_out ? 0.65 : 1, backgroundColor: pulsingId === log.id ? '#dcfce7' : 'transparent', transition: 'background 0.5s' }}>
                <td style={{ padding: '13px 16px' }}><StatusBadge isActive={!log.time_out} /></td>
                <td style={{ padding: '13px 16px', fontWeight: 600 }}>{log.patrons?.full_name ?? '—'}</td>
                <td style={{ padding: '13px 16px', fontFamily: 'monospace' }}>{log.patrons?.university_id ?? '—'}</td>
                <td style={{ padding: '13px 16px' }}><RolePill role={log.patrons?.role} /></td>
                <td style={{ padding: '13px 16px' }}>{format(parseISO(log.time_in), 'h:mm a')}</td>
                <td style={{ padding: '13px 16px' }}>{log.time_out ? format(parseISO(log.time_out), 'h:mm a') : '—'}</td>
                <td style={{ padding: '13px 16px' }}>
                  {!log.time_out && (
                    <button onClick={() => confirm(`Time out?`) && timeOutMutation.mutate(log.id)} style={{ background: '#fef2f2', color: '#ef4444', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}>Time Out</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        @keyframes livePulse { 0%, 100% { opacity: 1; scale: 1; } 50% { opacity: 0.4; scale: 1.35; } }
      `}</style>
    </div>
  );
}
