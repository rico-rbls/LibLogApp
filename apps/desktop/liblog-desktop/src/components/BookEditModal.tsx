/**
 * BookEditModal.tsx  (Phase 7)
 * ----------------------------
 * Isolated edit modal for updating a resource record in Supabase.
 * Institution: Calauan Community College (CCC)
 */
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, BookOpen } from 'lucide-react';
import { supabase } from '../services/supabase';
import type { Resource } from '../types';
import {
  CCC_PURPLE,
  CCC_PURPLE_TINT,
  FONT_FAMILY,
} from '../utils/constants';

// ─── Supabase Mutator ─────────────────────────────────────────────────────────
async function updateResource(resource: Resource): Promise<void> {
  const { id, created_at: _created_at, updated_at: _updated_at, ...rest } = resource;
  const { error } = await supabase.from('resources').update(rest).eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const inputSx: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: '8px',
  border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none',
  transition: 'border-color 0.15s', fontFamily: 'inherit',
  boxSizing: 'border-box', background: '#fff',
};

const labelSx: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 600,
  color: '#374151', marginBottom: '6px',
  textTransform: 'uppercase', letterSpacing: '0.05em',
};

// ─── BookEditModal ────────────────────────────────────────────────────────────
interface BookEditModalProps {
  resource: Resource;
  onClose: () => void;
}

export default function BookEditModal({ resource, onClose }: BookEditModalProps) {
  const [form, setForm] = useState<Resource>({ ...resource });
  const queryClient = useQueryClient();

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: updateResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      onClose();
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setForm(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const focusPurple  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = CCC_PURPLE; };
  const blurGray     = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = '#e5e7eb'; };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(15,5,30,0.55)',
        backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, fontFamily: FONT_FAMILY,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff', borderRadius: '22px', padding: '32px',
          width: '500px', maxWidth: '92vw',
          boxShadow: '0 32px 80px rgba(101,45,144,0.22)',
          border: '1.5px solid #f3e8ff',
          animation: 'modalIn 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: CCC_PURPLE_TINT,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <BookOpen size={20} color={CCC_PURPLE} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a2e' }}>
                Edit Resource
              </h2>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                Update resource details and inventory count
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f3f4f6', border: 'none', borderRadius: '8px',
              padding: '8px', cursor: 'pointer', color: '#6b7280',
              display: 'flex', alignItems: 'center', transition: 'background 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#e5e7eb'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f3f4f6'; }}
          >
            <X size={16} />
          </button>
        </div>

        {isError && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: '10px', padding: '12px 14px',
            color: '#dc2626', fontSize: '13px', marginBottom: '16px',
          }}>
            ⚠️ {(error as Error).message}
          </div>
        )}

        <form
          onSubmit={e => { e.preventDefault(); mutate(form); }}
          style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          <div>
            <label style={labelSx}>Title *</label>
            <input required name="title" value={form.title} onChange={handleChange}
              placeholder="e.g. Introduction to Programming" style={inputSx}
              onFocus={focusPurple} onBlur={blurGray} />
          </div>

          <div>
            <label style={labelSx}>Author *</label>
            <input required name="author" value={form.author ?? ''} onChange={handleChange}
              placeholder="e.g. John Doe" style={inputSx}
              onFocus={focusPurple} onBlur={blurGray} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelSx}>ISBN</label>
              <input name="isbn" value={form.isbn ?? ''} onChange={handleChange}
                placeholder="978-3-16-148410-0" style={inputSx}
                onFocus={focusPurple} onBlur={blurGray} />
            </div>
            <div>
              <label style={labelSx}>Category</label>
              <input name="category" value={form.category ?? ''} onChange={handleChange}
                placeholder="e.g. Science" style={inputSx}
                onFocus={focusPurple} onBlur={blurGray} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelSx}>Total Copies *</label>
              <input required type="number" min={1} name="total_copies"
                value={form.total_copies} onChange={handleChange} style={inputSx}
                onFocus={focusPurple} onBlur={blurGray} />
            </div>
            <div>
              <label style={labelSx}>Available *</label>
              <input required type="number" min={0} name="available_copies"
                value={form.available_copies} onChange={handleChange} style={inputSx}
                onFocus={focusPurple} onBlur={blurGray} />
            </div>
          </div>

          <div>
            <label style={labelSx}>Status</label>
            <select name="status" value={form.status} onChange={handleChange}
              style={{ ...inputSx, cursor: 'pointer' }}
              onFocus={focusPurple} onBlur={blurGray}
            >
              <option value="AVAILABLE">Available — Available for borrowing</option>
              <option value="BORROWED">Borrowed — All copies checked out</option>
              <option value="DONATED">Donated — Removed from circulation</option>
              <option value="MAINTENANCE">Maintenance — Being repaired</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button
              type="button" onClick={onClose}
              style={{
                padding: '10px 20px', borderRadius: '10px',
                border: '1.5px solid #e5e7eb', background: 'transparent',
                cursor: 'pointer', fontSize: '14px', color: '#6b7280',
                fontFamily: 'inherit', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f9fafb'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              Cancel
            </button>
            <button
              type="submit" disabled={isPending}
              style={{
                padding: '10px 24px', borderRadius: '10px', border: 'none',
                backgroundColor: CCC_PURPLE, color: '#fff',
                cursor: isPending ? 'not-allowed' : 'pointer',
                fontSize: '14px', fontWeight: 600, fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: '8px',
                opacity: isPending ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(101,45,144,0.3)',
                transition: 'transform 0.1s, opacity 0.15s',
              }}
              onMouseEnter={e => { if (!isPending) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
            >
              {isPending && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
              {isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes modalIn { from { opacity:0; transform:scale(0.95) translateY(8px) } to { opacity:1; transform:scale(1) translateY(0) } }
        @keyframes spin    { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }
      `}</style>
    </div>
  );
}
