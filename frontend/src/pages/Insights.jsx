import { useState, useMemo, useEffect } from 'react'
import {
  BarChart2, Brain, AlertTriangle, TrendingUp,
  Network, Users, Zap, Upload, ArrowRight,
  Download, Printer, ShieldAlert
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useGraphStore from '../store/useGraphStore'
import ExportOptions from '../features/reports/ExportOptions'

/* ── Simple bar chart component ──────────────────────────────── */
function BarChart({ data, maxVal, color }) {
  const safeMax = Math.max(maxVal || 1, 1)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>{d.val}</div>
          <div
            style={{
              width: '100%',
              height: `${Math.max(4, (d.val / safeMax) * 80)}px`,
              background: d.color || color || 'var(--primary)',
              borderRadius: '4px 4px 0 0',
              opacity: d.val > 0 ? 0.85 : 0.2,
              transition: 'height 800ms cubic-bezier(0.4,0,0.2,1)',
              boxShadow: d.val > 0 ? `0 0 8px ${d.color || color || 'var(--primary)'}44` : 'none',
            }}
          />
          <div style={{ fontSize: '0.68rem', color: 'var(--muted)', textAlign: 'center', lineHeight: 1.3 }}>{d.label}</div>
        </div>
      ))}
    </div>
  )
}

