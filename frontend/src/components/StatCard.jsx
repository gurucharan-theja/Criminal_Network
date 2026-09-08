/**
 * StatCard — reusable metric card
 *
 * Props:
 *   title       {string}  — metric name
 *   value       {string|number} — primary value
 *   delta       {string}  — change string e.g. "+12%" or "↑ 5"
 *   deltaType   {'up'|'down'|'neutral'}
 *   icon        {ReactNode}
 *   accent      {'primary'|'danger'|'warning'|'success'|'secondary'}
 *   sub         {string}  — optional sub-label
 *   loading     {boolean}
 */
export default function StatCard({
  title,
  value,
  delta,
  deltaType = 'neutral',
  icon,
  accent = 'primary',
  sub,
  loading = false,
}) {
  const accentColors = {
    primary:   { color: 'var(--primary)',   bg: 'var(--primary-dim)',   border: 'var(--border-glow)' },
    secondary: { color: 'var(--secondary)', bg: 'var(--secondary-dim)', border: 'rgba(59,130,246,0.25)' },
    danger:    { color: 'var(--danger)',    bg: 'var(--danger-dim)',    border: 'rgba(239,68,68,0.3)' },
    warning:   { color: 'var(--warning)',   bg: 'var(--warning-dim)',   border: 'rgba(245,158,11,0.3)' },
    success:   { color: 'var(--success)',   bg: 'var(--success-dim)',   border: 'rgba(34,197,94,0.3)' },
  }

  const deltaColors = {
    up:      'var(--danger)',
    down:    'var(--success)',
    neutral: 'var(--muted)',
  }

  const { color, bg, border } = accentColors[accent] || accentColors.primary

  return (
    <div
      className="card anim-fade-up"
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderColor: 'var(--border)',
        transition: 'border-color var(--transition), box-shadow var(--transition), transform var(--transition)',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = border
        e.currentTarget.style.boxShadow = `0 0 20px ${color}22`
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'var(--shadow-card)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Top-right decorative glow */}
      <div
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: color,
          opacity: 0.07,
          filter: 'blur(20px)',
          pointerEvents: 'none',
        }}
      />

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--muted)',
          }}
        >
          {title}
        </span>
        {icon && (
          <div
            style={{
              width: 34,
              height: 34,
              background: bg,
              border: `1px solid ${border}`,
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color,
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      {loading ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <div className="spinner" />
        </div>
      ) : (
        <div
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: 'var(--text-title)',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            marginBottom: 8,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {value}
        </div>
      )}

      {/* Delta + sub */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {delta && (
          <span
            style={{
              fontSize: '0.78rem',
              fontWeight: 600,
              color: deltaColors[deltaType],
            }}
          >
            {delta}
          </span>
        )}
        {sub && (
          <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{sub}</span>
        )}
      </div>
    </div>
  )
}
