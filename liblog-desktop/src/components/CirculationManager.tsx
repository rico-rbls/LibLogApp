/**
 * CirculationManager.tsx  (Phase 5)
 * -----------------------------------
 * Book borrowing & return engine for the LibLog Librarian Dashboard.
 * Institution: Calauan Community College (CCC)
 *
 * Business Rules (from CCC Librarian interview):
 *   - 3-day maximum borrow period (enforced by DB default: due_date = now() + 3d)
 *   - No reservations: Issue button disabled when available_copies === 0
 *   - Returning a book: sets returned_at = now(), status = 'returned',
 *     and increments books.available_copies via a separate UPDATE
 *
 * Layout: Split-panel
 *   LEFT  — Issue Book form (select patron → select book → issue)
 *   RIGHT — Active Loans table with Return button per row
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, RotateCcw, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { supabase } from '../services/supabase';
import type { Book, Patron, BookLoanWithRelations, NewBookLoan } from '../types';
import { CCC_PURPLE, CCC_PURPLE_TINT, COLOR_WARNING, COLOR_WARNING_BG, FONT_FAMILY } from '../utils/constants';

// ─── Constants ────────────────────────────────────────────────────────────────
const LOANS_KEY  = ['active-loans']  as const;
const BOOKS_KEY  = ['books-circ']    as const;
const PATRONS_KEY = ['patrons-circ'] as const;
const PENALTY_PER_DAY = 5; // ₱5

// ─── Supabase Fetchers ────────────────────────────────────────────────────────
async function fetchActiveLoans(): Promise<BookLoanWithRelations[]> {
  const { data, error } = await supabase
    .from('book_loans')
    .select('*, books(title, author, isbn, available_copies), patrons(full_name, id_number, patron_type)')
    .eq('status', 'active')
    .order('borrowed_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as BookLoanWithRelations[];
}

async function fetchAvailableBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('status', 'active')
    .gt('available_copies', 0)
    .order('title');
  if (error) throw new Error(error.message);
  return (data ?? []) as Book[];
}

async function fetchPatrons(): Promise<Patron[]> {
  const { data, error } = await supabase
    .from('patrons')
    .select('*')
    .order('full_name');
  if (error) throw new Error(error.message);
  return (data ?? []) as Patron[];
}

async function issueLoan(payload: NewBookLoan): Promise<void> {
  // 1. Create the loan record (due_date handled by DB default: now() + 3 days)
  const { error: loanErr } = await supabase
    .from('book_loans')
    .insert(payload);
  if (loanErr) throw new Error(loanErr.message);

  // 2. Decrement available_copies on the book
  const { error: bookErr } = await supabase.rpc('decrement_available_copies', {
    p_book_id: payload.book_id,
  });
  // If RPC doesn't exist, fall back to a raw UPDATE
  if (bookErr) {
    const { error: updErr } = await supabase
      .from('books')
      .update({ available_copies: supabase.raw('available_copies - 1') as unknown as number })
      .eq('id', payload.book_id);
    if (updErr) throw new Error(updErr.message);
  }
}

async function returnLoan(loanId: string, bookId: string): Promise<void> {
  // 1. Close the loan
  const { error: loanErr } = await supabase
    .from('book_loans')
    .update({ returned_at: new Date().toISOString(), status: 'returned' })
    .eq('id', loanId);
  if (loanErr) throw new Error(loanErr.message);

  // 2. Restore available_copies
  const { data: book, error: fetchErr } = await supabase
    .from('books')
    .select('available_copies, total_copies')
    .eq('id', bookId)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);

  const newCopies = Math.min((book.available_copies ?? 0) + 1, book.total_copies ?? 1);
  const { error: updErr } = await supabase
    .from('books')
    .update({ available_copies: newCopies })
    .eq('id', bookId);
  if (updErr) throw new Error(updErr.message);
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function getDaysOverdue(dueDateISO: string): number {
  return Math.max(0, differenceInDays(new Date(), parseISO(dueDateISO)));
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function OverdueBadge({ dueDate }: { dueDate: string }) {
  const days = getDaysOverdue(dueDate);
  if (days === 0) {
    return (
      <span style={{ color: '#16a34a', fontSize: '12px', fontWeight: 600 }}>
        Due {format(parseISO(dueDate), 'MMM d')}
      </span>
    );
  }
  return (
    <span style={{
      background: COLOR_WARNING_BG, color: COLOR_WARNING,
      padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 700,
    }}>
      ⚠ {days}d overdue · ₱{days * PENALTY_PER_DAY}
    </span>
  );
}

// ─── CirculationManager ───────────────────────────────────────────────────────
export default function CirculationManager() {
  const qc = useQueryClient();
  const [selectedPatronId, setSelectedPatronId] = useState('');
  const [selectedBookId,   setSelectedBookId]   = useState('');
  const [issueSuccess,     setIssueSuccess]      = useState(false);

  const { data: loans   = [], isLoading: loansLoading   } = useQuery<BookLoanWithRelations[], Error>({ queryKey: LOANS_KEY,   queryFn: fetchActiveLoans });
  const { data: books   = [], isLoading: booksLoading   } = useQuery<Book[],                  Error>({ queryKey: BOOKS_KEY,   queryFn: fetchAvailableBooks });
  const { data: patrons = [], isLoading: patronsLoading } = useQuery<Patron[],                Error>({ queryKey: PATRONS_KEY, queryFn: fetchPatrons });

  const issueMutation = useMutation({
    mutationFn: issueLoan,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LOANS_KEY });
      qc.invalidateQueries({ queryKey: BOOKS_KEY });
      setSelectedBookId('');
      setSelectedPatronId('');
      setIssueSuccess(true);
      setTimeout(() => setIssueSuccess(false), 3000);
    },
  });

  const returnMutation = useMutation({
    mutationFn: ({ loanId, bookId }: { loanId: string; bookId: string }) =>
      returnLoan(loanId, bookId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LOANS_KEY });
      qc.invalidateQueries({ queryKey: BOOKS_KEY });
    },
  });

  const selectedBook  = books.find(b => b.id === selectedBookId);
  const canIssue      = selectedPatronId && selectedBookId && (selectedBook?.available_copies ?? 0) > 0;

  const handleIssue = () => {
    if (!canIssue) return;
    issueMutation.mutate({ book_id: selectedBookId, patron_id: selectedPatronId });
  };

  const handleReturn = (loanId: string, bookId: string, name: string) => {
    if (confirm(`Confirm return from ${name}?`)) {
      returnMutation.mutate({ loanId, bookId });
    }
  };

  // ─── Styles ────────────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: '#fff', borderRadius: '16px',
    padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  };

  const label: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 600,
    color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  const select: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: '10px',
    border: '1.5px solid #e5e7eb', fontSize: '14px',
    fontFamily: FONT_FAMILY, color: '#1a1a2e', background: '#f9fafb',
    cursor: 'pointer', outline: 'none',
  };

  const btnPrimary: React.CSSProperties = {
    width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
    background: canIssue ? CCC_PURPLE : '#e5e7eb',
    color: canIssue ? '#fff' : '#9ca3af',
    fontSize: '14px', fontWeight: 700, cursor: canIssue ? 'pointer' : 'not-allowed',
    fontFamily: FONT_FAMILY, transition: 'background 0.2s', display: 'flex',
    alignItems: 'center', justifyContent: 'center', gap: '8px',
  };

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <BookOpen size={24} color={CCC_PURPLE} />
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e' }}>
            Circulation Manager
          </h2>
          <p style={{ fontSize: '13px', color: '#9ca3af' }}>
            Issue &amp; Return · Max 3-day borrow · ₱{PENALTY_PER_DAY}/day penalty
          </p>
        </div>
      </div>

      {/* ── Split Panel ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* LEFT — Issue Book ─────────────────────────────────────────────────── */}
        <div style={card}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e', marginBottom: '20px',
            paddingBottom: '12px', borderBottom: '2px solid #f3e8ff' }}>
            📤 Issue Book
          </h3>

          {/* Patron Select */}
          <div style={{ marginBottom: '16px' }}>
            <label style={label}>Select Patron</label>
            {patronsLoading
              ? <div style={{ height: '42px', background: '#f3f4f6', borderRadius: '10px', animation: 'skelPulse 1.4s ease infinite' }} />
              : (
                <select
                  value={selectedPatronId}
                  onChange={e => setSelectedPatronId(e.target.value)}
                  style={select}
                >
                  <option value=''>— Choose patron —</option>
                  {patrons.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.id_number})
                    </option>
                  ))}
                </select>
              )
            }
          </div>

          {/* Book Select */}
          <div style={{ marginBottom: '20px' }}>
            <label style={label}>Select Book</label>
            {booksLoading
              ? <div style={{ height: '42px', background: '#f3f4f6', borderRadius: '10px', animation: 'skelPulse 1.4s ease infinite' }} />
              : (
                <select
                  value={selectedBookId}
                  onChange={e => setSelectedBookId(e.target.value)}
                  style={select}
                >
                  <option value=''>— Choose book —</option>
                  {books.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.available_copies} left)
                    </option>
                  ))}
                </select>
              )
            }
          </div>

          {/* Availability warning */}
          {selectedBook && selectedBook.available_copies === 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: COLOR_WARNING_BG,
              border: `1px solid ${COLOR_WARNING}`, borderRadius: '10px', padding: '10px 14px',
              marginBottom: '16px', fontSize: '13px', color: COLOR_WARNING, fontWeight: 600 }}>
              <AlertTriangle size={16} />
              No copies available — reservations not allowed.
            </div>
          )}

          {/* Due date preview */}
          {selectedBook && selectedBook.available_copies > 0 && (
            <div style={{ background: CCC_PURPLE_TINT, borderRadius: '10px', padding: '10px 14px',
              marginBottom: '16px', fontSize: '13px', color: CCC_PURPLE, fontWeight: 500 }}>
              📅 Due date: <strong>{format(
                new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), 'MMMM d, yyyy'
              )}</strong> (3 days from today)
            </div>
          )}

          {/* Issue Button */}
          <button style={btnPrimary} onClick={handleIssue} disabled={!canIssue || issueMutation.isPending}>
            {issueMutation.isPending
              ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Issuing…</>
              : issueSuccess
                ? <><CheckCircle2 size={16} /> Issued Successfully!</>
                : '📤 Issue Book'
            }
          </button>

          {issueMutation.isError && (
            <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '10px', textAlign: 'center' }}>
              ⚠ {issueMutation.error.message}
            </p>
          )}
        </div>

        {/* RIGHT — Active Loans ───────────────────────────────────────────────── */}
        <div style={card}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a2e', marginBottom: '20px',
            paddingBottom: '12px', borderBottom: '2px solid #f3e8ff' }}>
            📥 Return Book — Active Loans ({loans.length})
          </h3>

          {loansLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ height: '58px', background: '#f3f4f6', borderRadius: '10px',
                  animation: 'skelPulse 1.4s ease infinite' }} />
              ))}
            </div>
          ) : loans.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
              <RotateCcw size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
              No active loans at this time.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f3e8ff' }}>
                    {['Patron', 'Book', 'Borrowed', 'Due / Status', 'Action'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px',
                        fontWeight: 700, color: CCC_PURPLE, textTransform: 'uppercase',
                        letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan, idx) => (
                    <tr key={loan.id} style={{
                      background: idx % 2 === 0 ? '#fff' : '#fafafa',
                      borderBottom: '1px solid #f3f4f6',
                      transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#faf5ff'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = idx % 2 === 0 ? '#fff' : '#fafafa'; }}
                    >
                      <td style={{ padding: '12px', fontWeight: 600, color: '#1a1a2e' }}>
                        <div>{loan.patrons?.full_name ?? '—'}</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>{loan.patrons?.id_number}</div>
                      </td>
                      <td style={{ padding: '12px', color: '#374151' }}>
                        <div style={{ fontWeight: 500 }}>{loan.books?.title ?? '—'}</div>
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>{loan.books?.author}</div>
                      </td>
                      <td style={{ padding: '12px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {loan.borrowed_at ? format(parseISO(loan.borrowed_at), 'MMM d') : '—'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <OverdueBadge dueDate={loan.due_date} />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button
                          id={`return-${loan.id}`}
                          onClick={() => handleReturn(loan.id, loan.book_id, loan.patrons?.full_name ?? 'patron')}
                          disabled={returnMutation.isPending}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '6px 14px', borderRadius: '8px', border: 'none',
                            background: CCC_PURPLE, color: '#fff',
                            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                            fontFamily: FONT_FAMILY, whiteSpace: 'nowrap',
                            opacity: returnMutation.isPending ? 0.6 : 1,
                            transition: 'opacity 0.15s',
                          }}
                        >
                          <RotateCcw size={12} /> Return
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Global keyframes */}
      <style>{`
        @keyframes skelPulse { 0%,100%{opacity:.4} 50%{opacity:.8} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