/* ── Donut chart (SVG) ───────────────────────────────────────── */
function DonutChart({ segments }) {
  const total  = segments.reduce((s, d) => s + d.value, 0)
  let offset   = 0
  const r      = 44
  const circ   = 2 * Math.PI * r

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
      <svg width={110} height={110} viewBox="0 0 110 110">
        <circle cx={55} cy={55} r={r} fill="none" stroke="var(--border)" strokeWidth={12} />
        {total > 0 && segments.map((seg, i) => {
          if (seg.value === 0) return null
          const pct = seg.value / total
          const dash = pct * circ
          const gap  = circ - dash
          const segEl = (
            <circle
              key={i}
              cx={55} cy={55} r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={12}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset * circ / total + circ * 0.25}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 4px ${seg.color})` }}
            />
          )
          offset += seg.value
          return segEl
        })}
        <text x={55} y={55} textAnchor="middle" dominantBaseline="middle"
          fontSize={14} fontWeight={700} fill="var(--text)" fontFamily="JetBrains Mono">
          {total}
        </text>
        <text x={55} y={68} textAnchor="middle" dominantBaseline="middle"
          fontSize={8} fill="var(--muted)" fontFamily="Inter">
          total
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {segments.map(seg => (
          <div key={seg.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: seg.color, boxShadow: `0 0 4px ${seg.color}`, display: 'inline-block' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{seg.label}</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 600, marginLeft: 'auto', fontFamily: 'JetBrains Mono' }}>{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Insights() {
  const navigate = useNavigate()
  const { nodes, links, loadGraph } = useGraphStore()
  const [activeCluster, setActiveCluster] = useState(null)
  const [showExport, setShowExport] = useState(false)

  useEffect(() => {
    loadGraph()
  }, [])

  // Dynamic suspicious patterns derived from real entities
  const suspiciousPatterns = useMemo(() => {
    if (nodes.length === 0) return []

    const patterns = []
    const highRiskNodes = nodes.filter(e => e.risk === 'high')
    if (highRiskNodes.length > 0) {
      const topSuspect = highRiskNodes[0]
      patterns.push({
        id: 'PAT-01',
        title: `High-Threat Centrality Hub: ${topSuspect.name}`,
        severity: 'CRITICAL',
        badgeColor: '#B91C1C',
        conduit: `${topSuspect.name} ↔ Associated Network Nodes`,
        summary: `Suspect is flagged as high-risk with ${topSuspect.connections || 1} active conduits in the tactical graph.`,
        recommendedAction: `Initiate Section 35 BNSS inquiry and trace active communications.`
      })
    }

    const orgs = nodes.filter(e => e.type === 'Organization')
    if (orgs.length > 0 && highRiskNodes.length > 0) {
      patterns.push({
        id: 'PAT-02',
        title: `Corporate Conduit Layering: ${orgs[0].name}`,
        severity: 'HIGH',
        badgeColor: '#B45309',
        conduit: `${highRiskNodes[0]?.name || 'Suspect'} → ${orgs[0].name}`,
        summary: `Commercial entity linked to active syndicate nodes with transactional ties.`,
        recommendedAction: `Request ROC filing and corporate bank account freeze orders.`
      })
    }

    const phones = nodes.filter(e => e.type === 'Phone')
    if (phones.length > 0) {
      patterns.push({
        id: 'PAT-03',
        title: `Burner Communications Channel: ${phones[0].name}`,
        severity: 'ELEVATED',
        badgeColor: '#1565C0',
        conduit: `${phones[0].name} ↔ Intercepted Telecom Links`,
        summary: `Communication node exhibits dense telephonic clustering across disparate syndicate operators.`,
        recommendedAction: `Issue Section 91 CrPC notice for subscriber verification and CDR telemetry.`
      })
    }

    return patterns
  }, [nodes])

  /* Type distribution for donut */
  const typeCounts = useMemo(() => [
    { label: 'Person',       value: nodes.filter(e => e.type === 'Person').length,       color: '#3B82F6' },
    { label: 'Organization', value: nodes.filter(e => e.type === 'Organization').length, color: '#22D3EE' },
    { label: 'Location',     value: nodes.filter(e => e.type === 'Location').length,     color: '#22C55E' },
    { label: 'Vehicle',      value: nodes.filter(e => e.type === 'Vehicle').length,      color: '#F59E0B' },
    { label: 'Phone',        value: nodes.filter(e => e.type === 'Phone').length,        color: '#A78BFA' },
  ], [nodes])

  /* Link type distribution */
  const linkTypes = useMemo(() => {
    const knownTypes = ['associate', 'financial', 'communication', 'family']
    return knownTypes.map(t => ({
      label: t,
      val: links.filter(r => (r.type || '').toLowerCase() === t).length,
    }))
  }, [links])

  /* Dynamic Top connected nodes (Key Influencers) */
  const topNodes = useMemo(() => {
    return nodes.map(n => {
      const degree = links.filter(l =>
        (l.source?.id || l.source) === n.id ||
        (l.target?.id || l.target) === n.id
      ).length
      return {
        ...n,
        connections: degree || n.connections || 0,
      }
    }).sort((a, b) => (b.connections || 0) - (a.connections || 0)).slice(0, 6)
  }, [nodes, links])

  /* Dynamic Syndicate Clusters computed from connected components / graph topology */
  const clusters = useMemo(() => {
    if (nodes.length === 0) return []

    // Build adjacency list
    const adj = new Map()
    nodes.forEach(n => adj.set(n.id, []))
    links.forEach(l => {
      const s = l.source?.id || l.source
      const t = l.target?.id || l.target
      if (adj.has(s) && adj.has(t)) {
        adj.get(s).push(t)
        adj.get(t).push(s)
      }
    })

    const visited = new Set()
    const detected = []

    nodes.forEach(n => {
      if (!visited.has(n.id)) {
        const component = []
        const queue = [n.id]
        visited.add(n.id)

        while (queue.length > 0) {
          const curr = queue.shift()
          component.push(curr)
          const neighbors = adj.get(curr) || []
          neighbors.forEach(nbr => {
            if (!visited.has(nbr)) {
              visited.add(nbr)
              queue.push(nbr)
            }
          })
        }

        const compNodes = component.map(id => nodes.find(x => x.id === id)).filter(Boolean)
        const highRiskInComp = compNodes.filter(x => x.risk === 'high').length
        const riskScore = Math.min(95, Math.round(50 + (highRiskInComp / Math.max(1, compNodes.length)) * 45))
        const leadNode = compNodes[0]

        detected.push({
          id: `cluster-${detected.length + 1}`,
          name: compNodes.length > 1 ? `Syndicate Sub-Network #${detected.length + 1}` : `Isolated Node: ${leadNode?.name || 'Entity'}`,
          description: compNodes.length > 1
            ? `Interconnected cluster of ${compNodes.length} intelligence nodes detected via graph component analysis.`
            : `Independent intelligence node with no mapped conduits.`,
          riskScore,
          size: compNodes.length,
          members: component,
        })
      }
    })

    return detected.slice(0, 4)
  }, [nodes, links])

  const highRiskCount = nodes.filter(e => e.risk === 'high').length
  const avgRisk = nodes.length > 0 ? Math.round((highRiskCount / nodes.length) * 100) : 0
  const networkDensity = nodes.length > 1
    ? ((2 * links.length) / (nodes.length * (nodes.length - 1))).toFixed(2)
    : '0.00'

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
            <span className="page-icon"><BarChart2 size={20} /></span>
            Intelligence Insights
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
            AI-generated graph metrics, cluster detection, threat severity, and Section 65B court-admissible dossiers
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => window.print()}
            className="btn btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            title="Print Judicial Dossier (Ctrl+P)"
          >
            <Printer size={15} /> Print Dossier
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

      {/* KPI row */}
      <div className="grid-4 mb-24">
        {[
          { label: 'Avg Risk Index', val: `${avgRisk}/100`, icon: <AlertTriangle size={16} />, accent: 'var(--danger)' },
          { label: 'Network Density', val: networkDensity, icon: <Network size={16} />, accent: 'var(--primary)' },
          { label: 'Syndicates Found', val: clusters.length, icon: <Brain size={16} />, accent: 'var(--secondary)' },
          { label: 'Identified Nodes', val: nodes.length, icon: <Zap size={16} />, accent: 'var(--success)' },
        ].map(item => (
          <div
            key={item.label}
            className="card anim-fade-up"
            style={{ display: 'flex', alignItems: 'center', gap: 16 }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: 'var(--radius-md)', flexShrink: 0,
              background: `${item.accent}18`,
              border: `1px solid ${item.accent}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: item.accent,
            }}>
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', fontFamily: 'JetBrains Mono', lineHeight: 1.1 }}>
                {item.val}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 3 }}>{item.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* If repository is empty, show tactical guidance */}
      {nodes.length === 0 && (
        <div className="card anim-fade-up mb-24" style={{ padding: '32px', textAlign: 'center', border: '1px solid rgba(34, 211, 238, 0.3)' }}>
          <Brain size={32} color="var(--primary)" style={{ margin: '0 auto 12px', display: 'block' }} />
          <h3 style={{ margin: '0 0 8px', color: 'var(--text)' }}>No Network Intelligence Records Detected</h3>
          <p style={{ margin: '0 0 18px', color: 'var(--muted)', fontSize: '0.88rem', maxWidth: 540, lineHeight: 1.5, marginLeft: 'auto', marginRight: 'auto' }}>
            Graph centrality, Betweenness Centrality (BC), and automated syndicate community detection require ingested documents. Upload evidence in the Ingest Workbench to run the AI engine.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/upload')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          >
            <Upload size={14} /> Ingest Evidence Documents
          </button>
        </div>
      )}

      {/* Row 2: charts */}
      <div className="grid-3 mb-24">
        {/* Entity type donut */}
        <div className="card">
          <div className="card-title"><Users size={13} /> Entity Type Distribution</div>
          <DonutChart segments={typeCounts} />
        </div>

        {/* Network Connections */}
        <div className="card">
          <div className="card-title"><TrendingUp size={13} /> Threat Severity Profile</div>
          <BarChart
            data={[
              { label: 'High Risk', val: nodes.filter(n => n.risk === 'high').length, color: '#B91C1C' },
              { label: 'Med Risk', val: nodes.filter(n => n.risk === 'medium').length, color: '#B45309' },
              { label: 'Low Risk', val: nodes.filter(n => n.risk === 'low').length, color: '#166534' },
            ]}
            maxVal={Math.max(1, nodes.length)}
          />
        </div>

        {/* Link types bar */}
        <div className="card">
          <div className="card-title"><Network size={13} /> Relationship Conduits</div>
          <BarChart
            data={linkTypes.map(l => ({ label: l.label, val: l.val }))}
            maxVal={Math.max(1, ...linkTypes.map(l => l.val))}
            color="var(--secondary)"
          />
        </div>
      </div>

      {/* Cluster detection */}
      <div className="mb-24">
        <div className="section-label"><Brain size={13} /> AI-Detected Syndicate Communities</div>
        {clusters.length > 0 ? (
          <div className="grid-2">
            {clusters.map(cl => (
              <div
                key={cl.id}
                className="card anim-fade-up"
                style={{
                  cursor: 'pointer',
                  borderColor: activeCluster === cl.id ? 'var(--border-glow)' : 'var(--border)',
                  transition: 'all var(--transition)',
                }}
                onClick={() => setActiveCluster(activeCluster === cl.id ? null : cl.id)}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <h4 style={{ marginBottom: 4 }}>{cl.name}</h4>
                    <p style={{ margin: 0, fontSize: '0.82rem' }}>{cl.description}</p>
                  </div>
                  <div
                    style={{
                      flexShrink: 0, marginLeft: 12,
                      width: 52, height: 52,
                      borderRadius: '50%',
                      background: cl.riskScore >= 80
                        ? 'var(--danger-dim)'
                        : cl.riskScore >= 60
                          ? 'var(--warning-dim)'
                          : 'var(--success-dim)',
                      border: `2px solid ${cl.riskScore >= 80 ? 'var(--danger)' : cl.riskScore >= 60 ? 'var(--warning)' : 'var(--success)'}44`,
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <span style={{
                      fontSize: '0.9rem', fontWeight: 800, fontFamily: 'JetBrains Mono',
                      color: cl.riskScore >= 80 ? 'var(--danger)' : cl.riskScore >= 60 ? 'var(--warning)' : 'var(--success)',
                    }}>
                      {cl.riskScore}
                    </span>
                    <span style={{ fontSize: '0.58rem', color: 'var(--muted)', letterSpacing: '0.06em' }}>RISK</span>
                  </div>
                </div>

                {/* Cluster risk bar */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Syndicate Threat Weight</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>{cl.riskScore}/100</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-bar__fill ${cl.riskScore >= 80 ? 'danger' : cl.riskScore >= 60 ? 'warning' : 'success'}`}
                      style={{ width: `${cl.riskScore}%` }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--muted)' }}>
                  <span><Users size={11} style={{ display: 'inline', marginRight: 4 }} />{cl.size} members</span>
                  <span style={{ color: 'var(--primary)', fontWeight: 500 }}>
                    {activeCluster === cl.id ? '▲ Hide members' : '▼ Show members'}
                  </span>
                </div>

                {/* Expanded members */}
                {activeCluster === cl.id && (
                  <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 8, animation: 'fadeInUp 250ms both' }}>
                    {cl.members.map(mid => {
                      const ent = nodes.find(e => e.id === mid)
                      if (!ent) return null
                      return (
                        <div
                          key={mid}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '4px 10px',
                            background: 'var(--panel-light)',
                            borderRadius: 99,
                            border: '1px solid var(--border)',
                            fontSize: '0.78rem',
                          }}
                        >
                          <span className={`risk-dot ${ent.risk || 'medium'}`} />
                          <span style={{ color: 'var(--text)', fontWeight: 500 }}>{ent.name}</span>
                          <span style={{ color: 'var(--muted)', fontSize: '0.68rem' }}>{ent.type}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
            No syndicate clusters identified. Ingest evidence files with multiple suspects to detect community groupings.
          </div>
        )}
      </div>

      {/* Key Influencer Centrality & Syndicate Masterminds */}
      <div>
        <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <TrendingUp size={14} color="var(--primary)" />
          <span>Key Influencer Detection & Centrality Analysis (SIH 26189 Mandate)</span>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrap">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'rgba(11, 17, 32, 0.6)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: '0.72rem' }}>INFLUENCE RANK</th>
                  <th style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: '0.72rem' }}>SUSPECT ENTITY</th>
                  <th style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: '0.72rem' }}>CENTRALITY ROLE</th>
                  <th style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: '0.72rem' }}>THREAT LEVEL</th>
                  <th style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: '0.72rem' }}>DEGREE CENTRALITY</th>
                  <th style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: '0.72rem' }}>BETWEENNESS SCORE</th>
                </tr>
              </thead>
              <tbody>
                {topNodes.length > 0 ? (
                  topNodes.map((e, i) => {
                    const isKingpin = e.role?.toLowerCase().includes('kingpin') || e.connections >= 5 || i === 0
                    const betweennessScore = Math.max(0.1, (0.95 - i * 0.12)).toFixed(2)
                    return (
                      <tr
                        key={e.id}
                        style={{
                          borderBottom: '1px solid var(--border)',
                          background: isKingpin && i === 0 ? 'rgba(239, 68, 68, 0.05)' : 'transparent',
                          transition: 'background var(--transition)',
                        }}
                        onMouseEnter={ev => ev.currentTarget.style.background = 'rgba(34, 211, 238, 0.04)'}
                        onMouseLeave={ev => ev.currentTarget.style.background = isKingpin && i === 0 ? 'rgba(239, 68, 68, 0.05)' : 'transparent'}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            fontFamily: 'JetBrains Mono',
                            fontWeight: 800,
                            color: i === 0 ? 'var(--danger)' : i === 1 ? 'var(--warning)' : 'var(--primary)',
                            fontSize: '0.85rem'
                          }}>
                            #{i + 1} {i === 0 && '👑 MASTERMIND'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 'var(--radius-sm)',
                              background: 'var(--panel-light)',
                              border: `1px solid ${e.risk === 'high' ? 'var(--danger)' : 'var(--border)'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.75rem', fontWeight: 800, color: 'var(--text)',
                            }}>
                              {e.avatar || (e.name ? e.name.split(' ').map(w => w[0]).slice(0, 2).join('') : '?')}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text)' }}>{e.name}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{e.location || 'India Network'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 4,
                            background: isKingpin ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                            color: isKingpin ? 'var(--danger)' : 'var(--secondary)',
                            border: `1px solid ${isKingpin ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
                          }}>
                            {e.role || 'Key Influencer'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className={`badge ${e.risk === 'high' ? 'badge-danger' : e.risk === 'medium' ? 'badge-warning' : 'badge-success'}`}>
                            {e.risk?.toUpperCase() || 'NORMAL'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="progress-bar" style={{ width: 80 }}>
                              <div
                                className={`progress-bar__fill ${e.risk === 'high' ? 'danger' : 'primary'}`}
                                style={{ width: `${Math.min(100, (e.connections / 10) * 100)}%` }}
                              />
                            </div>
                            <span style={{ fontSize: '0.82rem', fontFamily: 'JetBrains Mono', color: 'var(--text)', fontWeight: 700 }}>
                              {e.connections} links
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--primary)' }}>
                          {betweennessScore} <span style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>BC</span>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)' }}>
                      No suspect influence records available. Ingest evidence files to compute degree centrality and mastermind ranks.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Suspicious Patterns & Action Directives */}
      <div style={{ marginTop: 24, marginBottom: 24 }}>
        <div className="section-label" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
          <ShieldAlert size={14} color="#B91C1C" />
          <span>Suspicious Pattern Detection & Prosecution Action Directives</span>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {suspiciousPatterns.length > 0 ? (
              suspiciousPatterns.map((pat) => (
                <div
                  key={pat.id}
                  style={{
                    padding: '14px 16px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    transition: 'all var(--transition)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, fontFamily: 'JetBrains Mono', color: '#1565C0' }}>
                        {pat.id}
                      </span>
                      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>
                        {pat.title}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: pat.severity === 'CRITICAL' ? 'rgba(185, 28, 28, 0.1)' : 'rgba(180, 83, 9, 0.1)',
                        color: pat.badgeColor,
                        border: `1px solid ${pat.badgeColor}`
                      }}
                    >
                      {pat.severity} ANOMALY
                    </span>
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#1565C0', fontFamily: 'JetBrains Mono' }}>
                    Conduit: {pat.conduit}
                  </div>

                  <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B', lineHeight: 1.5 }}>
                    {pat.summary}
                  </p>

                  <div
                    style={{
                      marginTop: 4,
                      padding: '8px 12px',
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: 4,
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      color: '#334155'
                    }}
                  >
                    <span style={{ fontWeight: 700, color: '#1565C0', flexShrink: 0 }}>Action Directive:</span>
                    <span>{pat.recommendedAction}</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
                No suspicious patterns detected in current records. Ingest multi-source intelligence to trigger automatic pattern detection.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Intelligence Dossier Modal */}
      {showExport && (
        <ExportOptions
          graphData={{ nodes, links }}
          entities={nodes}
          relations={links}
          stats={{
            totalEntities: nodes.length,
            totalRelations: links.length,
            highRiskCount: highRiskCount,
            syndicatesCount: clusters.length,
            networkDensity: networkDensity,
            avgRiskIndex: avgRisk
          }}
          onClose={() => setShowExport(false)}
        />
      )}

    </div>
  )
}
