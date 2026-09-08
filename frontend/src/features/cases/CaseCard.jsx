import { FolderOpen, AlertTriangle, Clock, Users, Link2, Trash2, ExternalLink, ShieldAlert, ArrowUpRight, Calendar, User, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useUIStore from '../../store/useUIStore'
import useToast from '../../hooks/useToast'
import { deleteCase } from '../../api/caseApi'
import useCaseStore from '../../store/useCaseStore'

const STATUS_CONFIG = {
  active:  { color: '#16A34A', bg: 'rgba(22, 163, 74, 0.1)',  border: 'rgba(22, 163, 74, 0.25)', label: 'Active Inquiry' },
  closed:  { color: '#64748B', bg: 'rgba(100, 116, 139, 0.1)', border: 'rgba(100, 116, 139, 0.25)', label: 'Closed / Archived' },
  pending: { color: '#D97706', bg: 'rgba(217, 119, 6, 0.1)', border: 'rgba(217, 119, 6, 0.25)', label: 'Pending Review' },
}

const RISK_CONFIG = {
  high:   { color: '#DC2626', bg: '#FEF2F2', label: 'CRITICAL THREAT', border: '#FCA5A5' },
  medium: { color: '#D97706', bg: '#FFFBEB', label: 'ELEVATED RISK',   border: '#FDE68A' },
  low:    { color: '#16A34A', bg: '#F0FDF4', label: 'MONITORED',       border: '#BBF7D0' },
}

export default function CaseCard({ caseData, onDeleted }) {
  const navigate  = useNavigate()
  const toast     = useToast()
  const openModal = useUIStore(s => s.openModal)
  const loadCases = useCaseStore(s => s.loadCases)

  const statusKey = (caseData.status || 'pending').toLowerCase()
  const riskKey   = (caseData.risk || 'medium').toLowerCase()

  const status = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending
  const risk   = RISK_CONFIG[riskKey] || RISK_CONFIG.medium

  const isHighRisk = riskKey === 'high'

  const handleDelete = (e) => {
    e.stopPropagation()
    openModal({
      title:        'Delete Case Docket',
      content:      `Are you sure you want to delete case docket "${caseData.title}" (${caseData.caseNumber})? All forensic links associated with this docket will be unlinked.`,
      confirmLabel: 'Confirm Delete',
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
      onClick={() => navigate(`/investigation?case=${caseData.id}`)}
      style={{
        padding: '20px 22px',
        cursor: 'pointer',
        position: 'relative',
        background: '#FFFFFF',
        borderRadius: 12,
        border: `1.5px solid ${isHighRisk ? '#FCA5A5' : 'var(--border)'}`,
        boxShadow: isHighRisk ? '0 4px 16px rgba(220, 38, 38, 0.06)' : 'var(--shadow-card)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 14,
        overflow: 'hidden',
      }}
    >
      {/* Tactical Top Hazard Strip for High Risk */}
      {isHighRisk && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, #DC2626, #F87171, #DC2626)',
        }} />
      )}

      {/* Header Row: Docket ID & Threat Badge */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FolderOpen size={15} color="var(--primary)" />
            <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace' }}>
              {caseData.caseNumber || `DOCKET-${caseData.id}`}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                fontSize: '0.66rem',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: 4,
                background: status.bg,
                color: status.color,
                border: `1px solid ${status.border}`,
              }}
            >
              {status.label.toUpperCase()}
            </span>

            <span
              style={{
                fontSize: '0.66rem',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: 4,
                background: risk.color,
                color: '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              {isHighRisk && <ShieldAlert size={10} />}
              {risk.label}
            </span>
          </div>
        </div>

        {/* Case Title */}
        <h3 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-heading)', lineHeight: 1.3 }}>
          {caseData.title}
        </h3>

        {/* Description / Summary */}
        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.45 }} className="truncate-2">
          {caseData.description || 'Police investigation docket concerning cross-border criminal syndicates, illicit Hawala transactions, and telecom ping intercepts.'}
        </p>
      </div>

      {/* Forensic Telemetry Box */}
      <div
        style={{
          background: isHighRisk ? '#FEF2F2' : '#F8FAFC',
          border: `1px solid ${isHighRisk ? '#FEE2E2' : '#E2E8F0'}`,
          borderRadius: 8,
          padding: '8px 12px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px 12px',
          fontSize: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)' }}>
          <User size={13} color="var(--primary)" />
          <span style={{ color: 'var(--text)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {caseData.investigator || 'Special Cell Unit'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)' }}>
          <Calendar size={13} color="var(--muted)" />
          <span style={{ color: 'var(--muted)' }}>
            {caseData.createdAt ? new Date(caseData.createdAt).toLocaleDateString() : 'Active 2026'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Users size={13} color="#0284C7" />
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>
            {caseData.entityCount || 0} suspects
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link2 size={13} color="#16A34A" />
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>
            {caseData.relationCount || 0} conduits
          </span>
        </div>
      </div>

      {/* Actions footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
        <button
          onClick={handleDelete}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: '0.72rem',
            transition: 'color 150ms',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
          title="Delete docket"
        >
          <Trash2 size={14} /> Remove
        </button>

        <span style={{
          fontSize: '0.74rem',
          fontWeight: 700,
          color: 'var(--primary)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 3,
        }}>
          Open Docket <ArrowUpRight size={13} />
        </span>
      </div>
    </div>
  )
}
