import { useState, useMemo, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Search, FolderOpen, Clock, AlertTriangle,
  Filter, FileText, MapPin, Link2, Users, ShieldAlert,
  ArrowRight, CheckCircle2, Building, Upload, Plus,
  ExternalLink, Activity, Hash, CalendarDays, Network, Trash2
} from 'lucide-react'

import EntityCard from '../components/EntityCard'
import SearchBar from '../components/SearchBar'
import useGraphStore from '../store/useGraphStore'
import useCaseStore from '../store/useCaseStore'
import { getRelatedCasesForEntity } from '../utils/caseCorrelation'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

const SORT_OPTIONS = [
  'Risk Level',
  'Name A–Z',
  'Most Connected',
  'Last Seen'
]

const normalizeStatus = (status) =>
  String(status || '').toUpperCase()

const normalizePriority = (priority) =>
  String(priority || 'MEDIUM').toUpperCase()

const priorityColor = (priority) => {
  const value = normalizePriority(priority)

  if (value === 'CRITICAL' || value === 'HIGH') {
    return 'var(--danger)'
  }

  if (value === 'MEDIUM') {
    return 'var(--warning)'
  }

  return 'var(--success)'
}

const statusColor = (status) => {
  const value = normalizeStatus(status)

  if (value === 'ACTIVE') {
    return 'var(--danger)'
  }

  if (value === 'ON_HOLD') {
    return 'var(--warning)'
  }

  if (value === 'CLOSED') {
    return 'var(--success)'
  }

  return 'var(--primary)'
}

const evidenceStatusClass = (status) => {
  const value = normalizeStatus(status)

  if (value === 'PROCESSED') return 'badge-success'
  if (value === 'PROCESSING') return 'badge-warning'
  if (value === 'FAILED') return 'badge-danger'
  if (value === 'ARCHIVED') return 'badge-primary'

  return 'badge-primary'
}

