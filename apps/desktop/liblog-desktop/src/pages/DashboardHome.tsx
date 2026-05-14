/**
 * DashboardHome.tsx  (Phase 6)
 * ----------------------------
 * Central Hub (v1.0 Schema).
 */
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Users, BookOpen, AlertTriangle, PhilippinePeso, Clock, TrendingUp, Zap } from 'lucide-react';
import { supabase } from '../services/supabase';
import type { UserRole } from '../types';
import {
  CCC_PURPLE, CCC_PURPLE_TINT, COLOR_DANGER, COLOR_DANGER_BG,
  COLOR_WARNING, COLOR_WARNING_BG, COLOR_SUCCESS, COLOR_SUCCESS_BG, FONT_FAMILY
} from '../utils/constants';

interface OverdueLoan {
  id: string;
  due_date: string;
  resources: { title: string; author: string } | null;
  patrons: { full_name: string; university_id: string } | null;
}

interface RecentScan {
  id: string;
  time_in: string;
  time_out: string | null;
  patrons: { full_name: string; role: UserRole } | null;
}

const today = new Date().toISOString().split('T')[0];

async function fetchTodayVisitorCount(): Promise<number> {
  const { count, error } = await supabase.from('attendance_logs').select('*', { count: 'exact', head: true }).eq('date', today);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function fetchActiveLoanCount(): Promise<number> {
  const { count, error } = await supabase.from('borrow_records').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE');
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function fetchOverdueCount(): Promise<number> {
  const { count, error } = await supabase.from('borrow_records').select('*', { count: 'exact', head: true }).eq('status', 'OVERDUE');
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function fetchUnpaidPenalties(): Promise<number> {
  const { data, error } = await supabase.from('borrow_records').select('due_date').eq('status', 'OVERDUE');
  if (error) throw new Error(error.message);
  return (data ?? []).reduce((sum, l) => sum + Math.max(1, differenceInDays(new Date(), parseISO(l.due_date))) * 5, 0);
}

async function fetchTopOverdueLoans(): Promise<OverdueLoan[]> {
  const { data, error } = await supabase.from('borrow_records').select('id, due_date, resources(title, author), patrons(full_name, university_id)').eq('status', 'OVERDUE').order('due_date', { ascending: true }).limit(5);
  if (error) throw new Error(error.message);
  return (data ?? []) as OverdueLoan[];
}

async function fetchRecentScans(): Promise<RecentScan[]> {
  const { data, error } = await supabase.from('attendance_logs').select('id, time_in, time_out, patrons(full_name, role)').order('time_in', { ascending: false }).limit(5);
  if (error) throw new Error(error.message);
  return (data ?? []) as RecentScan[];
}

function KpiCard({ label, value, icon: Icon, accent, accentBg, prefix = '', isLoading, sublabel }: any) {
  return (
    <div style={{ background: '#fff', borderRadius: '18px', padding: '22px 24px', boxShadow: '0 2px 12px rgba(101,45,144,0.07)', border: `1.5px solid ${accentBg}`, display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={22} color={accent} /></div>
      <div>
        {isLoading ? <div style={{ height: '34px', background: '#f3e8ff', borderRadius: '8px' }} /> : (
          <>
            <p style={{ fontSize: '34px', fontWeight: 800, color: '#1a1a2e' }}>{prefix}{value}</p>
            <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '6px' }}>{label}</p>
            {sublabel && <p style={{ fontSize: '11px', color: accent, fontWeight: 600 }}>{sublabel}</p>}
          </>
        )}
      </div>
    </div>
  );
}

export default function DashboardHome() {
  const { data: visitorCount = 0, isLoading: loadingVisitors } = useQuery({ queryKey: ['kpi-visitors'], queryFn: fetchTodayVisitorCount });
  const { data: loanCount = 0, isLoading: loadingLoans } = useQuery({ queryKey: ['kpi-loans'], queryFn: fetchActiveLoanCount });
  const { data: overdueCount = 0, isLoading: loadingOverdue } = useQuery({ queryKey: ['kpi-overdue'], queryFn: fetchOverdueCount });
  const { data: totalPenalties = 0, isLoading: loadingPenalties } = useQuery({ queryKey: ['kpi-penalties'], queryFn: fetchUnpaidPenalties });
  const { data: overdueLoans = [], isLoading: loadingAlerts } = useQuery({ queryKey: ['top-overdue'], queryFn: fetchTopOverdueLoans });
  const { data: recentScans = [], isLoading: loadingScans } = useQuery({ queryKey: ['recent-scans'], queryFn: fetchRecentScans });

  return (
    <div style={{ fontFamily: FONT_FAMILY }}>
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between' }}>
        <div><h1 style={{ fontSize: '26px', fontWeight: 800 }}>Librarian Dashboard</h1><p style={{ color: '#9ca3af' }}>{format(new Date(), 'EEEE, MMMM d, yyyy')}</p></div>
        <div style={{ background: CCC_PURPLE_TINT, padding: '6px 14px', borderRadius: '20px', color: CCC_PURPLE, fontWeight: 600 }}><Zap size={13} /> Live System</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <KpiCard label="Today's Visitors" value={visitorCount} icon={Users} accent={CCC_PURPLE} accentBg={CCC_PURPLE_TINT} isLoading={loadingVisitors} />
        <KpiCard label="Active Loans" value={loanCount} icon={BookOpen} accent="#3b82f6" accentBg="#eff6ff" isLoading={loadingLoans} />
        <KpiCard label="Overdue Items" value={overdueCount} icon={AlertTriangle} accent={overdueCount > 0 ? COLOR_DANGER : COLOR_SUCCESS} accentBg={overdueCount > 0 ? COLOR_DANGER_BG : COLOR_SUCCESS_BG} isLoading={loadingOverdue} />
        <KpiCard label="Pending Fines" value={totalPenalties} icon={PhilippinePeso} accent={COLOR_WARNING} accentBg={COLOR_WARNING_BG} prefix="₱" isLoading={loadingPenalties} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>Urgent Overdue</h3>
          {loadingAlerts ? <p>Loading…</p> : overdueLoans.map((l, i) => (
            <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #f3f4f6' }}>
              <div><p style={{ fontWeight: 600 }}>{l.resources?.title}</p><p style={{ fontSize: '11px', color: '#9ca3af' }}>{l.patrons?.full_name}</p></div>
              <div style={{ textAlign: 'right' }}><span style={{ color: COLOR_DANGER, fontWeight: 700 }}>{Math.max(1, differenceInDays(new Date(), parseISO(l.due_date)))}d</span></div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: '18px', padding: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>Recent Activity</h3>
          {loadingScans ? <p>Loading…</p> : recentScans.map(s => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: !s.time_out ? COLOR_SUCCESS : '#d1d5db' }} />
              <div style={{ flex: 1 }}><p style={{ fontWeight: 600 }}>{s.patrons?.full_name}</p><p style={{ fontSize: '11px', color: '#9ca3af' }}>{format(parseISO(s.time_in), 'h:mm a')}</p></div>
              <span style={{ fontSize: '10px', background: '#f3e8ff', color: CCC_PURPLE, padding: '2px 8px', borderRadius: '10px' }}>{s.patrons?.role.toLowerCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
