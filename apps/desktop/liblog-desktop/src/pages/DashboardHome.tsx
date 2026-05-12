/**
 * DashboardHome.tsx  (Phase 6)
 * ----------------------------
 * Central Business Intelligence Hub for the LibLog Librarian Dashboard.
 * Institution: Calauan Community College (CCC)
 *
 * Layout:
 *   TOP ROW  — 4 KPI Scorecards (Today's Visitors, Active Loans, Overdue, Penalties)
 *   MIDDLE   — Left: Top 5 Overdue Alerts | Right: Last 5 QR Scans (Live Feed)
 *
 * Data Sources:
 *   - library_logs  → today's visitor count + recent scans
 *   - book_loans    → active loans count + overdue records + unpaid penalties
 *
 * Self-Annealing:
 *   - Skeleton loaders shown while queries are in-flight
 *   - All queries independent; one failure does not block others
 *   - No implicit `any` — all Supabase results typed inline
 */
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, differenceInDays } from 'date-fns';
import {
  Users,
  BookOpen,
  AlertTriangle,
  PhilippinePeso,
  Clock,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { supabase } from '../services/supabase';
import {
  CCC_PURPLE,
  CCC_PURPLE_TINT,
  CCC_PURPLE_TINT_ALT,
  COLOR_DANGER,
  COLOR_DANGER_BG,
  COLOR_WARNING,
  COLOR_WARNING_BG,
  COLOR_SUCCESS,
  COLOR_SUCCESS_BG,
  FONT_FAMILY,
} from '../utils/constants';

// ─── Types ────────────────────────────────────────────────────────────────────
interface OverdueLoan {
  id: string;
  due_date: string;
  books: { title: string; author: string } | null;
  patrons: { full_name: string; unified_id: string } | null;
}

interface RecentScan {
  id: string;
  time_in: string;
  status: string;
  patrons: { full_name: string; patron_type: string } | null;
}

// ─── Supabase Fetchers ────────────────────────────────────────────────────────
const today = new Date().toISOString().split('T')[0];

async function fetchTodayVisitorCount(): Promise<number> {
  const { count, error } = await supabase
    .from('library_logs')
    .select('*', { count: 'exact', head: true })
    .gte('time_in', `${today}T00:00:00+08:00`)
    .lte('time_in', `${today}T23:59:59+08:00`);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function fetchActiveLoanCount(): Promise<number> {
  const { count, error } = await supabase
    .from('book_loans')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function fetchOverdueCount(): Promise<number> {
  const { count, error } = await supabase
    .from('book_loans')
    .select('*', { count: 'exact', head: true })
    .lt('due_date', new Date().toISOString())
    .eq('status', 'active');
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function fetchUnpaidPenalties(): Promise<number> {
  const { data, error } = await supabase
    .from('book_loans')
    .select('due_date')
    .lt('due_date', new Date().toISOString())
    .eq('status', 'active')
    .eq('penalty_paid', false);
  if (error) throw new Error(error.message);
  const total = (data ?? []).reduce((sum, loan) => {
    const days = Math.max(1, differenceInDays(new Date(), parseISO(loan.due_date)));
    return sum + days * 5;
  }, 0);
  return total;
}

async function fetchTopOverdueLoans(): Promise<OverdueLoan[]> {
  const { data, error } = await supabase
    .from('book_loans')
    .select('id, due_date, books(title, author), patrons(full_name, unified_id)')
    .lt('due_date', new Date().toISOString())
    .eq('status', 'active')
    .order('due_date', { ascending: true })
    .limit(5);
  if (error) throw new Error(error.message);
  return (data ?? []) as OverdueLoan[];
}

async function fetchRecentScans(): Promise<RecentScan[]> {
  const { data, error } = await supabase
    .from('library_logs')
    .select('id, time_in, status, patrons(full_name, patron_type)')
    .order('time_in', { ascending: false })
    .limit(5);
  if (error) throw new Error(error.message);
  return (data ?? []) as RecentScan[];
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ width = '100%', height = '18px', radius = '6px' }: {
  width?: string; height?: string; radius?: string;
}) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: 'linear-gradient(90deg, #e9d5ff 0%, #f3e8ff 50%, #e9d5ff 100%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.6s ease-in-out infinite',
    }} />
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent: string;
  accentBg: string;
  prefix?: string;
  isLoading: boolean;
  sublabel?: string;
}

