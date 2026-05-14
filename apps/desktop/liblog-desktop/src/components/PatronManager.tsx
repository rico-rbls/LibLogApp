/**
 * PatronManager.tsx  (Phase 2)
 * ----------------------------
 * CRUD interface for the `patrons` table (v1.0 Schema).
 */
import { useState, useDeferredValue, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Trash2, Pencil, Search, X, Loader2, UserRound, Mail } from 'lucide-react';
import { supabase } from '../services/supabase';
import type { Patron, NewPatron, UserRole } from '../types';
import { CCC_PURPLE } from '../utils/constants';

const PATRON_QUERY_KEY = ['patrons'] as const;

type PatronRoleFilter = 'all' | UserRole;

const ROLE_CONFIG: Record<UserRole, { bg: string; color: string; label: string }> = {
  STUDENT:   { bg: '#eff6ff', color: '#3b82f6', label: 'Student'   },
  FACULTY:   { bg: '#f0fdf4', color: '#16a34a', label: 'Faculty'   },
  VISITOR:   { bg: '#fff7ed', color: '#ea580c', label: 'Visitor'   },
  LIBRARIAN: { bg: '#faf5ff', color: '#652d90', label: 'Librarian' },
};

function RoleBadge({ role }: { role: UserRole }) {
  const cfg = ROLE_CONFIG[role];
  return (
    <span style={{
      background: cfg.bg, color: cfg.color,
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

async function fetchPatrons(): Promise<Patron[]> {
  const { data, error } = await supabase
    .from('patrons')
    .select('*')
    .order('full_name', { ascending: true });
  if (error) throw new Error(error.message);
  return data as Patron[];
}

async function createPatron(patron: NewPatron): Promise<void> {
  // Note: Creating a patron requires a corresponding auth user in practice.
  // This logic assumes the backend trigger or admin API handles the link.
  const { error } = await supabase.from('patrons').insert([patron]);
  if (error) throw new Error(error.message);
}

async function updatePatron({ id, ...rest }: Pick<Patron, 'id'> & Partial<NewPatron>): Promise<void> {
  const { error } = await supabase.from('patrons').update(rest).eq('id', id);
  if (error) throw new Error(error.message);
}

async function deletePatron(id: string): Promise<void> {
  const { error } = await supabase.from('patrons').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

function SkeletonRow() {
  return (
    <tr>{[1, 2, 3, 4, 5].map(i => (
      <td key={i} style={{ padding: '14px 16px' }}>
        <div style={{ height: '14px', borderRadius: '6px', backgroundColor: '#e9d5ff', opacity: 0.5, animation: 'pulse 1.5s ease-in-out infinite', width: '85%' }} />
      </td>
    ))}</tr>
  );
}

type ModalMode = 'add' | 'edit';

const EMPTY_PATRON: NewPatron = { full_name: '', university_id: '', email: '', role: 'STUDENT', program: '' };

function PatronModal({ mode, initial, onClose, onSubmit, isPending, error }: {
  mode: ModalMode;
  initial?: Patron;
  onClose: () => void;
  onSubmit: (data: NewPatron) => void;
  isPending: boolean;
  error: string | null;
}) {
  const [form, setForm] = useState<NewPatron>(() => initial
    ? { full_name: initial.full_name, university_id: initial.university_id, email: initial.email, role: initial.role, program: initial.program || '' }
    : EMPTY_PATRON
  );

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '20px', padding: '32px', width: '500px', maxWidth: '90vw', boxShadow: '0 25px 60px rgba(101,45,144,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a2e' }}>{mode === 'add' ? 'Register Patron' : 'Edit Patron'}</h2>
          <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer' }}><X size={16} /></button>
        </div>
        {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '10px', marginBottom: '16px' }}>⚠️ {error}</div>}
        <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div><label style={labelStyle}>Full Name *</label><input required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>Email Address *</label><input required type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div><label style={labelStyle}>University ID *</label><input required value={form.university_id} onChange={e => setForm(f => ({ ...f, university_id: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>Role *</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))} style={inputStyle}>
                <option value="STUDENT">Student</option>
                <option value="FACULTY">Faculty</option>
                <option value="VISITOR">Visitor</option>
                <option value="LIBRARIAN">Librarian</option>
              </select>
            </div>
          </div>
          <div><label style={labelStyle}>Program (e.g. BSPA)</label><input value={form.program || ''} onChange={e => setForm(f => ({ ...f, program: e.target.value }))} style={inputStyle} /></div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '10px', border: '1.5px solid #e5e7eb', background: 'transparent' }}>Cancel</button>
            <button type="submit" disabled={isPending} style={{ padding: '10px 24px', borderRadius: '10px', border: 'none', backgroundColor: CCC_PURPLE, color: '#fff' }}>
              {isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PatronManager() {
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [editTarget, setEditTarget] = useState<Patron | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [searchRaw, setSearchRaw] = useState('');
  const [roleFilter, setRoleFilter] = useState<PatronRoleFilter>('all');

  const search = useDeferredValue(searchRaw.toLowerCase().trim());
  const queryClient = useQueryClient();

  const { data: patrons = [], isLoading, isError, error: fetchError } = useQuery<Patron[], Error>({ queryKey: PATRON_QUERY_KEY, queryFn: fetchPatrons });

  const filtered = useMemo(() => {
    let result = patrons;
    if (roleFilter !== 'all') result = result.filter(p => p.role === roleFilter);
    if (search) result = result.filter(p => p.full_name.toLowerCase().includes(search) || p.university_id.toLowerCase().includes(search));
    return result;
  }, [patrons, roleFilter, search]);

  const createMutation = useMutation({ mutationFn: createPatron, onSuccess: () => { queryClient.invalidateQueries({ queryKey: PATRON_QUERY_KEY }); setModalMode(null); } });
  const updateMutation = useMutation({ mutationFn: updatePatron, onSuccess: () => { queryClient.invalidateQueries({ queryKey: PATRON_QUERY_KEY }); setModalMode(null); } });
  const deleteMutation = useMutation({ mutationFn: deletePatron, onSuccess: () => queryClient.invalidateQueries({ queryKey: PATRON_QUERY_KEY }) });

  const handleSubmit = (data: NewPatron) => {
    if (modalMode === 'add') createMutation.mutate(data);
    else if (modalMode === 'edit' && editTarget) updateMutation.mutate({ id: editTarget.id, ...data });
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Users size={24} color={CCC_PURPLE} />
          <div><h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e' }}>Patron Directory</h2><p style={{ fontSize: '13px', color: '#9ca3af' }}>{filtered.length} patrons found</p></div>
        </div>
        <button onClick={() => setModalMode('add')} style={{ backgroundColor: CCC_PURPLE, color: '#fff', padding: '10px 20px', borderRadius: '10px', border: 'none', fontWeight: 600 }}><Plus size={16} /> Register Patron</button>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ position: 'relative', flex: '1', maxWidth: '360px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input placeholder="Search name or ID…" value={searchRaw} onChange={e => setSearchRaw(e.target.value)} style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: '10px', border: '1.5px solid #e5e7eb' }} />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as PatronRoleFilter)} style={{ padding: '10px', borderRadius: '10px', border: '1.5px solid #e5e7eb' }}>
          <option value="all">All Roles</option>
          <option value="STUDENT">Students</option>
          <option value="FACULTY">Faculty</option>
          <option value="VISITOR">Visitors</option>
          <option value="LIBRARIAN">Librarians</option>
        </select>
      </div>

      <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#faf5ff', borderBottom: '2px solid #f3e8ff' }}>
              {['University ID', 'Full Name', 'Role', 'Program', 'Actions'].map(h => <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: CCC_PURPLE, fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />) : filtered.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f3e8ff' }}>
                <td style={{ padding: '13px 16px', fontFamily: 'monospace' }}>{p.university_id}</td>
                <td style={{ padding: '13px 16px', fontWeight: 600 }}>{p.full_name}</td>
                <td style={{ padding: '13px 16px' }}><RoleBadge role={p.role} /></td>
                <td style={{ padding: '13px 16px' }}>{p.program || '—'}</td>
                <td style={{ padding: '13px 16px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => { setEditTarget(p); setModalMode('edit'); }} style={{ background: '#f3e8ff', border: 'none', borderRadius: '8px', padding: '7px', color: CCC_PURPLE }}><Pencil size={14} /></button>
                    <button onClick={() => confirm(`Remove ${p.full_name}?`) && deleteMutation.mutate(p.id)} style={{ background: '#fef2f2', border: 'none', borderRadius: '8px', padding: '7px', color: '#ef4444' }}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalMode && <PatronModal mode={modalMode} initial={editTarget || undefined} onClose={() => setModalMode(null)} onSubmit={handleSubmit} isPending={createMutation.isPending || updateMutation.isPending} error={mutationError} />}
    </div>
  );
}
