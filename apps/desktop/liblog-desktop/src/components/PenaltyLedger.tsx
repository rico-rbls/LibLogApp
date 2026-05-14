/**
 * PenaltyLedger.tsx
 * -----------------
 * Displays all overdue borrow records with calculated penalties.
 * (v1.0 Schema)
 */
import { differenceInDays, format, parseISO } from 'date-fns';
import { AlertTriangle, CheckCircle, RefreshCw, PhilippinePeso } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import type { BorrowRecordWithRelations, UserRole } from '../types';
import { CCC_PURPLE } from '../utils/constants';

const PENALTY_RATE = 5;

function calcPenalty(dueDateStr: string): number {
  const daysOverdue = differenceInDays(new Date(), parseISO(dueDateStr));
  return Math.max(0, daysOverdue) * PENALTY_RATE;
}

async function fetchOverdueLoans(): Promise<BorrowRecordWithRelations[]> {
  const { data, error } = await supabase
    .from('borrow_records')
    .select('*, resources(title, author, isbn), patrons(full_name, university_id, role)')
    .eq('status', 'OVERDUE')
    .order('due_date', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as BorrowRecordWithRelations[];
}

async function settlePenalty(id: string): Promise<void> {
  // Mark penalty as paid (simplification: setting paid_fine_amount = calculated)
  const { data: rec } = await supabase.from('borrow_records').select('due_date').eq('id', id).single();
  if (!rec) return;
  const fine = calcPenalty(rec.due_date);
  const { error } = await supabase.from('borrow_records').update({ paid_fine_amount: fine }).eq('id', id);
  if (error) throw new Error(error.message);
}

function RoleBadge({ role }: { role: UserRole | undefined }) {
  const colors: Record<string, string> = { STUDENT: '#3b82f6', FACULTY: '#16a34a', VISITOR: '#ea580c', LIBRARIAN: '#652d90' };
  return <span style={{ color: colors[role ?? ''] || '#6b7280', fontSize: '11px', fontWeight: 700 }}>{role}</span>;
}

export default function PenaltyLedger() {
  const queryClient = useQueryClient();
  const { data: loans = [], isLoading, isError, error, refetch } = useQuery<BorrowRecordWithRelations[], Error>({ queryKey: ['penalty-ledger'], queryFn: fetchOverdueLoans });

  const mutation = useMutation({
    mutationFn: settlePenalty,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['penalty-ledger'] }),
  });

  const grandTotal = loans.reduce((sum, l) => sum + calcPenalty(l.due_date), 0);

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading ledger…</div>;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div><h1 style={{ fontSize: '24px', fontWeight: 800 }}>Penalty Ledger</h1><p style={{ color: '#9ca3af' }}>Overdue fines (₱5/day)</p></div>
        <div style={{ background: '#FEF3C7', padding: '12px 20px', borderRadius: '12px', textAlign: 'right' }}>
          <p style={{ fontSize: '11px', fontWeight: 600 }}>OUTSTANDING</p>
          <p style={{ fontSize: '24px', fontWeight: 800, color: '#92400E' }}>₱{grandTotal.toLocaleString()}</p>
        </div>
      </div>

      {loans.length === 0 ? (
        <div style={{ background: '#fff', padding: '48px', textAlign: 'center', borderRadius: '16px' }}>
          <CheckCircle size={48} color="#10B981" style={{ margin: '0 auto 16px' }} />
          <p>No outstanding penalties.</p>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#fafafa' }}>
              <tr>{['Patron', 'Resource', 'Due Date', 'Fine', 'Action'].map(h => <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase' }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loans.map(loan => {
                const penalty = calcPenalty(loan.due_date);
                return (
                  <tr key={loan.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 600 }}>{loan.patrons?.full_name}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>{loan.patrons?.university_id} <RoleBadge role={loan.patrons?.role} /></div>
                    </td>
                    <td style={{ padding: '14px 20px' }}><div style={{ fontWeight: 500 }}>{loan.resources?.title}</div></td>
                    <td style={{ padding: '14px 20px', color: '#dc2626', fontWeight: 600 }}>{format(parseISO(loan.due_date), 'MMM d, yyyy')}</td>
                    <td style={{ padding: '14px 20px', fontWeight: 800 }}>₱{penalty.toLocaleString()}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <button onClick={() => confirm(`Settle?`) && mutation.mutate(loan.id)} style={{ background: '#10B981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>Settle ₱{penalty}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
