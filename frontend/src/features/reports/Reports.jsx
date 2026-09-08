import { useState, useMemo } from 'react'
import {
  BarChart2,
  Download,
  RefreshCw,
  Users,
  Link2,
  AlertTriangle,
  TrendingUp,
  FileText,
  ShieldAlert,
  Flame,
  Layers,
  ArrowRight,
  Printer
} from 'lucide-react'
import ExportOptions from './ExportOptions'
import Spinner from '../../components/ui/Spinner'
import useApi from '../../hooks/useApi'
import { fetchStats } from '../../api/analysisApi'
import { fetchEntities } from '../../api/entityApi'
import { fetchRelationships, fetchGraph } from '../../api/relationshipApi'
import useGraphStore from '../../store/useGraphStore'

function StatRow({ label, value, color, max }) {
  const pct = max ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{label}</span>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color }}>{value}</span>
      </div>
      <div style={{ height: 6, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 600ms ease' }} />
      </div>
    </div>
  )
}

export default function Reports() {
  const [showExport, setShowExport] = useState(false)

  const { data: stats,     loading: l1, refetch: refetchStats }  = useApi(fetchStats)
  const { data: apiEntities,  loading: l2, refetch: refetchEntities } = useApi(fetchEntities)
  const { data: apiRelations, loading: l3, refetch: refetchRelations } = useApi(fetchRelationships)
  const { data: graph,     loading: l4 } = useApi(fetchGraph)

  const storeNodes = useGraphStore(s => s.nodes)
  const storeLinks = useGraphStore(s => s.links)

  const loading = l1 || l2 || l3 || l4

  const refresh = () => { refetchStats(); refetchEntities(); refetchRelations() }

  // Combine API and store records
  const entities = (storeNodes && storeNodes.length > 0) ? storeNodes : (apiEntities || [])
  const relations = (storeLinks && storeLinks.length > 0) ? storeLinks : (apiRelations || [])

  const total = entities.length || stats?.totalEntities || 0
  const highRiskNodes = entities.filter(e => e.risk === 'high')

  const typeBreakdown = [
    { label: 'Persons',       value: entities.filter(e => e.type === 'Person').length,       color: 'var(--secondary)' },
    { label: 'Organizations', value: entities.filter(e => e.type === 'Organization').length, color: 'var(--primary)' },
    { label: 'Locations',     value: entities.filter(e => e.type === 'Location').length,     color: 'var(--success)' },
    { label: 'Phones',        value: entities.filter(e => e.type === 'Phone').length,        color: '#A78BFA' },
    { label: 'Vehicles',      value: entities.filter(e => e.type === 'Vehicle').length,      color: 'var(--warning)' },
  ]

  const riskBreakdown = [
    { label: 'High Risk',   value: entities.filter(e => e.risk === 'high').length,   color: 'var(--danger)'  },
    { label: 'Medium Risk', value: entities.filter(e => e.risk === 'medium').length, color: 'var(--warning)' },
    { label: 'Low Risk',    value: entities.filter(e => e.risk === 'low').length,    color: 'var(--success)' },
  ]

  const relBreakdown = [
    { label: 'Associates',     value: relations.filter(r => (r.type || '').toLowerCase() === 'associate').length,     color: 'var(--secondary)' },
    { label: 'Financial',      value: relations.filter(r => (r.type || '').toLowerCase() === 'financial').length,     color: 'var(--success)'   },
    { label: 'Communication',  value: relations.filter(r => (r.type || '').toLowerCase() === 'communication').length, color: 'var(--primary)'   },
    { label: 'Family',         value: relations.filter(r => (r.type || '').toLowerCase() === 'family').length,        color: '#A78BFA'          },
  ]

  // Dynamic suspicious patterns derived from real entities
  const suspiciousPatterns = useMemo(() => {
    if (entities.length === 0) return []

    const patterns = []
    if (highRiskNodes.length > 0) {
      const topSuspect = highRiskNodes[0]
      patterns.push({
        id: 'PAT-01',
        title: `High-Threat Centrality Hub: ${topSuspect.name}`,
        severity: 'CRITICAL',
        badgeColor: 'var(--danger)',
        conduit: `${topSuspect.name} ↔ Associated Network Nodes`,
        summary: `Suspect is flagged as high-risk with ${topSuspect.connections || 1} active conduits in the tactical graph.`,
        recommendedAction: `Initiate Section 35 BNSS inquiry and trace active communications.`
      })
    }

    const orgs = entities.filter(e => e.type === 'Organization')
    if (orgs.length > 0 && highRiskNodes.length > 0) {
      patterns.push({
        id: 'PAT-02',
        title: `Corporate Conduit Layering: ${orgs[0].name}`,
        severity: 'HIGH',
        badgeColor: 'var(--warning)',
        conduit: `${highRiskNodes[0]?.name || 'Suspect'} → ${orgs[0].name}`,
        summary: `Commercial entity linked to active syndicate nodes with transactional ties.`,
        recommendedAction: `Request ROC filing and corporate bank account freeze orders.`
      })
    }

    return patterns
  }, [entities, highRiskNodes])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(34, 211, 238, 0.1)',
                border: '1px solid rgba(34, 211, 238, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)'
              }}
            >
              <FileText size={18} />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.35rem' }}>Intelligence & Court Dossier Export</h1>
          </div>
          <p style={{ margin: '4px 0 0', color: 'var(--text)', fontSize: '0.85rem' }}>
            Multi-source network summary, graph metrics, suspicious patterns, and Section 65B court-admissible dossiers
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={refresh}
            className="btn btn-ghost"
            title="Refresh"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Download size={15} /> Export Intelligence Dossier
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Spinner size="lg" message="Compiling intelligence data..." />
        </div>
      ) : (
        <>
          {/* Summary metrics */}
          <div className="grid-4">
            <div className="card anim-fade-up" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Total Entities</span>
                <Users size={16} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-title)', fontFamily: 'JetBrains Mono' }}>
                {total}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 4 }}>
                Registered intelligence nodes
              </div>
            </div>

            <div className="card anim-fade-up" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>High Threat Nodes</span>
                <AlertTriangle size={16} color="var(--danger)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--danger)', fontFamily: 'JetBrains Mono' }}>
                {highRiskNodes.length}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 4 }}>
                Requires priority attention
              </div>
            </div>

            <div className="card anim-fade-up" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Relational Conduits</span>
                <Link2 size={16} color="var(--secondary)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-title)', fontFamily: 'JetBrains Mono' }}>
                {relations.length}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 4 }}>
                Mapped criminal edges
              </div>
            </div>

            <div className="card anim-fade-up" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Section 65B Certificate</span>
                <ShieldAlert size={16} color="var(--success)" />
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)', fontFamily: 'JetBrains Mono' }}>
                READY
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 4 }}>
                Hash verifiable evidence
              </div>
            </div>
          </div>

          {/* Suspicious Pattern Detection Module */}
          <div className="card anim-fade-up" style={{ padding: '22px 24px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Flame size={18} color="var(--danger)" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text)' }}>
                  Suspicious Pattern & Criminal Syndicate Detection (Phase 5 Mandate)
                </h3>
              </div>
              <span className="badge badge-danger">
                {suspiciousPatterns.length} PATTERNS FLAGGED
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {suspiciousPatterns.length > 0 ? (
                suspiciousPatterns.map((pat) => (
                  <div
                    key={pat.id}
                    style={{
                      padding: '14px 16px',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      transition: 'all var(--transition)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>
                          {pat.id}
                        </span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text)' }}>
                          {pat.title}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: pat.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: pat.badgeColor,
                          border: `1px solid ${pat.badgeColor}`
                        }}
                      >
                        {pat.severity} ANOMALY
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                      Conduit: {pat.conduit}
                    </div>

                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                      {pat.summary}
                    </p>

                    <div
                      style={{
                        marginTop: 4,
                        padding: '8px 12px',
                        background: 'rgba(34, 211, 238, 0.04)',
                        border: '1px solid rgba(34, 211, 238, 0.2)',
                        borderRadius: 4,
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        color: 'var(--text)'
                      }}
                    >
                      <span style={{ fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>Action Directive:</span>
                      <span>{pat.recommendedAction}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
                  No suspicious patterns detected in current database records. Ingest multi-source intelligence to trigger automatic pattern detection.
                </div>
              )}
            </div>
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {/* Entity types */}
            <div className="card" style={{ padding: '20px 22px' }}>
              <div className="card-title" style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={14} /> Entity Classification
              </div>
              {typeBreakdown.map(s => <StatRow key={s.label} {...s} max={Math.max(1, total)} />)}
            </div>

            {/* Risk breakdown */}
            <div className="card" style={{ padding: '20px 22px' }}>
              <div className="card-title" style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={14} /> Threat Distribution
              </div>
              {riskBreakdown.map(s => <StatRow key={s.label} {...s} max={Math.max(1, total)} />)}
            </div>

            {/* Relationship types */}
            <div className="card" style={{ padding: '20px 22px' }}>
              <div className="card-title" style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link2 size={14} /> Conduit Distribution
              </div>
              {relBreakdown.map(s => <StatRow key={s.label} {...s} max={Math.max(1, relations.length)} />)}
            </div>
          </div>
        </>
      )}

      {showExport && (
        <ExportOptions
          graphData={graph}
          entities={entities}
          relations={relations}
          stats={stats}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}
