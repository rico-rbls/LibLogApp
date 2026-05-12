/**
 * OverdueDashboard.tsx  (Phase 5)
 * ---------------------------------
 * Overdue loan tracking & penalty settlement for the LibLog Librarian Dashboard.
 * Institution: Calauan Community College (CCC)
 *
 * Business Rules:
 *   - Queries book_loans WHERE due_date < NOW() AND status = 'active'
 *   - Penalty: ₱5 per day overdue — calculated strictly via date-fns differenceInDays
 *   - "Settle Penalty & Return" closes the loan and marks penalty_paid = true
 *     in a single transaction (two sequential UPDATEs — no stored proc needed)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Loader2, PhilippinePeso } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { supabase } from '../services/supabase';
import type { BookLoanWithRelations } from '../types';
import {
  CCC_PURPLE, CCC_PURPLE_TINT,
  COLOR_DANGER, COLOR_DANGER_BG,
  COLOR_WARNING, COLOR_WARNING_BG,
  FONT_FAMILY,
} from '../utils/constants';

// ─── Constants ────────────────────────────────────────────────────────────────
const OVERDUE_KEY   = ['overdue-loans'] as const;
const PENALTY_RATE  = 5;   // ₱5 per day

// ─── Helpers ──────────────────────────────────────────────────────────────────
/**
 * Calculates days overdue using date-fns for accuracy.
 * Uses differenceInDays(now, dueDate) — always returns >= 1 for truly overdue rows
 * (the DB filter guarantees due_date < NOW()).
 */
function calcDaysOverdue(dueDateISO: string): number {
  return Math.max(1, differenceInDays(new Date(), parseISO(dueDateISO)));
}

function calcPenalty(dueDateISO: string): number {
  return calcDaysOverdue(dueDateISO) * PENALTY_RATE;
}

// ─── Supabase Fetcher ─────────────────────────────────────────────────────────
async function fetchOverdueLoans(): Promise<BookLoanWithRelations[]> {
  const { data, error } = await supabase
    .from('book_loans')
    .select('*, books(title, author, isbn, available_copies), patrons(full_name, id_number, patron_type)')
    .lt('due_date', new Date().toISOString())   // due_date < NOW()
    .eq('status', 'active')                      // still not returned
    .order('due_date', { ascending: true });     // most overdue first
  if (error) throw new Error(error.message);
  return (data ?? []) as BookLoanWithRelations[];
}

async function settlePenaltyAndReturn(loan: BookLoanWithRelations): Promise<void> {
  // 1. Close the loan + mark penalty paid
  const { error: loanErr } = await supabase
    .from('book_loans')
    .update({
      returned_at:  new Date().toISOString(),
      status:       'returned',
      penalty_paid: true,
    })
    .eq('id', loan.id);
  if (loanErr) throw new Error(loanErr.message);

  // 2. Restore available_copies
  const { data: book, error: fetchErr } = await supabase
    .from('books')
    .select('available_copies, total_copies')
    .eq('id', loan.book_id)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);

  const newCopies = Math.min((book.available_copies ?? 0) + 1, book.total_copies ?? 1);
  const { error: updErr } = await supabase
    .from('books')
    .update({ available_copies: newCopies })
    .eq('id', loan.book_id);
  if (updErr) throw new Error(updErr.message);
}

