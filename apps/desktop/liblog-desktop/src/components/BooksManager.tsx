/**
 * BooksManager.tsx  (Phase 7 — Catalog + Isolation)
 * ---------------------------------------------------
 * Resources Catalog & Inventory (v1.0 Schema).
 */
import { useState, useDeferredValue, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, BookCopy, X, Loader2, Pencil, Search, Gift, LayoutList, LayoutGrid } from 'lucide-react';
import { supabase } from '../services/supabase';
import type { Resource, NewResource } from '../types';
import BookEditModal from './BookEditModal';
import { CCC_PURPLE } from '../utils/constants';

const QUERY_KEY = ['resources'] as const;

async function fetchResources(): Promise<Resource[]> {
  const { data, error } = await supabase.from('resources').select('*').order('title', { ascending: true });
  if (error) throw new Error(error.message);
  return data as Resource[];
}

async function createResource(resource: NewResource): Promise<void> {
  const { error } = await supabase.from('resources').insert([resource]);
  if (error) throw new Error(error.message);
}

async function deleteResource(id: string): Promise<void> {
  const { error } = await supabase.from('resources').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

async function markResourceDonated(id: string): Promise<void> {
  const { error } = await supabase.from('resources').update({ status: 'DONATED', available_copies: 0 }).eq('id', id);
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

const EMPTY_FORM: NewResource = { title: '', author: '', isbn: '', category: '', total_copies: 1, available_copies: 1, status: 'AVAILABLE' };

function AddResourceModal({ onClose, onSubmit, isPending }: { onClose: () => void; onSubmit: (d: NewResource) => void; isPending: boolean }) {
  const [form, setForm] = useState<NewResource>(EMPTY_FORM);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
  };
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '480px', maxWidth: '90vw', boxShadow: '0 25px 60px rgba(101,45,144,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a2e' }}>Add New Resource</h2>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>Fill in the resource details below</p>
          </div>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#6b7280' }}><X size={16} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div><label style={labelStyle}>Title *</label><input required name="title" value={form.title} onChange={handleChange} placeholder="e.g. Introduction to Programming" style={inputStyle} /></div>
          <div><label style={labelStyle}>Author *</label><input required name="author" value={form.author} onChange={handleChange} placeholder="e.g. John Doe" style={inputStyle} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={labelStyle}>ISBN</label><input name="isbn" value={form.isbn ?? ''} onChange={handleChange} placeholder="978-..." style={inputStyle} /></div>
            <div><label style={labelStyle}>Category</label><input name="category" value={form.category ?? ''} onChange={handleChange} placeholder="e.g. Science" style={inputStyle} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={labelStyle}>Total Copies *</label><input required type="number" min={1} name="total_copies" value={form.total_copies} onChange={handleChange} style={inputStyle} /></div>
            <div><label style={labelStyle}>Available *</label><input required type="number" min={0} name="available_copies" value={form.available_copies} onChange={handleChange} style={inputStyle} /></div>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '10px', border: '1.5px solid #e5e7eb', background: 'transparent', cursor: 'pointer', fontSize: '14px', color: '#6b7280' }}>Cancel</button>
            <button type="submit" disabled={isPending} style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', backgroundColor: CCC_PURPLE, color: '#fff', cursor: isPending ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', opacity: isPending ? 0.7 : 1 }}>
              {isPending && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
              {isPending ? 'Saving…' : 'Add Resource'}
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

function ResourceCard({ resource, onEdit, onDonate, onDelete }: {
  resource: Resource;
  onEdit: (r: Resource) => void;
  onDonate: (r: Resource) => void;
  onDelete: (id: string, title: string) => void;
}) {
  const isDonated = resource.status === 'DONATED';
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
    onClick={() => { if (!isDonated) onEdit(resource); }}
    >
      <div style={{ width: '100%', height: '100px', borderRadius: '10px', background: `linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <BookCopy size={36} color={CCC_PURPLE} style={{ opacity: 0.5 }} />
      </div>
      <div>
        <p style={{ fontWeight: 700, fontSize: '13px', color: '#1a1a2e', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{resource.title}</p>
        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resource.author || '—'}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
        {availBadge(resource.available_copies, resource.total_copies)}
        <span style={{ background: isDonated ? '#f3f4f6' : '#f0fdf4', color: isDonated ? '#6b7280' : '#16a34a', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' }}>{resource.status.toLowerCase()}</span>
      </div>
      <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
        <button onClick={() => onEdit(resource)} disabled={isDonated} title="Edit" style={{ flex: 1, padding: '7px', background: '#f3e8ff', border: 'none', borderRadius: '8px', cursor: isDonated ? 'not-allowed' : 'pointer', color: CCC_PURPLE, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isDonated ? 0.4 : 1 }}><Pencil size={13} /></button>
        {!isDonated && <button onClick={() => onDonate(resource)} title="Mark Donated" style={{ flex: 1, padding: '7px', background: '#fff7ed', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Gift size={13} /></button>}
        <button onClick={() => onDelete(resource.id, resource.title)} title="Delete" style={{ flex: 1, padding: '7px', background: '#fef2f2', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={13} /></button>
      </div>
    </div>
  );
}

export default function BooksManager() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget]     = useState<Resource | null>(null);
  const [searchRaw, setSearchRaw]       = useState('');
  const [view, setView]                 = useState<'list' | 'grid'>('list');

  const search = useDeferredValue(searchRaw.toLowerCase().trim());
  const queryClient = useQueryClient();

  const { data: resources = [], isLoading, isError, error } = useQuery<Resource[], Error>({ queryKey: QUERY_KEY, queryFn: fetchResources });

  const filtered = useMemo(() => {
    if (!search) return resources;
    return resources.filter(r =>
      r.title.toLowerCase().includes(search) ||
      r.author.toLowerCase().includes(search) ||
      (r.isbn ?? '').toLowerCase().includes(search) ||
      (r.category ?? '').toLowerCase().includes(search)
    );
  }, [resources, search]);

  const createMutation = useMutation({ mutationFn: createResource, onSuccess: () => { queryClient.invalidateQueries({ queryKey: QUERY_KEY }); setShowAddModal(false); } });
  const deleteMutation = useMutation({ mutationFn: deleteResource, onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }) });
  const donateMutation = useMutation({ mutationFn: markResourceDonated, onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }) });

  const handleDelete = (id: string, title: string) => { if (confirm(`Delete "${title}"?`)) deleteMutation.mutate(id); };
  const handleDonate = (r: Resource) => { if (confirm(`Mark "${r.title}" as Donated?`)) donateMutation.mutate(r.id); };

  const toggleBtn = (active: boolean, onClick: () => void, icon: React.ReactNode) => (
    <button onClick={onClick} style={{ padding: '8px 12px', border: `1.5px solid ${active ? CCC_PURPLE : '#e5e7eb'}`, borderRadius: '8px', background: active ? CCC_PURPLE : '#fff', color: active ? '#fff' : '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 0.15s' }}>{icon}</button>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BookCopy size={24} color={CCC_PURPLE} />
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e' }}>Resources Catalog</h1>
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>{isLoading ? 'Loading…' : `${filtered.length} of ${resources.length} items`}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '4px', background: '#f3f4f6', borderRadius: '10px', padding: '4px' }}>
            {toggleBtn(view === 'list', () => setView('list'), <LayoutList size={16} />)}
            {toggleBtn(view === 'grid', () => setView('grid'), <LayoutGrid size={16} />)}
          </div>
          <button onClick={() => setShowAddModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: CCC_PURPLE, color: '#fff', padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
            <Plus size={16} /> Add Resource
          </button>
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: '16px', maxWidth: '400px' }}>
        <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
        <input type="search" placeholder="Search resources…" value={searchRaw} onChange={e => setSearchRaw(e.target.value)}
          style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none' }} />
      </div>

      {isError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>⚠️ {error.message}</div>}

      {view === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-[270px] rounded-2xl bg-purple-100 opacity-40 animate-pulse" />)
            : filtered.map(r => <ResourceCard key={r.id} resource={r} onEdit={setEditTarget} onDonate={handleDonate} onDelete={handleDelete} />)
          }
        </div>
      )}

      {view === 'list' && (
        <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#faf5ff', borderBottom: '2px solid #f3e8ff' }}>
                {['Title', 'Author', 'ISBN', 'Category', 'Available', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: CCC_PURPLE, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                : filtered.map((r, idx) => (
                    <tr key={r.id}
                      style={{ backgroundColor: r.status === 'DONATED' ? '#f9fafb' : idx % 2 === 0 ? '#fff' : '#fdfbff', borderBottom: '1px solid #f3e8ff', opacity: r.status === 'DONATED' ? 0.65 : 1 }}
                    >
                      <td style={{ padding: '13px 16px', fontWeight: 600 }}>{r.title}</td>
                      <td style={{ padding: '13px 16px' }}>{r.author ?? '—'}</td>
                      <td style={{ padding: '13px 16px', color: '#9ca3af' }}>{r.isbn || '—'}</td>
                      <td style={{ padding: '13px 16px' }}>{r.category ? <span style={{ background: '#f3e8ff', color: CCC_PURPLE, padding: '3px 10px', borderRadius: '20px', fontSize: '12px' }}>{r.category}</span> : '—'}</td>
                      <td style={{ padding: '13px 16px' }}>{availBadge(r.available_copies, r.total_copies)}</td>
                      <td style={{ padding: '13px 16px' }}><span style={{ background: r.status === 'DONATED' ? '#f3f4f6' : '#f0fdf4', color: r.status === 'DONATED' ? '#6b7280' : '#16a34a', padding: '3px 10px', borderRadius: '20px', fontSize: '12px' }}>{r.status.toLowerCase()}</span></td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => setEditTarget(r)} disabled={r.status === 'DONATED'} title="Edit" style={{ background: '#f3e8ff', border: 'none', borderRadius: '8px', padding: '7px', color: CCC_PURPLE, opacity: r.status === 'DONATED' ? 0.4 : 1 }}><Pencil size={14} /></button>
                          {r.status !== 'DONATED' && <button onClick={() => handleDonate(r)} title="Mark Donated" style={{ background: '#fff7ed', border: 'none', borderRadius: '8px', padding: '7px', color: '#ea580c' }}><Gift size={14} /></button>}
                          <button onClick={() => handleDelete(r.id, r.title)} disabled={deleteMutation.isPending} title="Delete" style={{ background: '#fef2f2', border: 'none', borderRadius: '8px', padding: '7px', color: '#ef4444' }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && <AddResourceModal onClose={() => setShowAddModal(false)} onSubmit={data => createMutation.mutate(data)} isPending={createMutation.isPending} />}
      {editTarget && <BookEditModal resource={editTarget} onClose={() => setEditTarget(null)} />}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }
        @keyframes spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
