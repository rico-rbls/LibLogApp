/**
 * BooksManager.tsx  (Phase 2 — upgraded)
 * ----------------------------------------
 * Books Inventory Management for LibLog Librarian Dashboard.
 * Institution: Calauan Community College (CCC)
 *
 * Phase 2 additions over MVP:
 *   - "Search as you type" — client-side filter on the cached dataset.
 *     At 5,000 rows, filtering locally is instant (< 2ms) and avoids
 *     hammering Supabase with a new HTTP request per keystroke.
 *   - Edit modal — pre-populated form, useMutation for UPDATE, cache invalidation.
 *   - Edit icon (Pencil) from lucide-react alongside existing Delete (Trash2).
 */
import { useState, useDeferredValue, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, BookCopy, X, Loader2, Pencil, Search } from 'lucide-react';
import { supabase } from '../services/supabase';
import type { Book, NewBook } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────
const QUERY_KEY = ['books'] as const;
const CCC_PURPLE = '#652D90';

// ─── Supabase Fetchers ────────────────────────────────────────────────────────
async function fetchBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('title', { ascending: true });
  if (error) throw new Error(error.message);
  return data as Book[];
}

async function createBook(book: NewBook): Promise<void> {
  const { error } = await supabase.from('books').insert([book]);
  if (error) throw new Error(error.message);
}

async function updateBook({ id, ...rest }: Book): Promise<void> {
  const { error } = await supabase.from('books').update(rest).eq('id', id);
  if (error) throw new Error(error.message);
}

async function deleteBook(id: string): Promise<void> {
  const { error } = await supabase.from('books').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Shared Styles ────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1.5px solid #e5e7eb',
  fontSize: '14px',
  outline: 'none',
  transition: 'border-color 0.15s',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#374151',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

// ─── Skeleton Row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div style={{
            height: '14px', borderRadius: '6px',
            backgroundColor: '#e9d5ff', opacity: 0.5,
            animation: 'pulse 1.5s ease-in-out infinite',
            width: i === 1 ? '70%' : i === 6 ? '40px' : '85%',
          }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Book Form Modal ──────────────────────────────────────────────────────────
type ModalMode = 'add' | 'edit';

interface BookModalProps {
  mode: ModalMode;
  initial?: Book;
  onClose: () => void;
  onSubmit: (data: NewBook | Book) => void;
  isPending: boolean;
}

const EMPTY_FORM: NewBook = {
  title: '', author: '', isbn: '', category: '', total_copies: 1, available_copies: 1,
};

