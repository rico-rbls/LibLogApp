/**
 * OverdueDashboard.tsx  (Phase 5)
 * ---------------------------------
 * Overdue tracking & penalty settlement (v1.0 Schema).
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Loader2, PhilippinePeso } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { supabase } from '../services/supabase';
import type { BorrowRecordWithRelations } from '../types';
import {
  CCC_PURPLE, CCC_PURPLE_TINT,
  COLOR_DANGER, COLOR_DANGER_BG,
  COLOR_WARNING, COLOR_WARNING_BG,
  FONT_FAMILY,
} from '../utils/constants';

const OVERDUE_KEY = ['overdue-loans'] as const;
const PENALTY_RATE = 5;

function calcDaysOverdue(dueDateISO: string): number {
  return Math.max(1, differenceInDays(new Date(), parseISO(dueDateISO)));
}

function calcPenalty(dueDateISO: string): number {
  return calcDaysOverdue(dueDateISO) * PENALTY_RATE;
}

async function fetchOverdueLoans(): Promise<BorrowRecordWithRelations[]> {
  const { data, error } = await supabase
    .from('borrow_records')
    .select('*, resources(title, author, isbn, available_copies), patrons(full_name, university_id, role)')
    .lt('due_date', new Date().toISOString())
    .eq('status', 'ACTIVE')
    .order('due_date', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as BorrowRecordWithRelations[];
}

async function settlePenaltyAndReturn(loan: BorrowRecordWithRelations): Promise<void> {
  const now = new Date().toISOString();
  // 1. Update borrow record
  const { error: loanErr } = await supabase
    .from('borrow_records')
    .update({ return_date: now, status: 'RETURNED' })
    .eq('id', loan.id);
  if (loanErr) throw new Error(loanErr.message);

  // 2. Update resource copies
  const { data: res, error: fetchErr } = await supabase
    .from('resources')
    .select('available_copies, total_copies')
    .eq('id', loan.resource_id)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);

  const newCopies = Math.min((res.available_copies ?? 0) + 1, res.total_copies ?? 1);
  await supabase.from('resources').update({ available_copies: newCopies }).eq('id', loan.resource_id);
}

function SeverityBadge({ days }: { days: number }) {
  const severe = days >= 7;
  return <span style={{ background: severe ? COLOR_DANGER_BG : COLOR_WARNING_BG, color: severe ? COLOR_DANGER : COLOR_WARNING, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>{days}d overdue</span>;
}

export default function OverdueDashboard() {
  const qc = useQueryClient();
  const { data: loans = [], isLoading, isError, error, refetch } = useQuery<BorrowRecordWithRelations[], Error>({ queryKey: OVERDUE_KEY, queryFn: fetchOverdueLoans, refetchInterval: 1000 * 60 * 5 });
  const settleMutation = useMutation({ mutationFn: settlePenaltyAndReturn, onSuccess: () => { qc.invalidateQueries({ queryKey: OVERDUE_KEY }); qc.invalidateQueries({ queryKey: ['resources'] }); } });

  const totalPenalties = loans.reduce((sum, l) => sum + calcPenalty(l.due_date), 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertTriangle size={24} color={COLOR_WARNING} />
          <div><h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e' }}>Overdue Dashboard</h2><p style={{ fontSize: '13px', color: '#9ca3af' }}>₱{PENALTY_RATE}/day penalty</p></div>
        </div>
        <button onClick={() => refetch()} style={{ background: '#f3f4f6', borderRadius: '8px', padding: '8px 14px' }}>↻ Refresh</button>
      </div>

      {!isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
          {[
            { label: 'Overdue Loans', value: loans.length, bg: COLOR_DANGER_BG, color: COLOR_DANGER },
            { label: 'Total Fines', value: `₱${totalPenalties}`, bg: COLOR_WARNING_BG, color: COLOR_WARNING },
            { label: 'Critical (7+ days)', value: loans.filter(l => calcDaysOverdue(l.due_date) >= 7).length, bg: '#fef2f2', color: '#b91c1c' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.color}`, borderRadius: '14px', padding: '16px 20px' }}>
              <p style={{ fontSize: '28px', fontWeight: 800, color: s.color }}>{s.value}</p>
              <p style={{ fontSize: '12px', color: s.color, fontWeight: 500 }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {isError && <div style={{ background: COLOR_DANGER_BG, color: COLOR_DANGER, padding: '16px', marginBottom: '16px' }}>⚠️ {error.message}</div>}

      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {isLoading ? <div style={{ height: '200px', background: '#f3f4f6', borderRadius: '10px' }} /> : loans.length === 0 ? <p style={{ textAlign: 'center', padding: '40px' }}>No overdue loans found.</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f3e8ff' }}>
                {['Patron', 'Resource', 'Due Date', 'Overdue', 'Fine', 'Action'].map(h => <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: CCC_PURPLE, fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {loans.map(loan => (
                <tr key={loan.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '13px 14px' }}>
                    <div style={{ fontWeight: 600 }}>{loan.patrons?.full_name}</div>
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{loan.patrons?.university_id}</div>
                  </td>
                  <td style={{ padding: '13px 14px' }}>
                    <div style={{ fontWeight: 500 }}>{loan.resources?.title}</div>
                  </td>
                  <td style={{ padding: '13px 14px', color: COLOR_DANGER, fontWeight: 600 }}>{format(parseISO(loan.due_date), 'MMM d, yyyy')}</td>
                  <td style={{ padding: '13px 14px' }}><SeverityBadge days={calcDaysOverdue(loan.due_date)} /></td>
                  <td style={{ padding: '13px 14px' }}><div style={{ background: CCC_PURPLE_TINT, color: CCC_PURPLE, padding: '4px 12px', borderRadius: '20px', fontWeight: 700 }}>₱{calcPenalty(loan.due_date)}</div></td>
                  <td style={{ padding: '13px 14px' }}>
                    <button onClick={() => confirm(`Settle fine?`) && settleMutation.mutate(loan)} style={{ background: CCC_PURPLE, color: '#fff', padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 700 }}>Settle & Return</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
