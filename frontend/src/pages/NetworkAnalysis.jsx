import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Network, Filter, RefreshCw,
  AlertTriangle, Users, Link2, Sliders, Upload, Target,
  PhoneCall, HeartHandshake, Users2, DollarSign, Layers
} from 'lucide-react'

import NetworkGraph from '../graph/NetworkGraph'
import useGraphStore from '../store/useGraphStore'

const RISK_FILTERS = ['all', 'high', 'medium', 'low']
const TYPE_FILTERS = ['all', 'Person', 'Organization', 'Location', 'Vehicle', 'Phone']

// Distinct Tactical Channels
const CHANNELS = [
  { id: 'all',           label: 'All Overviews',       icon: Layers,          desc: 'Global syndicate master overview', color: 'var(--primary)' },
  { id: 'communication', label: 'Communication Web',   icon: PhoneCall,       desc: 'Call records, burner SIMs & messages', color: '#0284C7' },
  { id: 'associate',     label: 'Associative Network', icon: Users2,          desc: 'Co-conspirators, syndicates & handlers', color: '#D97706' },
  { id: 'family',        label: 'Family & Kinship',    icon: HeartHandshake,  desc: 'Blood relations & familial conduits', color: '#7C3AED' },
  { id: 'financial',     label: 'Financial Hawala',    icon: DollarSign,      desc: 'Money trails, shell firms & accounts', color: '#16A34A' },
]