export default function Investigation() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Connect to live Zustand stores
  const {
    nodes,
    links,
    loadGraph
  } = useGraphStore()

  const {
    cases: storeCases,
    removeCase
  } = useCaseStore()

  const handleDeleteCase = async (c) => {
    if (!c) return
    if (window.confirm(`Are you sure you want to delete case docket "${c.title}" (${c.caseNumber || c.id})?`)) {
      try {
        await removeCase(c.id)
        setCaseFilter('all')
        navigate('/investigation')
      } catch (err) {
        console.error('Failed to delete case:', err)
      }
    }
  }

  // Case-specific evidence
  const [caseEvidence, setCaseEvidence] = useState([])
  const [evidenceLoading, setEvidenceLoading] = useState(false)
  const [evidenceError, setEvidenceError] = useState('')

  useEffect(() => {
    loadGraph()
  }, [loadGraph])

  const allCases = storeCases || []

  // Read URL query parameter: ?case=... or ?q=...
  const urlCaseParam = searchParams.get('case') || 'all'
  const urlQueryParam = searchParams.get('q') || ''

  const [search, setSearch] = useState(urlQueryParam)
  const [caseFilter, setCaseFilter] = useState(urlCaseParam)
  const [riskFilter, setRiskFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sort, setSort] = useState('Risk Level')
  const [selectedEntity, setSelectedEntity] = useState(null)
  const [tab, setTab] = useState('entities')
  const [showAllIfEmpty, setShowAllIfEmpty] = useState(false)

  // Synchronize when URL search param changes
  useEffect(() => {
    const nextCase = searchParams.get('case')
    const nextQuery = searchParams.get('q')

    if (nextCase) {
      setCaseFilter(nextCase)
    }

    if (nextQuery !== null) {
      setSearch(nextQuery)
    }
  }, [searchParams])

  // Active Case Object — matched robustly by ID or caseNumber
  const currentCase = useMemo(() => {
    if (caseFilter === 'all') {
      return null
    }

    return (
      allCases.find(
        c =>
          String(c.id) === String(caseFilter) ||
          c.caseNumber === caseFilter
      ) || null
    )
  }, [allCases, caseFilter])

  /*
   * Load evidence whenever a specific case is selected.
   *
   * Backend endpoint:
   * GET /api/v1/evidence/case/{caseId}
   */
  useEffect(() => {
    let cancelled = false

    const loadCaseEvidence = async () => {
      if (!currentCase?.id) {
        setCaseEvidence([])
        setEvidenceError('')
        return
      }

      setEvidenceLoading(true)
      setEvidenceError('')

      try {
        const response = await fetch(
          `${API_BASE_URL}/evidence/case/${currentCase.id}`
        )

        if (!response.ok) {
          throw new Error(
            `Evidence request failed with status ${response.status}`
          )
        }

        const data = await response.json()

        if (!cancelled) {
          setCaseEvidence(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        if (!cancelled) {
          setCaseEvidence([])
          setEvidenceError(
            error?.message || 'Unable to load case evidence.'
          )
        }
      } finally {
        if (!cancelled) {
          setEvidenceLoading(false)
        }
      }
    }

    loadCaseEvidence()

    return () => {
      cancelled = true
    }
  }, [currentCase?.id])

  /* Search suggestions from live nodes */
  const suggestions = useMemo(
    () =>
      search.length > 1
        ? nodes
            .filter(e =>
              e.name?.toLowerCase().includes(search.toLowerCase())
            )
            .slice(0, 6)
        : [],
    [search, nodes]
  )

  /* Filtered & sorted entities */
  const filtered = useMemo(() => {
    let list = [...nodes]

    // Case filter
    if (
      caseFilter !== 'all' &&
      currentCase &&
      !showAllIfEmpty
    ) {
      const caseEntities = list.filter(e => {
        const matchesCaseId =
          e.caseId &&
          String(e.caseId) === String(currentCase.id)

        const matchesCaseIds =
          Array.isArray(e.caseIds) &&
          e.caseIds.some(
            cid => String(cid) === String(currentCase.id)
          )

        const matchesArray =
          Array.isArray(currentCase.entities) &&
          currentCase.entities.includes(e.id)

        const matchesSource =
          currentCase.sourceFiles &&
          e.sourceFile &&
          currentCase.sourceFiles.includes(e.sourceFile)

        return (
          matchesCaseId ||
          matchesCaseIds ||
          matchesArray ||
          matchesSource
        )
      })

      list = caseEntities
    }

    // Search query filter
    if (search) {
      const q = search.toLowerCase()

      list = list.filter(
        e =>
          e.name?.toLowerCase().includes(q) ||
          e.role?.toLowerCase().includes(q) ||
          e.location?.toLowerCase().includes(q) ||
          (Array.isArray(e.tags) &&
            e.tags.some(t =>
              t.toLowerCase().includes(q)
            ))
      )
    }

    // Risk filter
    if (riskFilter !== 'all') {
      list = list.filter(e => e.risk === riskFilter)
    }

    // Entity type filter
    if (typeFilter !== 'all') {
      list = list.filter(e => e.type === typeFilter)
    }

    const riskRank = {
      high: 0,
      medium: 1,
      low: 2
    }

    if (sort === 'Risk Level') {
      list.sort(
        (a, b) =>
          (riskRank[a.risk] ?? 3) -
          (riskRank[b.risk] ?? 3)
      )
    }

    if (sort === 'Name A–Z') {
      list.sort((a, b) =>
        (a.name || '').localeCompare(b.name || '')
      )
    }

    if (sort === 'Most Connected') {
      list.sort(
        (a, b) =>
          (b.connections || 0) -
          (a.connections || 0)
      )
    }

    if (sort === 'Last Seen') {
      list.sort(
        (a, b) =>
          new Date(b.lastSeen || 0) -
          new Date(a.lastSeen || 0)
      )
    }

    return list
  }, [
    nodes,
    search,
    caseFilter,
    riskFilter,
    typeFilter,
    sort,
    currentCase,
    showAllIfEmpty
  ])

  /*
   * Evidence statistics for selected case.
   */
  const evidenceStats = useMemo(() => {
    const total = caseEvidence.length

    const processed = caseEvidence.filter(
      e => normalizeStatus(e.status) === 'PROCESSED'
    ).length

    const processing = caseEvidence.filter(
      e =>
        normalizeStatus(e.status) === 'PROCESSING' ||
        normalizeStatus(e.status) === 'UPLOADED'
    ).length

    const failed = caseEvidence.filter(
      e => normalizeStatus(e.status) === 'FAILED'
    ).length

    const archived = caseEvidence.filter(
      e => normalizeStatus(e.status) === 'ARCHIVED'
    ).length

    const cdr = caseEvidence.filter(
      e =>
        String(e.sourceType || '').toUpperCase() === 'CDR'
    ).length

    const financial = caseEvidence.filter(
      e =>
        String(e.sourceType || '').toUpperCase() ===
        'FINANCIAL_TRANSACTION'
    ).length

    return {
      total,
      processed,
      processing,
      failed,
      archived,
      cdr,
      financial
    }
  }, [caseEvidence])

  /*
   * Case-level intelligence summary.
   */
  const caseOverview = useMemo(() => {
    const entityIds = new Set(
      filtered.map(entity => String(entity.id))
    )

    const caseLinks = links.filter(link => {
      const sourceId = String(link.source?.id || link.source)
      const targetId = String(link.target?.id || link.target)

      return entityIds.has(sourceId) && entityIds.has(targetId)
    })

    const highRisk = filtered.filter(
      entity => String(entity.risk || '').toLowerCase() === 'high'
    ).length

    const mediumRisk = filtered.filter(
      entity => String(entity.risk || '').toLowerCase() === 'medium'
    ).length

    const typeCounts = filtered.reduce((acc, entity) => {
      const type = entity.type || 'Unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})

    const topEntityType =
      Object.entries(typeCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'None'

    return {
      entities: filtered.length,
      relationships: caseLinks.length,
      highRisk,
      mediumRisk,
      topEntityType
    }
  }, [filtered, links])

  /*
   * Real timeline events derived from cases, evidence and entities.
   */
  const filteredEvents = useMemo(() => {
    const evts = []

    if (currentCase) {
      evts.push({
        id: `c-init-${currentCase.id}`,
        title: `Investigation Docket Opened: ${currentCase.title}`,
        date: currentCase.createdAt
          ? new Date(currentCase.createdAt)
              .toISOString()
              .slice(0, 10)
          : 'Current',
        risk:
          currentCase.priority?.toLowerCase() ||
          'medium',
        type: 'DOCKET_REGISTRATION'
      })

      caseEvidence.forEach(evidence => {
        evts.push({
          id: `evidence-${evidence.id}`,
          title: `Evidence Ingested: ${
            evidence.fileName ||
            evidence.evidenceNumber ||
            `Evidence #${evidence.id}`
          }`,
          date:
            evidence.uploadedAt ||
            evidence.createdAt ||
            'Current',
          risk:
            normalizeStatus(evidence.status) === 'FAILED'
              ? 'high'
              : normalizeStatus(evidence.status) ===
                  'PROCESSING'
                ? 'medium'
                : 'low',
          type:
            evidence.sourceType ||
            evidence.fileType ||
            'EVIDENCE'
        })
      })
    }

    filtered.forEach(e => {
      if (e.lastSeen) {
        evts.push({
          id: `ent-seen-${e.id}`,
          title: `Suspect Telemetry / Sighting: ${e.name}`,
          date: e.lastSeen,
          risk: e.risk || 'low',
          type:
            e.type?.toUpperCase() ||
            'INTEL'
        })
      }
    })

    return evts.sort(
      (a, b) =>
        new Date(b.date) - new Date(a.date)
    )
  }, [currentCase, filtered, caseEvidence])

  const se = selectedEntity

  // Compute live relational links for selected entity
  const selectedEntityLinks = useMemo(() => {
    if (!se) {
      return []
    }

    return links.filter(
      l =>
        (l.source?.id || l.source) === se.id ||
        (l.target?.id || l.target) === se.id
    )
  }, [se, links])

  const selectedEntityEvidence = useMemo(() => {
    if (!se) return []

    const selectedId = String(se.id)

    return caseEvidence.filter(evidence => {
      const candidates = [
        evidence.entityId,
        evidence.nodeId,
        evidence.subjectId,
        evidence.targetId,
        evidence.sourceEntityId
      ]

      if (
        candidates.some(
          value =>
            value !== null &&
            value !== undefined &&
            String(value) === selectedId
        )
      ) {
        return true
      }

      if (
        Array.isArray(evidence.entityIds) &&
        evidence.entityIds.some(id => String(id) === selectedId)
      ) {
        return true
      }

      if (
        Array.isArray(evidence.entities) &&
        evidence.entities.some(
          entity => String(entity?.id ?? entity) === selectedId
        )
      ) {
        return true
      }

      const sourceText = [
        evidence.fileName,
        evidence.sourceFile,
        evidence.extractedText,
        evidence.description
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return Boolean(
        se.name &&
          sourceText.includes(String(se.name).toLowerCase())
      )
    })
  }, [se, caseEvidence])

  const selectedEntityRelationSummary = useMemo(() => {
    if (!se) {
      return {
        total: 0,
        incoming: 0,
        outgoing: 0,
        types: []
      }
    }

    const selectedId = String(se.id)
    const counts = {}
    let incoming = 0
    let outgoing = 0

    selectedEntityLinks.forEach(link => {
      const sourceId = String(link.source?.id ?? link.source)
      const targetId = String(link.target?.id ?? link.target)

      if (sourceId === selectedId) outgoing += 1
      if (targetId === selectedId) incoming += 1

      const type =
        link.type ||
        link.relationType ||
        link.relationshipType ||
        'RELATED'

      counts[type] = (counts[type] || 0) + 1
    })

    return {
      total: selectedEntityLinks.length,
      incoming,
      outgoing,
      types: Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    }
  }, [se, selectedEntityLinks])

  const selectedEntityConfidence = Number(se?.confidence ?? 0)
  const selectedEntityRisk = String(se?.risk || 'low').toLowerCase()
  const selectedEntityStatus = normalizeStatus(se?.status || 'ACTIVE')
  const selectedEntityConnections = Math.max(
    selectedEntityLinks.length,
    Number(se?.connections || 0)
  )

  const eventColor = {
    high: 'var(--danger)',
    medium: 'var(--warning)',
    low: 'var(--success)'
  }

  const currentStatus = normalizeStatus(
    currentCase?.status
  )

  const currentPriority = normalizePriority(
    currentCase?.priority
  )

  const buildCaseRoute = (path, extraParams = {}) => {
    const params = new URLSearchParams()

    if (currentCase?.id) {
      params.set('case', currentCase.id)
    }

    Object.entries(extraParams).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.set(key, value)
      }
    })

    const query = params.toString()
    return query ? `${path}?${query}` : path
  }

  const openEntityInNetwork = entity => {
    if (!entity) return

    const entityId = entity.id ?? entity.nodeId
    if (entityId === null || entityId === undefined) return

    navigate(
      buildCaseRoute('/network', {
        entity: entityId
      })
    )
  }

  return (
    <div style={{ paddingBottom: 40 }}>
      <div className="page-header">
        <h1>
          <span className="page-icon">
            <Search size={20} />
          </span>
          Investigation Workbench
        </h1>

        <p>
          Search, filter and interrogate criminal entities
          and active case dockets.
        </p>
      </div>

      {/* Case Selector Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 16,
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <button
          className={`btn btn-sm ${
            caseFilter === 'all'
              ? 'btn-primary'
              : 'btn-outline'
          }`}
          onClick={() => {
            setCaseFilter('all')
            setSelectedEntity(null)
            navigate('/investigation')
          }}
        >
          All Cases ({allCases.length})
        </button>

        {allCases.map(c => {
          const isActiveTab =
            String(caseFilter) === String(c.id) ||
            caseFilter === c.caseNumber

          const caseStatus = normalizeStatus(
            c.status
          )

         
        })}

        <button
          className="btn btn-sm btn-ghost"
          onClick={() => navigate('/cases')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            color: 'var(--primary)'
          }}
        >
          <Plus size={13} />
          Manage Cases
        </button>
      </div>

      {/* Active Case Banner */}
      {currentCase && (
        <>
          <div
            className="card anim-fade-up"
            style={{
              padding: '16px 20px',
              marginBottom: 16,
              background: '#FFFFFF',
              border: '1px solid var(--border)',
              borderLeft: `4px solid ${statusColor(
                currentStatus
              )}`,
              boxShadow: 'var(--shadow-card)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 16
              }}
            >
              <div
                style={{
                  flex: 1,
                  minWidth: 280
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 6,
                    flexWrap: 'wrap'
                  }}
                >
                  <FolderOpen
                    size={16}
                    color="var(--primary)"
                  />

                  <span
                    style={{
                      fontSize: '0.74rem',
                      color: 'var(--primary)',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    CASE:{' '}
                    {currentCase.caseNumber ||
                      `CASE-${currentCase.id}`}
                  </span>

                  <span
                    className={`badge ${
                      currentStatus === 'ACTIVE'
                        ? 'badge-danger'
                        : currentStatus === 'ON_HOLD'
                          ? 'badge-warning'
                          : currentStatus ===
                              'CLOSED'
                            ? 'badge-success'
                            : 'badge-primary'
                    }`}
                  >
                    {currentStatus || 'OPEN'}
                  </span>

                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color:
                        priorityColor(
                          currentPriority
                        ),
                      background:
                        'rgba(255,255,255,0.06)',
                      padding: '2px 8px',
                      borderRadius: 4
                    }}
                  >
                    {currentPriority} PRIORITY
                  </span>
                </div>

                <h3
                  style={{
                    margin: '0 0 6px',
                    fontSize: '1.2rem',
                    color: 'var(--text)'
                  }}
                >
                  {currentCase.title}
                </h3>

                <p
                  style={{
                    margin: 0,
                    fontSize: '0.84rem',
                    color: 'var(--muted)',
                    maxWidth: 800,
                    lineHeight: 1.5
                  }}
                >
                  {currentCase.description ||
                    'No case synopsis recorded. Ingest intelligence reports to associate suspects and evidence.'}
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  textAlign: 'right'
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      color: 'var(--muted)'
                    }}
                  >
                    Lead Investigator:{' '}
                  </span>

                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: 'var(--text)'
                    }}
                  >
                    {currentCase.investigator ||
                      currentCase.leadAnalyst ||
                      'Lead Investigator'}
                  </span>
                </div>

                <div>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      color: 'var(--muted)'
                    }}
                  >
                    Department:{' '}
                  </span>

                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: 'var(--muted-dark)'
                    }}
                  >
                    {currentCase.department ||
                      'Crime Branch'}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    marginTop: 4,
                    justifyContent: 'flex-end'
                  }}
                >
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() =>
                      navigate(buildCaseRoute('/upload'))
                    }
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <Upload size={12} />
                    Ingest Evidence
                  </button>

                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() =>
                      navigate(buildCaseRoute('/network'))
                    }
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 10px'
                    }}
                  >
                    View Network
                  </button>

                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => handleDeleteCase(currentCase)}
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 10px',
                      color: 'var(--danger)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Trash2 size={12} />
                    Delete Docket
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Investigation Overview */}
          <div
            className="card anim-fade-up"
            style={{
              padding: 16,
              marginBottom: 20
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
                gap: 12,
                flexWrap: 'wrap'
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    color: 'var(--primary)',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.07em'
                  }}
                >
                  <ShieldAlert size={13} />
                  INVESTIGATION OVERVIEW
                </div>

                <h3
                  style={{
                    margin: '4px 0 0',
                    fontSize: '1rem',
                    color: 'var(--text)'
                  }}
                >
                  Case Intelligence Summary
                </h3>
              </div>

              {evidenceLoading && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--muted)'
                  }}
                >
                  Syncing evidence...
                </span>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(125px, 1fr))',
                gap: 10,
                marginBottom: 14
              }}
            >
              {[
                {
                  label: 'Entities',
                  value: caseOverview.entities,
                  icon: Users,
                  color: 'var(--primary)'
                },
                {
                  label: 'Relationships',
                  value: caseOverview.relationships,
                  icon: Link2,
                  color: 'var(--primary)'
                },
                {
                  label: 'High Risk',
                  value: caseOverview.highRisk,
                  icon: AlertTriangle,
                  color: 'var(--danger)'
                },
                {
                  label: 'Medium Risk',
                  value: caseOverview.mediumRisk,
                  icon: ShieldAlert,
                  color: 'var(--warning)'
                },
                {
                  label: 'Evidence',
                  value: evidenceStats.total,
                  icon: FileText,
                  color: 'var(--primary)'
                },
                {
                  label: 'Processed',
                  value: evidenceStats.processed,
                  icon: CheckCircle2,
                  color: 'var(--success)'
                }
              ].map(stat => {
                const Icon = stat.icon

                return (
                  <div
                    key={stat.label}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 12px',
                      background: 'var(--panel)'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.68rem',
                          color: 'var(--muted)'
                        }}
                      >
                        {stat.label}
                      </span>

                      <Icon size={13} color={stat.color} />
                    </div>

                    <div
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        color: 'var(--text)',
                        marginTop: 4
                      }}
                    >
                      {stat.value}
                    </div>
                  </div>
                )
              })}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'minmax(0, 1.3fr) minmax(220px, 0.7fr)',
                gap: 12
              }}
            >
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 12
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--primary)',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    marginBottom: 7
                  }}
                >
                  CASE SIGNAL
                </div>

                <div
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text)',
                    lineHeight: 1.5
                  }}
                >
                  {caseOverview.entities > 0
                    ? `${caseOverview.entities} entities are currently associated with this investigation, with ${caseOverview.relationships} mapped relationships.`
                    : 'No entities are currently linked to this investigation.'}
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                    marginTop: 9
                  }}
                >
                  <span className="badge badge-primary">
                    Primary Type: {caseOverview.topEntityType}
                  </span>

                  <span
                    className={`badge ${
                      evidenceStats.failed > 0
                        ? 'badge-danger'
                        : evidenceStats.processing > 0
                          ? 'badge-warning'
                          : 'badge-success'
                    }`}
                  >
                    {evidenceStats.failed > 0
                      ? `${evidenceStats.failed} failed evidence`
                      : evidenceStats.processing > 0
                        ? `${evidenceStats.processing} processing`
                        : 'Evidence pipeline stable'}
                  </span>
                </div>
              </div>

              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: 12
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--primary)',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    marginBottom: 7
                  }}
                >
                  EVIDENCE MIX
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 7
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.74rem'
                    }}
                  >
                    <span style={{ color: 'var(--muted)' }}>CDR</span>
                    <strong style={{ color: 'var(--text)' }}>
                      {evidenceStats.cdr}
                    </strong>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.74rem'
                    }}
                  >
                    <span style={{ color: 'var(--muted)' }}>Financial</span>
                    <strong style={{ color: 'var(--text)' }}>
                      {evidenceStats.financial}
                    </strong>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.74rem'
                    }}
                  >
                    <span style={{ color: 'var(--muted)' }}>Other Evidence</span>
                    <strong style={{ color: 'var(--text)' }}>
                      {Math.max(
                        0,
                        evidenceStats.total -
                          evidenceStats.cdr -
                          evidenceStats.financial
                      )}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {evidenceError && (
              <div
                style={{
                  padding: '9px 12px',
                  marginTop: 10,
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  background: 'rgba(239,68,68,0.06)',
                  color: 'var(--danger)',
                  fontSize: '0.76rem'
                }}
              >
                {evidenceError}
              </div>
            )}

            {/* Unified case workflow */}
            <div
              style={{
                marginTop: 12,
                padding: '10px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--panel)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                  marginBottom: 8
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.68rem',
                      color: 'var(--primary)',
                      fontWeight: 700,
                      letterSpacing: '0.06em'
                    }}
                  >
                    INVESTIGATION WORKFLOW
                  </div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--muted)',
                      marginTop: 2
                    }}
                  >
                    Keep evidence ingestion, network analysis and entity review in the same case context.
                  </div>
                </div>

                <span className="badge badge-primary">
                  {currentCase.caseNumber || `CASE-${currentCase.id}`}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 7
                }}
              >
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => navigate(buildCaseRoute('/upload'))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    fontSize: '0.7rem'
                  }}
                >
                  <Upload size={11} />
                  Add Evidence
                </button>

                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => navigate(buildCaseRoute('/network'))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    fontSize: '0.7rem'
                  }}
                >
                  <Network size={11} />
                  Explore Network
                </button>

                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => setTab('timeline')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    fontSize: '0.7rem'
                  }}
                >
                  <Clock size={11} />
                  Review Timeline
                </button>
              </div>
            </div>

            {caseEvidence.length > 0 && (
              <div
                style={{
                  marginTop: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 7
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--muted)',
                    fontWeight: 700,
                    letterSpacing: '0.05em'
                  }}
                >
                  RECENT CASE EVIDENCE
                </div>

                {caseEvidence.slice(0, 4).map(evidence => (
                  <div
                    key={evidence.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      padding: '8px 10px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    <div
                      style={{
                        minWidth: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8
                      }}
                    >
                      <FileText size={13} color="var(--primary)" />

                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.76rem',
                            fontWeight: 600,
                            color: 'var(--text)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {evidence.fileName ||
                            evidence.evidenceNumber ||
                            `Evidence #${evidence.id}`}
                        </div>

                        <div
                          style={{
                            fontSize: '0.66rem',
                            color: 'var(--muted)',
                            marginTop: 2
                          }}
                        >
                          {evidence.sourceType ||
                            evidence.fileType ||
                            'EVIDENCE'}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`badge ${evidenceStatusClass(
                        evidence.status
                      )}`}
                    >
                      {normalizeStatus(evidence.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Main layout */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: se
            ? '280px 1fr 340px'
            : '280px 1fr',
          gap: 20
        }}
      >
        {/* Sidebar filters */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          {/* Search */}
          <div
            className="card"
            style={{
              padding: '14px 16px'
            }}
          >
            <SearchBar
              placeholder="Search suspects, roles…"
              onSearch={setSearch}
              suggestions={suggestions}
              size="sm"
            />
          </div>

          {/* Filters */}
          <div className="card">
            <div className="card-title">
              <Filter size={13} />
              Filters
            </div>

            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--muted)',
                  marginBottom: 8,
                  fontWeight: 600
                }}
              >
                RISK LEVEL
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}
              >
                {[
                  'all',
                  'high',
                  'medium',
                  'low'
                ].map(r => (
                  <button
                    key={r}
                    onClick={() =>
                      setRiskFilter(r)
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 10px',
                      borderRadius:
                        'var(--radius-md)',
                      border: '1px solid',
                      borderColor:
                        riskFilter === r
                          ? 'var(--border-glow)'
                          : 'transparent',
                      background:
                        riskFilter === r
                          ? 'var(--primary-dim)'
                          : 'transparent',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      color:
                        riskFilter === r
                          ? 'var(--primary)'
                          : 'var(--muted)',
                      textAlign: 'left',
                      textTransform:
                        'capitalize',
                      fontWeight:
                        riskFilter === r
                          ? 600
                          : 400,
                      transition:
                        'all var(--transition)'
                    }}
                  >
                    {r !== 'all' && (
                      <span
                        className={`risk-dot ${r}`}
                      />
                    )}

                    {r === 'all'
                      ? 'All risks'
                      : `${r} risk`}
                  </button>
                ))}
              </div>
            </div>

            <div
              className="divider"
              style={{
                margin: '12px 0'
              }}
            />

            <div style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--muted)',
                  marginBottom: 8,
                  fontWeight: 600
                }}
              >
                ENTITY TYPE
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}
              >
                {[
                  'all',
                  'Person',
                  'Organization',
                  'Location',
                  'Vehicle',
                  'Phone',
                  'Wallet',
                  'Account'
                ].map(t => (
                  <button
                    key={t}
                    onClick={() =>
                      setTypeFilter(t)
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 10px',
                      borderRadius:
                        'var(--radius-md)',
                      border: '1px solid',
                      borderColor:
                        typeFilter === t
                          ? 'var(--border-glow)'
                          : 'transparent',
                      background:
                        typeFilter === t
                          ? 'var(--primary-dim)'
                          : 'transparent',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      color:
                        typeFilter === t
                          ? 'var(--primary)'
                          : 'var(--muted)',
                      textAlign: 'left',
                      textTransform:
                        'capitalize',
                      fontWeight:
                        typeFilter === t
                          ? 600
                          : 400,
                      transition:
                        'all var(--transition)'
                    }}
                  >
                    {t === 'all'
                      ? 'All types'
                      : t}
                  </button>
                ))}
              </div>
            </div>

            <div
              className="divider"
              style={{
                margin: '12px 0'
              }}
            />

            <div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--muted)',
                  marginBottom: 8,
                  fontWeight: 600
                }}
              >
                SORT BY
              </div>

              <select
                className="input"
                style={{
                  width: '100%',
                  fontSize: '0.8rem'
                }}
                value={sort}
                onChange={e =>
                  setSort(e.target.value)
                }
              >
                {SORT_OPTIONS.map(o => (
                  <option
                    key={o}
                    value={o}
                  >
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Center column */}
        <div>
          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom:
                '1px solid var(--border)',
              marginBottom: 16
            }}
          >
            {[
              'entities',
              'timeline'
            ].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding:
                    '10px 20px',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${
                    tab === t
                      ? 'var(--primary)'
                      : 'transparent'
                  }`,
                  color:
                    tab === t
                      ? 'var(--primary)'
                      : 'var(--muted)',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform:
                    'capitalize',
                  transition:
                    'color var(--transition)',
                  marginBottom: -1
                }}
              >
                {t === 'entities' ? (
                  <span
                    style={{
                      display: 'flex',
                      alignItems:
                        'center',
                      gap: 6
                    }}
                  >
                    <Users size={13} />
                    {filtered.length}{' '}
                    Entities
                  </span>
                ) : (
                  <span
                    style={{
                      display: 'flex',
                      alignItems:
                        'center',
                      gap: 6
                    }}
                  >
                    <Clock size={13} />
                    Timeline (
                    {filteredEvents.length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Entity Tab */}
          {tab === 'entities' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}
            >
              {nodes.length === 0 ? (
                <div
                  className="empty-state card"
                  style={{
                    padding: '36px 20px',
                    textAlign: 'center'
                  }}
                >
                  <div
                    className="icon"
                    style={{
                      fontSize: '2rem',
                      marginBottom: 10
                    }}
                  >
                    🔍
                  </div>

                  <h3
                    style={{
                      margin: '0 0 6px',
                      color: 'var(--text)'
                    }}
                  >
                    No Criminal Entities
                    Registered
                  </h3>

                  <p
                    style={{
                      margin:
                        '0 0 16px',
                      color:
                        'var(--muted)',
                      fontSize:
                        '0.85rem',
                      maxWidth: 460
                    }}
                  >
                    The intelligence
                    repository is currently
                    empty. Ingest FIRs, CDR
                    files, or seizure reports
                    to automatically extract
                    suspects, vehicles, and
                    organizations.
                  </p>

                  <button
                    className="btn btn-primary"
                    onClick={() =>
                      navigate('/upload')
                    }
                    style={{
                      display:
                        'inline-flex',
                      alignItems:
                        'center',
                      gap: 8
                    }}
                  >
                    <Upload size={14} />
                    Ingest Evidence Files
                  </button>
                </div>
              ) : filtered.length === 0 ? (
                <div
                  className="empty-state card"
                  style={{
                    padding: '36px 20px',
                    textAlign: 'center'
                  }}
                >
                  <div
                    className="icon"
                    style={{
                      fontSize: '2rem',
                      marginBottom: 10
                    }}
                  >
                    📂
                  </div>

                  <h3
                    style={{
                      margin: '0 0 6px',
                      color: 'var(--text)'
                    }}
                  >
                    {currentCase
                      ? `No suspects linked to Docket "${currentCase.title}"`
                      : 'No entities match current filters'}
                  </h3>

                  <p
                    style={{
                      margin:
                        '0 0 16px',
                      color:
                        'var(--muted)',
                      fontSize:
                        '0.85rem',
                      maxWidth: 460
                    }}
                  >
                    {currentCase
                      ? 'No entities are isolated specifically to this docket. Ingest files for this docket, or view all suspects currently active across the network.'
                      : 'Try adjusting your search query, risk filter, or category selector.'}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      gap: 10,
                      justifyContent:
                        'center'
                    }}
                  >
                    {currentCase && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() =>
                          setShowAllIfEmpty(
                            !showAllIfEmpty
                          )
                        }
                      >
                        {showAllIfEmpty
                          ? 'Filter to Docket Only'
                          : 'Browse All Network Suspects'}
                      </button>
                    )}

                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        setRiskFilter(
                          'all'
                        )
                        setTypeFilter(
                          'all'
                        )
                        setSearch('')
                      }}
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
                    onClick={() =>
                      setSelectedEntity(
                        selectedEntity?.id ===
                          e.id
                          ? null
                          : e
                      )
                    }
                    onDelete={(id) => {
                      if (window.confirm(`Are you sure you want to remove node "${e.name || e.id}" from graph?`)) {
                        useGraphStore.getState().removeNode(id)
                      }
                    }}
                  />
                ))
              )}
            </div>
          )}

          {/* Timeline Tab */}
          {tab === 'timeline' && (
            <div
              style={{
                position: 'relative',
                paddingLeft: 28
              }}
            >
              {filteredEvents.length ===
              0 ? (
                <div
                  className="card"
                  style={{
                    padding: '30px',
                    textAlign: 'center',
                    color:
                      'var(--muted)',
                    fontSize:
                      '0.85rem'
                  }}
                >
                  No timeline events logged
                  for this case. Ingest
                  surveillance or call logs
                  to construct chronology.
                </div>
              ) : (
                <>
                  <div
                    style={{
                      position:
                        'absolute',
                      left: 10,
                      top: 0,
                      bottom: 0,
                      width: 2,
                      background:
                        'var(--border)',
                      borderRadius: 99
                    }}
                  />

                  {filteredEvents.map(
                    ev => (
                      <div
                        key={ev.id}
                        className="anim-fade-up"
                        style={{
                          position:
                            'relative',
                          marginBottom: 20
                        }}
                      >
                        <div
                          style={{
                            position:
                              'absolute',
                            left: -23,
                            top: 6,
                            width: 12,
                            height: 12,
                            borderRadius:
                              '50%',
                            background:
                              eventColor[
                                ev.risk
                              ] ||
                              'var(--muted)',
                            boxShadow: `0 0 8px ${
                              eventColor[
                                ev.risk
                              ] ||
                              'var(--muted)'
                            }`,
                            border:
                              '2px solid var(--bg)'
                          }}
                        />

                        <div
                          className="card"
                          style={{
                            padding:
                              '12px 16px',
                            cursor:
                              'pointer'
                          }}
                          onMouseEnter={e =>
                            (e.currentTarget.style.borderColor =
                              'var(--border-glow)')
                          }
                          onMouseLeave={e =>
                            (e.currentTarget.style.borderColor =
                              'var(--border)')
                          }
                        >
                          <div
                            style={{
                              display:
                                'flex',
                              justifyContent:
                                'space-between',
                              marginBottom: 4
                            }}
                          >
                            <span
                              style={{
                                fontSize:
                                  '0.875rem',
                                fontWeight: 600,
                                color:
                                  'var(--text)'
                              }}
                            >
                              {ev.title}
                            </span>

                            <span
                              style={{
                                fontSize:
                                  '0.75rem',
                                color:
                                  'var(--muted)',
                                flexShrink: 0,
                                marginLeft: 8
                              }}
                            >
                              {ev.date}
                            </span>
                          </div>

                          <div
                            style={{
                              display:
                                'flex',
                              gap: 8,
                              alignItems:
                                'center'
                            }}
                          >
                            <span
                              className={`badge ${
                                ev.risk ===
                                'high'
                                  ? 'badge-danger'
                                  : ev.risk ===
                                      'medium'
                                    ? 'badge-warning'
                                    : 'badge-success'
                              }`}
                            >
                              {ev.risk}
                            </span>

                            <span
                              style={{
                                fontSize:
                                  '0.72rem',
                                color:
                                  'var(--muted)'
                              }}
                            >
                              Type:{' '}
                              {ev.type}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right column: Selected entity detail panel */}
        {se && (
          <div
            className="card anim-fade-up"
            style={{
              padding: 20,
              position: 'sticky',
              top: 80,
              height: 'fit-content',
              maxHeight: 'calc(100vh - 100px)',
              overflowY: 'auto'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14
              }}
            >
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase'
                }}
              >
                Entity Dossier // {se.type || 'Unknown'}
              </span>

              <button
                onClick={() => setSelectedEntity(null)}
                aria-label="Close entity dossier"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  padding: 4
                }}
              >
                ✕
              </button>
            </div>

            {/* Identity */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background:
                    'linear-gradient(135deg, var(--panel-light), #0f172a)',
                  border: `2px solid ${
                    selectedEntityRisk === 'high'
                      ? 'var(--danger)'
                      : selectedEntityRisk === 'medium'
                        ? 'var(--warning)'
                        : 'var(--primary)'
                  }`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: 'var(--text)'
                }}
              >
                {se.avatar ||
                  (se.name
                    ? se.name
                        .split(' ')
                        .map(w => w[0])
                        .slice(0, 2)
                        .join('')
                    : '?')}
              </div>

              <h3
                style={{
                  margin: '0 0 4px',
                  fontSize: '1.1rem',
                  color: 'var(--text)'
                }}
              >
                {se.name || 'Unnamed Entity'}
              </h3>

              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--muted)'
                }}
              >
                {se.role || se.type || 'Unknown role'}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: 10,
                  flexWrap: 'wrap'
                }}
              >
                <span
                  className={`badge ${
                    selectedEntityRisk === 'high'
                      ? 'badge-danger'
                      : selectedEntityRisk === 'medium'
                        ? 'badge-warning'
                        : 'badge-success'
                  }`}
                >
                  {selectedEntityRisk.toUpperCase()} RISK
                </span>

                <span className="badge badge-primary">
                  {se.type || 'Unknown'}
                </span>

                <span className="badge badge-primary">
                  {selectedEntityStatus}
                </span>
              </div>
            </div>

            {/* Cross-Case Intelligence Match Box */}
            {(() => {
              const relCases = getRelatedCasesForEntity(se)
              if (relCases.length === 0) return null
              return (
                <div
                  style={{
                    margin: '12px 0 16px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: '#FEF2F2',
                    border: '1.5px solid #FCA5A5',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: '0.82rem', color: '#991B1B', marginBottom: 6 }}>
                    <FolderOpen size={14} color="#DC2626" />
                    <span>Cross-Case Suspect Correlation ({relCases.length} {relCases.length === 1 ? 'Case' : 'Cases'})</span>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#7F1D1D', marginBottom: 8 }}>
                    Suspect identified in prior registered case dockets:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {relCases.map(c => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setCaseFilter(c.id)
                          navigate(`/investigation?case=${c.id}`)
                        }}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: '#FFFFFF',
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: '1px solid #FECACA',
                          cursor: 'pointer',
                          fontSize: '0.74rem'
                        }}
                        title="Click to switch to this case docket"
                      >
                        <strong style={{ color: '#DC2626' }}>{c.caseNumber || c.id}</strong>
                        <span style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                          {c.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Investigator actions */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
                marginBottom: 14
              }}
            >
              <button
                className="btn btn-sm btn-primary"
                onClick={() => openEntityInNetwork(se)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <Network size={13} />
                Network
              </button>

              <button
                className="btn btn-sm btn-outline"
                onClick={() => setTab('timeline')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <Clock size={13} />
                Timeline
              </button>
            </div>

            {/* Key intelligence metrics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: 8,
                marginBottom: 14
              }}
            >
              {[
                {
                  label: 'Connections',
                  value: selectedEntityConnections,
                  icon: Link2,
                  color: 'var(--primary)'
                },
                {
                  label: 'Evidence',
                  value: selectedEntityEvidence.length,
                  icon: FileText,
                  color: 'var(--warning)'
                },
                {
                  label: 'Confidence',
                  value:
                    selectedEntityConfidence > 0
                      ? `${Math.round(
                          Math.min(selectedEntityConfidence, 1) * 100
                        )}%`
                      : 'N/A',
                  icon: CheckCircle2,
                  color: 'var(--success)'
                },
                {
                  label: 'Risk',
                  value: selectedEntityRisk.toUpperCase(),
                  icon: AlertTriangle,
                  color:
                    selectedEntityRisk === 'high'
                      ? 'var(--danger)'
                      : selectedEntityRisk === 'medium'
                        ? 'var(--warning)'
                        : 'var(--success)'
                }
              ].map(metric => {
                const Icon = metric.icon

                return (
                  <div
                    key={metric.label}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '9px 10px',
                      background: 'var(--panel)'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.65rem',
                          color: 'var(--muted)'
                        }}
                      >
                        {metric.label}
                      </span>
                      <Icon size={12} color={metric.color} />
                    </div>

                    <div
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        color: 'var(--text)',
                        marginTop: 3
                      }}
                    >
                      {metric.value}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Entity metadata */}
            <div
              style={{
                borderTop: '1px solid var(--border)',
                paddingTop: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 9
              }}
            >
              {[
                {
                  label: 'Entity ID',
                  val: se.id ?? se.nodeId ?? '—',
                  icon: Hash
                },
                {
                  label: 'Status',
                  val: se.status || 'Active',
                  icon: Activity
                },
                {
                  label: 'Location',
                  val: se.location || 'Not recorded',
                  icon: MapPin
                },
                {
                  label: 'Source File',
                  val: se.sourceFile || 'Evidence DB',
                  icon: FileText
                },
                {
                  label: 'Last Activity',
                  val: se.lastSeen || 'Not recorded',
                  icon: CalendarDays
                }
              ].map(field => {
                const Icon = field.icon

                return (
                  <div
                    key={field.label}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '18px 1fr auto',
                      gap: 7,
                      alignItems: 'center',
                      fontSize: '0.76rem'
                    }}
                  >
                    <Icon size={12} color="var(--muted)" />

                    <span style={{ color: 'var(--muted)' }}>
                      {field.label}
                    </span>

                    <span
                      style={{
                        color: 'var(--text)',
                        fontWeight: 600,
                        textAlign: 'right',
                        maxWidth: 180,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                      title={String(field.val)}
                    >
                      {field.val}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Relationship intelligence */}
            <div
              style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: '1px solid var(--border)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--primary)',
                    fontWeight: 700,
                    letterSpacing: '0.06em'
                  }}
                >
                  RELATIONSHIP INTELLIGENCE
                </div>

                <span
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--muted)'
                  }}
                >
                  {selectedEntityRelationSummary.total} total
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  marginBottom: 9
                }}
              >
                <div
                  style={{
                    padding: '7px 9px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--panel)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.62rem',
                      color: 'var(--muted)'
                    }}
                  >
                    OUTGOING
                  </div>
                  <strong
                    style={{
                      fontSize: '0.9rem',
                      color: 'var(--text)'
                    }}
                  >
                    {selectedEntityRelationSummary.outgoing}
                  </strong>
                </div>

                <div
                  style={{
                    padding: '7px 9px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--panel)',
                    border: '1px solid var(--border)'
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.62rem',
                      color: 'var(--muted)'
                    }}
                  >
                    INCOMING
                  </div>
                  <strong
                    style={{
                      fontSize: '0.9rem',
                      color: 'var(--text)'
                    }}
                  >
                    {selectedEntityRelationSummary.incoming}
                  </strong>
                </div>
              </div>

              {selectedEntityRelationSummary.types.length > 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6
                  }}
                >
                  {selectedEntityRelationSummary.types.map(
                    ([type, count]) => (
                      <span
                        key={type}
                        className="badge badge-primary"
                      >
                        {type} · {count}
                      </span>
                    )
                  )}
                </div>
              ) : (
                <div
                  style={{
                    fontSize: '0.73rem',
                    color: 'var(--muted)'
                  }}
                >
                  No mapped relationships are available for this entity.
                </div>
              )}
            </div>

            {/* Connected entities */}
            {selectedEntityLinks.length > 0 && (
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: '1px solid var(--border)'
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--primary)',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    marginBottom: 8
                  }}
                >
                  CONNECTED ENTITIES
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}
                >
                  {selectedEntityLinks.slice(0, 6).map((link, index) => {
                    const source =
                      typeof link.source === 'object'
                        ? link.source
                        : nodes.find(
                            node =>
                              String(node.id) === String(link.source)
                          )

                    const target =
                      typeof link.target === 'object'
                        ? link.target
                        : nodes.find(
                            node =>
                              String(node.id) === String(link.target)
                          )

                    const selectedId = String(se.id)
                    const sourceId = String(
                      source?.id ?? link.source
                    )
                    const other =
                      sourceId === selectedId ? target : source

                    const relation =
                      link.type ||
                      link.relationType ||
                      link.relationshipType ||
                      'RELATED'

                    return (
                      <button
                        key={`${link.id ?? index}-${other?.id ?? 'unknown'}`}
                        onClick={() => {
                          if (other) setSelectedEntity(other)
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          border: '1px solid var(--border)',
                          background: 'var(--panel)',
                          borderRadius: 'var(--radius-md)',
                          padding: '8px 9px',
                          cursor: other ? 'pointer' : 'default',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8
                        }}
                      >
                        <span style={{ minWidth: 0 }}>
                          <span
                            style={{
                              display: 'block',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: 'var(--text)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {other?.name || 'Unknown entity'}
                          </span>

                          <span
                            style={{
                              display: 'block',
                              fontSize: '0.64rem',
                              color: 'var(--muted)',
                              marginTop: 2
                            }}
                          >
                            {relation}
                          </span>
                        </span>

                        <ArrowRight
                          size={12}
                          color="var(--muted)"
                          style={{ flexShrink: 0 }}
                        />
                      </button>
                    )
                  })}
                </div>

                {selectedEntityLinks.length > 6 && (
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => openEntityInNetwork(se)}
                    style={{
                      width: '100%',
                      marginTop: 7,
                      fontSize: '0.7rem'
                    }}
                  >
                    View all {selectedEntityLinks.length} connections
                    <ExternalLink size={11} />
                  </button>
                )}
              </div>
            )}

            {/* Evidence linked to this entity */}
            <div
              style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: '1px solid var(--border)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--primary)',
                    fontWeight: 700,
                    letterSpacing: '0.06em'
                  }}
                >
                  ENTITY EVIDENCE
                </div>

                <span
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--muted)'
                  }}
                >
                  {selectedEntityEvidence.length}
                </span>
              </div>

              {selectedEntityEvidence.length > 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}
                >
                  {selectedEntityEvidence.slice(0, 4).map(evidence => (
                    <div
                      key={evidence.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        padding: '7px 8px',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)'
                      }}
                    >
                      <div
                        style={{
                          minWidth: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 7
                        }}
                      >
                        <FileText
                          size={12}
                          color="var(--primary)"
                          style={{ flexShrink: 0 }}
                        />

                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              color: 'var(--text)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {evidence.fileName ||
                              evidence.evidenceNumber ||
                              `Evidence #${evidence.id}`}
                          </div>

                          <div
                            style={{
                              fontSize: '0.61rem',
                              color: 'var(--muted)',
                              marginTop: 2
                            }}
                          >
                            {evidence.sourceType ||
                              evidence.fileType ||
                              'EVIDENCE'}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`badge ${evidenceStatusClass(
                          evidence.status
                        )}`}
                        style={{ flexShrink: 0 }}
                      >
                        {normalizeStatus(evidence.status)}
                      </span>
                    </div>
                  ))}

                  {selectedEntityEvidence.length > 4 && (
                    <div
                      style={{
                        fontSize: '0.66rem',
                        color: 'var(--muted)',
                        textAlign: 'center'
                      }}
                    >
                      +{selectedEntityEvidence.length - 4} more evidence
                      records
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--muted)',
                    lineHeight: 1.45
                  }}
                >
                  No evidence record can be directly attributed to this
                  entity from the currently loaded case evidence.
                </div>
              )}
            </div>

            {se.bio && (
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: '1px solid var(--border)'
                }}
              >
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--primary)',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    marginBottom: 4
                  }}
                >
                  INTELLIGENCE BRIEF
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: '0.76rem',
                    color: 'var(--muted)',
                    lineHeight: 1.5
                  }}
                >
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
