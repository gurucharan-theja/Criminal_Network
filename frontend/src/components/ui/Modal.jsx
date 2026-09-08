import { useEffect } from 'react'
import { X } from 'lucide-react'
import useUIStore from '../../store/useUIStore'

/**
 * Modal — accessible overlay modal driven by useUIStore.
 *
 * Open from anywhere:
 *   useUIStore.getState().openModal({
 *     title: 'Confirm Delete',
 *     content: 'Are you sure?',
 *     onConfirm: () => deleteEntity(id),
 *   })
 */
export default function Modal() {
  const { modal, closeModal } = useUIStore()

  // Close on Escape key
  useEffect(() => {
    if (!modal) return
    const handler = (e) => { if (e.key === 'Escape') closeModal() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [modal, closeModal])

  if (!modal) return null

  const { title, content, onConfirm, onCancel, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false } = modal

  const handleConfirm = () => {
    if (onConfirm) onConfirm()
    closeModal()
  }

  const handleCancel = () => {
    if (onCancel) onCancel()
    closeModal()
  }

  return (
    /* Backdrop */
    <div
      onClick={handleCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 150ms both',
      }}
    >
      {/* Panel */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 'var(--radius-lg)',
          width: '100%', maxWidth: 440,
          padding: '28px 28px 24px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.05)',
          animation: 'fadeInUp 200ms both',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0F172A', fontWeight: 700 }}>{title}</h3>
          <button
            onClick={handleCancel}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#64748B', padding: 4, borderRadius: 6,
              display: 'flex', alignItems: 'center',
              transition: 'color var(--transition)',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#0F172A'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ color: '#334155', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 24 }}>
          {content}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={handleCancel}
            className="btn btn-ghost"
          >
            {cancelLabel}
          </button>
          {onConfirm && (
            <button
              onClick={handleConfirm}
              className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
