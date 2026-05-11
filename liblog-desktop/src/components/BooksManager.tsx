/**
 * BooksManager.tsx
 * ----------------
 * Books Inventory Management table for the LibLog Librarian Dashboard.
 * Institution: Calauan Community College (CCC)
 *
 * Features:
 *   - Full data table of books from Supabase `books` table
 *   - "Add Book" slide-in modal with form (Title, Author, ISBN, Category, Copies)
 *   - Delete book with cache invalidation
 *   - Skeleton loader while React Query fetches
 *   - useMutation for create/delete with automatic cache invalidation
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, BookCopy, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
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

async function deleteBook(id: string): Promise<void> {
  const { error } = await supabase.from('books').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div style={{
            height: '14px',
            borderRadius: '6px',
            backgroundColor: '#e9d5ff',
            opacity: 0.5,
            animation: 'pulse 1.5s ease-in-out infinite',
            width: i === 1 ? '70%' : i === 6 ? '40px' : '85%',
          }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Add Book Modal ───────────────────────────────────────────────────────────
interface AddBookModalProps {
  onClose: () => void;
  onSubmit: (book: NewBook) => void;
  isPending: boolean;
}

const EMPTY_FORM: NewBook = {
  title: '', author: '', isbn: '', category: '', total_copies: 1, available_copies: 1,
};

function AddBookModal({ onClose, onSubmit, isPending }: AddBookModalProps) {
  const [form, setForm] = useState<NewBook>(EMPTY_FORM);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1.5px solid #e5e7eb',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.15s',
    fontFamily: 'inherit',
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

  return (
    // Backdrop
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
    >
      {/* Panel */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '32px',
          width: '480px',
          maxWidth: '90vw',
          boxShadow: '0 25px 60px rgba(101,45,144,0.2)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a2e' }}>Add New Book</h2>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>Fill in the book details below</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#6b7280' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>Title *</label>
            <input required name="title" value={form.title} onChange={handleChange} placeholder="e.g. Introduction to Programming" style={inputStyle} />
          </div>

          {/* Author */}
          <div>
            <label style={labelStyle}>Author *</label>
            <input required name="author" value={form.author} onChange={handleChange} placeholder="e.g. John Doe" style={inputStyle} />
          </div>

          {/* ISBN & Category — 2 columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>ISBN</label>
              <input name="isbn" value={form.isbn} onChange={handleChange} placeholder="978-3-16-148410-0" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Category</label>
              <input name="category" value={form.category} onChange={handleChange} placeholder="e.g. Science" style={inputStyle} />
            </div>
          </div>

          {/* Copies — 2 columns */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Total Copies *</label>
              <input required type="number" min={1} name="total_copies" value={form.total_copies} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Available *</label>
              <input required type="number" min={0} name="available_copies" value={form.available_copies} onChange={handleChange} style={inputStyle} />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '10px 20px', borderRadius: '10px', border: '1.5px solid #e5e7eb', background: 'transparent', cursor: 'pointer', fontSize: '14px', color: '#6b7280' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              style={{
                padding: '10px 24px', borderRadius: '10px', border: 'none',
                backgroundColor: CCC_PURPLE, color: '#fff', cursor: isPending ? 'not-allowed' : 'pointer',
                fontSize: '14px', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: '8px',
                opacity: isPending ? 0.7 : 1,
              }}
            >
              {isPending && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
              {isPending ? 'Saving…' : 'Add Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── BooksManager ─────────────────────────────────────────────────────────────
export default function BooksManager() {
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const { data: books, isLoading, isError, error } = useQuery<Book[], Error>({
    queryKey: QUERY_KEY,
    queryFn: fetchBooks,
  });

  // ── Create Mutation ────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: createBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      setShowModal(false);
    },
  });

  // ── Delete Mutation ────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: deleteBook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Delete "${title}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  // ── Availability badge color ───────────────────────────────────────────────
  const availBadge = (available: number, total: number) => {
    const ratio = available / total;
    const bg = ratio === 0 ? '#fef2f2' : ratio < 0.3 ? '#fff7ed' : '#f0fdf4';
    const color = ratio === 0 ? '#ef4444' : ratio < 0.3 ? '#f97316' : '#22c55e';
    return (
      <span style={{ background: bg, color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
        {available}/{total}
      </span>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BookCopy size={24} color={CCC_PURPLE} />
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e' }}>Book Inventory</h2>
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>
              {isLoading ? 'Loading…' : `${books?.length ?? 0} titles registered`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            backgroundColor: CCC_PURPLE, color: '#fff',
            padding: '10px 20px', borderRadius: '10px', border: 'none',
            cursor: 'pointer', fontSize: '14px', fontWeight: 600,
            boxShadow: '0 4px 12px rgba(101,45,144,0.3)',
            transition: 'transform 0.1s, box-shadow 0.1s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
        >
          <Plus size={16} />
          Add Book
        </button>
      </div>

      {/* Error state */}
      {isError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>
          ⚠️ {error.message}
        </div>
      )}

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#faf5ff', borderBottom: '2px solid #f3e8ff' }}>
              {['Title', 'Author', 'ISBN', 'Category', 'Available', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: CCC_PURPLE, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              : books?.map((book, idx) => (
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
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: '#1a1a2e' }}>{book.title}</td>
                  <td style={{ padding: '14px 16px', color: '#4b5563' }}>{book.author}</td>
                  <td style={{ padding: '14px 16px', color: '#9ca3af', fontFamily: 'monospace', fontSize: '12px' }}>{book.isbn || '—'}</td>
                  <td style={{ padding: '14px 16px' }}>
                    {book.category
                      ? <span style={{ background: '#f3e8ff', color: CCC_PURPLE, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500 }}>{book.category}</span>
                      : <span style={{ color: '#d1d5db' }}>—</span>}
                  </td>
                  <td style={{ padding: '14px 16px' }}>{availBadge(book.available_copies, book.total_copies)}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() => handleDelete(book.id, book.title)}
                      disabled={deleteMutation.isPending}
                      title="Delete book"
                      style={{
                        background: '#fef2f2', border: 'none', borderRadius: '8px',
                        padding: '7px', cursor: 'pointer', color: '#ef4444',
                        display: 'flex', alignItems: 'center',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fee2e2'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2'; }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            }
            {!isLoading && books?.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
                  <BookCopy size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
                  No books found. Add your first book.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <AddBookModal
          onClose={() => setShowModal(false)}
          onSubmit={book => createMutation.mutate(book)}
          isPending={createMutation.isPending}
        />
      )}

      {/* Keyframes injected once */}
      <style>{`
        @keyframes pulse { 0%,100% { opacity:.4 } 50% { opacity:.8 } }
        @keyframes spin  { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
