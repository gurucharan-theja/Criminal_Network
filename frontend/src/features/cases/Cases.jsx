import { useState, useEffect } from 'react'
import {
  FolderOpen, Plus, Search, RefreshCw, AlertTriangle, CheckCircle2, Clock,
  Shield, FileText, ArrowUpRight, Scale, Filter, SlidersHorizontal, Calendar
} from 'lucide-react'
import CaseCard from './CaseCard'
import NewCaseForm from './NewCaseForm'
import Spinner from '../../components/ui/Spinner'
import useCaseStore from '../../store/useCaseStore'
import useToast from '../../hooks/useToast'

const STATUS_TABS = [
  { id: 'all',     label: 'All Dockets' },
  { id: 'active',  label: 'Active Investigating' },
  { id: 'pending', label: 'Pending Judicial Review' },
  { id: 'closed',  label: 'Closed / Chargesheeted' },
]

export default function Cases() {
  const { cases, loading, error, loadCases } = useCaseStore()
  const toast = useToast()
  const [showForm,   setShowForm]   = useState(false)
  const [statusTab,  setStatusTab]  = useState('all')
  const [search,     setSearch]     = useState('')
  const [riskFilter, setRiskFilter] = useState('all') // all | high | medium | low

  useEffect(() => { loadCases() }, [loadCases])

  useEffect(() => {
    if (error) toast.error(error)
  }, [error])

  const filtered = cases.filter(c => {
    const matchStatus = statusTab === 'all' || c.status?.toLowerCase() === statusTab.toLowerCase()
    const matchRisk   = riskFilter === 'all' || c.risk?.toLowerCase() === riskFilter.toLowerCase()
    const q = search.trim().toLowerCase()
    const matchSearch = !q || c.title?.toLowerCase().includes(q) ||
      c.caseNumber?.toLowerCase().includes(q) ||
      c.investigator?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q)
    return matchStatus && matchRisk && matchSearch
  })

  const stats = {
    total:   cases.length,
    active:  cases.filter(c => c.status === 'active' || c.status === 'Active').length,
    pending: cases.filter(c => c.status === 'pending' || c.status === 'Pending').length,
    closed:  cases.filter(c => c.status === 'closed' || c.status === 'Closed').length,
    highRisk: cases.filter(c => c.risk === 'high' || c.risk === 'High').length,
  }

  return (
    <div className="page-transition" style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 60 }}>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="page-icon" style={{ background: 'rgba(21, 101, 192, 0.1)', color: 'var(--primary)' }}>
              <Scale size={20} />
            </span>
            Investigation Case Files & Dockets
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--muted)', fontSize: '0.88rem' }}>
            Court-admissible police case repositories, Section 65B forensic logs, and syndicated suspect dossiers.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={loadCases} className="btn btn-outline btn-sm" title="Refresh Case Records">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => setShowForm(true)} className="btn btn-primary" style={{ padding: '8px 18px' }}>
            <Plus size={16} /> Register New Case
          </button>
        </div>
      </div>

      {/* Telemetry Stat Cards Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {[
          { label: 'Active Investigation Dockets', value: stats.total,   color: '#1565C0', bg: 'rgba(21, 101, 192, 0.08)', icon: <FolderOpen size={18}/>, sub: 'Total registered' },
          { label: 'Active Operations',           value: stats.active,  color: '#16A34A', bg: 'rgba(22, 163, 74, 0.08)',  icon: <CheckCircle2 size={18}/>, sub: 'Under live surveillance' },
          { label: 'Pending Review',              value: stats.pending, color: '#D97706', bg: 'rgba(217, 119, 6, 0.08)',  icon: <Clock size={18}/>, sub: 'Awaiting court action' },
          { label: 'Critical Threat Level',       value: stats.highRisk,color: '#DC2626', bg: 'rgba(220, 38, 38, 0.08)',  icon: <AlertTriangle size={18}/>, sub: 'Priority inter-state syndicates' },
        ].map(s => (
          <div
            key={s.label}
            className="card"
            style={{
              padding: '16px 18px',
              border: '1px solid var(--border)',
              background: '#FFFFFF',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--muted)' }}>{s.label}</span>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.icon}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color, fontFamily: 'monospace', lineHeight: 1.1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 4 }}>
                {s.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Tactical Filters & Search Bar */}
      <div
        className="card"
        style={{
          padding: '14px 18px',
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'center',
          background: '#FFFFFF',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            style={{
              paddingLeft: 38,
              paddingRight: 14,
              paddingTop: 8,
              paddingBottom: 8,
              width: '100%',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: '#F8FAFC',
              fontSize: '0.85rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            placeholder="Search docket number, FIR section, suspect name, or lead officer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Status tabs */}
        <div style={{ display: 'flex', gap: 4, background: '#F1F5F9', borderRadius: 8, padding: 3, border: '1px solid #E2E8F0' }}>
          {STATUS_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setStatusTab(t.id)}
              style={{
                padding: '5px 12px',
                borderRadius: 6,
                fontSize: '0.76rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: statusTab === t.id ? '#FFFFFF' : 'transparent',
                color: statusTab === t.id ? '#0F172A' : '#64748B',
                boxShadow: statusTab === t.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 150ms ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Risk level toggle */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.04em' }}>THREAT:</span>
          {['all', 'high', 'medium', 'low'].map(r => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              style={{
                padding: '4px 9px',
                borderRadius: 99,
                fontSize: '0.7rem',
                fontWeight: 700,
                border: '1px solid',
                cursor: 'pointer',
                background: riskFilter === r
                  ? (r === 'high' ? 'var(--danger)' : r === 'medium' ? 'var(--warning)' : r === 'low' ? 'var(--success)' : 'var(--primary)')
                  : 'transparent',
                borderColor: riskFilter === r ? 'transparent' : 'var(--border)',
                color: riskFilter === r ? '#FFFFFF' : 'var(--muted)',
                textTransform: 'uppercase',
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Case Grid List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Spinner size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="card"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            background: '#FFFFFF',
            borderRadius: 14,
            border: '1px dashed var(--border)',
          }}
        >
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(21, 101, 192, 0.08)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <FolderOpen size={26} />
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>
            No Investigation Cases Found
          </h3>
          <p style={{ margin: '0 0 20px', color: 'var(--muted)', fontSize: '0.85rem', maxWidth: 420, marginInline: 'auto' }}>
            {cases.length === 0
              ? 'Your case docket repository is empty. Create your first investigation case to register suspects and upload evidence files.'
              : 'No cases match your active search criteria or filters. Try adjusting your search query or reset status filters.'}
          </p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary" style={{ padding: '8px 20px' }}>
            <Plus size={15} /> Create First Case Docket
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
          {filtered.map(c => (
            <CaseCard key={c.id} caseData={c} />
          ))}
        </div>
      )}

      {/* New Case Docket Modal */}
      {showForm && (
        <NewCaseForm onClose={() => setShowForm(false)} />
      )}
    </div>
  )
}
