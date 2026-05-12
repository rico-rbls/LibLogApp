/**
 * PenaltyLedger.tsx
 * -----------------
 * Displays all overdue book loans with calculated penalties.
 * Allows librarians to settle individual penalties (marks penalty_paid = true).
 *
 * Data source : book_loans WHERE status = 'overdue' AND penalty_paid = false
 * Penalty rate: ₱5 per day overdue (computed client-side from due_date → now)
 * Branding    : CCC Purple (#652D90), Success Green (#10B981) per branding.md
 */
import { differenceInDays } from 'date-fns';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import type { BookLoanWithRelations } from '../types';

// ─── Branding Tokens (branding.md §1) ────────────────────────────────────────
const CCC_PURPLE     = '#652D90';
const SUCCESS_GREEN  = '#10B981';
const WARNING_AMBER  = '#F59E0B';
const SURFACE_LIGHT  = '#F5EDF9';
const PAGE_BG        = '#f2f2fa';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const PENALTY_RATE = 5; // ₱5 per day

function calcPenalty(dueDateStr: string): number {
  const daysOverdue = differenceInDays(new Date(), new Date(dueDateStr));
  return Math.max(0, daysOverdue) * PENALTY_RATE;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

// ─── Supabase Fetcher ─────────────────────────────────────────────────────────
async function fetchOverdueLoans(): Promise<BookLoanWithRelations[]> {
  const { data, error } = await supabase
    .from('book_loans')
    .select('*, books(title, author, isbn, available_copies), patrons(full_name, unified_id, patron_type)')
    .eq('status', 'overdue')
    .eq('penalty_paid', false)
    .order('due_date', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as BookLoanWithRelations[];
}

async function settlePenalty(loanId: string): Promise<void> {
  const { error } = await supabase
    .from('book_loans')
    .update({ penalty_paid: true })
    .eq('id', loanId);

  if (error) throw new Error(error.message);
}

// ─── Patron Type Badge ────────────────────────────────────────────────────────
function PatronBadge({ type }: { type: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    student:  { bg: SURFACE_LIGHT, text: CCC_PURPLE },
    faculty:  { bg: '#EDE9FE',     text: '#7C3AED'  },
    visitor:  { bg: '#FEF3C7',     text: '#92400E'  },
  };
  const c = colors[type] ?? colors.visitor;
  return (
    <span style={{
      backgroundColor: c.bg, color: c.text,
      fontSize: '11px', fontWeight: 600,
      padding: '2px 8px', borderRadius: '999px',
      textTransform: 'capitalize',
    }}>
      {type}
    </span>
  );
}

// ─── PenaltyLedger ────────────────────────────────────────────────────────────
export default function PenaltyLedger() {
  const queryClient = useQueryClient();
  const [settling, setSettling] = useState<string | null>(null);

  const { data: loans = [], isLoading, isError, error, refetch } = useQuery<BookLoanWithRelations[]>({
    queryKey: ['penalty-ledger'],
    queryFn: fetchOverdueLoans,
  });

  const mutation = useMutation({
    mutationFn: settlePenalty,
    onMutate: (loanId) => setSettling(loanId),
    onSettled: () => {
      setSettling(null);
      queryClient.invalidateQueries({ queryKey: ['penalty-ledger'] });
      queryClient.invalidateQueries({ queryKey: ['book_loans'] });
    },
  });

  // ── Grand total ────────────────────────────────────────────────────────────
  const grandTotal = loans.reduce((sum, l) => sum + calcPenalty(l.due_date), 0);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px', gap: '12px', color: '#9ca3af' }}>
        <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px' }}>Loading penalty ledger…</span>
        <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '12px', padding: '20px', color: '#DC2626', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <AlertTriangle size={18} />
        <span style={{ fontSize: '14px', fontFamily: "'Inter', sans-serif" }}>
          {(error as Error).message}
        </span>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: PAGE_BG, minHeight: '100vh', padding: '28px' }}>

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1a1a2e', margin: 0 }}>
            Penalty Ledger
          </h1>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '4px' }}>
            Overdue fines — ₱5 per calendar day past due date
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Grand total chip */}
          <div style={{
            background: loans.length > 0 ? '#FEF3C7' : SURFACE_LIGHT,
            border: `1px solid ${loans.length > 0 ? WARNING_AMBER : CCC_PURPLE}33`,
            borderRadius: '12px', padding: '10px 18px',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#6b7280', margin: '0 0 2px' }}>TOTAL OUTSTANDING</p>
            <p style={{ fontSize: '22px', fontWeight: 800, color: loans.length > 0 ? '#92400E' : CCC_PURPLE, margin: 0 }}>
              ₱{grandTotal.toLocaleString()}
            </p>
          </div>

          <button
            onClick={() => refetch()}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '10px 16px', borderRadius: '10px',
              border: `1.5px solid ${CCC_PURPLE}33`,
              background: SURFACE_LIGHT, color: CCC_PURPLE,
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Empty State ───────────────────────────────────────────────────── */}
      {loans.length === 0 ? (
        <div style={{
          background: '#FFFFFF', borderRadius: '16px', padding: '60px 32px',
          textAlign: 'center', border: `1.5px solid ${SUCCESS_GREEN}33`,
        }}>
          <CheckCircle size={48} style={{ color: SUCCESS_GREEN, margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e', margin: '0 0 8px' }}>
            All clear!
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
            No outstanding overdue penalties at this time.
          </p>
        </div>
      ) : (

        /* ── Data Table ─────────────────────────────────────────────────── */
        <div style={{ background: '#FFFFFF', borderRadius: '16px', overflow: 'hidden' }}>
          {/* Overdue count banner */}
          <div style={{
            background: `linear-gradient(135deg, ${CCC_PURPLE} 0%, #4A2068 100%)`,
            padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} style={{ color: WARNING_AMBER }} />
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>
                {loans.length} Overdue {loans.length === 1 ? 'Loan' : 'Loans'}
              </span>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
              Rate: ₱{PENALTY_RATE}/day
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: PAGE_BG }}>
                {['Patron', 'Book', 'Due Date', 'Days Overdue', 'Penalty', 'Action'].map(h => (
                  <th key={h} style={{
                    padding: '12px 20px', textAlign: 'left',
                    fontSize: '11px', fontWeight: 600, color: '#9ca3af',
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                    borderBottom: '1px solid #f3f4f6',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loans.map((loan, idx) => {
                const daysOver  = Math.max(0, differenceInDays(new Date(), new Date(loan.due_date)));
                const penalty   = daysOver * PENALTY_RATE;
                const isSettling = settling === loan.id;

                return (
                  <tr
                    key={loan.id}
                    style={{
                      background: idx % 2 === 0 ? '#FFFFFF' : '#fafafa',
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = SURFACE_LIGHT)}
                    onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? '#FFFFFF' : '#fafafa')}
                  >
                    {/* Patron */}
                    <td style={{ padding: '14px 20px' }}>
                      <p style={{ fontWeight: 600, color: '#1a1a2e', fontSize: '14px', margin: '0 0 4px' }}>
                        {loan.patrons?.full_name ?? '—'}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'monospace' }}>
                          {loan.patrons?.unified_id ?? '—'}
                        </span>
                        {loan.patrons?.patron_type && <PatronBadge type={loan.patrons.patron_type} />}
                      </div>
                    </td>

                    {/* Book */}
                    <td style={{ padding: '14px 20px' }}>
                      <p style={{ fontWeight: 500, color: '#374151', fontSize: '14px', margin: '0 0 2px', maxWidth: '200px' }}>
                        {loan.books?.title ?? '—'}
                      </p>
                      <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>
                        {loan.books?.author ?? ''}
                      </p>
                    </td>

                    {/* Due Date */}
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        fontSize: '13px', color: '#DC2626', fontWeight: 600,
                        background: '#FEF2F2', padding: '4px 8px', borderRadius: '6px',
                      }}>
                        {formatDate(loan.due_date)}
                      </span>
                    </td>

                    {/* Days Overdue */}
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        fontSize: '13px', fontWeight: 700,
                        color: daysOver > 7 ? '#DC2626' : WARNING_AMBER,
                      }}>
                        {daysOver}d
                      </span>
                    </td>

                    {/* Penalty Amount */}
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#1a1a2e' }}>
                        ₱{penalty.toLocaleString()}
                      </span>
                    </td>

                    {/* Settle Button */}
                    <td style={{ padding: '14px 20px' }}>
                      <button
                        disabled={isSettling || mutation.isPending}
                        onClick={() => mutation.mutate(loan.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '8px 14px', borderRadius: '10px', border: 'none',
                          background: isSettling ? `${SUCCESS_GREEN}80` : SUCCESS_GREEN,
                          color: '#FFFFFF', fontSize: '13px', fontWeight: 600,
                          cursor: isSettling ? 'not-allowed' : 'pointer',
                          transition: 'opacity 0.15s, transform 0.1s',
                          opacity: isSettling ? 0.7 : 1,
                        }}
                        onMouseEnter={e => { if (!isSettling) (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'; }}
                        onMouseLeave={e => { if (!isSettling) (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
                      >
                        <CheckCircle size={14} />
                        {isSettling ? 'Settling…' : 'Settle ₱' + penalty}
                      </button>
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
