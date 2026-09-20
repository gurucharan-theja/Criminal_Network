import { useState, useEffect, useMemo } from 'react'
import {
  Users,
  AlertTriangle,
  FolderOpen,
  Package,
  Activity,
  TrendingUp,
  Clock,
  Plus,
  Upload,
  ArrowRight,
  ShieldCheck,
  FileText,
  Phone,
  WalletCards,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import StatCard from '../components/StatCard'
import EntityCard from '../components/EntityCard'
import useGraphStore from '../store/useGraphStore'
import useCaseStore from '../store/useCaseStore'
import useApi from '../hooks/useApi'
import {
  fetchStats,
  fetchEvidence,
  fetchCdrEvidence,
  fetchFinancialEvidence,
} from '../api/analysisApi'

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

  const { nodes, links, loadGraph } = useGraphStore()
  const { cases: storeCases } = useCaseStore()
  const cases = storeCases || []

  const { data: apiStats } = useApi(fetchStats)
  const [evidence, setEvidence] = useState([])
  const [cdrEvidence, setCdrEvidence] = useState([])
  const [financialEvidence, setFinancialEvidence] = useState([])

  const [evidenceLoading, setEvidenceLoading] = useState(true)

  // ============================================================
  // LOAD DASHBOARD DATA
  // ============================================================

  useEffect(() => {
    loadGraph()
  }, [loadGraph])

  useEffect(() => {
    let mounted = true

    const loadEvidenceData = async () => {
      setEvidenceLoading(true)

      try {
        const [
          allEvidence,
          cdrData,
          financialData,
        ] = await Promise.all([
          fetchEvidence(),
          fetchCdrEvidence(),
          fetchFinancialEvidence(),
        ])

        if (!mounted) return

        setEvidence(Array.isArray(allEvidence) ? allEvidence : [])
        setCdrEvidence(Array.isArray(cdrData) ? cdrData : [])
        setFinancialEvidence(
          Array.isArray(financialData) ? financialData : []
        )
      } catch (error) {
        console.error('Failed to load dashboard evidence data:', error)

        if (mounted) {
          setEvidence([])
          setCdrEvidence([])
          setFinancialEvidence([])
        }
      } finally {
        if (mounted) {
          setEvidenceLoading(false)
        }
      }
    }

    loadEvidenceData()

    return () => {
      mounted = false
    }
  }, [])

  // ============================================================
  // LIVE DASHBOARD METRICS
  // ============================================================

  const totalEntities =
    nodes.length > 0
      ? nodes.length
      : Number(apiStats?.totalEntities || 0)

  const activeThreats =
    nodes.length > 0
      ? nodes.filter(
          (n) =>
            n.risk === 'high' ||
            n.risk === 'HIGH' ||
            n.threatLevel === 'HIGH' ||
            n.threatLevel === 'CRITICAL'
        ).length
      : Number(
          apiStats?.activeThreats ||
          apiStats?.highRiskNodes ||
          0
        )

  const casesOpen =
    cases.length > 0
      ? cases.filter((c) => {
          const status = String(c.status || '').toUpperCase()

          return (
            status === 'OPEN' ||
            status === 'ACTIVE' ||
            status === 'ON_HOLD'
          )
        }).length
      : Number(apiStats?.casesOpen || 0)

  const connectionsTotal =
    links.length > 0
      ? links.length
      : Number(
          apiStats?.totalRelations ||
          apiStats?.connectionsTotal ||
          0
        )

  const totalEvidence = evidence.length
  const totalCdr = cdrEvidence.length
  const totalFinancial = financialEvidence.length

  const processedEvidence = evidence.filter(
    (item) =>
      String(item.status || '').toUpperCase() === 'PROCESSED'
  ).length

  const processingEvidence = evidence.filter((item) => {
    const status = String(item.status || '').toUpperCase()

    return (
      status === 'PROCESSING' ||
      status === 'UPLOADED'
    )
  }).length

  // ============================================================
  // HIGH-RISK ENTITIES
  // ============================================================

  const highRisk = useMemo(
    () =>
      nodes
        .filter(
          (e) =>
            e.risk === 'high' ||
            e.risk === 'HIGH' ||
            e.threatLevel === 'HIGH' ||
            e.threatLevel === 'CRITICAL'
        )
        .slice(0, 4),
    [nodes]
  )

  // ============================================================
  // ACTIVITY FEED
  // ============================================================

  const recentEvents = useMemo(() => {
    const list = []

    // Cases
    cases.forEach((c) => {
      list.push({
        id: `case-${c.id}`,
        title: `Docket Activated: ${c.title}`,
        type: 'intel',
        caseId: c.caseNumber || `CASE-${c.id}`,
        date: c.createdAt
          ? new Date(c.createdAt).toLocaleDateString()
          : 'Active',
        risk: String(c.risk || '').toLowerCase(),
      })
    })

    // High-risk entities
    nodes.forEach((n) => {
      const risk = String(n.risk || '').toLowerCase()

      if (
        risk === 'high' ||
        n.threatLevel === 'HIGH' ||
        n.threatLevel === 'CRITICAL'
      ) {
        list.push({
          id: `threat-${n.id}`,
          title: `High Threat Flagged: ${n.name} (${n.role || n.type})`,
          type:
            n.type === 'Vehicle'
              ? 'seizure'
              : n.type === 'Phone'
                ? 'call'
                : 'sighting',
          caseId: n.sourceFile || 'Evidence DB',
          date: n.lastSeen || 'Registered',
          risk: 'high',
        })
      }
    })

    // Recent CDR evidence
    cdrEvidence.slice(0, 4).forEach((item) => {
      list.push({
        id: `cdr-${item.id}`,
        title: `CDR Evidence Ingested: ${item.fileName || 'Unknown file'}`,
        type: 'call',
        caseId: item.evidenceNumber || 'CDR',
        date: item.uploadedAt
          ? new Date(item.uploadedAt).toLocaleDateString()
          : 'Recently',
        risk: 'medium',
      })
    })

    // Recent financial evidence
    financialEvidence.slice(0, 4).forEach((item) => {
      list.push({
        id: `financial-${item.id}`,
        title: `Financial Evidence Ingested: ${item.fileName || 'Unknown file'}`,
        type: 'financial',
        caseId: item.evidenceNumber || 'FINANCIAL',
        date: item.uploadedAt
          ? new Date(item.uploadedAt).toLocaleDateString()
          : 'Recently',
        risk: 'medium',
      })
    })

    // Recent general evidence
    evidence.slice(0, 4).forEach((item) => {
      const sourceType = String(
        item.sourceType || ''
      ).toUpperCase()

      if (
        sourceType === 'CDR' ||
        sourceType === 'FINANCIAL_TRANSACTION'
      ) {
        return
      }

      list.push({
        id: `evidence-${item.id}`,
        title: `Evidence Ingested: ${item.fileName || 'Unknown file'}`,
        type: 'digital',
        caseId: item.evidenceNumber || 'EVIDENCE',
        date: item.uploadedAt
          ? new Date(item.uploadedAt).toLocaleDateString()
          : 'Recently',
        risk: 'medium',
      })
    })

    return list
      .sort((a, b) => {
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)

        if (
          !Number.isNaN(dateA.getTime()) &&
          !Number.isNaN(dateB.getTime())
        ) {
          return dateB - dateA
        }

        return 0
      })
      .slice(0, 8)
  }, [
    cases,
    nodes,
    evidence,
    cdrEvidence,
    financialEvidence,
  ])

  const isEmptySystem =
    nodes.length === 0 &&
    cases.length === 0 &&
    evidence.length === 0

  return (
    <div>
      {/* ============================================================
          PAGE HEADER & TACTICAL CONTROL STRIP
          ============================================================ */}

      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: '1.6rem',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span
              className="page-icon"
              style={{
                background: 'rgba(21, 101, 192, 0.1)',
                color: 'var(--primary)',
              }}
            >
              <Activity size={20} />
            </span>
            CrimeNet Operations Command
          </h1>
          <p
            style={{
              margin: '6px 0 0 0',
              color: 'var(--muted)',
              fontSize: '0.88rem',
            }}
          >
            Real-time tactical surveillance, criminal network intelligence, and court-admissible docket tracking.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(22, 101, 52, 0.08)',
              color: 'var(--success)',
              border: '1px solid rgba(22, 101, 52, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--success)',
                boxShadow: '0 0 6px var(--success)',
              }}
            />
            SURVEILLANCE MATRIX ACTIVE
          </span>

          <button
            className="btn btn-outline btn-sm"
            onClick={() => navigate('/upload')}
          >
            <Upload size={14} /> Ingest Evidence
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/cases')}
          >
            <Plus size={14} /> Register Case
          </button>
        </div>
      </div>

      {/* ============================================================
          EMPTY SYSTEM
          ============================================================ */}

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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div style={{ maxWidth: 650 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <ShieldCheck
                  size={18}
                  color="var(--primary)"
                />

                <span
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    letterSpacing: '0.06em',
                  }}
                >
                  OPERATIONAL READINESS: INTELLIGENCE REPOSITORY EMPTY
                </span>
              </div>

              <h3
                style={{
                  margin: '0 0 6px 0',
                  fontSize: '1.2rem',
                  color: 'var(--text)',
                }}
              >
                System Ready for Real Intelligence Ingestion
              </h3>

              <p
                style={{
                  margin: 0,
                  fontSize: '0.85rem',
                  color: 'var(--muted)',
                  lineHeight: 1.5,
                }}
              >
                Ingest FIRs, Call Detail Records (CDRs), or register
                an investigation case docket to correlate multi-source
                evidence, detect syndicates, and track key influencers.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <button
                className="btn btn-primary"
                onClick={() => navigate('/upload')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Upload size={15} />
                Ingest Evidence
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => navigate('/cases')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Plus size={15} />
                Create Case File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          TACTICAL TELEMETRY STAT STRIP (MATCHING CONCEPT 1)
          ============================================================ */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {/* Stat 1: Active Dockets */}
        <div
          className="card anim-fade-up"
          style={{
            padding: '18px 20px',
            background: '#FFFFFF',
            border: '1px solid var(--border)',
            borderTop: '3px solid var(--primary)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/cases')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Active Dockets
            </span>
            <span className="page-icon" style={{ background: 'rgba(21, 101, 192, 0.1)', color: 'var(--primary)', width: 32, height: 32 }}>
              <FolderOpen size={16} />
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-title)', fontFamily: 'JetBrains Mono, monospace' }}>
            {casesOpen}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{cases.length} registered cases</span>
            <span style={{ color: 'var(--muted)' }}>Court admissible</span>
          </div>
        </div>

        {/* Stat 2: High Risk Suspects */}
        <div
          className="card anim-fade-up"
          style={{
            padding: '18px 20px',
            background: '#FFFFFF',
            border: '1px solid var(--border)',
            borderTop: '3px solid var(--danger)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: activeThreats > 0 ? '0 4px 16px rgba(185, 28, 28, 0.08)' : 'var(--shadow-card)',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/investigation')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Critical Threats
            </span>
            <span className="page-icon" style={{ background: 'rgba(185, 28, 28, 0.1)', color: 'var(--danger)', width: 32, height: 32 }}>
              <AlertTriangle size={16} />
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--danger)', fontFamily: 'JetBrains Mono, monospace' }}>
            {activeThreats}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
              {totalEntities > 0 ? `${Math.round((activeThreats / totalEntities) * 100)}% syndicate density` : 'Surveillance active'}
            </span>
            <span style={{ color: 'var(--muted)' }}>Priority 1</span>
          </div>
        </div>

        {/* Stat 3: CDR Intercepts */}
        <div
          className="card anim-fade-up"
          style={{
            padding: '18px 20px',
            background: '#FFFFFF',
            border: '1px solid var(--border)',
            borderTop: '3px solid var(--secondary)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/cdr')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CDR Intercepts
            </span>
            <span className="page-icon" style={{ background: 'rgba(0, 137, 123, 0.1)', color: 'var(--secondary)', width: 32, height: 32 }}>
              <Phone size={16} />
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-title)', fontFamily: 'JetBrains Mono, monospace' }}>
            {evidenceLoading ? '—' : totalCdr}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>{totalEvidence} total evidence files</span>
            <span style={{ color: 'var(--muted)' }}>Telecommunication</span>
          </div>
        </div>

        {/* Stat 4: Relational Conduits */}
        <div
          className="card anim-fade-up"
          style={{
            padding: '18px 20px',
            background: '#FFFFFF',
            border: '1px solid var(--border)',
            borderTop: '3px solid var(--warning)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-card)',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/network')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--warning)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Relational Edges
            </span>
            <span className="page-icon" style={{ background: 'rgba(180, 83, 9, 0.1)', color: 'var(--warning)', width: 32, height: 32 }}>
              <Package size={16} />
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-title)', fontFamily: 'JetBrains Mono, monospace' }}>
            {connectionsTotal}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--warning)', fontWeight: 600 }}>{totalEntities} mapped entities</span>
            <span style={{ color: 'var(--muted)' }}>Section 65B Validated</span>
          </div>
        </div>
      </div>

      {/* ============================================================
          HERO SYNDICATE NETWORK THREAT HEATMAP & MAIN LAYOUT
          ============================================================ */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: 24,
          marginBottom: 24,
        }}
      >
        {/* LEFT COLUMN: HERO NETWORK HEATMAP & DOSSIERS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* VISUAL NETWORK GRAPH HEATMAP CARD */}
          <div
            className="card anim-fade-up"
            style={{
              background: '#FFFFFF',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
              boxShadow: 'var(--shadow-card)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  TACTICAL GRAPH RADAR
                </div>
                <h3 style={{ margin: '4px 0 0 0', fontSize: '1.15rem', color: 'var(--text-title)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  Criminal Syndicate Topology Map
                </h3>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/network')}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                Launch Full Network Graph <ArrowRight size={13} />
              </button>
            </div>

            {/* SVG Visual Network Preview Widget */}
            <div
              style={{
                width: '100%',
                height: 220,
                background: '#0F172A',
                borderRadius: 'var(--radius-md)',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                border: '1px solid #1E293B',
              }}
            >
              <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                {/* Background Grid Pattern */}
                <defs>
                  <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Connection Edges */}
                <line x1="20%" y1="50%" x2="50%" y2="30%" stroke="rgba(185, 28, 28, 0.6)" strokeWidth="2" strokeDasharray="4 2" />
                <line x1="50%" y1="30%" x2="80%" y2="45%" stroke="rgba(21, 101, 192, 0.6)" strokeWidth="2" />
                <line x1="50%" y1="30%" x2="50%" y2="75%" stroke="rgba(0, 137, 123, 0.6)" strokeWidth="2" />
                <line x1="20%" y1="50%" x2="35%" y2="80%" stroke="rgba(180, 83, 9, 0.6)" strokeWidth="1.5" />
                <line x1="50%" y1="75%" x2="80%" y2="45%" stroke="rgba(21, 101, 192, 0.5)" strokeWidth="1.5" />

                {/* Central High Threat Node */}
                <circle cx="50%" cy="30%" r="18" fill="rgba(185, 28, 28, 0.25)" stroke="#B91C1C" strokeWidth="3" />
                <circle cx="50%" cy="30%" r="8" fill="#B91C1C" />

                {/* Secondary Nodes */}
                <circle cx="20%" cy="50%" r="14" fill="rgba(180, 83, 9, 0.25)" stroke="#B45309" strokeWidth="2" />
                <circle cx="20%" cy="50%" r="6" fill="#B45309" />

                <circle cx="80%" cy="45%" r="14" fill="rgba(21, 101, 192, 0.25)" stroke="#1565C0" strokeWidth="2" />
                <circle cx="80%" cy="45%" r="6" fill="#1565C0" />

                <circle cx="50%" cy="75%" r="14" fill="rgba(0, 137, 123, 0.25)" stroke="#00897B" strokeWidth="2" />
                <circle cx="50%" cy="75%" r="6" fill="#00897B" />

                <circle cx="35%" cy="80%" r="10" fill="rgba(148, 163, 184, 0.2)" stroke="#94A3B8" strokeWidth="1.5" />
                <circle cx="35%" cy="80%" r="4" fill="#94A3B8" />
              </svg>

              {/* Node Labels Overlay */}
              <div style={{ position: 'absolute', top: '15%', left: '46%', background: 'rgba(185, 28, 28, 0.9)', color: '#FFF', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: 4, letterSpacing: '0.05em' }}>
                PRIMARY KINGPIN (RISK: HIGH)
              </div>
              <div style={{ position: 'absolute', top: '56%', left: '12%', background: 'rgba(15, 23, 42, 0.85)', color: '#F1F5F9', fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, border: '1px solid #B45309' }}>
                PHONE CDR CONDUIT
              </div>
              <div style={{ position: 'absolute', top: '40%', left: '74%', background: 'rgba(15, 23, 42, 0.85)', color: '#F1F5F9', fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, border: '1px solid #1565C0' }}>
                MULE ACCOUNT
              </div>
              <div style={{ position: 'absolute', top: '80%', left: '45%', background: 'rgba(15, 23, 42, 0.85)', color: '#F1F5F9', fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, border: '1px solid #00897B' }}>
                FINANCIAL HUB
              </div>
            </div>

            {/* Network Telemetry Summary Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600 }}>Total Nodes</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-title)', fontFamily: 'JetBrains Mono' }}>{totalEntities}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--danger)', fontWeight: 600 }}>Threat Nodes</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--danger)', fontFamily: 'JetBrains Mono' }}>{activeThreats}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--secondary)', fontWeight: 600 }}>CDR Intercepts</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--secondary)', fontFamily: 'JetBrains Mono' }}>{totalCdr}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>Graph Edges</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'JetBrains Mono' }}>{connectionsTotal}</div>
              </div>
            </div>
          </div>
        {/* ACTIVITY FEED */}

        <div className="card">
          <div className="card-title">
            <Clock size={13} />
            Recent Activity Feed
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {recentEvents.length > 0 ? (
              recentEvents.map((ev, i) => {
                const cfg =
                  eventTypeConfig[ev.type] || {
                    color: 'var(--muted)',
                    label: ev.type.toUpperCase(),
                  }

                return (
                  <div
                    key={ev.id || i}
                    className="anim-fade-up"
                    style={{
                      display: 'flex',
                      gap: 14,
                      padding: '12px 0',
                      borderBottom:
                        i < recentEvents.length - 1
                          ? '1px solid var(--border)'
                          : 'none',
                      alignItems: 'flex-start',
                      cursor: 'pointer',
                    }}
                    onClick={() =>
                      navigate('/investigation')
                    }
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.paddingLeft = '6px')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.paddingLeft = '0')
                    }
                  >
                    <div
                      style={{
                        flexShrink: 0,
                        marginTop: 3,
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: cfg.color,
                          boxShadow: `0 0 6px ${cfg.color}`,
                        }}
                      />
                    </div>

                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.875rem',
                          color: 'var(--text)',
                          fontWeight: 500,
                          marginBottom: 3,
                        }}
                      >
                        {ev.title}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: 10,
                          alignItems: 'center',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: cfg.color,
                            background: `${cfg.color}18`,
                            padding: '1px 7px',
                            borderRadius: 99,
                            letterSpacing: '0.06em',
                          }}
                        >
                          {cfg.label}
                        </span>

                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--muted)',
                          }}
                        >
                          {ev.caseId}
                        </span>

                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--muted)',
                            marginLeft: 'auto',
                          }}
                        >
                          {ev.date}
                        </span>
                      </div>
                    </div>

                    {ev.risk === 'high' && (
                      <AlertTriangle
                        size={14}
                        color="var(--danger)"
                        style={{
                          flexShrink: 0,
                          marginTop: 2,
                        }}
                      />
                    )}
                  </div>
                )
              })
            ) : (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: 'var(--muted)',
                  fontSize: '0.85rem',
                }}
              >
                <Clock
                  size={24}
                  style={{
                    opacity: 0.3,
                    margin: '0 auto 10px',
                    display: 'block',
                  }}
                />

                No surveillance or intelligence feed entries yet.

                <div
                  style={{
                    marginTop: 6,
                    fontSize: '0.75rem',
                  }}
                >
                  Upload FIR documents, CDRs, financial records,
                  or register cases to populate activity tracking.
                </div>
              </div>
            )}
          </div>
        </div>
        </div>

        {/* RIGHT COLUMN */}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* ACTIVE CASE FILES */}

          <div className="card">
            <div
              className="card-title"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <FolderOpen size={13} />
                Active Case Files
              </span>

              <button
                onClick={() => navigate('/cases')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                View All <ArrowRight size={11} />
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {cases.length > 0 ? (
                cases.slice(0, 4).map((c) => {
                  const status =
                    String(c.status || '').toUpperCase()

                  const statusClass =
                    status === 'ACTIVE'
                      ? 'badge-danger'
                      : status === 'CLOSED'
                        ? 'badge-success'
                        : 'badge-warning'

                  return (
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
                      onClick={() =>
                        navigate(
                          `/investigation?case=${c.id}`
                        )
                      }
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor =
                          'var(--border-glow)'
                        e.currentTarget.style.background =
                          'rgba(34,211,238,0.05)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor =
                          'var(--border)'
                        e.currentTarget.style.background =
                          'var(--panel-light)'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            color: 'var(--text)',
                          }}
                        >
                          {c.title}
                        </span>

                        <span
                          className={`badge ${statusClass}`}
                        >
                          {c.status}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          gap: 12,
                          fontSize: '0.75rem',
                          color: 'var(--muted)',
                        }}
                      >
                        <span>
                          {c.caseNumber ||
                            `CASE-${c.id}`}
                        </span>

                        <span>
                          {c.investigator ||
                            'Crime Branch'}
                        </span>

                        <span
                          style={{
                            marginLeft: 'auto',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                          }}
                        >
                          {String(
                            c.priority ||
                            c.risk ||
                            'MEDIUM'
                          ).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div
                  style={{
                    padding: '20px 10px',
                    textAlign: 'center',
                    color: 'var(--muted)',
                    fontSize: '0.8rem',
                  }}
                >
                  No investigation cases registered yet.

                  <button
                    onClick={() => navigate('/cases')}
                    className="btn btn-outline btn-sm"
                    style={{
                      marginTop: 10,
                      width: '100%',
                    }}
                  >
                    + Create Case File
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* NETWORK SUMMARY */}

          <div className="card">
            <div className="card-title">
              <TrendingUp size={13} />
              Network Intelligence Summary
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {[
                {
                  label: 'High-Threat Nodes',
                  val: activeThreats,
                  total: Math.max(totalEntities, 1),
                  accent: 'danger',
                },
                {
                  label: 'Relational Conduits',
                  val: connectionsTotal,
                  total: Math.max(
                    connectionsTotal + 10,
                    50
                  ),
                  accent: 'primary',
                },
                {
                  label: 'Active Investigation Dockets',
                  val: casesOpen,
                  total: Math.max(
                    casesOpen + 5,
                    10
                  ),
                  accent: 'secondary',
                },
                {
                  label: 'Evidence Processed',
                  val: processedEvidence,
                  total: Math.max(
                    totalEvidence,
                    1
                  ),
                  accent: 'success',
                },
              ].map((item) => (
                <div key={item.label}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.8rem',
                        color: 'var(--muted)',
                      }}
                    >
                      {item.label}
                    </span>

                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: 'var(--text)',
                        fontFamily: 'JetBrains Mono',
                      }}
                    >
                      {item.val}
                    </span>
                  </div>

                  <div className="progress-bar">
                    <div
                      className={`progress-bar__fill ${item.accent}`}
                      style={{
                        width: `${Math.min(
                          100,
                          (item.val / item.total) * 100
                        ).toFixed(0)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          HIGH-RISK ENTITIES
          ============================================================ */}

      <div>
        <div className="section-label">
          <AlertTriangle size={13} />
          High-Risk Entities — Requires Attention
        </div>

        {highRisk.length > 0 ? (
          <div className="grid-4">
            {highRisk.map((e) => (
              <EntityCard
                key={e.id}
                entity={e}
                onClick={() =>
                  navigate(
                    `/investigation?q=${encodeURIComponent(
                      e.name || e.id
                    )}`
                  )
                }
              />
            ))}
          </div>
        ) : (
          <div
            className="card"
            style={{
              padding: '24px',
              textAlign: 'center',
              color: 'var(--muted)',
              fontSize: '0.85rem',
            }}
          >
            No high-risk entities identified in the database.
            Ingest evidence files to compute threat scores.
          </div>
        )}
      </div>
    </div>
  )
}