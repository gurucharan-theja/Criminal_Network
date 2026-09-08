import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Shield, Lock, User, Eye, EyeOff, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react'
import useAuthStore from '../store/useAuthStore'
import useToast from '../hooks/useToast'

export default function Login() {
  const navigate = useNavigate()
  const toast = useToast()
  const login = useAuthStore((s) => s.login)

  const [officialId, setOfficialId] = useState('NCRB-INV-7041')
  const [password, setPassword] = useState('••••••••••••')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleSignIn = (e) => {
    e.preventDefault()
    if (!officialId.trim()) {
      toast.warning('Please provide your Official Investigator ID')
      return
    }

    setLoading(true)
    setTimeout(() => {
      login({
        id: officialId,
        name: officialId === 'NCRB-INV-7041' ? 'Inspector Vikram Rathore' : 'Lead Investigator',
        badge: officialId,
        role: 'Lead Investigator',
        unit: 'Criminal Network Intelligence Unit',
      })
      toast.success(`Identity Verified: Welcome, ${officialId}`)
      navigate('/dashboard')
    }, 450)
  }

  return (
    <div
      className="page-transition"
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1.05fr 0.95fr',
        background: '#F5F7FA',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ── Left Side: Secure Government Terminal Identity (Rule 6: Almost Static) ──────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F2747 0%, #0A192F 100%)',
          color: '#FFFFFF',
          padding: '48px 56px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Subtle dot pattern background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.15) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            opacity: 0.5,
            pointerEvents: 'none',
          }}
        />

        {/* Brand Header */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: '#94A3B8',
              textDecoration: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: 32,
              transition: 'color 150ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
          >
            <ArrowLeft size={14} /> Back to Overview
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: '#1565C0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 2px 8px rgba(21,101,192,0.3)',
              }}
            >
              <Shield size={24} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                CrimeNet Investigation Portal
              </div>
              <div style={{ fontSize: '0.76rem', color: '#94A3B8' }}>
                National Crime Records Bureau &bull; Secure Terminal
              </div>
            </div>
          </div>
        </div>

        {/* Tactical Overview Graphic */}
        <div style={{ position: 'relative', zIndex: 2, margin: 'auto 0', padding: '24px 0' }}>
          <div style={{ maxWidth: 440 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38BDF8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              SECTION 65B EVIDENTIARY ARCHITECTURE
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', margin: '0 0 14px', lineHeight: 1.25 }}>
              Authorized Police Intelligence & Syndicate Analysis
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#94A3B8', lineHeight: 1.6, margin: '0 0 24px' }}>
              Access restricted to certified investigating officers, intelligence bureau analysts, and state special cells. All session queries are cryptographically logged.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', color: '#E2E8F0' }}>
                <CheckCircle2 size={16} color="#16A34A" /> Multi-Jurisdictional Cross-FIR Correlation
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', color: '#E2E8F0' }}>
                <CheckCircle2 size={16} color="#16A34A" /> Automated Hawala & Telecom Graph Extraction
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', color: '#E2E8F0' }}>
                <CheckCircle2 size={16} color="#16A34A" /> Immutable SHA-256 Audit Trail
              </div>
            </div>
          </div>
        </div>

        {/* Footer Identity */}
        <div style={{ position: 'relative', zIndex: 2, fontSize: '0.72rem', color: '#64748B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Version 2.4.0 (SIH-2026 Build)</span>
          <span style={{ color: '#38BDF8', fontWeight: 600 }}>Zero-Trust Enforced</span>
        </div>
      </div>

      {/* ── Right Side: Clean White Login Card ───────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          background: '#F5F7FA',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 420,
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: '36px 32px',
            boxShadow: '0 4px 16px -2px rgba(0, 0, 0, 0.04)',
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: 26 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1565C0', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
              SECURE INVESTIGATION GATEWAY
            </div>
            <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
              Investigator Sign In
            </h2>
            <p style={{ fontSize: '0.84rem', color: '#64748B', margin: 0 }}>
              Authenticate with your departmental credentials
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSignIn} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Official ID */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: 6,
                }}
              >
                Official ID / Service Number
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={officialId}
                  onChange={(e) => setOfficialId(e.target.value)}
                  placeholder="e.g. NCRB-INV-7041"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 14px 10px 38px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: "'Inter', sans-serif",
                    transition: 'border-color 180ms ease, box-shadow 180ms ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#1565C0'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(21, 101, 192, 0.12)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#CBD5E1'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                <User
                  size={16}
                  color="#64748B"
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label
                  style={{
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: '#475569',
                  }}
                >
                  Passphrase / Key
                </label>
                <span
                  style={{ fontSize: '0.72rem', color: '#1565C0', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => toast.info('Default evaluation credentials: Click SIGN IN')}
                >
                  Evaluation Mode
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure passphrase"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 38px 10px 38px',
                    borderRadius: 8,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#0F172A',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: "'Inter', sans-serif",
                    transition: 'border-color 180ms ease, box-shadow 180ms ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#1565C0'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(21, 101, 192, 0.12)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#CBD5E1'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                <Lock
                  size={16}
                  color="#64748B"
                  style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748B',
                    padding: 0,
                    display: 'flex',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#475569' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#1565C0', cursor: 'pointer' }}
                />
                Remember terminal
              </label>
              <span style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 600 }}>
                ● 256-Bit TLS Active
              </span>
            </div>

            {/* Submit Button (Rule 2: Lift 2px, Arrow moves 4px) */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '11px',
                fontSize: '0.9rem',
                justifyContent: 'center',
                marginTop: 6,
              }}
            >
              {loading ? 'Verifying Credentials...' : 'Sign In to Terminal'} {!loading && <ArrowRight size={15} className="btn-arrow" />}
            </button>
          </form>

          {/* Footer Marker */}
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
              Ministry of Home Affairs &bull; National Law Enforcement Portal
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
