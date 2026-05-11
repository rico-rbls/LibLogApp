/**
 * PatronManager.tsx  (Phase 2)
 * ----------------------------
 * CRUD interface for the `patrons` table.
 * Institution: Calauan Community College (CCC)
 *
 * Schema:
 *   patrons: id (uuid), id_number (text), full_name (text),
 *            patron_type ('student'|'faculty'|'visitor'),
 *            program_id (int, FK → programs), year_level (int 1-4),
 *            created_at (timestamptz)
 *   programs: id (int), name (text), acronym (varchar)
 *
 * Features:
 *   - Joined query: patrons + programs (for acronym display)
 *   - "Search as you type" filtering on name OR id_number (client-side)
 *   - Patron type filter dropdown (All / Student / Faculty / Visitor)
 *   - Add patron modal
 *   - Edit patron modal (pre-populated)
 *   - Delete with confirmation
 *   - Role badge with color coding
 *   - Skeleton loading state
 */
import { useState, useDeferredValue, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Trash2, Pencil, Search, X, Loader2, UserRound } from 'lucide-react';
import { supabase } from '../services/supabase';
import type { Patron, NewPatron, Program } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────
const PATRON_QUERY_KEY  = ['patrons'] as const;
const PROGRAM_QUERY_KEY = ['programs'] as const;
const CCC_PURPLE = '#652D90';

type PatronTypeFilter = 'all' | 'student' | 'faculty' | 'visitor';

// ─── Role Badge Config ────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  student:  { bg: '#eff6ff', color: '#3b82f6', label: 'Student'  },
  faculty:  { bg: '#f0fdf4', color: '#16a34a', label: 'Faculty'  },
  visitor:  { bg: '#fff7ed', color: '#ea580c', label: 'Visitor'  },
};

function RoleBadge({ type }: { type: Patron['patron_type'] }) {
  const cfg = ROLE_CONFIG[type];
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

// ─── Supabase Fetchers ────────────────────────────────────────────────────────
async function fetchPatrons(): Promise<Patron[]> {
  const { data, error } = await supabase
    .from('patrons')
    .select('*, programs(name, acronym)')
    .order('full_name', { ascending: true });
  if (error) throw new Error(error.message);
  return data as Patron[];
}

async function fetchPrograms(): Promise<Program[]> {
  const { data, error } = await supabase
    .from('programs')
    .select('id, name, acronym')
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return data as Program[];
}

async function createPatron(patron: NewPatron): Promise<void> {
  const { error } = await supabase.from('patrons').insert([patron]);
  if (error) throw new Error(error.message);
}

async function updatePatron({ id, ...rest }: Pick<Patron, 'id'> & NewPatron): Promise<void> {
  const { error } = await supabase
    .from('patrons')
    .update(rest)
    .eq('id', id);
  if (error) throw new Error(error.message);
}

async function deletePatron(id: string): Promise<void> {
  const { error } = await supabase.from('patrons').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ─── Skeleton Row ─────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr>
      {[1, 2, 3, 4, 5].map(i => (
        <td key={i} style={{ padding: '14px 16px' }}>
          <div style={{
            height: '14px', borderRadius: '6px',
            backgroundColor: '#e9d5ff', opacity: 0.5,
            animation: 'pulse 1.5s ease-in-out infinite',
            width: i === 5 ? '70px' : '85%',
          }} />
        </td>
      ))}
    </tr>
  );
}

// ─── Patron Form Modal ────────────────────────────────────────────────────────
type ModalMode = 'add' | 'edit';

interface PatronModalProps {
  mode: ModalMode;
  initial?: Patron;
  programs: Program[];
  onClose: () => void;
  onSubmit: (data: NewPatron) => void;
  isPending: boolean;
  error: string | null;
}

const EMPTY_PATRON: NewPatron = {
  full_name: '', id_number: '', patron_type: 'student', program_id: null, year_level: null,
};