function KpiCard({ label, value, icon: Icon, accent, accentBg, prefix = '', isLoading, sublabel }: KpiCardProps) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '18px',
      padding: '22px 24px',
      boxShadow: '0 2px 12px rgba(101,45,144,0.07)',
      border: `1.5px solid ${accentBg}`,
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
      (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px ${accent}22`;
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(101,45,144,0.07)';
    }}
    >
      {/* Decorative corner blob */}
      <div style={{
        position: 'absolute', top: '-20px', right: '-20px',
        width: '80px', height: '80px', borderRadius: '50%',
        background: accentBg, opacity: 0.6,
      }} />

      {/* Icon */}
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px',
        background: accentBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={22} color={accent} />
      </div>

      {/* Value */}
      <div>
        {isLoading ? (
          <>
            <Skeleton width="60%" height="36px" radius="8px" />
            <div style={{ marginTop: '8px' }}><Skeleton width="80%" height="14px" /></div>
          </>
        ) : (
          <>
            <p style={{
              fontSize: '34px', fontWeight: 800, color: '#1a1a2e',
              lineHeight: 1, letterSpacing: '-1px',
            }}>
              {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '6px', fontWeight: 500 }}>
              {label}
            </p>
            {sublabel && (
              <p style={{ fontSize: '11px', color: accent, marginTop: '3px', fontWeight: 600 }}>
                {sublabel}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Overdue Alert Row ────────────────────────────────────────────────────────
function OverdueAlertRow({ loan, idx }: { loan: OverdueLoan; idx: number }) {
  const days = Math.max(1, differenceInDays(new Date(), parseISO(loan.due_date)));
  const penalty = days * 5;
  const severe = days >= 7;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 14px', borderRadius: '12px',
      background: severe ? '#fff5f5' : idx % 2 === 0 ? '#fff' : '#fffbf5',
      border: `1px solid ${severe ? '#fecaca' : '#fde68a'}`,
      marginBottom: '8px',
      transition: 'background 0.15s',
    }}>
      {/* Urgency rank */}
      <div style={{
        width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
        background: severe ? COLOR_DANGER_BG : COLOR_WARNING_BG,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', fontWeight: 800,
        color: severe ? COLOR_DANGER : COLOR_WARNING,
      }}>
        {idx + 1}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontWeight: 600, color: '#1a1a2e', fontSize: '13px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {loan.books?.title ?? '—'}
        </p>
        <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
          {loan.patrons?.full_name ?? '—'} · {loan.patrons?.unified_id}
        </p>
      </div>

      {/* Badge */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, gap: '2px',
      }}>
        <span style={{
          background: severe ? COLOR_DANGER_BG : COLOR_WARNING_BG,
          color: severe ? COLOR_DANGER : COLOR_WARNING,
          padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
          whiteSpace: 'nowrap',
        }}>
          {days}d overdue
        </span>
        <span style={{ fontSize: '11px', fontWeight: 700, color: CCC_PURPLE }}>
          ₱{penalty}
        </span>
      </div>
    </div>
  );
}

// ─── Recent Scan Row ──────────────────────────────────────────────────────────
function RecentScanRow({ scan }: { scan: RecentScan }) {
  const isActive = scan.status === 'active';
  const typeColor = scan.patrons?.patron_type === 'student'
    ? '#3b82f6' : scan.patrons?.patron_type === 'faculty'
    ? '#16a34a' : '#ea580c';
  const typeBg = scan.patrons?.patron_type === 'student'
    ? '#eff6ff' : scan.patrons?.patron_type === 'faculty'
    ? '#f0fdf4' : '#fff7ed';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '11px 14px', borderRadius: '12px',
      background: '#fff', border: '1px solid #f3e8ff',
      marginBottom: '8px',
    }}>
      {/* Live dot */}
      <div style={{
        width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
        background: isActive ? COLOR_SUCCESS : '#d1d5db',
        boxShadow: isActive ? `0 0 0 3px ${COLOR_SUCCESS_BG}` : 'none',
        animation: isActive ? 'livePulse 2s ease-in-out infinite' : 'none',
      }} />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontWeight: 600, color: '#1a1a2e', fontSize: '13px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {scan.patrons?.full_name ?? 'Unknown Patron'}
        </p>
        <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={10} style={{ flexShrink: 0 }} />
          {scan.time_in ? format(parseISO(scan.time_in), 'MMM d · h:mm a') : '—'}
        </p>
      </div>

      {/* Type badge */}
      {scan.patrons && (
        <span style={{
          background: typeBg, color: typeColor,
          padding: '2px 8px', borderRadius: '20px',
          fontSize: '10px', fontWeight: 600, textTransform: 'capitalize',
          flexShrink: 0,
        }}>
          {scan.patrons.patron_type}
        </span>
      )}
    </div>
  );
}

// ─── Panel Skeleton ───────────────────────────────────────────────────────────
function PanelSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{
          height: '60px', borderRadius: '12px', overflow: 'hidden',
          padding: '0',
        }}>
          <Skeleton height="60px" radius="12px" />
        </div>
      ))}
    </div>
  );
}

// ─── DashboardHome ────────────────────────────────────────────────────────────
export default function DashboardHome() {
  const { data: visitorCount = 0,     isLoading: loadingVisitors  } = useQuery({ queryKey: ['kpi-visitors'],  queryFn: fetchTodayVisitorCount });
  const { data: loanCount = 0,        isLoading: loadingLoans     } = useQuery({ queryKey: ['kpi-loans'],     queryFn: fetchActiveLoanCount   });
  const { data: overdueCount = 0,     isLoading: loadingOverdue   } = useQuery({ queryKey: ['kpi-overdue'],   queryFn: fetchOverdueCount      });
  const { data: totalPenalties = 0,   isLoading: loadingPenalties } = useQuery({ queryKey: ['kpi-penalties'], queryFn: fetchUnpaidPenalties   });
  const { data: overdueLoans = [],    isLoading: loadingAlerts    } = useQuery({ queryKey: ['top-overdue'],   queryFn: fetchTopOverdueLoans   });
  const { data: recentScans = [],     isLoading: loadingScans     } = useQuery({ queryKey: ['recent-scans'], queryFn: fetchRecentScans       });

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div style={{ fontFamily: FONT_FAMILY }}>

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#1a1a2e', marginBottom: '4px' }}>
              {greeting}, Librarian 👋
            </h1>
            <p style={{ fontSize: '14px', color: '#9ca3af' }}>
              {format(now, "EEEE, MMMM d, yyyy")} · Calauan Community College
            </p>
          </div>

          {/* Real-time indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: CCC_PURPLE_TINT, border: `1px solid ${CCC_PURPLE}33`,
            borderRadius: '20px', padding: '6px 14px',
            fontSize: '12px', fontWeight: 600, color: CCC_PURPLE,
          }}>
            <Zap size={13} />
            LibLog BI Hub
          </div>
        </div>
      </div>

      {/* ── KPI Row ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <KpiCard
          label="Today's Visitors"
          value={visitorCount}
          icon={Users}
          accent={CCC_PURPLE}
          accentBg={CCC_PURPLE_TINT}
          isLoading={loadingVisitors}
          sublabel="Library entries today"
        />
        <KpiCard
          label="Active Book Loans"
          value={loanCount}
          icon={BookOpen}
          accent="#3b82f6"
          accentBg="#eff6ff"
          isLoading={loadingLoans}
          sublabel="Currently borrowed"
        />
        <KpiCard
          label="Overdue Books"
          value={overdueCount}
          icon={AlertTriangle}
          accent={overdueCount > 0 ? COLOR_DANGER : COLOR_SUCCESS}
          accentBg={overdueCount > 0 ? COLOR_DANGER_BG : COLOR_SUCCESS_BG}
          isLoading={loadingOverdue}
          sublabel={overdueCount > 0 ? 'Requires attention' : 'All clear!'}
        />
        <KpiCard
          label="Unpaid Penalties"
          value={totalPenalties}
          icon={PhilippinePeso}
          accent={totalPenalties > 0 ? COLOR_WARNING : COLOR_SUCCESS}
          accentBg={totalPenalties > 0 ? COLOR_WARNING_BG : COLOR_SUCCESS_BG}
          prefix="₱"
          isLoading={loadingPenalties}
          sublabel={totalPenalties > 0 ? 'Outstanding fines' : 'No pending fines'}
        />
      </div>

      {/* ── Middle Row ───────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* LEFT — Overdue Alerts ─────────────────────────────────────────── */}
        <div style={{
          background: '#fff', borderRadius: '18px',
          boxShadow: '0 2px 12px rgba(101,45,144,0.07)',
          overflow: 'hidden',
        }}>
          {/* Panel header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '18px 20px', borderBottom: `2px solid ${COLOR_DANGER_BG}`,
            background: '#fff',
          }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: COLOR_DANGER_BG,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={18} color={COLOR_DANGER} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '15px', color: '#1a1a2e' }}>
                Overdue Alerts
              </p>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                Top 5 most urgent — action required
              </p>
            </div>
            {overdueCount > 0 && (
              <div style={{
                marginLeft: 'auto',
                background: COLOR_DANGER_BG, color: COLOR_DANGER,
                padding: '3px 10px', borderRadius: '20px',
                fontSize: '12px', fontWeight: 700,
              }}>
                {overdueCount} total
              </div>
            )}
          </div>

          <div style={{ padding: '16px 20px' }}>
            {loadingAlerts ? (
              <PanelSkeleton />
            ) : overdueLoans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px',
                  background: COLOR_SUCCESS_BG,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px',
                }}>
                  <AlertTriangle size={22} color={COLOR_SUCCESS} />
                </div>
                <p style={{ fontWeight: 600, color: COLOR_SUCCESS, fontSize: '14px', marginBottom: '4px' }}>
                  No Overdue Loans
                </p>
                <p style={{ fontSize: '12px' }}>All borrowers are within their due dates.</p>
              </div>
            ) : (
              overdueLoans.map((loan, idx) => (
                <OverdueAlertRow key={loan.id} loan={loan} idx={idx} />
              ))
            )}
          </div>
        </div>

        {/* RIGHT — Recent Scans ──────────────────────────────────────────── */}
        <div style={{
          background: '#fff', borderRadius: '18px',
          boxShadow: '0 2px 12px rgba(101,45,144,0.07)',
          overflow: 'hidden',
        }}>
          {/* Panel header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '18px 20px', borderBottom: `2px solid ${CCC_PURPLE_TINT}`,
          }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: CCC_PURPLE_TINT,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TrendingUp size={18} color={CCC_PURPLE} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '15px', color: '#1a1a2e' }}>
                Recent QR Scans
              </p>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                Latest 5 library entries
              </p>
            </div>
            <div style={{
              marginLeft: 'auto',
              display: 'flex', alignItems: 'center', gap: '5px',
              background: CCC_PURPLE_TINT, color: CCC_PURPLE,
              padding: '3px 10px', borderRadius: '20px',
              fontSize: '11px', fontWeight: 700,
            }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: CCC_PURPLE, animation: 'livePulse 2s ease infinite',
                display: 'inline-block',
              }} />
              Live
            </div>
          </div>

          <div style={{ padding: '16px 20px' }}>
            {loadingScans ? (
              <PanelSkeleton />
            ) : recentScans.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '14px',
                  background: CCC_PURPLE_TINT_ALT,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px',
                }}>
                  <TrendingUp size={22} color={CCC_PURPLE} />
                </div>
                <p style={{ fontWeight: 600, color: CCC_PURPLE, fontSize: '14px', marginBottom: '4px' }}>
                  No Scans Yet
                </p>
                <p style={{ fontSize: '12px' }}>QR scans will appear here instantly.</p>
              </div>
            ) : (
              recentScans.map(scan => (
                <RecentScanRow key={scan.id} scan={scan} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Footer note ──────────────────────────────────────────────────── */}
      <p style={{ textAlign: 'center', fontSize: '12px', color: '#d1d5db', marginTop: '20px' }}>
        LibLog BI Hub · Data refreshes every 30 seconds · Powered by Supabase
      </p>

      {/* ── Global keyframes ─────────────────────────────────────────────── */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}
