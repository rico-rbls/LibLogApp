/**
 * DashboardPage.tsx
 * -----------------
 * Placeholder for the main dashboard view.
 * Replace stat cards with real React Query data hooks.
 */
export default function DashboardPage() {
  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a2e', marginBottom: '8px' }}>
        Dashboard
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '32px' }}>
        Welcome back, Librarian — here's today's overview.
      </p>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        {[
          { label: 'Logged In Today',  value: '—', color: '#652D90' },
          { label: 'Total Students',   value: '—', color: '#4A1F6E' },
          { label: 'Books Available',  value: '—', color: '#8B4DBF' },
          { label: 'Overdue Items',    value: '—', color: '#D97706' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              borderTop: `4px solid ${color}`,
            }}
          >
            <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '8px' }}>{label}</p>
            <p style={{ fontSize: '28px', fontWeight: 700, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Placeholder table */}
      <div style={{
        marginTop: '32px',
        background: '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', color: '#1a1a2e' }}>
          Recent Log-Ins
        </h2>
        <p style={{ color: '#9ca3af', fontSize: '14px' }}>
          Connect React Query to <code>library_logs</code> to populate this table.
        </p>
      </div>
    </div>
  );
}
