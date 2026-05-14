/**
 * LogbookManager.tsx
 * ------------------
 * Real-time attendance tracking (v1.0 Schema).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, UserCheck, Clock, LogOut as ForceOut, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../services/supabase';
import type { AttendanceLog, UserRole } from '../types';
import { CCC_PURPLE } from '../utils/constants';

const QUERY_KEY = ['attendance_logs'] as const;
const REFETCH_INTERVAL = 30_000;

async function fetchLogs(): Promise<AttendanceLog[]> {
  const { data, error } = await supabase
    .from('attendance_logs')
    .select('*, patrons(full_name, role, university_id)')
    .order('time_in', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return data as AttendanceLog[];
}

async function forceTimeOut(id: string): Promise<void> {
  const now = new Date();
  const { error } = await supabase
    .from('attendance_logs')
    .update({ time_out: now.toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

function RoleBadge({ role }: { role: UserRole | undefined }) {
  const config: Record<string, { label: string; bg: string; color: string }> = {
    STUDENT:   { label: 'Student',   bg: '#eff6ff', color: '#3b82f6' },
    FACULTY:   { label: 'Faculty',   bg: '#f0fdf4', color: '#16a34a' },
    VISITOR:   { label: 'Visitor',   bg: '#fff7ed', color: '#ea580c' },
    LIBRARIAN: { label: 'Librarian', bg: '#faf5ff', color: '#652d90' },
  };
  const cfg = config[role ?? ''] ?? { label: 'Unknown', bg: '#f3f4f6', color: '#6b7280' };
  return <span style={{ background: cfg.bg, color: cfg.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>{cfg.label}</span>;
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: isActive ? '#faf5ff' : '#f0fdf4', color: isActive ? CCC_PURPLE : '#16a34a', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isActive ? CCC_PURPLE : '#16a34a', display: 'inline-block', animation: isActive ? 'blink 1.5s infinite' : 'none' }} />
      {isActive ? 'Active' : 'Completed'}
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr>{[1, 2, 3, 4, 5, 6].map(i => (
      <td key={i} style={{ padding: '14px 16px' }}><div style={{ height: '14px', borderRadius: '6px', backgroundColor: '#e9d5ff', opacity: 0.5, animation: 'pulse 1.5s infinite', width: '80%' }} /></td>
    ))}</tr>
  );
}

export default function LogbookManager() {
  const queryClient = useQueryClient();
  const { data: logs, isLoading, isError, error, dataUpdatedAt } = useQuery<AttendanceLog[], Error>({ queryKey: QUERY_KEY, queryFn: fetchLogs, refetchInterval: REFETCH_INTERVAL });
  const timeOutMutation = useMutation({ mutationFn: forceTimeOut, onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }) });

  const activeCount = logs?.filter(l => !l.time_out).length ?? 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ClipboardList size={24} color={CCC_PURPLE} />
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e' }}>Attendance Logbook</h2>
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>{isLoading ? 'Loading…' : <><span style={{ color: CCC_PURPLE, fontWeight: 600 }}>{activeCount} inside library</span> · Updated {format(new Date(dataUpdatedAt), 'h:mm a')}</>}</p>
          </div>
        </div>
        <button onClick={() => queryClient.invalidateQueries({ queryKey: QUERY_KEY })} style={{ display: 'flex', alignItems: 'center', gap: '8px', border: `1.5px solid ${CCC_PURPLE}`, color: CCC_PURPLE, background: 'transparent', padding: '9px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}><RefreshCw size={14} /> Refresh</button>
      </div>

      <div style={{ background: `linear-gradient(135deg, ${CCC_PURPLE} 0%, #8B4DBF 100%)`, borderRadius: '16px', padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', color: '#fff', boxShadow: '0 8px 24px rgba(101,45,144,0.3)' }}>
        <UserCheck size={32} />
        <div><p style={{ fontSize: '13px', opacity: 0.8 }}>Active Patrons</p><p style={{ fontSize: '32px', fontWeight: 800 }}>{isLoading ? '…' : activeCount}</p></div>
      </div>

      {isError && <div style={{ background: '#fef2f2', padding: '16px', color: '#dc2626', marginBottom: '16px' }}>⚠️ {error.message}</div>}

      <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#faf5ff', borderBottom: '2px solid #f3e8ff' }}>
              {['Patron Name', 'Role', 'Time In', 'Time Out', 'Status', 'Action'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: CCC_PURPLE, textTransform: 'uppercase' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />) : logs?.map(entry => (
              <tr key={entry.id} style={{ borderBottom: '1px solid #f3e8ff' }}>
                <td style={{ padding: '14px 16px', fontWeight: 600 }}>{entry.patrons?.full_name ?? 'Unknown'}</td>
                <td style={{ padding: '14px 16px' }}><RoleBadge role={entry.patrons?.role} /></td>
                <td style={{ padding: '14px 16px' }}>{format(new Date(entry.time_in), 'MMM d, h:mm a')}</td>
                <td style={{ padding: '14px 16px' }}>{entry.time_out ? format(new Date(entry.time_out), 'MMM d, h:mm a') : '—'}</td>
                <td style={{ padding: '14px 16px' }}><StatusBadge isActive={!entry.time_out} /></td>
                <td style={{ padding: '14px 16px' }}>
                  {!entry.time_out && (
                    <button onClick={() => confirm(`Force exit?`) && timeOutMutation.mutate(entry.id)} style={{ background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600 }}><ForceOut size={12} /> Exit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
      `}</style>
    </div>
  );
}
