/**
 * EntityCard — Tactical Law Enforcement Intelligence Dossier Card
 *
 * Enhanced with:
 * - High-Risk Tactical Red Glass / Border Glow styling
 * - Warning pulse indicator & Threat Radar score badge
 * - Biometric / Operative Avatar with risk ring
 * - Sleek metadata badges and micro-actions
 */
import { User, MapPin, Link2, AlertTriangle, ShieldAlert, ArrowUpRight, Activity } from 'lucide-react'

const riskConfig = {
  high:   { label: 'CRITICAL THREAT', badge: 'badge-danger',  dot: 'high',   accent: '#DC2626', bg: 'rgba(220, 38, 38, 0.04)', border: 'rgba(220, 38, 38, 0.35)' },
  medium: { label: 'ELEVATED RISK',   badge: 'badge-warning', dot: 'medium', accent: '#D97706', bg: 'rgba(217, 119, 6, 0.03)',  border: 'rgba(217, 119, 6, 0.3)' },
  low:    { label: 'MONITORED',       badge: 'badge-success', dot: 'low',    accent: '#16A34A', bg: 'rgba(22, 163, 74, 0.03)',  border: 'rgba(22, 163, 74, 0.25)' },
}

const statusConfig = {
  active:   { label: 'Active Wanted', color: '#DC2626' },
  arrested: { label: 'In Custody',    color: '#D97706' },
  deceased: { label: 'Deceased',      color: '#64748B' },
  unknown:  { label: 'Under Watch',   color: '#0284C7' },
}

const typeColors = {
  Person:       { bg: 'rgba(2, 132, 199, 0.12)',  color: '#0284C7', icon: '👤' },
  Organization: { bg: 'rgba(124, 58, 237, 0.12)', color: '#7C3AED', icon: '🏢' },
  Location:     { bg: 'rgba(22, 163, 74, 0.12)',  color: '#16A34A', icon: '📍' },
  Vehicle:      { bg: 'rgba(217, 119, 6, 0.12)',  color: '#D97706', icon: '🚗' },
  Phone:        { bg: 'rgba(220, 38, 38, 0.12)',  color: '#DC2626', icon: '📞' },
}

