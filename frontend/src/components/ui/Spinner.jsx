/**
 * Spinner — loading indicator component.
 *
 * Usage:
 *   <Spinner />                      ← default cyan, 32px
 *   <Spinner size={20} color="var(--danger)" />
 *   <Spinner fullPage />             ← centered overlay on entire page
 *   <Spinner label="Loading graph…" />
 */
export default function Spinner({ size = 32, color, fullPage = false, label }) {
  const spinnerColor = color || 'var(--primary)'

  const spinner = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        style={{ animation: 'spin 700ms linear infinite' }}
      >
        <circle
          cx={12} cy={12} r={10}
          stroke={`${spinnerColor}33`}
          strokeWidth={2.5}
        />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke={spinnerColor}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      </svg>
      {label && (
        <span style={{ fontSize: '0.82rem', color: 'var(--muted)', letterSpacing: '0.04em' }}>
          {label}
        </span>
      )}
    </div>
  )

  if (fullPage) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(11,17,32,0.7)',
        backdropFilter: 'blur(4px)',
      }}>
        {spinner}
      </div>
    )
  }

  return spinner
}
