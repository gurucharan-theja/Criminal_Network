import { FolderOpen, AlertTriangle, Clock, Users, Link2, Trash2, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useUIStore from '../../store/useUIStore'
import useToast from '../../hooks/useToast'
import { deleteCase } from '../../api/caseApi'
import useCaseStore from '../../store/useCaseStore'

const STATUS_COLORS = {
  active:  { color: 'var(--success)',   bg: 'rgba(34,197,94,0.1)',   label: 'Active'  },
  closed:  { color: 'var(--muted)',     bg: 'rgba(148,163,184,0.1)', label: 'Closed'  },
  pending: { color: 'var(--warning)',   bg: 'rgba(245,158,11,0.1)',  label: 'Pending' },
}

const RISK_COLORS = {
  high:   'var(--danger)',
  medium: 'var(--warning)',
  low:    'var(--success)',
}

export default function CaseCard({ caseData, onDeleted }) {
  const navigate   = useNavigate()
  const toast      = useToast()
  const openModal  = useUIStore(s => s.openModal)
  const loadCases  = useCaseStore(s => s.loadCases)

  const status = STATUS_COLORS[caseData.status] || STATUS_COLORS.pending
  const risk   = RISK_COLORS[caseData.risk] || 'var(--muted)'

  const handleDelete = () => {
    openModal({
      title:        'Delete Case',
      content:      `Are you sure you want to delete "${caseData.title}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      danger:       true,
      onConfirm:    async () => {
        try {
          await deleteCase(caseData.id)
          toast.success(`Case "${caseData.title}" deleted`)
          loadCases()
          if (onDeleted) onDeleted(caseData.id)
        } catch {
          toast.error('Failed to delete case')
        }
      },
    })
  }

  return (
    <div
      className="card anim-fade-up"
      style={{ padding: '18px 20px', cursor: 'default', position: 'relative' }}
    >
      {/* Risk bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: 3, height: '100%',
        background: risk,
        borderRadius: 'var(--radius-lg) 0 0 var(--radius-lg)',
      }} />

      <div style={{ paddingLeft: 10 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <FolderOpen size={15} color="var(--primary)" />
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                {caseData.caseNumber}
              </span>
              {/* Status badge */}
              <span style={{
                fontSize: '0.68rem', fontWeight: 600, padding: '2px 8px',
                borderRadius: 99, background: status.bg, color: status.color,
              }}>
                {status.label}
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-heading)', fontWeight: 600 }}>
              {caseData.title}
            </h3>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => navigate(`/investigation?case=${caseData.id}`)}
              title="Open in Investigation"
              style={{
                background: 'var(--primary-dim)', border: '1px solid var(--border-glow)',
                color: 'var(--primary)', borderRadius: 'var(--radius-md)',
                padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                fontSize: '0.75rem', fontWeight: 500, transition: 'all var(--transition)',
              }}
            >
              <ExternalLink size={12} /> Open
            </button>
            <button
              onClick={handleDelete}
              title="Delete case"
              style={{
                background: 'var(--danger-dim)', border: '1px solid transparent',
                color: 'var(--danger)', borderRadius: 'var(--radius-md)',
                padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                transition: 'all var(--transition)',
              }}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Description */}
        {caseData.description && (
          <p style={{ margin: '0 0 12px', fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {caseData.description}
          </p>
        )}

        {/* Footer stats */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'var(--muted)' }}>
            <Users size={12} /> {caseData.entityCount || 0} entities
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'var(--muted)' }}>
            <Link2 size={12} /> {caseData.relationCount || 0} relations
          </span>
          {caseData.investigator && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'var(--muted)' }}>
              👤 {caseData.investigator}
            </span>
          )}
          {caseData.risk === 'high' && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'var(--danger)' }}>
              <AlertTriangle size={12} /> High Risk
            </span>
          )}
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: 'var(--muted)', marginLeft: 'auto' }}>
            <Clock size={12} />
            {caseData.createdAt ? new Date(caseData.createdAt).toLocaleDateString('en-IN') : '—'}
          </span>
        </div>
      </div>
    </div>
  )
}
