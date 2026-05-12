/**
 * ReportGenerator.tsx  (Phase 4 — hardened)
 * -------------------------------------------
 * CHED Compliance Export Engine for LibLog.
 * Institution: Calauan Community College (CCC)
 *
 * Filters: Date Range + Patron Type + Program (BSPA / MID)
 * Exports: CSV (native Blob) + PDF (jsPDF + autotable)
 *
 * Hardening (Static Analysis Pass):
 *   - All colour constants imported from utils/constants.ts (DRY).
 *   - LogEntryWithProgram replaces 'as any' casts on patron.programs.
 *   - jsPDF page count uses public API doc.getNumberOfPages().
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Download, FileText, FileSpreadsheet, AlertCircle, Loader2, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../services/supabase';
import type { LogEntryWithProgram } from '../types';
import {
  CCC_PURPLE,
  CCC_PURPLE_RGB,
  INSTITUTION_NAME,
  INSTITUTION_SYSTEM,
  DB_PROGRAMS  as PROGRAMS,
  DB_PATRON_TYPES as PATRON_TYPES,
} from '../utils/constants';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReportFilters {
  startDate: string;
  endDate: string;
  patronType: string;
  programId: string;
}

interface ReportRow {
  unified_id: string;
  full_name: string;
  patron_type: string;
  program: string;
  date: string;
  time_in: string;
  time_out: string;
  duration: string;
  status: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getDuration(timeIn: string, timeOut: string | null): string {
  if (!timeOut) return 'Active';
  const mins = Math.round((new Date(timeOut).getTime() - new Date(timeIn).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function toReportRows(logs: LogEntryWithProgram[]): ReportRow[] {
  return logs.map(l => ({
    unified_id:  l.patrons?.unified_id   ?? '—',
    full_name:   l.patrons?.full_name   ?? '—',
    patron_type: l.patrons?.patron_type ?? '—',
    program:     l.patrons?.programs?.acronym ?? '—',   // typed — no 'as any'
    date:        l.time_in ? format(parseISO(l.time_in), 'MMM d, yyyy') : '—',
    time_in:     l.time_in  ? format(parseISO(l.time_in),  'h:mm a') : '—',
    time_out:    l.time_out ? format(parseISO(l.time_out), 'h:mm a') : '—',
    duration:    getDuration(l.time_in, l.time_out),
    status:      l.status,
  }));
}

// ─── Supabase Query ───────────────────────────────────────────────────────────
async function fetchReportLogs(filters: ReportFilters): Promise<LogEntryWithProgram[]> {
  let q = supabase
    .from('library_logs')
    .select('*, patrons(full_name, unified_id, patron_type, program_id, programs(name, acronym))')
    .gte('time_in', `${filters.startDate}T00:00:00+08:00`)
    .lte('time_in', `${filters.endDate}T23:59:59+08:00`)
    .order('time_in', { ascending: false });

  if (filters.patronType) q = q.eq('patrons.patron_type', filters.patronType);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  let result = (data ?? []) as LogEntryWithProgram[];

  // Program filter applied client-side (nested FK filter not supported in Supabase JS)
  if (filters.programId) {
    result = result.filter(l => l.patrons?.program_id === Number(filters.programId));
  }

  return result;
}

// ─── Export: CSV ─────────────────────────────────────────────────────────────
function exportCSV(rows: ReportRow[], filename: string) {
  const headers = ['Unified ID','Full Name','Type','Program','Date','Time In','Time Out','Duration','Status'];
  const lines = [
    headers.join(','),
    ...rows.map(r => [
      r.unified_id, `"${r.full_name}"`, r.patron_type, r.program,
      r.date, r.time_in, r.time_out, r.duration, r.status,
    ].join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Export: PDF ─────────────────────────────────────────────────────────────
function exportPDF(rows: ReportRow[], filters: ReportFilters, totalCount: number) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const now   = format(new Date(), 'MMMM d, yyyy h:mm a');

  // Header bar
  doc.setFillColor(...CCC_PURPLE_RGB);
  doc.rect(0, 0, pageW, 28, 'F');

  // Title — strings from constants (DRY)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(INSTITUTION_NAME.toUpperCase(), 14, 11);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(INSTITUTION_SYSTEM, 14, 19);

  // Date stamp (top-right)
  doc.setFontSize(8);
  doc.text(`Generated: ${now}`, pageW - 14, 11, { align: 'right' });
  doc.text(`Period: ${filters.startDate} to ${filters.endDate}`, pageW - 14, 17, { align: 'right' });
  doc.text(`Total Records: ${totalCount}`, pageW - 14, 23, { align: 'right' });

  // Filter summary bar
  doc.setFillColor(245, 240, 255);
  doc.rect(0, 28, pageW, 10, 'F');
  doc.setTextColor(...CCC_PURPLE_RGB);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const typeLabel    = PATRON_TYPES.find(t => t.value === filters.patronType)?.label ?? 'All Types';
  const programLabel = PROGRAMS.find(p => p.id === filters.programId)?.label ?? 'All Programs';
  doc.text(`Filters Applied:  Type — ${typeLabel}   |   Program — ${programLabel}`, 14, 34);

  // Table
  autoTable(doc, {
    startY: 42,
    head: [['Unified ID', 'Full Name', 'Type', 'Program', 'Date', 'Time In', 'Time Out', 'Duration', 'Status']],
    body: rows.map(r => [r.unified_id, r.full_name, r.patron_type, r.program, r.date, r.time_in, r.time_out, r.duration, r.status]),
    headStyles: {
      fillColor: CCC_PURPLE_RGB,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8, textColor: [30, 30, 50] },
    alternateRowStyles: { fillColor: [250, 245, 255] },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 45 },
      2: { cellWidth: 18 },
      3: { cellWidth: 20 },
      4: { cellWidth: 26 },
      5: { cellWidth: 20 },
      6: { cellWidth: 20 },
      7: { cellWidth: 20 },
      8: { cellWidth: 22 },
    },
    didDrawPage: (data) => {
      // Footer on every page — use public jsPDF API (no 'as any')
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `LibLog — ${INSTITUTION_NAME}  |  Page ${data.pageNumber} of ${pageCount}`,
        pageW / 2,
        doc.internal.pageSize.getHeight() - 6,
        { align: 'center' }
      );
    },
  });

  const safePeriod = `${filters.startDate}_to_${filters.endDate}`;
  doc.save(`CCC_Library_Report_${safePeriod}.pdf`);
}

// ─── Input / Label styles ─────────────────────────────────────────────────────
const inputSx: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: '10px',
  border: '1.5px solid #e5e7eb', fontSize: '14px', outline: 'none',
  fontFamily: 'inherit', transition: 'border-color 0.15s', background: '#fff',
  boxSizing: 'border-box',
};
const labelSx: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151',
  marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em',
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusChip({ s }: { s: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    active:       { bg: '#dcfce7', color: '#16a34a' },
    completed:    { bg: '#f3f4f6', color: '#6b7280' },
    'auto-closed':{ bg: '#fef3c7', color: '#d97706' },
  };
  const c = cfg[s] ?? cfg.completed;
  return <span style={{ ...c, padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>{s}</span>;
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ hasSearched }: { hasSearched: boolean }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '64px 32px', gap: '16px',
    }}>
      <div style={{
        width: '72px', height: '72px', borderRadius: '20px',
        background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {hasSearched
          ? <AlertCircle size={32} color={CCC_PURPLE} style={{ opacity: 0.6 }} />
          : <BarChart3  size={32} color={CCC_PURPLE} style={{ opacity: 0.6 }} />}
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a2e', marginBottom: '6px' }}>
          {hasSearched ? 'No records found' : 'Configure your report'}
        </p>
        <p style={{ fontSize: '13px', color: '#9ca3af', maxWidth: '320px', lineHeight: 1.6 }}>
          {hasSearched
            ? 'No library logs match the selected filters. Try adjusting the date range or patron type.'
            : 'Select a date range, patron type, and program, then click Generate Report.'}
        </p>
      </div>
    </div>
  );
}

// ─── ReportGenerator ─────────────────────────────────────────────────────────
const today = format(new Date(), 'yyyy-MM-dd');

export default function ReportGenerator() {
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: today, endDate: today, patronType: '', programId: '',
  });
  const [submitted, setSubmitted] = useState<ReportFilters | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const { data: logs = [], isLoading, isError, error } = useQuery<LogEntryWithProgram[], Error>({
    queryKey: ['report-logs', submitted],
    queryFn: () => fetchReportLogs(submitted!),
    enabled: submitted !== null,
  });

  const rows = toReportRows(logs);
  const hasData  = rows.length > 0;
  const searched = submitted !== null;

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = CCC_PURPLE; };
  const handleBlur  = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => { e.target.style.borderColor = '#e5e7eb'; };

  const handleCSV = () => {
    if (!hasData) return;
    const fn = `CCC_Library_Report_${submitted!.startDate}_to_${submitted!.endDate}.csv`;
    exportCSV(rows, fn);
  };

  const handlePDF = async () => {
    if (!hasData) return;
    setIsExporting(true);
    try { exportPDF(rows, submitted!, logs.length); }
    finally { setIsExporting(false); }
  };

  return (
    <div>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <BarChart3 size={24} color={CCC_PURPLE} />
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a2e' }}>Report Generator</h2>
          <p style={{ fontSize: '13px', color: '#9ca3af' }}>CHED Compliance — Library Usage Export</p>
        </div>
      </div>

      {/* ── Filter Panel ──────────────────────────────────────────────── */}
      <div style={{
        background: '#fff', borderRadius: '16px',
        padding: '24px', marginBottom: '20px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        border: '1px solid #f3e8ff',
      }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: CCC_PURPLE, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Report Filters
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'end' }}>
          {/* Start Date */}
          <div>
            <label style={labelSx}>Start Date</label>
            <input type="date" value={filters.startDate} max={filters.endDate}
              onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
              style={inputSx} onFocus={handleFocus} onBlur={handleBlur} />
          </div>

          {/* End Date */}
          <div>
            <label style={labelSx}>End Date</label>
            <input type="date" value={filters.endDate} min={filters.startDate} max={today}
              onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
              style={inputSx} onFocus={handleFocus} onBlur={handleBlur} />
          </div>

          {/* Patron Type */}
          <div>
            <label style={labelSx}>Patron Type</label>
            <select value={filters.patronType}
              onChange={e => setFilters(f => ({ ...f, patronType: e.target.value }))}
              style={{ ...inputSx, cursor: 'pointer' }} onFocus={handleFocus} onBlur={handleBlur}>
              {PATRON_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {/* Program */}
          <div>
            <label style={labelSx}>Program</label>
            <select value={filters.programId}
              onChange={e => setFilters(f => ({ ...f, programId: e.target.value }))}
              style={{ ...inputSx, cursor: 'pointer' }} onFocus={handleFocus} onBlur={handleBlur}>
              {PROGRAMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
        </div>

        {/* Generate button */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setSubmitted({ ...filters })}
            disabled={isLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 24px', borderRadius: '10px', border: 'none',
              backgroundColor: CCC_PURPLE, color: '#fff',
              fontSize: '14px', fontWeight: 600, cursor: isLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', boxShadow: `0 4px 12px rgba(101,45,144,0.3)`,
              opacity: isLoading ? 0.7 : 1, transition: 'transform 0.1s',
            }}
            onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
          >
            {isLoading
              ? <><Loader2 size={15} style={{ animation: 'spin 0.9s linear infinite' }} /> Generating…</>
              : <><Search size={15} /> Generate Report</>}
          </button>
        </div>
      </div>

      {/* ── Results Panel ─────────────────────────────────────────────── */}
      <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

        {/* Results header + export actions */}
        {searched && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px', borderBottom: '1px solid #f3e8ff',
            background: '#faf5ff',
          }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a2e' }}>
                {isLoading ? 'Fetching records…' : `${rows.length} record${rows.length !== 1 ? 's' : ''} found`}
              </p>
              {submitted && !isLoading && (
                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                  {submitted.startDate} → {submitted.endDate}
                  {submitted.patronType ? ` · ${submitted.patronType}` : ''}
                  {submitted.programId  ? ` · ${PROGRAMS.find(p => p.id === submitted.programId)?.label}` : ''}
                </p>
              )}
            </div>
            {/* Export Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleCSV}
                disabled={!hasData || isLoading}
                title={hasData ? 'Export to CSV' : 'No data to export'}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '9px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                  border: `1.5px solid ${hasData ? '#16a34a' : '#e5e7eb'}`,
                  background: hasData ? '#f0fdf4' : '#f9fafb',
                  color: hasData ? '#16a34a' : '#d1d5db',
                  cursor: hasData ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (hasData) (e.currentTarget as HTMLButtonElement).style.background = '#dcfce7'; }}
                onMouseLeave={e => { if (hasData) (e.currentTarget as HTMLButtonElement).style.background = '#f0fdf4'; }}
              >
                <FileSpreadsheet size={15} /> Export CSV
              </button>

              <button
                onClick={handlePDF}
                disabled={!hasData || isLoading || isExporting}
                title={hasData ? 'Export to PDF' : 'No data to export'}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '9px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
                  border: `1.5px solid ${hasData ? CCC_PURPLE : '#e5e7eb'}`,
                  background: hasData ? '#f3e8ff' : '#f9fafb',
                  color: hasData ? CCC_PURPLE : '#d1d5db',
                  cursor: hasData && !isExporting ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (hasData) (e.currentTarget as HTMLButtonElement).style.background = '#e9d5ff'; }}
                onMouseLeave={e => { if (hasData) (e.currentTarget as HTMLButtonElement).style.background = '#f3e8ff'; }}
              >
                {isExporting
                  ? <><Loader2 size={15} style={{ animation: 'spin 0.9s linear infinite' }} /> Building PDF…</>
                  : <><FileText size={15} /> Export PDF</>}
              </button>

              {hasData && (
                <a
                  href="#"
                  onClick={e => { e.preventDefault(); handleCSV(); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '9px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, border: '1.5px solid #e5e7eb', color: '#6b7280', textDecoration: 'none', background: '#fff', transition: 'all 0.15s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#f9fafb'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#fff'; }}
                >
                  <Download size={15} /> Quick Download
                </a>
              )}
            </div>
          </div>
        )}

        {/* Table or states */}
        {isError ? (
          <div style={{ padding: '24px', color: '#dc2626', fontSize: '14px', background: '#fef2f2', margin: '16px', borderRadius: '12px', border: '1px solid #fecaca' }}>
            ⚠️ {error.message}
          </div>
        ) : isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px', gap: '12px', color: CCC_PURPLE }}>
            <Loader2 size={20} style={{ animation: 'spin 0.9s linear infinite' }} />
            <span style={{ fontSize: '14px', fontWeight: 500 }}>Querying records…</span>
          </div>
        ) : !hasData ? (
          <EmptyState hasSearched={searched} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#faf5ff', borderBottom: '2px solid #f3e8ff' }}>
                  {['Unified ID','Full Name','Type','Program','Date','Time In','Time Out','Duration','Status'].map(h => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: CCC_PURPLE, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}
                    style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fdfbff', borderBottom: '1px solid #f3e8ff', transition: 'background 0.12s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = '#faf5ff'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = i % 2 === 0 ? '#fff' : '#fdfbff'; }}
                  >
                    <td style={{ padding: '11px 14px', fontFamily: 'monospace', fontSize: '12px', color: '#6b7280' }}>{r.unified_id}</td>
                    <td style={{ padding: '11px 14px', fontWeight: 600, color: '#1a1a2e' }}>{r.full_name}</td>
                    <td style={{ padding: '11px 14px', color: '#6b7280', textTransform: 'capitalize' }}>{r.patron_type}</td>
                    <td style={{ padding: '11px 14px' }}>
                      {r.program !== '—'
                        ? <span style={{ background: '#f3e8ff', color: CCC_PURPLE, padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>{r.program}</span>
                        : <span style={{ color: '#d1d5db' }}>—</span>}
                    </td>
                    <td style={{ padding: '11px 14px', color: '#374151', whiteSpace: 'nowrap' }}>{r.date}</td>
                    <td style={{ padding: '11px 14px', color: '#374151', whiteSpace: 'nowrap' }}>{r.time_in}</td>
                    <td style={{ padding: '11px 14px', color: '#374151', whiteSpace: 'nowrap' }}>{r.time_out}</td>
                    <td style={{ padding: '11px 14px', color: '#6b7280', whiteSpace: 'nowrap' }}>{r.duration}</td>
                    <td style={{ padding: '11px 14px' }}><StatusChip s={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
