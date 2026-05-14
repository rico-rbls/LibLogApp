/**
 * ReportGenerator.tsx  (Phase 4)
 * -----------------------------
 * Compliance Export Engine (v1.0 Schema).
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Download, FileText, FileSpreadsheet, AlertCircle, Loader2, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../services/supabase';
import type { AttendanceLog, UserRole } from '../types';
import { CCC_PURPLE, CCC_PURPLE_RGB, INSTITUTION_NAME, INSTITUTION_SYSTEM } from '../utils/constants';

interface ReportFilters {
  startDate: string;
  endDate: string;
  role: string;
}

interface ReportRow {
  university_id: string;
  full_name: string;
  role: string;
  program: string;
  date: string;
  time_in: string;
  time_out: string;
  duration: string;
}

function getDuration(timeIn: string, timeOut: string | null): string {
  if (!timeOut) return 'Active';
  const mins = Math.round((new Date(timeOut).getTime() - new Date(timeIn).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

async function fetchReportLogs(filters: ReportFilters): Promise<AttendanceLog[]> {
  let q = supabase
    .from('attendance_logs')
    .select('*, patrons(full_name, university_id, role, program)')
    .gte('date', filters.startDate)
    .lte('date', filters.endDate)
    .order('time_in', { ascending: false });

  if (filters.role) q = q.eq('patrons.role', filters.role);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as AttendanceLog[];
}

function toReportRows(logs: AttendanceLog[]): ReportRow[] {
  return logs.map(l => ({
    university_id: l.patrons?.university_id ?? '—',
    full_name: l.patrons?.full_name ?? '—',
    role: l.patrons?.role ?? '—',
    program: l.patrons?.program ?? '—',
    date: l.date,
    time_in: format(parseISO(l.time_in), 'h:mm a'),
    time_out: l.time_out ? format(parseISO(l.time_out), 'h:mm a') : '—',
    duration: getDuration(l.time_in, l.time_out),
  }));
}

export default function ReportGenerator() {
  const [filters, setFilters] = useState<ReportFilters>({ startDate: format(new Date(), 'yyyy-MM-dd'), endDate: format(new Date(), 'yyyy-MM-dd'), role: '' });
  const [submitted, setSubmitted] = useState<ReportFilters | null>(null);

  const { data: logs = [], isLoading, isError, error } = useQuery<AttendanceLog[], Error>({
    queryKey: ['report-logs', submitted],
    queryFn: () => fetchReportLogs(submitted!),
    enabled: !!submitted,
  });

  const rows = toReportRows(logs);

  const handlePDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFillColor(...CCC_PURPLE_RGB);
    doc.rect(0, 0, pageW, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text(INSTITUTION_NAME, 14, 12);
    autoTable(doc, {
      startY: 25,
      head: [['ID', 'Name', 'Role', 'Program', 'Date', 'In', 'Out', 'Duration']],
      body: rows.map(r => [r.university_id, r.full_name, r.role, r.program, r.date, r.time_in, r.time_out, r.duration]),
    });
    doc.save(`Report_${filters.startDate}.pdf`);
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <BarChart3 size={24} color={CCC_PURPLE} />
        <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Report Generator</h2>
      </div>

      <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', marginBottom: '20px', border: '1px solid #f3e8ff' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div><label>Start Date</label><input type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} /></div>
          <div><label>End Date</label><input type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }} /></div>
          <div><label>Role</label>
            <select value={filters.role} onChange={e => setFilters(f => ({ ...f, role: e.target.value }))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
              <option value="">All Roles</option>
              <option value="STUDENT">Student</option>
              <option value="FACULTY">Faculty</option>
              <option value="VISITOR">Visitor</option>
            </select>
          </div>
        </div>
        <button onClick={() => setSubmitted({ ...filters })} style={{ marginTop: '20px', background: CCC_PURPLE, color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '10px', cursor: 'pointer' }}>Generate Report</button>
      </div>

      {logs.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', background: '#faf5ff' }}>
            <p style={{ fontWeight: 700 }}>{logs.length} Records Found</p>
            <button onClick={handlePDF} style={{ background: CCC_PURPLE, color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}><FileText size={14} /> Export PDF</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead><tr style={{ background: '#f9fafb' }}>{['ID', 'Name', 'Role', 'Date', 'In', 'Out'].map(h => <th key={h} style={{ padding: '12px', textAlign: 'left' }}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px' }}>{r.university_id}</td>
                  <td style={{ padding: '12px', fontWeight: 600 }}>{r.full_name}</td>
                  <td style={{ padding: '12px' }}>{r.role}</td>
                  <td style={{ padding: '12px' }}>{r.date}</td>
                  <td style={{ padding: '12px' }}>{r.time_in}</td>
                  <td style={{ padding: '12px' }}>{r.time_out}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