export default function NetworkAnalysis() {
  const navigate = useNavigate()
  const [activeChannel, setActiveChannel] = useState('all') // 'communication' | 'associate' | 'family' | 'financial' | 'all'
  const [riskFilter, setRiskFilter]       = useState('all')
  const [typeFilter, setTypeFilter]       = useState('all')
  const [selectedNode, setSelectedNode]   = useState(null)
  const [hoveredNode, setHoveredNode]     = useState(null)
  const [showFilters, setShowFilters]     = useState(false)
  const [isolationMode, setIsolationMode] = useState('all') // 'all' | '1-hop' | '2-hop'

  // Real graph data from Zustand Store & Backend
  const { nodes: realNodes, links: realLinks, loadGraph, loading } = useGraphStore()

  useEffect(() => {
    loadGraph()
  }, [])

  /* Filtered graph data by selected channel, risk, type, and isolation */
  const filtered = useMemo(() => {
    let allNodes = realNodes || []
    let allLinks = realLinks || []

    // 1. Channel Filter: strictly filter edges by requested relational channel
    let targetLinks = allLinks
    if (activeChannel !== 'all') {
      targetLinks = allLinks.filter(l => l.type === activeChannel)
    }

    // 2. Identify nodes participating in this channel
    const activeNodeIds = new Set()
    targetLinks.forEach(l => {
      const s = typeof l.source === 'object' ? l.source.id : l.source
      const t = typeof l.target === 'object' ? l.target.id : l.target
      activeNodeIds.add(s)
      activeNodeIds.add(t)
    })

    // If channel is specific, only show entities that actually belong to that channel mapping
    let nodes = activeChannel === 'all'
      ? allNodes
      : allNodes.filter(n => activeNodeIds.has(n.id))

    // 3. Risk & Type secondary filters
    if (riskFilter !== 'all') nodes = nodes.filter(n => n.risk === riskFilter)
    if (typeFilter !== 'all') nodes = nodes.filter(n => n.type === typeFilter)

    const finalNodeIds = new Set(nodes.map(n => n.id))
    let links = targetLinks.filter(l => {
      const s = typeof l.source === 'object' ? l.source.id : l.source
      const t = typeof l.target === 'object' ? l.target.id : l.target
      return finalNodeIds.has(s) && finalNodeIds.has(t)
    })

    // 4. Isolation mode filtering (1-hop or 2-hop around selectedNode)
    if (selectedNode && isolationMode !== 'all') {
      const targetId = selectedNode.id
      const hop1Nodes = new Set([targetId])

      links.forEach(l => {
        const s = typeof l.source === 'object' ? l.source.id : l.source
        const t = typeof l.target === 'object' ? l.target.id : l.target
        if (s === targetId) hop1Nodes.add(t)
        if (t === targetId) hop1Nodes.add(s)
      })

      if (isolationMode === '1-hop') {
        nodes = nodes.filter(n => hop1Nodes.has(n.id))
        links = links.filter(l => {
          const s = typeof l.source === 'object' ? l.source.id : l.source
          const t = typeof l.target === 'object' ? l.target.id : l.target
          return hop1Nodes.has(s) && hop1Nodes.has(t)
        })
      } else if (isolationMode === '2-hop') {
        const hop2Nodes = new Set(hop1Nodes)
        links.forEach(l => {
          const s = typeof l.source === 'object' ? l.source.id : l.source
          const t = typeof l.target === 'object' ? l.target.id : l.target
          if (hop1Nodes.has(s)) hop2Nodes.add(t)
          if (hop1Nodes.has(t)) hop2Nodes.add(s)
        })
        nodes = nodes.filter(n => hop2Nodes.has(n.id))
        links = links.filter(l => {
          const s = typeof l.source === 'object' ? l.source.id : l.source
          const t = typeof l.target === 'object' ? l.target.id : l.target
          return hop2Nodes.has(s) && hop2Nodes.has(t)
        })
      }
    }

    return { nodes, links }
  }, [realNodes, realLinks, activeChannel, riskFilter, typeFilter, selectedNode, isolationMode])

  const selectedEntity = selectedNode ? realNodes.find(n => n.id === selectedNode.id) : null

  /* Stats from filtered channel data */
  const highCount = filtered.nodes.filter(n => n.risk === 'high').length

  const currentChannelMeta = CHANNELS.find(c => c.id === activeChannel) || CHANNELS[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--nav-h) - 56px)' }}>
      {/* Page header */}
      <div className="page-header" style={{ marginBottom: 12 }}>
        <h1>
          <span className="page-icon"><Network size={20} /></span>
          Tactical Relational Mappings
        </h1>
        <p>Isolate and analyze independent operational channels: Communication, Associative Syndicate, Family/Kinship, or Financial.</p>
      </div>

      {/* TACTICAL CHANNEL SELECTOR BAR (Primary Navigation) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
          marginBottom: 14
        }}
      >
        {CHANNELS.map(ch => {
          const Icon = ch.icon
          const isActive = activeChannel === ch.id
          return (
            <div
              key={ch.id}
              onClick={() => {
                setActiveChannel(ch.id)
                setSelectedNode(null)
                setIsolationMode('all')
              }}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: `1.5px solid ${isActive ? ch.color : 'var(--border)'}`,
                background: isActive ? '#FFFFFF' : 'var(--panel)',
                boxShadow: isActive ? `0 4px 14px ${ch.color}25` : 'none',
                cursor: 'pointer',
                transition: 'all 180ms ease',
                display: 'flex',
                flexDirection: 'column',
                gap: 4
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  color: isActive ? ch.color : 'var(--text)'
                }}>
                  <Icon size={15} color={isActive ? ch.color : 'var(--muted)'} />
                  {ch.label}
                </span>
                {isActive && (
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: ch.color,
                    boxShadow: `0 0 6px ${ch.color}`
                  }} />
                )}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.3 }}>
                {ch.desc}
              </div>
            </div>
          )
        })}
      </div>

      {/* Toolbar: Stats & Secondary Filter Controls */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 12, flexWrap: 'wrap',
        }}
      >
        {/* Active Channel telemetry badges */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="badge badge-primary" style={{ background: `${currentChannelMeta.color}15`, color: currentChannelMeta.color, border: `1px solid ${currentChannelMeta.color}40` }}>
            {currentChannelMeta.label.toUpperCase()}
          </span>
          <span className="badge badge-muted"><Users size={11} />{filtered.nodes.length} entities</span>
          <span className="badge badge-muted"><Link2 size={11} />{filtered.links.length} conduits</span>
          <span className="badge badge-danger"><AlertTriangle size={11} />{highCount} high-threat</span>
        </div>

        {/* Isolation Mode Quick Toggles when a node is selected */}
        {selectedNode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '3px 8px', borderRadius: 8 }}>
            <Target size={13} color="#1D4ED8" />
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1E40AF' }}>FOCUS: {selectedNode.name?.slice(0, 14)}</span>
            <button
              onClick={() => setIsolationMode('all')}
              style={{
                background: isolationMode === 'all' ? '#1D4ED8' : 'transparent',
                color: isolationMode === 'all' ? '#FFF' : '#1E40AF',
                border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer'
              }}
            >
              Full
            </button>
            <button
              onClick={() => setIsolationMode('1-hop')}
              style={{
                background: isolationMode === '1-hop' ? '#1D4ED8' : 'transparent',
                color: isolationMode === '1-hop' ? '#FFF' : '#1E40AF',
                border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer'
              }}
              title="Show only immediate direct contacts"
            >
              1-Hop
            </button>
            <button
              onClick={() => setIsolationMode('2-hop')}
              style={{
                background: isolationMode === '2-hop' ? '#1D4ED8' : 'transparent',
                color: isolationMode === '2-hop' ? '#FFF' : '#1E40AF',
                border: 'none', borderRadius: 4, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer'
              }}
              title="Show up to 2 degrees of separation"
            >
              2-Hop
            </button>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Filter toggles */}
        <button
          className={`btn btn-sm ${showFilters ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setShowFilters(v => !v)}
        >
          <Sliders size={14} /> Refine Filters
        </button>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => { setRiskFilter('all'); setTypeFilter('all'); setIsolationMode('all'); setActiveChannel('all') }}
        >
          <RefreshCw size={14} /> Reset
        </button>
      </div>

      {/* Expandable Secondary Filter bar */}
      {showFilters && (
        <div
          className="card anim-fade-up"
          style={{ padding: '12px 16px', marginBottom: 14, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Filter size={13} color="var(--muted)" />
            <span style={{ fontSize: '0.76rem', color: 'var(--muted)', fontWeight: 600, marginRight: 4 }}>RISK</span>
            {RISK_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setRiskFilter(f)}
                style={{
                  padding: '3px 10px', borderRadius: 99, fontSize: '0.74rem',
                  fontWeight: 600, border: '1px solid',
                  cursor: 'pointer',
                  background: riskFilter === f
                    ? (f === 'high' ? 'var(--danger)' : f === 'medium' ? 'var(--warning)' : f === 'low' ? 'var(--success)' : 'var(--primary)')
                    : 'transparent',
                  borderColor: riskFilter === f ? 'transparent' : 'var(--border)',
                  color: riskFilter === f ? '#0B1120' : 'var(--muted)',
                  textTransform: 'capitalize',
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--muted)', fontWeight: 600, marginRight: 4 }}>ENTITY TYPE</span>
            {TYPE_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                style={{
                  padding: '3px 10px', borderRadius: 99, fontSize: '0.74rem',
                  fontWeight: 600, border: '1px solid',
                  cursor: 'pointer',
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
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(3px)',
                padding: 24,
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '2.4rem', marginBottom: 10 }}>📡</div>
              <h3 style={{ margin: '0 0 8px', color: 'var(--text)', fontSize: '1.15rem' }}>
                No {currentChannelMeta.label} Conduits Detected
              </h3>
              <p style={{ margin: '0 0 16px', color: 'var(--muted)', fontSize: '0.84rem', maxWidth: 440, lineHeight: 1.5 }}>
                {activeChannel !== 'all'
                  ? `No entities in current database have registered ${activeChannel} edges. Switch channels or upload evidence files containing ${activeChannel} data.`
                  : 'No criminal entities or relational edges registered. Ingest FIRs, CDR files, or case reports to generate tactical mappings.'}
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                {activeChannel !== 'all' && (
                  <button
                    className="btn btn-outline"
                    onClick={() => setActiveChannel('all')}
                  >
                    View All Overviews
                  </button>
                )}
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/upload')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <Upload size={14} /> Ingest Evidence Data
                </button>
              </div>
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
                {selectedEntity.avatar || selectedEntity.name?.slice(0, 2)?.toUpperCase() || 'ID'}
              </div>
              <h3 style={{ marginBottom: 4 }}>{selectedEntity.name}</h3>
              <p style={{ margin: 0 }}>{selectedEntity.role || 'Operative'}</p>
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

            {/* Connected entities */}
            <div style={{ marginTop: 20 }}>
              <div className="card-title"><Link2 size={13} /> Connected Channels</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(realLinks || [])
                  .filter(r => {
                    const s = typeof r.source === 'object' ? r.source.id : r.source
                    const t = typeof r.target === 'object' ? r.target.id : r.target
                    return s === selectedEntity.id || t === selectedEntity.id
                  })
                  .slice(0, 6)
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
