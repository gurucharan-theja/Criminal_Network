import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import useUIStore from '../../store/useUIStore'

const ICONS = {
  success: <CheckCircle  size={16} />,
  error:   <XCircle      size={16} />,
  warning: <AlertTriangle size={16} />,
  info:    <Info          size={16} />,
}

const COLORS = {
  success: { color: 'var(--success)', bg: 'var(--success-dim)' },
  error:   { color: 'var(--danger)',  bg: 'var(--danger-dim)'  },
  warning: { color: 'var(--warning)', bg: 'var(--warning-dim)' },
  info:    { color: 'var(--primary)', bg: 'var(--primary-dim)' },
}

/**
 * ToastContainer — renders all active toasts from useUIStore.
 * Mount once in App.jsx. Toasts auto-dismiss after their duration.
 *
 * Trigger from anywhere:
 *   useUIStore.getState().success('Saved!')
 *   useUIStore.getState().error('Upload failed')
 */
export default function ToastContainer() {
  const { toasts, dismissToast } = useUIStore()

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none',
      }}
    >
      {toasts.map(toast => {
        const { color, bg } = COLORS[toast.type] || COLORS.info
        return (
          <div
            key={toast.id}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '12px 16px',
              background: 'var(--panel)',
              border: `1px solid ${color}44`,
              borderLeft: `3px solid ${color}`,
              borderRadius: 'var(--radius-md)',
              boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px ${color}11`,
              minWidth: 280, maxWidth: 380,
              pointerEvents: 'all',
              animation: 'fadeInUp 200ms both',
            }}
          >
            {/* Icon */}
            <span style={{ color, flexShrink: 0, marginTop: 1 }}>
              {ICONS[toast.type]}
            </span>

            {/* Message */}
            <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.5 }}>
              {toast.message}
            </span>

            {/* Dismiss */}
            <button
              onClick={() => dismissToast(toast.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--muted)', padding: 2, flexShrink: 0,
                display: 'flex', alignItems: 'center',
                transition: 'color var(--transition)',
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
