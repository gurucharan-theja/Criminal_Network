import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Search, FolderOpen, Clock, AlertTriangle,
  Filter, FileText, MapPin, Link2, Users, ShieldAlert,
  ArrowRight, CheckCircle2, Building, Upload, Plus
} from 'lucide-react'

import EntityCard from '../components/EntityCard'
import SearchBar from '../components/SearchBar'
import useGraphStore from '../store/useGraphStore'
import useCaseStore from '../store/useCaseStore'

const SORT_OPTIONS = ['Risk Level', 'Name A–Z', 'Most Connected', 'Last Seen']

export default function Investigation() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Connect to live Zustand stores
  const { nodes, links, loadGraph } = useGraphStore()
  const { cases: storeCases, loadCases } = useCaseStore()

  useEffect(() => {
    loadGraph()
    loadCases()
  }, [])

  const allCases = storeCases || []

  // Read URL query parameter: ?case=... or ?q=...
  const urlCaseParam = searchParams.get('case') || 'all'
  const urlQueryParam = searchParams.get('q') || ''

  const [search, setSearch]             = useState(urlQueryParam)
  const [caseFilter, setCaseFilter]     = useState(urlCaseParam)
  const [riskFilter, setRiskFilter]     = useState('all')
  const [typeFilter, setTypeFilter]     = useState('all')
  const [sort, setSort]                 = useState('Risk Level')
  const [selectedEntity, setSelectedEntity] = useState(null)
  const [tab, setTab]                   = useState('entities') // 'entities' | 'timeline'
  const [showAllIfEmpty, setShowAllIfEmpty] = useState(false)

  // Synchronize when URL search param changes
  useEffect(() => {
    if (searchParams.get('case')) {
      setCaseFilter(searchParams.get('case'))
    }
    if (searchParams.get('q')) {
      setSearch(searchParams.get('q'))
    }
  }, [searchParams])

  // Active Case Object — matched robustly by ID (numeric or string) or caseNumber
  const currentCase = useMemo(() => {
    if (caseFilter === 'all') return null
    return allCases.find(c => String(c.id) === String(caseFilter) || c.caseNumber === caseFilter) || null
  }, [allCases, caseFilter])

  /* Search suggestions from live nodes */
  const suggestions = useMemo(() =>
    search.length > 1
      ? nodes.filter(e => e.name?.toLowerCase().includes(search.toLowerCase())).slice(0, 6)
      : [],
  [search, nodes])

  /* Filtered & sorted entities */
  const filtered = useMemo(() => {
    let list = [...nodes]

    // Case filter
    if (caseFilter !== 'all' && currentCase && !showAllIfEmpty) {
      const caseEntities = list.filter(e => {
        const matchesCaseId = e.caseId && String(e.caseId) === String(currentCase.id)
        const matchesCaseIds = Array.isArray(e.caseIds) && e.caseIds.some(cid => String(cid) === String(currentCase.id))
        const matchesArray = Array.isArray(currentCase.entities) && currentCase.entities.includes(e.id)
        const matchesSource = currentCase.sourceFiles && e.sourceFile && currentCase.sourceFiles.includes(e.sourceFile)
        return matchesCaseId || matchesCaseIds || matchesArray || matchesSource
      })
      // If entities are mapped to this case, narrow down to them; otherwise list is empty for this docket
      list = caseEntities
    }

    // Search query filter
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.name?.toLowerCase().includes(q) ||
        e.role?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q) ||
        (Array.isArray(e.tags) && e.tags.some(t => t.toLowerCase().includes(q)))
      )
    }

    // Risk and Type filters
    if (riskFilter !== 'all') list = list.filter(e => e.risk === riskFilter)
    if (typeFilter !== 'all') list = list.filter(e => e.type === typeFilter)

    const riskRank = { high: 0, medium: 1, low: 2 }
    if (sort === 'Risk Level')     list.sort((a, b) => (riskRank[a.risk] ?? 3) - (riskRank[b.risk] ?? 3))
    if (sort === 'Name A–Z')       list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    if (sort === 'Most Connected') list.sort((a, b) => (b.connections || 0) - (a.connections || 0))
    if (sort === 'Last Seen')      list.sort((a, b) => new Date(b.lastSeen || 0) - new Date(a.lastSeen || 0))
    return list
  }, [nodes, search, caseFilter, riskFilter, typeFilter, sort, currentCase, showAllIfEmpty])

  /* Real timeline events derived from cases and nodes */
  const filteredEvents = useMemo(() => {
    const evts = []
    if (currentCase) {
      evts.push({
        id: `c-init-${currentCase.id}`,
        title: `Investigation Docket Opened: ${currentCase.title}`,
        date: currentCase.createdAt ? new Date(currentCase.createdAt).toISOString().slice(0, 10) : 'Current',
        risk: currentCase.risk || 'medium',
        type: 'DOCKET_REGISTRATION',
      })
    }
    filtered.forEach(e => {
      if (e.lastSeen) {
        evts.push({
          id: `ent-seen-${e.id}`,
          title: `Suspect Telemetry / Sighting: ${e.name}`,
          date: e.lastSeen,
          risk: e.risk || 'low',
          type: e.type?.toUpperCase() || 'INTEL',
        })
      }
    })
    return evts.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [currentCase, filtered])

  const se = selectedEntity

  // Compute live relational links for selected entity
  const selectedEntityLinks = useMemo(() => {
    if (!se) return []
    return links.filter(l =>
      (l.source?.id || l.source) === se.id ||
      (l.target?.id || l.target) === se.id
    )
  }, [se, links])

  const eventColor = {
    high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--success)',
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <h1>
          <span className="page-icon"><Search size={20} /></span>
          Investigation Workbench
        </h1>
        <p>Search, filter and interrogate criminal entities and active case dockets.</p>
      </div>

      {/* Case Selector Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          className={`btn btn-sm ${caseFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => { setCaseFilter('all'); navigate('/investigation') }}
        >
          All Cases ({allCases.length})
        </button>
        {allCases.map(c => {
          const isActiveTab = String(caseFilter) === String(c.id) || caseFilter === c.caseNumber
          return (
            <button
              key={c.id}
              className={`btn btn-sm ${isActiveTab ? 'btn-secondary' : 'btn-outline'}`}
              onClick={() => { setCaseFilter(String(c.id)); navigate(`/investigation?case=${c.id}`) }}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <span
                style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: c.status === 'active' || c.status === 'Active' ? 'var(--danger)' : c.status === 'closed' || c.status === 'Closed' ? 'var(--success)' : 'var(--warning)',
                  display: 'inline-block',
                }}
              />
              <span>{c.title}</span>
            </button>
          )
        })}
        <button
          className="btn btn-sm btn-ghost"
          onClick={() => navigate('/cases')}
          style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)' }}
        >
          <Plus size={13} /> Manage Cases
        </button>
      </div>

      {/* Active Case Banner (When a specific case is selected) */}
      {currentCase && (
        <div
          className="card anim-fade-up"
          style={{
            padding: '16px 20px',
            marginBottom: 20,
            background: '#FFFFFF',
            border: '1px solid var(--border)',
            borderLeft: `4px solid ${currentCase.status === 'active' || currentCase.status === 'Active' ? 'var(--danger)' : 'var(--success)'}`,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <FolderOpen size={16} color="var(--primary)" />
                <span style={{ fontSize: '0.74rem', color: 'var(--primary)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  ACTIVE DOCKET: {currentCase.caseNumber || `CASE-${currentCase.id}`}
                </span>
                <span className={`badge ${currentCase.status === 'active' || currentCase.status === 'Active' ? 'badge-danger' : 'badge-success'}`}>
                  {currentCase.status?.toUpperCase()}
                </span>
                <span style={{
                  fontSize: '0.68rem', fontWeight: 700,
                  color: currentCase.risk === 'high' ? 'var(--danger)' : currentCase.risk === 'medium' ? 'var(--warning)' : 'var(--success)',
                  background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 4
                }}>
                  {currentCase.risk?.toUpperCase()} PRIORITY
                </span>
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.2rem', color: 'var(--text)' }}>
                {currentCase.title}
              </h3>
              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--muted)', maxWidth: 800, lineHeight: 1.5 }}>
                {currentCase.description || 'No case synopsis recorded. Ingest intelligence reports to associate suspects and evidence.'}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'right' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>Lead Investigator: </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>
                  {currentCase.investigator || currentCase.leadAnalyst || 'Lead Investigator'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>Department: </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--muted-dark)' }}>
                  {currentCase.department || 'Crime Branch'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4, justifyContent: 'flex-end' }}>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => navigate('/upload')}
                  style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Upload size={12} /> Ingest Evidence
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => navigate('/network')}
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  View Network
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div style={{ display: 'grid', gridTemplateColumns: se ? '280px 1fr 340px' : '280px 1fr', gap: 20 }}>
        {/* Sidebar filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Search */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <SearchBar
              placeholder="Search suspects, roles…"
              onSearch={setSearch}
              suggestions={suggestions}
              size="sm"
            />
          </div>

          {/* Filters */}
          <div className="card">
            <div className="card-title"><Filter size={13} /> Filters</div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>RISK LEVEL</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {['all', 'high', 'medium', 'low'].map(r => (
                  <button
                    key={r}
                    onClick={() => setRiskFilter(r)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '7px 10px', borderRadius: 'var(--radius-md)',
                      border: '1px solid',
                      borderColor: riskFilter === r ? 'var(--border-glow)' : 'transparent',
                      background: riskFilter === r ? 'var(--primary-dim)' : 'transparent',
                      cursor: 'pointer', fontSize: '0.82rem',
                      color: riskFilter === r ? 'var(--primary)' : 'var(--muted)',
                      textAlign: 'left', textTransform: 'capitalize',
                      fontWeight: riskFilter === r ? 600 : 400,
                      transition: 'all var(--transition)',
                    }}
                  >
                    {r !== 'all' && <span className={`risk-dot ${r}`} />}
                    {r === 'all' ? 'All risks' : `${r} risk`}
                  </button>
                ))}
              </div>
            </div>

            <div className="divider" style={{ margin: '12px 0' }} />

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>ENTITY TYPE</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {['all', 'Person', 'Organization', 'Location', 'Vehicle', 'Phone'].map(t => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '7px 10px', borderRadius: 'var(--radius-md)',
                      border: '1px solid',
                      borderColor: typeFilter === t ? 'var(--border-glow)' : 'transparent',
                      background: typeFilter === t ? 'var(--primary-dim)' : 'transparent',
                      cursor: 'pointer', fontSize: '0.82rem',
                      color: typeFilter === t ? 'var(--primary)' : 'var(--muted)',
                      textAlign: 'left', textTransform: 'capitalize',
                      fontWeight: typeFilter === t ? 600 : 400,
                      transition: 'all var(--transition)',
                    }}
                  >
                    {t === 'all' ? 'All types' : t}
                  </button>
                ))}
              </div>
            </div>

            <div className="divider" style={{ margin: '12px 0' }} />

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 8, fontWeight: 600 }}>SORT BY</div>
              <select
                className="input"
                style={{ width: '100%', fontSize: '0.8rem' }}
                value={sort}
                onChange={e => setSort(e.target.value)}
              >
                {SORT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Center column: tabs + results */}
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
            {['entities', 'timeline'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '10px 20px', background: 'none', border: 'none',
                  borderBottom: `2px solid ${tab === t ? 'var(--primary)' : 'transparent'}`,
                  color: tab === t ? 'var(--primary)' : 'var(--muted)',
                  fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                  textTransform: 'capitalize', transition: 'color var(--transition)',
                  marginBottom: -1,
                }}
              >
                {t === 'entities'
                  ? <span style={{display:'flex',alignItems:'center',gap:6}}><Users size={13}/>{filtered.length} Entities</span>
                  : <span style={{display:'flex',alignItems:'center',gap:6}}><Clock size={13}/>Timeline ({filteredEvents.length})</span>
                }
              </button>
            ))}
          </div>

          {tab === 'entities' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {nodes.length === 0 ? (
                <div className="empty-state card" style={{ padding: '36px 20px', textAlign: 'center' }}>
                  <div className="icon" style={{ fontSize: '2rem', marginBottom: 10 }}>🔍</div>
                  <h3 style={{ margin: '0 0 6px', color: 'var(--text)' }}>No Criminal Entities Registered</h3>
                  <p style={{ margin: '0 0 16px', color: 'var(--muted)', fontSize: '0.85rem', maxWidth: 460 }}>
                    The intelligence repository is currently empty. Ingest FIRs, CDR files, or seizure reports to automatically extract suspects, vehicles, and organizations.
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate('/upload')}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  >
                    <Upload size={14} /> Ingest Evidence Files
                  </button>
                </div>
              ) : filtered.length === 0 ? (
                <div className="empty-state card" style={{ padding: '36px 20px', textAlign: 'center' }}>
                  <div className="icon" style={{ fontSize: '2rem', marginBottom: 10 }}>📂</div>
                  <h3 style={{ margin: '0 0 6px', color: 'var(--text)' }}>
                    {currentCase ? `No suspects linked to Docket "${currentCase.title}"` : 'No entities match current filters'}
                  </h3>
                  <p style={{ margin: '0 0 16px', color: 'var(--muted)', fontSize: '0.85rem', maxWidth: 460 }}>
                    {currentCase
                      ? 'No entities are isolated specifically to this docket. Ingest files for this docket, or view all suspects currently active across the network.'
                      : 'Try adjusting your search query, risk filter, or category selector.'}
                  </p>
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                    {currentCase && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setShowAllIfEmpty(!showAllIfEmpty)}
                      >
                        {showAllIfEmpty ? 'Filter to Docket Only' : 'Browse All Network Suspects'}
                      </button>
                    )}
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => { setRiskFilter('all'); setTypeFilter('all'); setSearch(''); }}
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              ) : (
                filtered.map(e => (
                  <EntityCard
                    key={e.id}
                    entity={e}
                    compact={true}
                    onClick={() => setSelectedEntity(selectedEntity?.id === e.id ? null : e)}
                  />
                ))
              )}
            </div>
          )}

          {tab === 'timeline' && (
            <div style={{ position: 'relative', paddingLeft: 28 }}>
              {filteredEvents.length === 0 ? (
                <div className="card" style={{ padding: '30px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
                  No timeline events logged for this case. Ingest surveillance or call logs to construct chronology.
                </div>
              ) : (
                <>
                  <div style={{
                    position: 'absolute', left: 10, top: 0, bottom: 0,
                    width: 2, background: 'var(--border)', borderRadius: 99,
                  }} />
                  {filteredEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="anim-fade-up"
                      style={{ position: 'relative', marginBottom: 20 }}
                    >
                      <div style={{
                        position: 'absolute', left: -23, top: 6,
                        width: 12, height: 12, borderRadius: '50%',
                        background: eventColor[ev.risk] || 'var(--muted)',
                        boxShadow: `0 0 8px ${eventColor[ev.risk] || 'var(--muted)'}`,
                        border: '2px solid var(--bg)',
                      }} />
                      <div
                        className="card"
                        style={{ padding: '12px 16px', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-glow)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>{ev.title}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', flexShrink: 0, marginLeft: 8 }}>{ev.date}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <span className={`badge ${ev.risk === 'high' ? 'badge-danger' : ev.risk === 'medium' ? 'badge-warning' : 'badge-success'}`}>
                            {ev.risk}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Type: {ev.type}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right column: Selected entity detail panel */}
        {se && (
          <div className="card anim-fade-up" style={{ padding: 20, position: 'sticky', top: 80, height: 'fit-content' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Suspect Dossier // {se.type}
              </span>
              <button
                onClick={() => setSelectedEntity(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4 }}
              >
                ✕
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div
                style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--panel-light), #0f172a)',
                  border: `2px solid ${se.risk === 'high' ? 'var(--danger)' : 'var(--primary)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 10px',
                  fontSize: '1.2rem', fontWeight: 800, color: 'var(--text)',
                }}
              >
                {se.avatar || (se.name ? se.name.split(' ').map(w => w[0]).slice(0, 2).join('') : '?')}
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: 'var(--text)' }}>{se.name}</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{se.role || se.type}</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 10 }}>
                <span className={`badge ${se.risk === 'high' ? 'badge-danger' : se.risk === 'medium' ? 'badge-warning' : 'badge-success'}`}>
                  {se.risk?.toUpperCase() || 'NORMAL'} RISK
                </span>
                <span className="badge badge-primary">{se.type}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Status', val: se.status || 'Active' },
                { label: 'Location', val: se.location || 'Maharashtra' },
                { label: 'Connections', val: `${selectedEntityLinks.length || se.connections || 0} links` },
                { label: 'Source File', val: se.sourceFile || 'Evidence DB' },
                { label: 'Last Activity', val: se.lastSeen || 'Current' },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                  <span style={{ color: 'var(--muted)' }}>{f.label}</span>
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>{f.val}</span>
                </div>
              ))}
            </div>

            {se.bio && (
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4 }}>
                  INTELLIGENCE BRIEF
                </div>
                <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                  {se.bio}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
