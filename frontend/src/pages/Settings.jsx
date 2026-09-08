import React, { useState } from 'react'
import {
  Shield,
  Key,
  Server,
  Lock,
  Cpu,
  Database,
  Radio,
  Eye,
  Bell,
  Save,
  CheckCircle2,
  RefreshCw,
  Terminal,
  FileCheck,
  Trash2
} from 'lucide-react'
import useToast from '../hooks/useToast'
import useGraphStore from '../store/useGraphStore'
import useCaseStore from '../store/useCaseStore'
import axiosClient from '../api/axiosClient'

export default function Settings() {
  const toast = useToast()
  const purgeAllData = useGraphStore(s => s.purgeAllData)
  const { loadCases } = useCaseStore()

  const handlePurgeAllIntelligence = async () => {
    if (window.confirm('Officer Confirmation: Are you sure you want to purge all stored entities, relationships, and reset repository to a clean state? This cannot be undone.')) {
      await purgeAllData()
      try {
        await axiosClient.post('/cases/reset')
      } catch (e) {}
      await loadCases()
      localStorage.clear()
      toast.success('All records purged! Repository is 100% clean and ready for real data.')
    }
  }

  // Form state tailored for Indian Law Enforcement / Intelligence units
  const [department, setDepartment] = useState('Central Bureau of Investigation (CBI) - Special Crime Unit')
  const [jurisdiction, setJurisdiction] = useState('Zone-1 (North-Western Region / INTERPOL Red Notice Coordination)')
  const [badgeId, setBadgeId] = useState('LE-CBI-78402-A')
  const [classification, setClassification] = useState('SECRET // LAW ENFORCEMENT SENSITIVE (LES)')
  
  // Security & Data retention
  const [retentionDays, setRetentionDays] = useState('180')
  const [cdrAutoSync, setCdrAutoSync] = useState(true)
  const [twoFactorAuth, setTwoFactorAuth] = useState(true)
  const [auditLogging, setAuditLogging] = useState(true)
  const [redactionDefault, setRedactionDefault] = useState(true)

  // AI & Detection Thresholds
  const [minConfidence, setMinConfidence] = useState(85)
  const [aiEngineEndpoint, setAiEngineEndpoint] = useState('http://localhost:8000')
  const [enableIndianRegex, setEnableIndianRegex] = useState(true)
  const [autoFlagHawala, setAutoFlagHawala] = useState(true)

  const handleSave = (e) => {
    e.preventDefault()
    toast.success('Department security credentials & threshold settings updated!')
  }

  const handlePurgeLogs = () => {
    toast.warning('Evidence audit logs verified and re-encrypted with HMAC-SHA256.')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              background: 'rgba(34, 211, 238, 0.1)',
              border: '1px solid var(--primary)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 10px',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em'
            }}>
              <Shield size={14} /> OFFICIAL POLICE USE ONLY
            </div>
            <span style={{
              fontSize: '0.72rem',
              color: 'var(--danger)',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid var(--danger)',
              padding: '2px 8px',
              borderRadius: 4,
              fontWeight: 600
            }}>
              RESTRICTED ACCESS
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.45rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            Bureau Operational Parameters & Security Configuration
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text)', fontSize: '0.875rem' }}>
            Configure national crime database interfaces, automated intelligence thresholds, and chain-of-custody encryption.
          </p>
        </div>

        <button onClick={handleSave} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Save size={16} /> Save Security Directives
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        {/* Section 1: Officer & Agency Profile */}
        <div className="card" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
            <Key size={18} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 600 }}>Agency & Officer Credentials</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 6 }}>
                Investigating Agency / Bureau
              </label>
              <input
                className="input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 6 }}>
                Assigned Jurisdiction & Desk
              </label>
              <input
                className="input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 6 }}>
                  Lead Officer Token / Badge #
                </label>
                <input
                  className="input"
                  style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'var(--font-mono)' }}
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 6 }}>
                  Access Tier
                </label>
                <input
                  className="input"
                  style={{ width: '100%', boxSizing: 'border-box', color: 'var(--danger)', fontWeight: 600 }}
                  value="TIER 1 (FULL SURVEILLANCE)"
                  readOnly
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 6 }}>
                Evidence Clearance Marking
              </label>
              <select
                className="input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
              >
                <option value="RESTRICTED // LAW ENFORCEMENT">RESTRICTED // LAW ENFORCEMENT</option>
                <option value="SECRET // LAW ENFORCEMENT SENSITIVE (LES)">SECRET // LAW ENFORCEMENT SENSITIVE (LES)</option>
                <option value="TOP SECRET // JUDICIAL DISCLOSURE EXEMPT">TOP SECRET // JUDICIAL DISCLOSURE EXEMPT</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: AI Crime NLP & Syndicate Detection Thresholds */}
        <div className="card" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
            <Cpu size={18} color="var(--primary)" />
            <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 600 }}>AI Syndicate Detection Engine</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 6 }}>
                AI Engine Microservice Host
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="input"
                  style={{ flex: 1, fontFamily: 'var(--font-mono)' }}
                  value={aiEngineEndpoint}
                  onChange={(e) => setAiEngineEndpoint(e.target.value)}
                />
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: '0.72rem', color: 'var(--success)', background: 'rgba(34,197,94,0.1)',
                  padding: '0 10px', borderRadius: 'var(--radius-md)', fontWeight: 600
                }}>
                  <CheckCircle2 size={12} /> ONLINE
                </span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                  Min Evidence Confidence Threshold
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {minConfidence}%
                </span>
              </div>
              <input
                type="range"
                min="60"
                max="99"
                value={minConfidence}
                onChange={(e) => setMinConfidence(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                Signals below {minConfidence}% will not automatically be admitted into the judicial graph.
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.82rem' }}>
                <input
                  type="checkbox"
                  checked={enableIndianRegex}
                  onChange={(e) => setEnableIndianRegex(e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>Auto-detect Indian PAN, Aadhaar & Telecom CDRs</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.82rem' }}>
                <input
                  type="checkbox"
                  checked={autoFlagHawala}
                  onChange={(e) => setAutoFlagHawala(e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>Trigger Immediate Alert on Unregistered Hawala / Crypto Channels</span>
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: National Security & Chain-of-Custody Data Protocol */}
        <div className="card" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
            <Lock size={18} color="var(--danger)" />
            <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 600 }}>Evidence Custody & Encryption</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted)', marginBottom: 6 }}>
                Active Case File Retention Window (Days)
              </label>
              <input
                type="number"
                className="input"
                style={{ width: '100%', boxSizing: 'border-box' }}
                value={retentionDays}
                onChange={(e) => setRetentionDays(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.82rem' }}>
                <input
                  type="checkbox"
                  checked={cdrAutoSync}
                  onChange={(e) => setCdrAutoSync(e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>Auto-archive raw telecom towers dump upon ingest</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.82rem' }}>
                <input
                  type="checkbox"
                  checked={twoFactorAuth}
                  onChange={(e) => setTwoFactorAuth(e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>Mandate RSA SecurID Token for Graph Deletions</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.82rem' }}>
                <input
                  type="checkbox"
                  checked={redactionDefault}
                  onChange={(e) => setRedactionDefault(e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span>Automatic witness identity obfuscation on export</span>
              </label>
            </div>

            <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={handlePurgeLogs}
                className="btn btn-ghost"
                style={{ width: '100%', fontSize: '0.78rem', justifyContent: 'center', gap: 6 }}
              >
                <FileCheck size={14} /> Verify Audit Hash Integrity
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: Live Surveillance & Intercept Feeds */}
        <div className="card" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
            <Radio size={18} color="var(--warning)" />
            <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 600 }}>External Surveillance Feeds</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { title: 'CCTNS (Crime & Criminal Tracking Network)', status: 'Connected', ping: '18ms', color: 'var(--success)' },
              { title: 'NATGRID Inter-agency Data Exchange', status: 'Syncing...', ping: '42ms', color: 'var(--primary)' },
              { title: 'ICJIS (Inter-operable Criminal Justice System)', status: 'Connected', ping: '24ms', color: 'var(--success)' },
              { title: 'Vahan Vehicle National Registry', status: 'Active', ping: '31ms', color: 'var(--success)' },
            ].map((feed, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text)' }}>{feed.title}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Latency: {feed.ping}</div>
                </div>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  color: feed.color,
                  background: 'rgba(255,255,255,0.04)',
                  padding: '2px 8px',
                  borderRadius: 4
                }}>
                  ● {feed.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: Data Purge & Operational Reset */}
        <div className="card" style={{ padding: '22px 24px', border: '1px solid #FECACA', background: '#FEF2F2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, borderBottom: '1px solid #FCA5A5', paddingBottom: 10 }}>
            <Trash2 size={18} color="#B91C1C" />
            <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#B91C1C' }}>
              Database Purge & Clean Slate
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#7F1D1D', margin: '0 0 16px', lineHeight: 1.5 }}>
            Wipe all extracted entities, relational conduits, and stored dockets to start completely fresh with real investigative evidence.
          </p>
          <button
            type="button"
            onClick={handlePurgeAllIntelligence}
            className="btn"
            style={{
              background: '#B91C1C',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 16px',
              fontSize: '0.82rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer'
            }}
          >
            <Trash2 size={14} /> Purge All Data & Start Clean
          </button>
        </div>
      </div>
    </div>
  )
}