function PatronModal({ mode, initial, programs, onClose, onSubmit, isPending, error }: PatronModalProps) {
  const [form, setForm] = useState<NewPatron>(() => initial
    ? { full_name: initial.full_name, id_number: initial.id_number, patron_type: initial.patron_type, program_id: initial.program_id, year_level: initial.year_level }
    : EMPTY_PATRON
  );

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none',
    transition: 'border-color 0.15s', fontFamily: 'inherit', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '12px', fontWeight: 600,
    color: '#374151', marginBottom: '6px',
    textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = CCC_PURPLE;
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = '#e5e7eb';
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '20px', padding: '32px',
          width: '500px', maxWidth: '90vw',
          boxShadow: '0 25px 60px rgba(101,45,144,0.2)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a2e' }}>
              {mode === 'add' ? 'Register New Patron' : 'Edit Patron'}
            </h2>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>
              {mode === 'add' ? 'Enter the patron details below' : 'Update patron information'}
            </p>
          </div>
          <button onClick={onClose}
            style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#6b7280' }}>
            <X size={16} />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={e => { e.preventDefault(); onSubmit(form); }}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          {/* Full Name */}
          <div>
            <label style={labelStyle}>Full Name *</label>
            <input required value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="e.g. Maria Santos" style={inputStyle}
              onFocus={handleFocus} onBlur={handleBlur} />
          </div>

          {/* ID Number + Patron Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>ID Number *</label>
              <input required value={form.id_number}
                onChange={e => setForm(f => ({ ...f, id_number: e.target.value }))}
                placeholder="e.g. 2024-0001" style={inputStyle}
                onFocus={handleFocus} onBlur={handleBlur} />
            </div>
            <div>
              <label style={labelStyle}>Patron Type *</label>
              <select
                required
                value={form.patron_type}
                onChange={e => setForm(f => ({ ...f, patron_type: e.target.value as Patron['patron_type'] }))}
                style={{ ...inputStyle, cursor: 'pointer', background: '#fff' }}
                onFocus={handleFocus} onBlur={handleBlur}
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
                <option value="visitor">Visitor</option>
              </select>
            </div>
          </div>

          {/* Program + Year Level — only relevant for students */}
          {form.patron_type === 'student' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>Program</label>
                <select
                  value={form.program_id ?? ''}
                  onChange={e => setForm(f => ({ ...f, program_id: e.target.value ? Number(e.target.value) : null }))}
                  style={{ ...inputStyle, cursor: 'pointer', background: '#fff' }}
                  onFocus={handleFocus} onBlur={handleBlur}
                >
                  <option value="">— Select Program —</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>{p.acronym} — {p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Year Level</label>
                <select
                  value={form.year_level ?? ''}
                  onChange={e => setForm(f => ({ ...f, year_level: e.target.value ? Number(e.target.value) : null }))}
                  style={{ ...inputStyle, cursor: 'pointer', background: '#fff' }}
                  onFocus={handleFocus} onBlur={handleBlur}
                >
                  <option value="">— Select Year —</option>
                  {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Actions */}
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
              {isPending ? 'Saving…' : mode === 'add' ? 'Register Patron' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── PatronManager ────────────────────────────────────────────────────────────
export default function PatronManager() {
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [editTarget, setEditTarget] = useState<Patron | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [searchRaw, setSearchRaw] = useState('');
  const [typeFilter, setTypeFilter] = useState<PatronTypeFilter>('all');

  const search = useDeferredValue(searchRaw.toLowerCase().trim());
  const queryClient = useQueryClient();

  // ── Fetch Patrons ──────────────────────────────────────────────────────────
  const { data: patrons = [], isLoading, isError, error: fetchError } = useQuery<Patron[], Error>({
    queryKey: PATRON_QUERY_KEY,
    queryFn: fetchPatrons,
  });

  // ── Fetch Programs (for dropdown in modal) ────────────────────────────────
  const { data: programs = [] } = useQuery<Program[], Error>({
    queryKey: PROGRAM_QUERY_KEY,
    queryFn: fetchPrograms,
  });

  // ── Client-side filter ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = patrons;
    if (typeFilter !== 'all') result = result.filter(p => p.patron_type === typeFilter);
    if (search) result = result.filter(p =>
      p.full_name.toLowerCase().includes(search) ||
      p.id_number.toLowerCase().includes(search)
    );
    return result;
  }, [patrons, typeFilter, search]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: createPatron,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATRON_QUERY_KEY });
      setModalMode(null);
      setMutationError(null);
    },
    onError: (err: Error) => setMutationError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: updatePatron,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PATRON_QUERY_KEY });
      setModalMode(null);
      setEditTarget(null);
      setMutationError(null);
    },
    onError: (err: Error) => setMutationError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: deletePatron,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PATRON_QUERY_KEY }),
  });

  const handleSubmit = (data: NewPatron) => {
    setMutationError(null);
    if (modalMode === 'add') {
      createMutation.mutate(data);
    } else if (modalMode === 'edit' && editTarget) {
      updateMutation.mutate({ id: editTarget.id, ...data });
    }
  };

  const openEdit = (patron: Patron) => {
    setEditTarget(patron);
    setMutationError(null);
    setModalMode('edit');
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remove patron "${name}"? This cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  // ── Role tab counts ────────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    all:     patrons.length,
    student: patrons.filter(p => p.patron_type === 'student').length,
    faculty: patrons.filter(p => p.patron_type === 'faculty').length,
    visitor: patrons.filter(p => p.patron_type === 'visitor').length,
  }), [patrons]);

  const filterTabs: { key: PatronTypeFilter; label: string }[] = [
    { key: 'all',     label: `All (${counts.all})`           },
    { key: 'student', label: `Students (${counts.student})`  },
    { key: 'faculty', label: `Faculty (${counts.faculty})`   },
    { key: 'visitor', label: `Visitors (${counts.visitor})`  },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Users size={24} color={CCC_PURPLE} />
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e' }}>Patron Management</h2>
            <p style={{ fontSize: '13px', color: '#9ca3af' }}>
              {isLoading ? 'Loading…' : `${filtered.length} of ${patrons.length} patrons`}
            </p>
          </div>
        </div>
        <button
          id="patron-add-btn"
          onClick={() => { setMutationError(null); setModalMode('add'); }}
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
          <Plus size={16} /> Register Patron
        </button>
      </div>

      {/* ── Search + Filter Row ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '220px', maxWidth: '360px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }} />
          <input
            id="patron-search"
            type="search"
            placeholder="Search by name or ID number…"
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

        {/* Role filter tabs */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setTypeFilter(tab.key)}
              style={{
                padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                border: typeFilter === tab.key ? `1.5px solid ${CCC_PURPLE}` : '1.5px solid #e5e7eb',
                background: typeFilter === tab.key ? '#f3e8ff' : '#fff',
                color: typeFilter === tab.key ? CCC_PURPLE : '#6b7280',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Fetch Error ──────────────────────────────────────────────────── */}
      {isError && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>
          ⚠️ {fetchError.message}
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#faf5ff', borderBottom: '2px solid #f3e8ff' }}>
              {['ID Number', 'Full Name', 'Patron Type', 'Program', 'Actions'].map(h => (
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
                    <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
                      <UserRound size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
                      {search || typeFilter !== 'all'
                        ? 'No patrons match your filters.'
                        : 'No patrons registered yet.'}
                    </td>
                  </tr>
                )
                : filtered.map((patron, idx) => (
                  <tr
                    key={patron.id}
                    style={{
                      backgroundColor: idx % 2 === 0 ? '#fff' : '#fdfbff',
                      borderBottom: '1px solid #f3e8ff',
                      transition: 'background-color 0.12s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#faf5ff'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = idx % 2 === 0 ? '#fff' : '#fdfbff'; }}
                  >
                    <td style={{ padding: '13px 16px', fontFamily: 'monospace', fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>
                      {patron.id_number}
                    </td>
                    <td style={{ padding: '13px 16px', fontWeight: 600, color: '#1a1a2e' }}>
                      {patron.full_name}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <RoleBadge type={patron.patron_type} />
                    </td>
                    <td style={{ padding: '13px 16px', color: '#6b7280', fontSize: '13px' }}>
                      {patron.programs
                        ? <span title={patron.programs.name}>{patron.programs.acronym}{patron.year_level ? ` — Yr ${patron.year_level}` : ''}</span>
                        : <span style={{ color: '#d1d5db' }}>—</span>}
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => openEdit(patron)}
                          title="Edit patron"
                          style={{ background: '#f3e8ff', border: 'none', borderRadius: '8px', padding: '7px', cursor: 'pointer', color: CCC_PURPLE, display: 'flex', alignItems: 'center', transition: 'background 0.15s' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#e9d5ff'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f3e8ff'; }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(patron.id, patron.full_name)}
                          disabled={deleteMutation.isPending}
                          title="Remove patron"
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
        <PatronModal
          mode={modalMode}
          initial={modalMode === 'edit' && editTarget ? editTarget : undefined}
          programs={programs}
          onClose={() => { setModalMode(null); setEditTarget(null); setMutationError(null); }}
          onSubmit={handleSubmit}
          isPending={isMutating}
          error={mutationError}
        />
      )}

      <style>{`
        @keyframes pulse { 0%,100% { opacity:.4 } 50% { opacity:.8 } }
        @keyframes spin  { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
