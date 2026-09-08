import { useState } from 'react'
import { X, FolderOpen } from 'lucide-react'
import useCaseStore from '../../store/useCaseStore'
import useToast from '../../hooks/useToast'
import Spinner from '../../components/ui/Spinner'

export default function NewCaseForm({ onCreated, onClose }) {
  const toast = useToast()
  const addCase = useCaseStore(s => s.addCase)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', investigator: '',
    department: '', risk: 'medium', status: 'active',
  })

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.warning('Title is required'); return }
    setLoading(true)
    try {
      const created = await addCase(form)
      toast.success(`Case "${created.title}" created!`)
      if (onCreated) onCreated(created)
      onClose()
    } catch (err) {
      toast.error('Failed to create case: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    background: '#F8FAFC', border: '1px solid #CBD5E1',
    borderRadius: 'var(--radius-md)', color: '#334155',
    fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color var(--transition)',
    fontFamily: 'inherit',
  }

  const labelStyle = {
    display: 'block', fontSize: '0.78rem',
    color: '#64748B', marginBottom: 6, fontWeight: 600,
  }

  return (
    <div style={{
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
          borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 500,
          padding: '28px 28px 24px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.05)',
          animation: 'fadeInUp 200ms both',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FolderOpen size={20} color="#1565C0" />
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0F172A', fontWeight: 700 }}>New Investigation Case</h3>
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Title */}
          <div>
            <label style={labelStyle}>Case Title *</label>
            <input style={inputStyle} placeholder="e.g. Operation Coastal Storm" value={form.title} onChange={set('title')} />
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
              placeholder="Brief summary of the case..."
              value={form.description}
              onChange={set('description')}
            />
          </div>

          {/* Investigator + Department */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Lead Investigator</label>
              <input style={inputStyle} placeholder="Name" value={form.investigator} onChange={set('investigator')} />
            </div>
            <div>
              <label style={labelStyle}>Department</label>
              <input style={inputStyle} placeholder="e.g. CBI, NIA" value={form.department} onChange={set('department')} />
            </div>
          </div>

          {/* Risk + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Risk Level</label>
              <select style={inputStyle} value={form.risk} onChange={set('risk')}>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.status} onChange={set('status')}>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Spinner size={14} /> : '+ Create Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
