import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Bell, Search, Activity, ChevronDown, Award, Fingerprint, Lock, LogOut, Menu } from 'lucide-react'
import SearchBar from './SearchBar'
import OfficerDossierModal from './OfficerDossierModal'
import useAuthStore from '../store/useAuthStore'
import useUIStore from '../store/useUIStore'
import useToast from '../hooks/useToast'

export default function Navbar() {
  const navigate = useNavigate()
  const toast = useToast()
  const logout = useAuthStore((s) => s.logout)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)

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
          padding: '0 20px',
          gap: '16px',
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

        {/* 3-Line Menu / Hamburger Button */}
        <button
          onClick={toggleSidebar}
          style={{
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '7px 9px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text)',
            transition: 'all 180ms ease',
          }}
          title="Toggle Navigation Menu"
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--primary)'
            e.currentTarget.style.background = 'var(--panel-light)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.background = 'none'
          }}
        >
          <Menu size={18} color="var(--primary)" />
        </button>

        {/* Clean CrimeNet Branding */}
        <div
          onClick={() => navigate('/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 230, cursor: 'pointer' }}
        >
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

        {/* Tactical Search Bar */}
        <div style={{ flex: 1, maxWidth: 440 }}>
          <SearchBar />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginLeft: 'auto' }}>
          {/* Notifications */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotif((v) => !v)}
              style={{
                position: 'relative',
                background: 'none',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '8px 10px',
                cursor: 'pointer',
                color: 'var(--text)',
              }}
            >
              <Bell size={16} />
              {alertCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#DC2626',
                    color: '#fff',
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {alertCount}
                </span>
              )}
            </button>

            {showNotif && (
              <div
                className="anim-fade-up"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  width: 320,
                  background: '#FFFFFF',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  padding: 12,
                  zIndex: 2000,
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                  Active Intelligence Notifications
                </div>
                {notifications.map((n) => (
                  <div key={n.id} style={{ padding: '8px 0', borderBottom: '1px solid #F1F5F9', fontSize: '0.78rem' }}>
                    <div style={{ color: 'var(--text)', fontWeight: 500 }}>{n.text}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.7rem', marginTop: 3 }}>{n.time}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Officer Dossier badge */}
          <div
            onClick={() => setShowDossier(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 12px',
              borderRadius: 20,
              background: 'var(--panel-light)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
            }}
          >
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#1565C0', color: '#fff', fontSize: '0.72rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              VR
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)' }}>
              Inspector Rathore
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={() => {
              logout()
              navigate('/login')
              toast.info('Session logged out securely')
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              padding: 6,
              display: 'flex',
              alignItems: 'center',
            }}
            title="Sign out of terminal"
          >
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      <OfficerDossierModal isOpen={showDossier} onClose={() => setShowDossier(false)} />
    </>
  )
}