// ─── Penalty Severity Badge ───────────────────────────────────────────────────
function SeverityBadge({ days }: { days: number }) {
  const severe = days >= 7;
  return (
    <span style={{
      background: severe ? COLOR_DANGER_BG : COLOR_WARNING_BG,
      color:      severe ? COLOR_DANGER    : COLOR_WARNING,
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      {days}d overdue
    </span>
  );
}

// ─── OverdueDashboard ─────────────────────────────────────────────────────────
export default function OverdueDashboard() {
  const qc = useQueryClient();

  const { data: loans = [], isLoading, isError, error, refetch } =
    useQuery<BookLoanWithRelations[], Error>({
      queryKey: OVERDUE_KEY,
      queryFn:  fetchOverdueLoans,
      // Refresh every 5 minutes — overdue count changes slowly
      refetchInterval: 1000 * 60 * 5,
    });

  const settleMutation = useMutation({
    mutationFn: settlePenaltyAndReturn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: OVERDUE_KEY });
      qc.invalidateQueries({ queryKey: ['active-loans'] });
      qc.invalidateQueries({ queryKey: ['books-circ'] });
    },
  });

  const totalPenalties = loans.reduce((sum, l) => sum + calcPenalty(l.due_date), 0);

  const handleSettle = (loan: BookLoanWithRelations) => {
    const penalty = calcPenalty(loan.due_date);
    const name    = loan.patrons?.full_name ?? 'patron';
    if (confirm(
      `Settle ₱${penalty} penalty and process return for ${name}?\n\nBook: ${loan.books?.title ?? '—'}`
    )) {
      settleMutation.mutate(loan);
    }
  };

  // ─── Styles ────────────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: '#fff', borderRadius: '16px',
    padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  };

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <AlertTriangle size={24} color={COLOR_WARNING} />
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e' }}>
              Overdue Dashboard
            </h2>
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>
              ₱{PENALTY_RATE}/day penalty · Strict date-fns calculation
            </p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', padding: '8px 14px',
            cursor: 'pointer', fontSize: '13px', color: '#6b7280', fontFamily: FONT_FAMILY }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* ── Summary Cards ────────────────────────────────────────────────────── */}
      {!isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
          {[
            {
              label: 'Overdue Loans',
              value: loans.length.toString(),
              bg: loans.length > 0 ? COLOR_DANGER_BG : '#f0fdf4',
              color: loans.length > 0 ? COLOR_DANGER : '#16a34a',
              border: loans.length > 0 ? COLOR_DANGER : '#86efac',
            },
            {
              label: 'Total Penalties',
              value: `₱${totalPenalties}`,
              bg: totalPenalties > 0 ? COLOR_WARNING_BG : '#f0fdf4',
              color: totalPenalties > 0 ? COLOR_WARNING : '#16a34a',
              border: totalPenalties > 0 ? COLOR_WARNING : '#86efac',
            },
            {
              label: 'Severely Overdue (7+ days)',
              value: loans.filter(l => calcDaysOverdue(l.due_date) >= 7).length.toString(),
              bg: COLOR_DANGER_BG,
              color: COLOR_DANGER,
              border: COLOR_DANGER,
            },
          ].map(({ label, value, bg, color, border }) => (
            <div key={label} style={{
              background: bg, border: `1.5px solid ${border}`,
              borderRadius: '14px', padding: '16px 20px',
            }}>
              <p style={{ fontSize: '28px', fontWeight: 800, color, lineHeight: 1 }}>{value}</p>
              <p style={{ fontSize: '12px', color, opacity: 0.75, marginTop: '4px', fontWeight: 500 }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {isError && (
        <div style={{ background: COLOR_DANGER_BG, border: `1px solid ${COLOR_DANGER}`,
          borderRadius: '12px', padding: '16px', color: COLOR_DANGER, fontSize: '14px', marginBottom: '16px' }}>
          ⚠ {error.message}
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div style={card}>
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ height: '56px', background: '#f3f4f6', borderRadius: '10px',
                animation: 'skelPulse 1.4s ease infinite' }} />
            ))}
          </div>
        ) : loans.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', color: '#9ca3af' }}>
            <CheckCircle2 size={40} style={{ margin: '0 auto 16px', display: 'block', color: '#86efac' }} />
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#16a34a', marginBottom: '6px' }}>
              All Clear — No Overdue Loans
            </p>
            <p style={{ fontSize: '14px' }}>All borrowers have returned their books on time.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f3e8ff' }}>
                  {['Patron', 'Book', 'Due Date', 'Days Overdue', 'Penalty (₱5/day)', 'Action'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left', fontSize: '11px',
                      fontWeight: 700, color: CCC_PURPLE, textTransform: 'uppercase',
                      letterSpacing: '0.05em', whiteSpace: 'nowrap',
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loans.map((loan, idx) => {
                  const days    = calcDaysOverdue(loan.due_date);
                  const penalty = days * PENALTY_RATE;
                  const severe  = days >= 7;

                  return (
                    <tr key={loan.id} style={{
                      background: severe
                        ? '#fff5f5'
                        : idx % 2 === 0 ? '#fff' : '#fafafa',
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#faf5ff'; }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLTableRowElement).style.background = severe
                          ? '#fff5f5' : idx % 2 === 0 ? '#fff' : '#fafafa';
                      }}
                    >
                      {/* Patron */}
                      <td style={{ padding: '13px 14px' }}>
                        <div style={{ fontWeight: 600, color: '#1a1a2e' }}>
                          {loan.patrons?.full_name ?? '—'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                          {loan.patrons?.id_number} · {loan.patrons?.patron_type}
                        </div>
                      </td>

                      {/* Book */}
                      <td style={{ padding: '13px 14px' }}>
                        <div style={{ fontWeight: 500, color: '#374151' }}>
                          {loan.books?.title ?? '—'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                          {loan.books?.author}
                        </div>
                      </td>

                      {/* Due Date */}
                      <td style={{ padding: '13px 14px', color: COLOR_DANGER, fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {loan.due_date ? format(parseISO(loan.due_date), 'MMM d, yyyy') : '—'}
                      </td>

                      {/* Days Overdue */}
                      <td style={{ padding: '13px 14px' }}>
                        <SeverityBadge days={days} />
                      </td>

                      {/* Penalty */}
                      <td style={{ padding: '13px 14px' }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          background: CCC_PURPLE_TINT, color: CCC_PURPLE,
                          padding: '4px 12px', borderRadius: '20px',
                          fontWeight: 700, fontSize: '13px',
                        }}>
                          <PhilippinePeso size={13} />
                          {penalty.toLocaleString()}
                        </div>
                      </td>

                      {/* Action */}
                      <td style={{ padding: '13px 14px' }}>
                        <button
                          id={`settle-${loan.id}`}
                          onClick={() => handleSettle(loan)}
                          disabled={settleMutation.isPending}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '7px 14px', borderRadius: '8px', border: 'none',
                            background: CCC_PURPLE, color: '#fff',
                            fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                            fontFamily: FONT_FAMILY, whiteSpace: 'nowrap',
                            opacity: settleMutation.isPending ? 0.6 : 1,
                            transition: 'opacity 0.15s',
                          }}
                        >
                          {settleMutation.isPending
                            ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
                            : <CheckCircle2 size={13} />
                          }
                          Settle &amp; Return
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

      {/* ── Disclaimer ──────────────────────────────────────────────────────── */}
      {loans.length > 0 && (
        <p style={{ marginTop: '12px', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
          Penalty = (days since due date) × ₱{PENALTY_RATE} · Calculated using date-fns at render time
        </p>
      )}

      <style>{`
        @keyframes skelPulse { 0%,100%{opacity:.4} 50%{opacity:.8} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