function BookModal({ mode, initial, onClose, onSubmit, isPending }: BookModalProps) {
  const [form, setForm] = useState<NewBook | Book>(initial ?? EMPTY_FORM);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff', borderRadius: '20px', padding: '32px',
          width: '480px', maxWidth: '90vw',
          boxShadow: '0 25px 60px rgba(101,45,144,0.2)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a2e' }}>
              {mode === 'add' ? 'Add New Book' : 'Edit Book'}
            </h2>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>
              {mode === 'add' ? 'Fill in the book details below' : 'Update the book information'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#6b7280' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={e => { e.preventDefault(); onSubmit(form); }}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div>
            <label style={labelStyle}>Title *</label>
            <input required name="title" value={form.title} onChange={handleChange}
              placeholder="e.g. Introduction to Programming" style={inputStyle}
              onFocus={e => { e.target.style.borderColor = CCC_PURPLE; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }} />
          </div>

          <div>
            <label style={labelStyle}>Author *</label>
            <input required name="author" value={form.author} onChange={handleChange}
              placeholder="e.g. John Doe" style={inputStyle}
              onFocus={e => { e.target.style.borderColor = CCC_PURPLE; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>ISBN</label>
              <input name="isbn" value={form.isbn ?? ''} onChange={handleChange}
                placeholder="978-3-16-148410-0" style={inputStyle}
                onFocus={e => { e.target.style.borderColor = CCC_PURPLE; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }} />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <input name="category" value={form.category ?? ''} onChange={handleChange}
                placeholder="e.g. Science" style={inputStyle}
                onFocus={e => { e.target.style.borderColor = CCC_PURPLE; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Total Copies *</label>
              <input required type="number" min={1} name="total_copies"
                value={form.total_copies} onChange={handleChange} style={inputStyle}
                onFocus={e => { e.target.style.borderColor = CCC_PURPLE; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }} />
            </div>
            <div>
              <label style={labelStyle}>Available *</label>
              <input required type="number" min={0} name="available_copies"
                value={form.available_copies} onChange={handleChange} style={inputStyle}
                onFocus={e => { e.target.style.borderColor = CCC_PURPLE; }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" onClick={onClose}
              style={{ padding: '10px 20px', borderRadius: '10px', border: '1.5px solid #e5e7eb', background: 'transparent', cursor: 'pointer', fontSize: '14px', color: '#6b7280', fontFamily: 'inherit' }}>
              Cancel
            </button>
            <button type="submit" disabled={isPending}
              style={{
                padding: '10px 24px', borderRadius: '10px', border: 'none',
                backgroundColor: CCC_PURPLE, color: '#fff',
                cursor: isPending ? 'not-allowed' : 'pointer',
                fontSize: '14px', fontWeight: 600, fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: '8px',
                opacity: isPending ? 0.7 : 1,
              }}>
              {isPending && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
              {isPending ? 'Saving…' : mode === 'add' ? 'Add Book' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── BooksManager ─────────────────────────────────────────────────────────────
export default function BooksManager() {
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [editTarget, setEditTarget] = useState<Book | null>(null);
  const [searchRaw, setSearchRaw] = useState('');

  // useDeferredValue keeps the table responsive while the user types fast
  const search = useDeferredValue(searchRaw.toLowerCase().trim());

  const queryClient = useQueryClient();

  // ── Fetch all books once — React Query caches the result ─────────────────
  const { data: books = [], isLoading, isError, error } = useQuery<Book[], Error>({
    queryKey: QUERY_KEY,
    queryFn: fetchBooks,
  });

  // ── Client-side search filter (instant on 5k rows) ────────────────────────
  const filtered = useMemo(() => {
    if (!search) return books;
    return books.filter(b =>
      b.title.toLowerCase().includes(search) ||
      b.author.toLowerCase().includes(search) ||
      (b.isbn ?? '').toLowerCase().includes(search) ||
      (b.category ?? '').toLowerCase().includes(search)
    );
  }, [books, search]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: createBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setModalMode(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setModalMode(null);
      setEditTarget(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBook,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Delete "${title}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const openEdit = (book: Book) => {
    setEditTarget(book);
    setModalMode('edit');
  };

  const handleModalSubmit = (data: NewBook | Book) => {
    if (modalMode === 'add') {
      createMutation.mutate(data as NewBook);
    } else if (modalMode === 'edit' && editTarget) {
      updateMutation.mutate({ ...editTarget, ...(data as Book) });
    }
  };

  // ── Availability badge ─────────────────────────────────────────────────────
  const availBadge = (available: number, total: number) => {
    const ratio = total > 0 ? available / total : 0;
    const bg    = ratio === 0 ? '#fef2f2' : ratio < 0.3 ? '#fff7ed' : '#f0fdf4';
    const color = ratio === 0 ? '#ef4444' : ratio < 0.3 ? '#f97316' : '#22c55e';
    return (
      <span style={{ background: bg, color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
        {available}/{total}
      </span>
    );
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BookCopy size={24} color={CCC_PURPLE} />
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e' }}>Book Inventory</h2>
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>
              {isLoading ? 'Loading…' : `${filtered.length} of ${books.length} titles`}
            </p>
          </div>
        </div>
        <button
          id="books-add-btn"
          onClick={() => setModalMode('add')}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            backgroundColor: CCC_PURPLE, color: '#fff',
            padding: '10px 20px', borderRadius: '10px', border: 'none',
            cursor: 'pointer', fontSize: '14px', fontWeight: 600, fontFamily: 'inherit',
            boxShadow: '0 4px 12px rgba(101,45,144,0.3)',
            transition: 'transform 0.1s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
        >
          <Plus size={16} /> Add Book
        </button>
      </div>

      {/* ── Search Bar ──────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', marginBottom: '16px', maxWidth: '400px' }}>
        <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
        <input
          id="books-search"
          type="search"
          placeholder="Search by title, author, ISBN, or category…"
          value={searchRaw}
          onChange={e => setSearchRaw(e.target.value)}
          style={{
            width: '100%', padding: '10px 12px 10px 36px',
            borderRadius: '10px', border: '1.5px solid #e5e7eb',
            fontSize: '14px', outline: 'none', fontFamily: 'inherit',
            transition: 'border-color 0.15s', boxSizing: 'border-box',
          }}
          onFocus={e => { e.target.style.borderColor = CCC_PURPLE; }}
          onBlur={e => { e.target.style.borderColor = '#e5e7eb'; }}
        />
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
              {['Title', 'Author', 'ISBN', 'Category', 'Available', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: CCC_PURPLE, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
              : filtered.length === 0
                ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
                      <BookCopy size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
                      {search ? `No books match "${searchRaw}"` : 'No books found. Add your first book.'}
                    </td>
                  </tr>
                )
                : filtered.map((book, idx) => (
                  <tr
                    key={book.id}
                    style={{
                      backgroundColor: idx % 2 === 0 ? '#fff' : '#fdfbff',
                      borderBottom: '1px solid #f3e8ff',
                      transition: 'background-color 0.12s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#faf5ff'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = idx % 2 === 0 ? '#fff' : '#fdfbff'; }}
                  >
                    <td style={{ padding: '13px 16px', fontWeight: 600, color: '#1a1a2e', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {book.title}
                    </td>
                    <td style={{ padding: '13px 16px', color: '#4b5563' }}>{book.author ?? '—'}</td>
                    <td style={{ padding: '13px 16px', color: '#9ca3af', fontFamily: 'monospace', fontSize: '12px' }}>{book.isbn || '—'}</td>
                    <td style={{ padding: '13px 16px' }}>
                      {book.category
                        ? <span style={{ background: '#f3e8ff', color: CCC_PURPLE, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500 }}>{book.category}</span>
                        : <span style={{ color: '#d1d5db' }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 16px' }}>{availBadge(book.available_copies, book.total_copies)}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {/* Edit */}
                        <button
                          onClick={() => openEdit(book)}
                          title="Edit book"
                          style={{ background: '#f3e8ff', border: 'none', borderRadius: '8px', padding: '7px', cursor: 'pointer', color: CCC_PURPLE, display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#e9d5ff'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f3e8ff'; }}
                        >
                          <Pencil size={14} />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(book.id, book.title)}
                          disabled={deleteMutation.isPending}
                          title="Delete book"
                          style={{ background: '#fef2f2', border: 'none', borderRadius: '8px', padding: '7px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fee2e2'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2'; }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {/* ── Modal ───────────────────────────────────────────────────────── */}
      {modalMode && (
        <BookModal
          mode={modalMode}
          initial={modalMode === 'edit' && editTarget ? editTarget : undefined}
          onClose={() => { setModalMode(null); setEditTarget(null); }}
          onSubmit={handleModalSubmit}
          isPending={isMutating}
        />
      )}

      <style>{`
        @keyframes pulse { 0%,100% { opacity:.4 } 50% { opacity:.8 } }
        @keyframes spin  { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
