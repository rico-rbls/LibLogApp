/**
 * BooksManager.tsx  (Phase 7 — Catalog + Isolation)
 * ---------------------------------------------------
 * Books Catalog & Inventory — strictly isolated from attendance/logbook.
 * Dual-view: Table (list) / Catalog (grid cards).
 * Edit opens BookEditModal (extracted component).
 */
import { useState, useDeferredValue, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, BookCopy, X, Loader2, Pencil, Search, Gift, LayoutList, LayoutGrid } from 'lucide-react';
import { supabase } from '../services/supabase';
import type { Book, NewBook } from '../types';
import BookEditModal from './BookEditModal';
import { CCC_PURPLE } from '../utils/constants';

const QUERY_KEY = ['books'] as const;

async function fetchBooks(): Promise<Book[]> {
  const { data, error } = await supabase.from('books').select('*').order('title', { ascending: true });
  if (error) throw new Error(error.message);
  return data as Book[];
}
async function createBook(book: NewBook): Promise<void> {
  const { error } = await supabase.from('books').insert([book]);
  if (error) throw new Error(error.message);
}
async function deleteBook(id: string): Promise<void> {
  const { error } = await supabase.from('books').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
async function markBookDonated(id: string): Promise<void> {
  const { error } = await supabase.from('books').update({ status: 'donated', available_copies: 0 }).eq('id', id);
  if (error) throw new Error(error.message);
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: '8px',
  border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none',
  transition: 'border-color 0.15s', fontFamily: 'inherit', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151',
  marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em',
};

function SkeletonRow() {
  return (
    <tr>{[1,2,3,4,5,6].map(i => (
      <td key={i} style={{ padding: '14px 16px' }}>
        <div style={{ height: '14px', borderRadius: '6px', backgroundColor: '#e9d5ff', opacity: 0.5, animation: 'pulse 1.5s ease-in-out infinite', width: i===1?'70%':i===6?'40px':'85%' }} />
      </td>
    ))}</tr>
  );
}

const EMPTY_FORM: NewBook = { title: '', author: '', isbn: '', category: '', total_copies: 1, available_copies: 1, status: 'active' };

function AddBookModal({ onClose, onSubmit, isPending }: { onClose: () => void; onSubmit: (d: NewBook) => void; isPending: boolean }) {
  const [form, setForm] = useState<NewBook>(EMPTY_FORM);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '480px', maxWidth: '90vw', boxShadow: '0 25px 60px rgba(101,45,144,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a2e' }}>Add New Book</h2>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>Fill in the book details below</p>
          </div>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#6b7280' }}><X size={16} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div><label style={labelStyle}>Title *</label><input required name="title" value={form.title} onChange={handleChange} placeholder="e.g. Introduction to Programming" style={inputStyle} onFocus={e => { e.target.style.borderColor = CCC_PURPLE; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }} /></div>
          <div><label style={labelStyle}>Author *</label><input required name="author" value={form.author} onChange={handleChange} placeholder="e.g. John Doe" style={inputStyle} onFocus={e => { e.target.style.borderColor = CCC_PURPLE; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={labelStyle}>ISBN</label><input name="isbn" value={form.isbn ?? ''} onChange={handleChange} placeholder="978-3-16-148410-0" style={inputStyle} onFocus={e => { e.target.style.borderColor = CCC_PURPLE; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }} /></div>
            <div><label style={labelStyle}>Category</label><input name="category" value={form.category ?? ''} onChange={handleChange} placeholder="e.g. Science" style={inputStyle} onFocus={e => { e.target.style.borderColor = CCC_PURPLE; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={labelStyle}>Total Copies *</label><input required type="number" min={1} name="total_copies" value={form.total_copies} onChange={handleChange} style={inputStyle} onFocus={e => { e.target.style.borderColor = CCC_PURPLE; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }} /></div>
            <div><label style={labelStyle}>Available *</label><input required type="number" min={0} name="available_copies" value={form.available_copies} onChange={handleChange} style={inputStyle} onFocus={e => { e.target.style.borderColor = CCC_PURPLE; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }} /></div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '10px', border: '1.5px solid #e5e7eb', background: 'transparent', cursor: 'pointer', fontSize: '14px', color: '#6b7280', fontFamily: 'inherit' }}>Cancel</button>
            <button type="submit" disabled={isPending} style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', backgroundColor: CCC_PURPLE, color: '#fff', cursor: isPending ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px', opacity: isPending ? 0.7 : 1 }}>
              {isPending && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
              {isPending ? 'Saving…' : 'Add Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function availBadge(available: number, total: number) {
  const ratio = total > 0 ? available / total : 0;
  const bg    = ratio === 0 ? '#fef2f2' : ratio < 0.3 ? '#fff7ed' : '#f0fdf4';
  const color = ratio === 0 ? '#ef4444' : ratio < 0.3 ? '#f97316' : '#22c55e';
  return <span style={{ background: bg, color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>{available}/{total}</span>;
}

// ─── Catalog Card ─────────────────────────────────────────────────────────────
function BookCard({ book, onEdit, onDonate, onDelete }: {
  book: Book;
  onEdit: (b: Book) => void;
  onDonate: (b: Book) => void;
  onDelete: (id: string, title: string) => void;
}) {
  const isDonated = book.status === 'donated';
  return (
    <div style={{
      background: '#fff', borderRadius: '16px', padding: '20px',
      boxShadow: '0 2px 8px rgba(101,45,144,0.08)',
      border: '1.5px solid #f3e8ff',
      opacity: isDonated ? 0.65 : 1,
      display: 'flex', flexDirection: 'column', gap: '12px',
      transition: 'transform 0.15s, box-shadow 0.15s',
      cursor: isDonated ? 'default' : 'pointer',
    }}
    onMouseEnter={e => { if (!isDonated) { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(101,45,144,0.14)'; } }}
    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(101,45,144,0.08)'; }}
    onClick={() => { if (!isDonated) onEdit(book); }}
    >
      {/* Cover placeholder */}
      <div style={{ width: '100%', height: '100px', borderRadius: '10px', background: `linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <BookCopy size={36} color={CCC_PURPLE} style={{ opacity: 0.5 }} />
      </div>
      {/* Title + author */}
      <div>
        <p style={{ fontWeight: 700, fontSize: '13px', color: '#1a1a2e', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{book.title}</p>
        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.author || '—'}</p>
      </div>
      {/* Copies + status row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
        {availBadge(book.available_copies, book.total_copies)}
        <span style={{ background: isDonated ? '#f3f4f6' : '#f0fdf4', color: isDonated ? '#6b7280' : '#16a34a', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' }}>{book.status}</span>
      </div>
      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
        <button onClick={() => onEdit(book)} disabled={isDonated} title="Edit" style={{ flex: 1, padding: '7px', background: '#f3e8ff', border: 'none', borderRadius: '8px', cursor: isDonated ? 'not-allowed' : 'pointer', color: CCC_PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isDonated ? 0.4 : 1 }}><Pencil size={13} /></button>
        {!isDonated && <button onClick={() => onDonate(book)} title="Mark Donated" style={{ flex: 1, padding: '7px', background: '#fff7ed', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Gift size={13} /></button>}
        <button onClick={() => onDelete(book.id, book.title)} title="Delete" style={{ flex: 1, padding: '7px', background: '#fef2f2', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={13} /></button>
      </div>
    </div>
  );
}

// ─── BooksManager ─────────────────────────────────────────────────────────────
export default function BooksManager() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget]     = useState<Book | null>(null);
  const [searchRaw, setSearchRaw]       = useState('');
  const [view, setView]                 = useState<'list' | 'grid'>('list');

  const search = useDeferredValue(searchRaw.toLowerCase().trim());
  const queryClient = useQueryClient();

  const { data: books = [], isLoading, isError, error } = useQuery<Book[], Error>({ queryKey: QUERY_KEY, queryFn: fetchBooks });

  const filtered = useMemo(() => {
    if (!search) return books;
    return books.filter(b =>
      b.title.toLowerCase().includes(search) ||
      b.author.toLowerCase().includes(search) ||
      (b.isbn ?? '').toLowerCase().includes(search) ||
      (b.category ?? '').toLowerCase().includes(search)
    );
  }, [books, search]);

  const createMutation = useMutation({ mutationFn: createBook, onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEY }); setShowAddModal(false); } });
  const deleteMutation = useMutation({ mutationFn: deleteBook, onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }) });
  const donateMutation = useMutation({ mutationFn: markBookDonated, onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }) });

  const handleDelete = (id: string, title: string) => { if (confirm(`Delete "${title}"? This cannot be undone.`)) deleteMutation.mutate(id); };
  const handleDonate = (book: Book) => { if (confirm(`Mark "${book.title}" as Donated? It will be removed from circulation.`)) donateMutation.mutate(book.id); };

  const toggleBtn = (active: boolean, onClick: () => void, icon: React.ReactNode) => (
    <button onClick={onClick} style={{ padding: '8px 12px', border: `1.5px solid ${active ? CCC_PURPLE : '#e5e7eb'}`, borderRadius: '8px', background: active ? CCC_PURPLE : '#fff', color: active ? '#fff' : '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}>{icon}</button>
  );

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BookCopy size={24} color={CCC_PURPLE} />
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e' }}>Books Catalog &amp; Inventory</h1>
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>{isLoading ? 'Loading…' : `${filtered.length} of ${books.length} titles`}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', borderRadius: '10px', padding: '4px' }}>
            {toggleBtn(view === 'list', () => setView('list'), <LayoutList size={16} />)}
            {toggleBtn(view === 'grid', () => setView('grid'), <LayoutGrid size={16} />)}
          </div>
          <button id="books-add-btn" onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: CCC_PURPLE, color: '#fff', padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(101,45,144,0.3)' }}>
            <Plus size={16} /> Add Book
          </button>
        </div>
      </div>

      {/* ── Search ── */}
      <div style={{ position: 'relative', marginBottom: '16px', maxWidth: '400px' }}>
        <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
        <input id="books-search" type="search" placeholder="Search by title, author, ISBN, or category…" value={searchRaw} onChange={e => setSearchRaw(e.target.value)}
          style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s', boxSizing: 'border-box' }}
          onFocus={e => { e.target.style.borderColor = CCC_PURPLE; }} onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }} />
      </div>

      {/* ── Error ── */}
      {isError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>⚠️ {error.message}</div>}

      {/* ── GRID VIEW ── */}
      {view === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <div key={i} style={{ height: '270px', borderRadius: '16px', background: '#f3e8ff', opacity: 0.4, animation: 'pulse 1.5s ease-in-out infinite' }} />)
            : filtered.length === 0
              ? <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '48px', color: '#9ca3af' }}><BookCopy size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />{search ? `No books match "${searchRaw}"` : 'No books found.'}</div>
              : filtered.map(book => <BookCard key={book.id} book={book} onEdit={setEditTarget} onDonate={handleDonate} onDelete={handleDelete} />)
          }
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#faf5ff', borderBottom: '2px solid #f3e8ff' }}>
                {['Title', 'Author', 'ISBN', 'Category', 'Available', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: CCC_PURPLE, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                : filtered.length === 0
                  ? <tr><td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}><BookCopy size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />{search ? `No books match "${searchRaw}"` : 'No books found. Add your first book.'}</td></tr>
                  : filtered.map((book, idx) => (
                    <tr key={book.id}
                      style={{ backgroundColor: book.status === 'donated' ? '#f9fafb' : idx % 2 === 0 ? '#fff' : '#fdfbff', borderBottom: '1px solid #f3e8ff', transition: 'background-color 0.12s', opacity: book.status === 'donated' ? 0.65 : 1 }}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#faf5ff'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = book.status === 'donated' ? '#f9fafb' : idx % 2 === 0 ? '#fff' : '#fdfbff'; }}
                    >
                      <td style={{ padding: '13px 16px', fontWeight: 600, color: '#1a1a2e', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title}</td>
                      <td style={{ padding: '13px 16px', color: '#4b5563' }}>{book.author ?? '—'}</td>
                      <td style={{ padding: '13px 16px', color: '#9ca3af', fontFamily: 'monospace', fontSize: '12px' }}>{book.isbn || '—'}</td>
                      <td style={{ padding: '13px 16px' }}>{book.category ? <span style={{ background: '#f3e8ff', color: CCC_PURPLE, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500 }}>{book.category}</span> : <span style={{ color: '#d1d5db' }}>—</span>}</td>
                      <td style={{ padding: '13px 16px' }}>{availBadge(book.available_copies, book.total_copies)}</td>
                      <td style={{ padding: '13px 16px' }}><span style={{ background: book.status === 'donated' ? '#f3f4f6' : '#f0fdf4', color: book.status === 'donated' ? '#6b7280' : '#16a34a', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, textTransform: 'capitalize' }}>{book.status ?? 'active'}</span></td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => setEditTarget(book)} disabled={book.status === 'donated'} title="Edit" style={{ background: '#f3e8ff', border: 'none', borderRadius: '8px', padding: '7px', cursor: book.status === 'donated' ? 'not-allowed' : 'pointer', color: CCC_PURPLE, display: 'flex', alignItems: 'center', opacity: book.status === 'donated' ? 0.4 : 1 }}><Pencil size={14} /></button>
                          {book.status !== 'donated' && <button onClick={() => handleDonate(book)} title="Mark Donated" style={{ background: '#fff7ed', border: 'none', borderRadius: '8px', padding: '7px', cursor: 'pointer', color: '#ea580c', display: 'flex', alignItems: 'center' }}><Gift size={14} /></button>}
                          <button onClick={() => handleDelete(book.id, book.title)} disabled={deleteMutation.isPending} title="Delete" style={{ background: '#fef2f2', border: 'none', borderRadius: '8px', padding: '7px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* ── Add Modal ── */}
      {showAddModal && <AddBookModal onClose={() => setShowAddModal(false)} onSubmit={data => createMutation.mutate(data)} isPending={createMutation.isPending} />}

      {/* ── Edit Modal (extracted component) ── */}
      {editTarget && <BookEditModal book={editTarget} onClose={() => setEditTarget(null)} />}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }
        @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
