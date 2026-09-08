import { FileText, Download, Table, Image, X } from 'lucide-react'
import useToast from '../../hooks/useToast'

const EXPORT_TYPES = [
  {
    id: 'csv-entities',
    icon: <Table size={20} />,
    label: 'Entities CSV',
    desc: 'All extracted entities with risk scores, types, and metadata',
    color: 'var(--success)',
  },
  {
    id: 'csv-relations',
    icon: <Table size={20} />,
    label: 'Relationships CSV',
    desc: 'All detected relationships with confidence scores and evidence',
    color: 'var(--secondary)',
  },
  {
    id: 'json-graph',
    icon: <FileText size={20} />,
    label: 'Graph JSON',
    desc: 'Full network graph in D3-compatible format (nodes + links)',
    color: 'var(--primary)',
  },
  {
    id: 'json-full',
    icon: <FileText size={20} />,
    label: 'Full Report JSON',
    desc: 'Complete investigation data — entities, relations, cases, stats',
    color: 'var(--warning)',
  },
  {
    id: 'png-graph',
    icon: <Image size={20} />,
    label: 'Graph Screenshot',
    desc: 'PNG image of the current network graph (use browser print for PDF)',
    color: 'var(--danger)',
  },
]

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function downloadCSV(rows, filename) {
  if (!rows.length) return
  const headers = Object.keys(rows[0]).join(',')
  const body    = rows.map(r => Object.values(r).map(v =>
    typeof v === 'string' && v.includes(',') ? `"${v}"` : v ?? ''
  ).join(',')).join('\n')
  const blob = new Blob([headers + '\n' + body], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function ExportOptions({ graphData, entities, relations, stats, onClose }) {
  const toast = useToast()

  const handleExport = (type) => {
    try {
      const ts = new Date().toISOString().slice(0, 10)
      switch (type) {
        case 'csv-entities':
          downloadCSV(entities || [], `crimenet-entities-${ts}.csv`)
          toast.success('Entities CSV downloaded')
          break
        case 'csv-relations':
          downloadCSV(relations || [], `crimenet-relations-${ts}.csv`)
          toast.success('Relationships CSV downloaded')
          break
        case 'json-graph':
          downloadJSON(graphData || { nodes: [], links: [] }, `crimenet-graph-${ts}.json`)
          toast.success('Graph JSON downloaded')
          break
        case 'json-full':
          downloadJSON({ entities, relations, stats, exportedAt: new Date().toISOString() },
            `crimenet-full-report-${ts}.json`)
          toast.success('Full report JSON downloaded')
          break
        case 'png-graph':
          toast.info('Use Ctrl+P → Save as PDF, or right-click the graph → Save image')
          break
        default:
          break
      }
    } catch {
      toast.error('Export failed. Please try again.')
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 150ms both',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FFFFFF', border: '1px solid #E2E8F0',
          borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 480,
          padding: '28px 28px 24px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.05)',
          animation: 'fadeInUp 200ms both',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Download size={20} color="#1565C0" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0F172A', fontWeight: 700 }}>Export Data</h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', padding: 4, borderRadius: 6 }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#0F172A')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {EXPORT_TYPES.map(exp => (
            <button
              key={exp.id}
              onClick={() => handleExport(exp.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 16px', background: '#F8FAFC',
                border: '1px solid #E2E8F0', borderRadius: 'var(--radius-md)',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'all var(--transition)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#1565C0'; e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(21, 101, 192, 0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <span style={{ color: exp.color, flexShrink: 0 }}>{exp.icon}</span>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1E293B', marginBottom: 2 }}>
                  {exp.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', lineHeight: 1.4 }}>
                  {exp.desc}
                </div>
              </div>
              <Download size={14} style={{ color: '#64748B', marginLeft: 'auto', flexShrink: 0 }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
