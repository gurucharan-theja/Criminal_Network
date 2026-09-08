/**
 * EntityCard — reusable entity profile/result card
 *
 * Props:
 *   entity {object}:
 *     id, name, type, role, risk ('high'|'medium'|'low'),
 *     connections {number}, location, tags [], avatar (initials),
 *     status ('active'|'arrested'|'deceased'|'unknown')
 *   onClick {fn}
 *   compact {boolean} — slim list-row variant
 */
import { User, MapPin, Link2, AlertTriangle } from 'lucide-react'

const riskConfig = {
  high:   { label: 'HIGH RISK',   badge: 'badge-danger',  dot: 'high',   accent: 'var(--danger)'  },
  medium: { label: 'MEDIUM RISK', badge: 'badge-warning', dot: 'medium', accent: 'var(--warning)' },
  low:    { label: 'LOW RISK',    badge: 'badge-success', dot: 'low',    accent: 'var(--success)' },
}

const statusConfig = {
  active:   { label: 'Active',   color: 'var(--danger)'  },
  arrested: { label: 'Arrested', color: 'var(--warning)' },
  deceased: { label: 'Deceased', color: 'var(--muted)'   },
  unknown:  { label: 'Unknown',  color: 'var(--muted-dark)' },
}

const typeColors = {
  Person:       { bg: 'rgba(59,130,246,0.12)',  color: 'var(--secondary)' },
  Organization: { bg: 'rgba(34,211,238,0.12)',  color: 'var(--primary)'   },
  Location:     { bg: 'rgba(34,197,94,0.12)',   color: 'var(--success)'   },
  Vehicle:      { bg: 'rgba(245,158,11,0.12)',  color: 'var(--warning)'   },
  Phone:        { bg: 'rgba(239,68,68,0.12)',   color: 'var(--danger)'    },
}

export default function EntityCard({ entity, onClick, compact = false }) {
  if (!entity) return null

  const risk   = riskConfig[entity.risk]   || riskConfig.low
  const status = statusConfig[entity.status] || statusConfig.unknown
  const typeStyle = typeColors[entity.type] || typeColors.Person

  const avatarText = entity.avatar ||
    (entity.name ? entity.name.split(' ').map(w => w[0]).slice(0, 2).join('') : '?')

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
          border: '1px solid var(--border)',
          background: 'var(--panel)',
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
          e.currentTarget.style.borderColor = 'var(--border)'
          e.currentTarget.style.background = 'var(--panel)'
        }}
      >
        {/* Avatar */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${typeStyle.bg}, rgba(0,0,0,0.2))`,
          border: `1.5px solid ${typeStyle.color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.72rem', fontWeight: 700, color: typeStyle.color,
        }}>
          {avatarText}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>{entity.connections ?? 0}</span>
        </div>
      </div>
    )
  }

  /* Full card */
  return (
    <div
      className="card anim-fade-up"
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color var(--transition), box-shadow var(--transition), transform var(--transition)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = risk.accent
          e.currentTarget.style.boxShadow = `0 0 20px ${risk.accent}22`
          e.currentTarget.style.transform = 'translateY(-2px)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.boxShadow = 'var(--shadow-card)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Glow streak for high-risk */}
      {entity.risk === 'high' && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent, var(--danger), transparent)',
          opacity: 0.7,
        }} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'flex-start' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${typeStyle.color}33, ${typeStyle.color}11)`,
          border: `2px solid ${typeStyle.color}55`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.9rem', fontWeight: 700, color: typeStyle.color,
        }}>
          {avatarText}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h4 style={{ margin: 0 }} className="truncate">{entity.name}</h4>
            <span className={`badge ${risk.badge}`}>
              {entity.risk === 'high' && <AlertTriangle size={9} />}
              {risk.label}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span
              style={{
                fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px',
                borderRadius: 99, background: typeStyle.bg, color: typeStyle.color,
              }}
            >
              {entity.type}
            </span>
            {entity.role && (
              <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{entity.role}</span>
            )}
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', marginBottom: 16 }}>
        {entity.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={13} color="var(--muted)" />
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {entity.location}
            </span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link2 size={13} color="var(--muted)" />
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
            {entity.connections ?? 0} connections
          </span>
        </div>
        {entity.status && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="risk-dot" style={{ background: status.color, boxShadow: `0 0 5px ${status.color}` }} />
            <span style={{ fontSize: '0.8rem', color: status.color, fontWeight: 500 }}>
              {status.label}
            </span>
          </div>
        )}
      </div>

      {/* Tags & Confidence metadata */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {entity.tags?.map((tag) => (
            <span key={tag} className="tag" style={{ fontSize: '0.68rem' }}>{tag}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
            {entity.confidence ? `${Math.round(entity.confidence * 100)}% NLP CONF` : '92% NLP CONF'}
          </span>
        </div>
      </div>
    </div>
  )
}

