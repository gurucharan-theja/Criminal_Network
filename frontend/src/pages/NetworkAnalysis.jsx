import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Network, Filter, RefreshCw,
  AlertTriangle, Users, Link2, Sliders, Upload,
} from 'lucide-react'

import NetworkGraph from '../graph/NetworkGraph'
import useGraphStore from '../store/useGraphStore'

const RISK_FILTERS   = ['all', 'high', 'medium', 'low']
const TYPE_FILTERS   = ['all', 'Person', 'Organization', 'Location', 'Vehicle', 'Phone']
const LINK_FILTERS   = ['all', 'associate', 'financial', 'communication', 'family']

export default function NetworkAnalysis() {
  const navigate = useNavigate()
  const [riskFilter, setRiskFilter]   = useState('all')
  const [typeFilter, setTypeFilter]   = useState('all')
  const [linkFilter, setLinkFilter]   = useState('all')
  const [selectedNode, setSelectedNode] = useState(null)
  const [hoveredNode, setHoveredNode]   = useState(null)
  const [showFilters, setShowFilters]   = useState(true)

  // Real graph data from Zustand Store & Backend
  const { nodes: realNodes, links: realLinks, loadGraph, loading } = useGraphStore()

  useEffect(() => {
    loadGraph()
  }, [])

  /* Filtered graph data */
  const filtered = useMemo(() => {
    let nodes = realNodes || []
    let links = realLinks || []

    if (riskFilter !== 'all') nodes = nodes.filter(n => n.risk === riskFilter)
    if (typeFilter !== 'all') nodes = nodes.filter(n => n.type === typeFilter)

    const nodeIds = new Set(nodes.map(n => n.id))
    links = links.filter(l => {
      const s = typeof l.source === 'object' ? l.source.id : l.source
      const t = typeof l.target === 'object' ? l.target.id : l.target
      return nodeIds.has(s) && nodeIds.has(t)
    })
    if (linkFilter !== 'all') links = links.filter(l => l.type === linkFilter)

    return { nodes, links }
  }, [realNodes, realLinks, riskFilter, typeFilter, linkFilter])

  const selectedEntity = selectedNode ? realNodes.find(n => n.id === selectedNode.id) : null


  /* Stats from filtered data */
  const highCount   = filtered.nodes.filter(n => n.risk === 'high').length
  const medCount    = filtered.nodes.filter(n => n.risk === 'medium').length
  const lowCount    = filtered.nodes.filter(n => n.risk === 'low').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--nav-h) - 56px)' }}>
      {/* Page header */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h1>
          <span className="page-icon"><Network size={20} /></span>
          Network Analysis
        </h1>
        <p>Interactive criminal network graph. Click nodes to inspect. Drag to rearrange.</p>
      </div>

      {/* Toolbar */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 16, flexWrap: 'wrap',
        }}
      >
        {/* Node count badges */}
        <div style={{ display: 'flex', gap: 8, marginRight: 8 }}>
          <span className="badge badge-muted"><Users size={11} />{filtered.nodes.length} nodes</span>
          <span className="badge badge-muted"><Link2 size={11} />{filtered.links.length} edges</span>
          <span className="badge badge-danger"><AlertTriangle size={11} />{highCount} high-risk</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Filter toggles */}
        <button
          className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setShowFilters(v => !v)}
        >
          <Sliders size={14} /> Filters
        </button>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => { setRiskFilter('all'); setTypeFilter('all'); setLinkFilter('all') }}
        >
          <RefreshCw size={14} /> Reset
        </button>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div
          className="card anim-fade-up"
          style={{ padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Filter size={13} color="var(--muted)" />
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600, marginRight: 4 }}>RISK</span>
            {RISK_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setRiskFilter(f)}
                style={{
                  padding: '4px 12px', borderRadius: 99, fontSize: '0.78rem',
                  fontWeight: 600, border: '1px solid',
                  cursor: 'pointer', transition: 'all var(--transition)',
                  background: riskFilter === f
                    ? (f === 'high' ? 'var(--danger)' : f === 'medium' ? 'var(--warning)' : f === 'low' ? 'var(--success)' : 'var(--primary)')
                    : 'transparent',
                  borderColor: riskFilter === f
                    ? 'transparent'
                    : 'var(--border)',
                  color: riskFilter === f ? '#0B1120' : 'var(--muted)',
                  textTransform: 'capitalize',
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600, marginRight: 4 }}>TYPE</span>
            {TYPE_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                style={{
                  padding: '4px 12px', borderRadius: 99, fontSize: '0.78rem',
                  fontWeight: 600, border: '1px solid',
                  cursor: 'pointer', transition: 'all var(--transition)',
                  background: typeFilter === f ? 'var(--primary-dim)' : 'transparent',
                  borderColor: typeFilter === f ? 'var(--border-glow)' : 'var(--border)',
                  color: typeFilter === f ? 'var(--primary)' : 'var(--muted)',
                  textTransform: 'capitalize',
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 600, marginRight: 4 }}>LINKS</span>
            {LINK_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setLinkFilter(f)}
                style={{
                  padding: '4px 12px', borderRadius: 99, fontSize: '0.78rem',
                  fontWeight: 600, border: '1px solid',
                  cursor: 'pointer', transition: 'all var(--transition)',
                  background: linkFilter === f ? 'var(--secondary-dim)' : 'transparent',
                  borderColor: linkFilter === f ? 'rgba(59,130,246,0.35)' : 'var(--border)',
                  color: linkFilter === f ? 'var(--secondary)' : 'var(--muted)',
                  textTransform: 'capitalize',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: selectedNode ? '1fr 310px' : '1fr', gap: 20, minHeight: 0 }}>
        {/* Graph */}
        <div
          className="card"
          style={{ padding: 0, overflow: 'hidden', position: 'relative' }}
        >
          {filtered.nodes.length === 0 && (
            <div
              style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                zIndex: 10,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(3px)',
                padding: 24,
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🌐</div>
              <h3 style={{ margin: '0 0 8px', color: 'var(--text)', fontSize: '1.2rem' }}>
                Intelligence Network Canvas Ready
              </h3>
              <p style={{ margin: '0 0 18px', color: 'var(--muted)', fontSize: '0.85rem', maxWidth: 460, lineHeight: 1.5 }}>
                No criminal entities or relational edges in tactical graph. Upload real FIRs, CDR records, or case reports to generate the interactive network topology.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/upload')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                <Upload size={14} /> Ingest Real Data
              </button>
            </div>
          )}
          <NetworkGraph
            nodes={filtered.nodes}
            links={filtered.links}
            onNodeClick={(node) => setSelectedNode(selectedNode?.id === node.id ? null : node)}
            onNodeHover={setHoveredNode}
            focusNodeId={selectedNode?.id}
            selectedEntity={selectedEntity}
            onClearSelected={() => setSelectedNode(null)}
            height={520}
          />

        </div>

        {/* Node detail panel */}
        {selectedNode && selectedEntity && (
          <div
            className="card anim-fade-up"
            style={{ overflow: 'auto', position: 'relative' }}
          >
            <button
              onClick={() => setSelectedNode(null)}
              style={{
                position: 'absolute', top: 14, right: 14,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--muted)', padding: 4,
              }}
            >✕</button>

            <div className="card-title"><Users size={13} /> Entity Detail</div>

            {/* Avatar + name */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div
                style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary-dim), var(--secondary-dim))',
                  border: `2px solid var(--border-glow)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px',
                  fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)',
                }}
              >
                {selectedEntity.avatar}
              </div>
              <h3 style={{ marginBottom: 4 }}>{selectedEntity.name}</h3>
              <p style={{ margin: 0 }}>{selectedEntity.role}</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 10 }}>
                <span className={`badge ${selectedEntity.risk === 'high' ? 'badge-danger' : selectedEntity.risk === 'medium' ? 'badge-warning' : 'badge-success'}`}>
                  {selectedEntity.risk?.toUpperCase()} RISK
                </span>
                <span className="badge badge-primary">{selectedEntity.type}</span>
              </div>
            </div>

            <div className="divider" />

            {/* Fields */}
            {[
              { label: 'Status',      val: selectedEntity.status },
              { label: 'Location',    val: selectedEntity.location },
              { label: 'Connections', val: selectedEntity.connections },
              { label: 'First Seen',  val: selectedEntity.firstSeen },
              { label: 'Last Seen',   val: selectedEntity.lastSeen },
              { label: 'Case IDs',    val: selectedEntity.caseIds?.join(', ') },
            ].map(f => f.val != null && (
              <div
                key={f.label}
                style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '7px 0', borderBottom: '1px solid var(--border)' }}
              >
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 500 }}>{f.label}</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text)', fontWeight: 500, textAlign: 'right' }}>{String(f.val)}</span>
              </div>
            ))}

            {/* Bio */}
            {selectedEntity.bio && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Intelligence Note</div>
                <p style={{ fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--muted)' }}>{selectedEntity.bio}</p>
              </div>
            )}

            {/* Tags */}
            {selectedEntity.tags?.length > 0 && (
              <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selectedEntity.tags.map(t => <span key={t} className="tag">{t}</span>)}
              </div>
            )}

            {/* Connected entities */}
            <div style={{ marginTop: 20 }}>
              <div className="card-title"><Link2 size={13} /> Connected Nodes</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(realLinks || [])
                  .filter(r => {
                    const s = typeof r.source === 'object' ? r.source.id : r.source
                    const t = typeof r.target === 'object' ? r.target.id : r.target
                    return s === selectedEntity.id || t === selectedEntity.id
                  })
                  .slice(0, 5)
                  .map(r => {
                    const s = typeof r.source === 'object' ? r.source.id : r.source
                    const t = typeof r.target === 'object' ? r.target.id : r.target
                    const otherId = s === selectedEntity.id ? t : s
                    const other = (realNodes || []).find(n => n.id === otherId)
                    if (!other) return null
                    return (
                      <div
                        key={r.id || `${s}-${t}`}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 10px',
                          background: 'var(--panel-light)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                        }}
                        onClick={() => setSelectedNode(other)}
                      >
                        <span className={`risk-dot ${other.risk || 'medium'}`} />
                        <span style={{ color: 'var(--text)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {other.name}
                        </span>
                        <span style={{ color: 'var(--muted)', fontSize: '0.72rem', flexShrink: 0 }}>{r.label || r.type || 'connected'}</span>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
