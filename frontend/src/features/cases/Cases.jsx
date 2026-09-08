import { useState, useEffect } from 'react'
import { FolderOpen, Plus, Search, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import CaseCard from './CaseCard'
import NewCaseForm from './NewCaseForm'
import Spinner from '../../components/ui/Spinner'
import useCaseStore from '../../store/useCaseStore'
import useToast from '../../hooks/useToast'

const STATUS_TABS = ['all', 'active', 'pending', 'closed']

export default function Cases() {
  const { cases, loading, error, loadCases } = useCaseStore()
  const toast = useToast()
  const [showForm,   setShowForm]   = useState(false)
  const [statusTab,  setStatusTab]  = useState('all')
  const [search,     setSearch]     = useState('')

  useEffect(() => { loadCases() }, [loadCases])

  useEffect(() => {
    if (error) toast.error(error)
  }, [error]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = cases.filter(c => {
    const matchStatus = statusTab === 'all' || c.status === statusTab
    const q = search.trim().toLowerCase()
    const matchSearch = !q || c.title?.toLowerCase().includes(q) ||
      c.caseNumber?.toLowerCase().includes(q) ||
      c.investigator?.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  const stats = {
    total:   cases.length,
    active:  cases.filter(c => c.status === 'active').length,
    pending: cases.filter(c => c.status === 'pending').length,
    closed:  cases.filter(c => c.status === 'closed').length,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, height: '100%' }}>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <FolderOpen size={22} color="var(--primary)" /> Investigation Cases
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '0.875rem' }}>
            Manage and track all active investigation cases
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={loadCases} className="btn btn-ghost" title="Refresh">
            <RefreshCw size={14} />
          </button>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <Plus size={15} /> New Case
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14 }}>
        {[
          { label: 'Total Cases',  value: stats.total,   color: 'var(--primary)', icon: <FolderOpen size={16}/> },
          { label: 'Active',       value: stats.active,  color: 'var(--success)', icon: <CheckCircle size={16}/> },
          { label: 'Pending',      value: stats.pending, color: 'var(--warning)', icon: <Clock size={16}/> },
          { label: 'Closed',       value: stats.closed,  color: 'var(--muted)',   icon: <AlertTriangle size={16}/> },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{s.label}</span>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 36, width: '100%', boxSizing: 'border-box' }}
            placeholder="Search by title, case number, investigator…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Status tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--panel)', borderRadius: 'var(--radius-md)', padding: 4, border: '1px solid var(--border)' }}>
          {STATUS_TABS.map(t => (
            <button
              key={t}
              onClick={() => setStatusTab(t)}
              style={{
                padding: '5px 14px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: statusTab === t ? 'var(--primary-dim)' : 'transparent',
                color: statusTab === t ? 'var(--primary)' : 'var(--muted)',
                fontSize: '0.8rem', fontWeight: statusTab === t ? 600 : 400,
                textTransform: 'capitalize', transition: 'all var(--transition)',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Case list */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Spinner label="Loading cases…" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="icon">📁</div>
          <h3>{cases.length === 0 ? 'No cases yet' : 'No matching cases'}</h3>
          <p>{cases.length === 0 ? 'Create your first investigation case to get started.' : 'Try a different search or filter.'}</p>
          {cases.length === 0 && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={14} /> Create First Case
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
            Showing {filtered.length} of {cases.length} cases
          </div>
          {filtered.map(c => (
            <CaseCard key={c.id} caseData={c} onDeleted={loadCases} />
          ))}
        </div>
      )}

      {/* New case form modal */}
      {showForm && (
        <NewCaseForm
          onClose={() => setShowForm(false)}
          onCreated={() => loadCases()}
        />
      )}
    </div>
  )
}
