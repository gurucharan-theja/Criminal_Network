import { useState, useEffect, useMemo } from 'react'
import {
  Users, AlertTriangle, FolderOpen, Package,
  Activity, TrendingUp, Clock, Plus, Upload, ArrowRight, ShieldCheck
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import StatCard from '../components/StatCard'
import EntityCard from '../components/EntityCard'
import useGraphStore from '../store/useGraphStore'
import useCaseStore from '../store/useCaseStore'
import useApi from '../hooks/useApi'
import { fetchStats } from '../api/analysisApi'

const eventTypeConfig = {
  sighting:  { color: 'var(--warning)',   label: 'SIGHTING' },
  financial: { color: 'var(--danger)',    label: 'FINANCIAL' },
  seizure:   { color: 'var(--primary)',   label: 'SEIZURE' },
  call:      { color: 'var(--secondary)', label: 'CALL' },
  arrest:    { color: 'var(--success)',   label: 'ARREST' },
  intel:     { color: 'var(--warning)',   label: 'INTEL' },
  digital:   { color: 'var(--primary)',   label: 'DIGITAL' },
}

export default function Dashboard() {
  const navigate = useNavigate()

  // Real data stores
  const { nodes, links, loadGraph } = useGraphStore()
  const { cases, loadCases } = useCaseStore()
  const { data: apiStats, refetch: refetchStats } = useApi(fetchStats)

  useEffect(() => {
    loadGraph()
    loadCases()
  }, [])

  // Derived metrics from live database
  const totalEntities = nodes.length || apiStats?.totalEntities || 0
  const activeThreats = nodes.filter(n => n.risk === 'high' || n.threatLevel === 'HIGH' || n.threatLevel === 'CRITICAL').length || apiStats?.highRiskNodes || 0
  const casesOpen = cases.filter(c => c.status === 'active' || c.status === 'Active' || c.status === 'pending').length || apiStats?.casesOpen || 0
  const connectionsTotal = links.length || apiStats?.connectionsTotal || 0
  const seizuresCount = nodes.filter(n => n.type === 'Vehicle' || n.role?.toLowerCase().includes('seiz') || n.role?.toLowerCase().includes('contraband')).length

  const highRisk = useMemo(() =>
    nodes.filter(e => e.risk === 'high' || e.threatLevel === 'HIGH' || e.threatLevel === 'CRITICAL').slice(0, 4),
  [nodes])

  // Synthesized real activity feed based on ingested nodes and active cases
  const recentEvents = useMemo(() => {
    const list = []

    cases.forEach(c => {
      list.push({
        id: 'case-' + c.id,
        title: `Docket Activated: ${c.title}`,
        type: 'intel',
        caseId: c.caseNumber || `CASE-${c.id}`,
        date: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Active',
        risk: c.risk || 'medium',
      })
    })

    nodes.forEach(n => {
      if (n.risk === 'high') {
        list.push({
          id: 'threat-' + n.id,
          title: `High Threat Flagged: ${n.name} (${n.role || n.type})`,
          type: n.type === 'Vehicle' ? 'seizure' : n.type === 'Phone' ? 'call' : 'sighting',
          caseId: n.sourceFile || 'Evidence DB',
          date: n.lastSeen || 'Registered',
          risk: 'high',
        })
      }
    })

    return list.slice(0, 8)
  }, [cases, nodes])

  const isEmptySystem = nodes.length === 0 && cases.length === 0

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <h1>
          <span className="page-icon"><Activity size={20} /></span>
          Operations Dashboard
        </h1>
        <p>Real-time tactical overview — criminal network intelligence, active dockets, and threat analytics.</p>
      </div>

      {/* Operational Empty State Banner if no data ingested yet */}
      {isEmptySystem && (
        <div
          className="card anim-fade-up"
          style={{
            marginBottom: 24,
            padding: '24px',
            background: '#FFFFFF',
            border: '1px solid var(--border)',
            borderLeft: '4px solid var(--primary)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ maxWidth: 650 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <ShieldCheck size={18} color="var(--primary)" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.06em' }}>
                  OPERATIONAL READINESS: INTELLIGENCE REPOSITORY EMPTY
                </span>
              </div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', color: 'var(--text)' }}>
                System Ready for Real Intelligence Ingestion
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                Operating under Government Intelligence Light Standard. Ingest FIRs, Call Detail Records (CDRs), or register an investigation case docket to correlate multi-source evidence, detect syndicates, and track key influencers.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                onClick={() => navigate('/upload')}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Upload size={15} /> Ingest Evidence
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate('/cases')}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Plus size={15} /> Create Case File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid-4 mb-24">
        <StatCard
          title="Total Entities"
          value={totalEntities}
          delta={totalEntities > 0 ? `${totalEntities} identified` : 'Awaiting data'}
          deltaType={totalEntities > 0 ? 'up' : 'neutral'}
          icon={<Users size={17} />}
          accent="primary"
          sub="in active network"
        />
        <StatCard
          title="Active Threats"
          value={activeThreats}
          delta={activeThreats > 0 ? 'High-risk flags' : 'None detected'}
          deltaType={activeThreats > 0 ? 'up' : 'neutral'}
          icon={<AlertTriangle size={17} />}
          accent="danger"
          sub="high-risk nodes"
        />
        <StatCard
          title="Open Cases"
          value={casesOpen}
          delta={casesOpen > 0 ? `${casesOpen} registered` : 'No active dockets'}
          deltaType="neutral"
          icon={<FolderOpen size={17} />}
          accent="warning"
          sub="under investigation"
        />
        <StatCard
          title="Connections Mapped"
          value={connectionsTotal}
          delta={connectionsTotal > 0 ? `${connectionsTotal} links` : '0 conduits'}
          deltaType={connectionsTotal > 0 ? 'up' : 'neutral'}
          icon={<Package size={17} />}
          accent="success"
          sub="relational edges"
        />
      </div>

      {/* Main 2-col layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, marginBottom: 24 }}>
        {/* Activity feed */}
        <div className="card">
          <div className="card-title">
            <Clock size={13} /> Recent Activity Feed
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {recentEvents.length > 0 ? (
              recentEvents.map((ev, i) => {
                const cfg = eventTypeConfig[ev.type] || { color: 'var(--muted)', label: ev.type.toUpperCase() }
                return (
                  <div
                    key={ev.id || i}
                    className="anim-fade-up"
                    style={{
                      display: 'flex',
                      gap: 14,
                      padding: '12px 0',
                      borderBottom: i < recentEvents.length - 1 ? '1px solid var(--border)' : 'none',
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate('/investigation')}
                    onMouseEnter={(e) => (e.currentTarget.style.paddingLeft = '6px')}
                    onMouseLeave={(e) => (e.currentTarget.style.paddingLeft = '0')}
                  >
                    {/* Type dot */}
                    <div style={{ flexShrink: 0, marginTop: 3 }}>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 8, height: 8,
                          borderRadius: '50%',
                          background: cfg.color,
                          boxShadow: `0 0 6px ${cfg.color}`,
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.875rem', color: 'var(--text)', fontWeight: 500, marginBottom: 3 }}>
                        {ev.title}
                      </div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span
                          style={{
                            fontSize: '0.68rem', fontWeight: 700, color: cfg.color,
                            background: `${cfg.color}18`, padding: '1px 7px',
                            borderRadius: 99, letterSpacing: '0.06em',
                          }}
                        >
                          {cfg.label}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                          {ev.caseId}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', marginLeft: 'auto' }}>
                          {ev.date}
                        </span>
                      </div>
                    </div>
                    {ev.risk === 'high' && (
                      <AlertTriangle size={14} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
                    )}
                  </div>
                )
              })
            ) : (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
                <Clock size={24} style={{ opacity: 0.3, margin: '0 auto 10px', display: 'block' }} />
                No surveillance or intelligence feed entries yet.
                <div style={{ marginTop: 6, fontSize: '0.75rem' }}>
                  Upload FIR documents or register cases to populate real-time activity tracking.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Case status */}
          <div className="card">
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FolderOpen size={13} /> Active Case Files</span>
              <button
                onClick={() => navigate('/cases')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                View All <ArrowRight size={11} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cases.length > 0 ? (
                cases.slice(0, 4).map(c => (
                  <div
                    key={c.id}
                    style={{
                      padding: '10px 12px',
                      background: 'var(--panel-light)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all var(--transition)',
                    }}
                    onClick={() => navigate(`/investigation?case=${c.id}`)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-glow)'
                      e.currentTarget.style.background = 'rgba(34,211,238,0.05)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)'
                      e.currentTarget.style.background = 'var(--panel-light)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>{c.title}</span>
                      <span className={`badge ${c.status === 'active' || c.status === 'Active' ? 'badge-danger' : c.status === 'closed' || c.status === 'Closed' ? 'badge-success' : 'badge-warning'}`}>
                        {c.status}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', color: 'var(--muted)' }}>
                      <span>{c.caseNumber || `CASE-${c.id}`}</span>
                      <span>{c.investigator || 'Crime Branch'}</span>
                      <span style={{ marginLeft: 'auto', color: c.risk === 'high' ? 'var(--danger)' : c.risk === 'medium' ? 'var(--warning)' : 'var(--success)', fontWeight: 600, fontSize: '0.7rem' }}>
                        {c.risk?.toUpperCase() || 'HIGH'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem' }}>
                  No investigation cases registered yet.
                  <button
                    onClick={() => navigate('/cases')}
                    className="btn btn-outline btn-sm"
                    style={{ marginTop: 10, width: '100%' }}
                  >
                    + Create Case File
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Network summary */}
          <div className="card">
            <div className="card-title"><TrendingUp size={13} /> Network Intelligence Summary</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'High-Threat Nodes', val: activeThreats, total: Math.max(totalEntities, 1), accent: 'danger' },
                { label: 'Relational Conduits', val: connectionsTotal, total: Math.max(connectionsTotal + 10, 50), accent: 'primary' },
                { label: 'Active Investigation Dockets', val: cases.length, total: Math.max(cases.length + 5, 10), accent: 'secondary' },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{item.label}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'JetBrains Mono' }}>
                      {item.val}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-bar__fill ${item.accent}`}
                      style={{ width: `${Math.min(100, (item.val / item.total) * 100).toFixed(0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* High-risk entities strip */}
      <div>
        <div className="section-label">
          <AlertTriangle size={13} />
          High-Risk Entities — Requires Attention
        </div>
        {highRisk.length > 0 ? (
          <div className="grid-4">
            {highRisk.map(e => (
              <EntityCard
                key={e.id}
                entity={e}
                onClick={() => navigate(`/investigation?q=${encodeURIComponent(e.name || e.id)}`)}
              />
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
            No high-risk entities identified in the database. Ingest evidence files to compute threat scores.
          </div>
        )}
      </div>
    </div>
  )
}