export default function EntityCard({ entity, onClick, compact = false }) {
  if (!entity) return null

  const risk   = riskConfig[entity.risk]   || riskConfig.low
  const status = statusConfig[entity.status] || statusConfig.unknown
  const typeStyle = typeColors[entity.type] || typeColors.Person
  const isHighRisk = entity.risk === 'high'

  const avatarText = entity.avatar ||
    (entity.name ? entity.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() : 'ID')

  if (compact) {
    return (
      <div
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          border: `1px solid ${isHighRisk ? risk.border : 'var(--border)'}`,
          background: isHighRisk ? risk.bg : 'var(--panel)',
          cursor: onClick ? 'pointer' : 'default',
          transition: 'all var(--transition)',
        }}
        onMouseEnter={(e) => {
          if (onClick) {
            e.currentTarget.style.borderColor = risk.accent
            e.currentTarget.style.background = 'var(--panel-light)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = isHighRisk ? risk.border : 'var(--border)'
          e.currentTarget.style.background = isHighRisk ? risk.bg : 'var(--panel)'
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${typeStyle.bg}, rgba(0,0,0,0.05))`,
          border: `1.5px solid ${typeStyle.color}66`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.72rem', fontWeight: 800, color: typeStyle.color,
        }}>
          {avatarText}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {entity.name}
            </span>
            <span className={`risk-dot ${risk.dot}`} />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>
            {entity.role || entity.type}
            {entity.location && ` · ${entity.location}`}
          </div>
        </div>
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link2 size={13} color="var(--muted)" />
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontFamily: 'monospace' }}>{entity.connections ?? 0}</span>
        </div>
      </div>
    )
  }

  /* Full Tactical Card */
  return (
    <div
      className="card anim-fade-up"
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 200ms ease',
        position: 'relative',
        overflow: 'hidden',
        background: isHighRisk ? '#FFFFFF' : 'var(--panel)',
        border: `1.5px solid ${isHighRisk ? '#FCA5A5' : 'var(--border)'}`,
        boxShadow: isHighRisk ? '0 4px 16px rgba(220, 38, 38, 0.08)' : 'var(--shadow-card)',
        borderRadius: 12,
        padding: '16px 18px',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = risk.accent
          e.currentTarget.style.boxShadow = isHighRisk
            ? '0 8px 24px rgba(220, 38, 38, 0.18)'
            : '0 8px 20px rgba(0, 0, 0, 0.08)'
          e.currentTarget.style.transform = 'translateY(-3px)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isHighRisk ? '#FCA5A5' : 'var(--border)'
        e.currentTarget.style.boxShadow = isHighRisk
          ? '0 4px 16px rgba(220, 38, 38, 0.08)'
          : 'var(--shadow-card)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Tactical Top Hazard Strip for High Risk */}
      {isHighRisk && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, #DC2626, #F87171, #DC2626)',
        }} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start' }}>
        {/* Avatar with pulsing tactical ring */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 10,
            background: isHighRisk ? 'linear-gradient(135deg, #FEE2E2, #FEF2F2)' : `linear-gradient(135deg, ${typeStyle.bg}, #FFFFFF)`,
            border: `2px solid ${isHighRisk ? '#DC2626' : typeStyle.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.88rem', fontWeight: 800,
            color: isHighRisk ? '#DC2626' : typeStyle.color,
            boxShadow: isHighRisk ? '0 0 10px rgba(220, 38, 38, 0.2)' : 'none'
          }}>
            {avatarText}
          </div>
          {isHighRisk && (
            <span style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 10, height: 10, borderRadius: '50%',
              background: '#DC2626', border: '2px solid #FFFFFF',
              boxShadow: '0 0 6px #DC2626'
            }} />
          )}
        </div>

        {/* Title & Badges */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-heading)' }} className="truncate">
              {entity.name}
            </h4>
            <ArrowUpRight size={14} color="var(--muted)" style={{ opacity: 0.6 }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.66rem', fontWeight: 800, padding: '2px 6px',
                borderRadius: 4,
                background: isHighRisk ? '#FEE2E2' : typeStyle.bg,
                color: isHighRisk ? '#DC2626' : typeStyle.color,
                border: `1px solid ${isHighRisk ? '#FCA5A5' : typeStyle.color + '44'}`,
                letterSpacing: '0.04em'
              }}
            >
              {entity.type?.toUpperCase()}
            </span>
            <span
              style={{
                fontSize: '0.66rem', fontWeight: 800, padding: '2px 6px',
                borderRadius: 4,
                background: isHighRisk ? '#DC2626' : (entity.risk === 'medium' ? '#D97706' : '#16A34A'),
                color: '#FFFFFF',
                letterSpacing: '0.04em',
                display: 'inline-flex', alignItems: 'center', gap: 3
              }}
            >
              {isHighRisk && <ShieldAlert size={10} />}
              {risk.label}
            </span>
          </div>
        </div>
      </div>

      {/* Role / Bio snippet */}
      <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 12, lineHeight: 1.4 }} className="truncate-2">
        {entity.role || entity.bio || 'Operative identified in active investigation dossier.'}
      </div>

      {/* Details grid pill box */}
      <div style={{
        background: isHighRisk ? '#FEF2F2' : '#F8FAFC',
        border: `1px solid ${isHighRisk ? '#FEE2E2' : '#E2E8F0'}`,
        borderRadius: 8,
        padding: '8px 10px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '6px 12px',
        marginBottom: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <MapPin size={12} color="var(--muted)" />
          <span style={{ fontSize: '0.74rem', color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entity.location || 'Known Region'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Link2 size={12} color="var(--muted)" />
          <span style={{ fontSize: '0.74rem', color: 'var(--text)', fontWeight: 600 }}>
            {entity.connections ?? 0} conduits
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Activity size={12} color={status.color} />
          <span style={{ fontSize: '0.74rem', color: status.color, fontWeight: 700 }}>
            {status.label}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Threat Index:</span>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: isHighRisk ? '#DC2626' : 'var(--text)', fontFamily: 'monospace' }}>
            {entity.riskScore || (isHighRisk ? '94/100' : '48/100')}
          </span>
        </div>
      </div>

      {/* Tags & Action row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {entity.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="tag" style={{ fontSize: '0.65rem', padding: '1px 6px', background: '#F1F5F9' }}>
              #{tag}
            </span>
          ))}
          {(!entity.tags || entity.tags.length === 0) && (
            <span style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>#FIR-EVIDENCE</span>
          )}
        </div>

        <span style={{
          fontSize: '0.68rem',
          fontWeight: 700,
          color: isHighRisk ? '#DC2626' : 'var(--primary)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 2
        }}>
          Dossier <ArrowUpRight size={11} />
        </span>
      </div>
    </div>
  )
}
