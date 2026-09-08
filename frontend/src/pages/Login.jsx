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
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1.05fr 0.95fr',
        background: '#F5F7FA',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ── Left Side: Network Visual & Government Identity ──────── */}
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
        {/* Subtle geometric & grid background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(rgba(21, 101, 192, 0.25) 1px, transparent 1px), linear-gradient(rgba(0, 137, 123, 0.08) 1px, transparent 1px)',
            backgroundSize: '32px 32px, 64px 64px',
            opacity: 0.45,
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
                boxShadow: '0 4px 12px rgba(21, 101, 192, 0.4)',
              }}
            >
              <Shield size={24} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.01em', color: '#FFFFFF' }}>
                NATIONAL CRIME RECORDS BUREAU
              </div>
              <div style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: 600, letterSpacing: '0.04em' }}>
                AI-POWERED CRIMINAL NETWORK ANALYSIS &bull; PROTOTYPE
              </div>
            </div>
          </div>
        </div>

        {/* Center: Live-looking Subtle Network Visual */}
        <div style={{ position: 'relative', zIndex: 2, margin: '40px 0' }}>
          <svg viewBox="0 0 460 260" style={{ width: '100%', maxWidth: 440, height: 'auto', display: 'block', margin: '0 auto' }}>
            {/* Edges */}
            <line x1="80" y1="130" x2="190" y2="60" stroke="#1E3A8A" strokeWidth="2" strokeDasharray="3 3" />
            <line x1="80" y1="130" x2="190" y2="200" stroke="#1E3A8A" strokeWidth="2" strokeDasharray="3 3" />
            <line x1="190" y1="60" x2="300" y2="60" stroke="#00897B" strokeWidth="2" />
            <line x1="190" y1="200" x2="300" y2="200" stroke="#1E3A8A" strokeWidth="2" strokeDasharray="3 3" />
            <line x1="300" y1="60" x2="380" y2="130" stroke="#1565C0" strokeWidth="2.5" />
            <line x1="300" y1="200" x2="380" y2="130" stroke="#1E3A8A" strokeWidth="2" strokeDasharray="3 3" />
            <line x1="190" y1="60" x2="300" y2="200" stroke="#38BDF8" strokeWidth="1.5" strokeOpacity="0.6" />

            {/* Nodes */}
            {[
              { cx: 80, cy: 130, r: 12, label: 'Endpoint', col: '#00897B' },
              { cx: 190, cy: 60, r: 14, label: 'CDR Ping', col: '#F59E0B' },
              { cx: 190, cy: 200, r: 12, label: 'Cell Tower', col: '#10B981' },
              { cx: 300, cy: 60, r: 16, label: 'Syndicate Hub', col: '#EF4444' },
              { cx: 300, cy: 200, r: 12, label: 'Hawala Node', col: '#8B5CF6' },
              { cx: 380, cy: 130, r: 20, label: 'Key Target', col: '#1565C0' },
            ].map((n, idx) => (
              <g key={idx}>
                {n.cx === 380 && (
                  <circle cx={n.cx} cy={n.cy} r={n.r + 10} fill="none" stroke="#38BDF8" strokeWidth="1.5" opacity="0.4" />
                )}
                <circle cx={n.cx} cy={n.cy} r={n.r} fill="#0F2747" stroke={n.col} strokeWidth="2.5" />
                <circle cx={n.cx} cy={n.cy} r={n.r - 6} fill={n.col} />
              </g>
            ))}
          </svg>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px', color: '#FFFFFF' }}>
              AI-POWERED CRIMINAL NETWORK INTELLIGENCE
            </h3>
            <p style={{ fontSize: '0.84rem', color: '#94A3B8', margin: 0, lineHeight: 1.5, maxWidth: 420, marginInline: 'auto' }}>
              Correlating multi-carrier telecom dumps, financial conduits, and cross-border syndicates into verifiable graph evidence.
            </p>
          </div>
        </div>

        {/* Footer Identity */}
        <div style={{ position: 'relative', zIndex: 2, fontSize: '0.72rem', color: '#64748B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

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
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)',
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1565C0', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
              SECURE INVESTIGATION GATEWAY
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', margin: '0 0 6px' }}>
              Welcome Back
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#334155', margin: 0 }}>
              Investigator Sign In with Authorized Credentials
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
                  color: '#64748B',
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
                    color: '#334155',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: "'Inter', sans-serif",
                    transition: 'border-color 150ms',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#1565C0')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
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
                    color: '#64748B',
                  }}
                >
                  Password
                </label>
                <span
                  style={{ fontSize: '0.72rem', color: '#1565C0', cursor: 'pointer', fontWeight: 500 }}
                  onClick={() => toast.info('For prototype evaluation, click SIGN IN directly.')}
                >
                  Need Help?
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
                    transition: 'border-color 150ms',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#1565C0')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
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
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#334155' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: '#1565C0', cursor: 'pointer' }}
                />
                Remember me
              </label>
              <span style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 600 }}>
                ● 256-Bit SSL Enforced
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: 8,
                background: '#1565C0',
                color: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: 700,
                border: 'none',
                cursor: loading ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 2px 8px rgba(21, 101, 192, 0.3)',
                transition: 'all 150ms',
                marginTop: 6,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#0D47A1')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#1565C0')}
            >
              {loading ? 'Authenticating...' : 'SIGN IN'} {!loading && <ArrowRight size={16} />}
            </button>
          </form>

          {/* Prototype Footer Marker */}
          <div style={{ marginTop: 26, paddingTop: 18, borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>

            <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: 3 }}>
              Authorized Law Enforcement Persons Only
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}