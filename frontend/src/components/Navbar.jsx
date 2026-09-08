import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Bell, Search, Activity, ChevronDown, Award, Fingerprint, Lock, LogOut } from 'lucide-react'
import SearchBar from './SearchBar'
import OfficerDossierModal from './OfficerDossierModal'
import useAuthStore from '../store/useAuthStore'
import useToast from '../hooks/useToast'

export default function Navbar() {
  const navigate = useNavigate()
  const toast = useToast()
  const logout = useAuthStore((s) => s.logout)

  const [alertCount] = useState(2)
  const [showNotif, setShowNotif] = useState(false)
  const [showDossier, setShowDossier] = useState(false)

  const notifications = [
    { id: 1, type: 'danger',  text: 'Priority Flag: High-threat conduit detected in active network', time: '3 min ago' },
    { id: 2, type: 'warning', text: 'Telemetry Alert: Unusual night-time call ping cluster detected', time: '18 min ago' },
    { id: 3, type: 'primary', text: 'Section 65B Digital Evidence Certificate sealed for Case Docket', time: '1 hr ago' },
  ]

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 'var(--nav-h)',
          background: '#FFFFFF',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: '18px',
          zIndex: 1000,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Subtle Primary Accent Line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%)',
            zIndex: 1001,
          }}
        />

        {/* Clean CrimeNet Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 240, cursor: 'pointer' }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: 'linear-gradient(135deg, var(--primary) 0%, #0D47A1 100%)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(21, 101, 192, 0.25)',
              flexShrink: 0,
            }}
          >
            <Shield size={20} color="#FFFFFF" strokeWidth={2.4} />
          </div>

          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text)', lineHeight: 1.1, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 6 }}>
              CrimeNet
              <span style={{ fontSize: '0.62rem', fontWeight: 700, background: 'var(--primary-dim)', color: 'var(--primary-light)', padding: '1px 6px', borderRadius: 4, border: '1px solid var(--border-glow)' }}>
                AI ANALYTICS
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: 2 }}>
              Criminal Network Analysis System
            </div>
          </div>
        </div>

        {/* Search bar — grows */}
        <div style={{ flex: 1, maxWidth: 520 }}>
          <SearchBar placeholder="Search suspects, phones, vehicles, organizations, tags…" />
        </div>

        {/* Right controls: Live System Status + Officer Profile */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Live System Status Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '5px 12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '0.7rem',
              fontWeight: 700,
              color: 'var(--success)',
              letterSpacing: '0.05em',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--success)',
                boxShadow: '0 0 8px var(--success)',
              }}
            />
            LIVE INTEL GRID
          </div>

          {/* Notifications Trigger */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotif(!showNotif)}
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-md)',
                background: showNotif ? 'var(--primary-dim)' : 'var(--panel-light)',
                border: `1px solid ${showNotif ? 'var(--primary)' : 'var(--border)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: showNotif ? 'var(--primary)' : 'var(--muted)',
                position: 'relative',
                transition: 'all var(--transition)',
              }}
              title="System Alerts & Notifications"
            >
              <Bell size={18} />
              {alertCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    minWidth: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: 'var(--danger)',
                    color: '#fff',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #FFFFFF',
                  }}
                >
                  {alertCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotif && (
              <div
                className="anim-fade-up"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 12px)',
                  right: 0,
                  width: 340,
                  background: '#FFFFFF',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  padding: '16px',
                  zIndex: 1100,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>
                    System Alerts ({alertCount})
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
                    Mark all read
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--panel-light)',
                        border: '1px solid var(--border)',
                        fontSize: '0.78rem',
                      }}
                    >
                      <div style={{ color: 'var(--text)', marginBottom: 4, lineHeight: 1.4 }}>{n.text}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>{n.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Officer Tactical Profile Button (Triggers Classified Dossier) */}
          <div
            onClick={() => setShowDossier(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '5px 12px 5px 8px',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              transition: 'all var(--transition)',
              border: '1px solid var(--border)',
              background: 'var(--panel-light)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#FFFFFF'
              e.currentTarget.style.borderColor = 'var(--primary)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(21, 101, 192, 0.12)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--panel-light)'
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.boxShadow = 'none'
            }}
            title="Inspect Officer Tactical Dossier"
          >
            {/* Officer Insignia */}
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-sm)',
                background: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 800,
                color: '#FFFFFF',
                position: 'relative'
              }}
            >
              INV
              <span
                style={{
                  position: 'absolute',
                  top: -2,
                  right: -2,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--success)',
                  border: '1px solid #fff'
                }}
              />
            </div>

            {/* Officer Details */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 700, lineHeight: 1.1 }}>
                  Lead Investigator
                </span>
                <Award size={13} color="var(--gold)" />
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                INTEL-DESK // TIER-1
              </span>
            </div>

            <ChevronDown size={14} color="var(--muted)" />
          </div>

          {/* Quick Sign Out Action */}
          <button
            onClick={() => {
              logout()
              toast.info('Officer Session Terminated')
              navigate('/')
            }}
            title="Sign Out to Terminal Overview"
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--muted)',
              transition: 'all var(--transition)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--danger)'
              e.currentTarget.style.borderColor = 'var(--danger)'
              e.currentTarget.style.background = 'var(--danger-dim)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--muted)'
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      {/* Officer Classified Dossier Modal */}
      {showDossier && (
        <OfficerDossierModal onClose={() => setShowDossier(false)} />
      )}
    </>
  )
}
