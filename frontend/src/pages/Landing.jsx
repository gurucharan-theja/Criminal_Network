import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Shield,
  ArrowRight,
  LogIn,
  User,
  Phone,
  Building,
  MapPin,
  Share2,
  Cpu,
  CheckCircle2,
  Layers,
  Activity,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react'

// Single-run count-up hook (Rule 5: count once and stop)
function useCountOnce(target, duration = 1200) {
  const [count, setCount] = useState(0)
  const hasAnimated = useRef(false)
  const elRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const startTime = performance.now()

          const step = (now) => {
            const progress = Math.min((now - startTime) / duration, 1)
            const ease = 1 - Math.pow(1 - progress, 3) // easeOutCubic
            setCount(Math.floor(ease * target))
            if (progress < 1) {
              requestAnimationFrame(step)
            } else {
              setCount(target) // exactly stop
            }
          }
          requestAnimationFrame(step)
        }
      },
      { threshold: 0.2 }
    )

    if (elRef.current) observer.observe(elRef.current)
    return () => observer.disconnect()
  }, [target, duration])

  return [count, elRef]
}

export default function Landing() {
  const navigate = useNavigate()

  // Dynamic progressive drawing for Hero Network Graph (Rule 3)
  // Stage 0: Initial Nodes appear (0-300ms)
  // Stage 1: Connections draw themselves progressively (400-1200ms)
  // Stage 2: Central entity activates with very subtle pulse
  const [graphStep, setGraphStep] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setGraphStep(1), 350)
    const t2 = setTimeout(() => setGraphStep(2), 1100)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  // Statistical counters (Rule 5: count once to exact value then stop)
  const [c1, ref1] = useCountOnce(128, 900)
  const [c2, ref2] = useCountOnce(94, 800)
  const [c3, ref3] = useCountOnce(2400, 1100)
  const [c4, ref4] = useCountOnce(100, 700)

  // Layout for the product demonstration network graph
  // Central node: Ravi (Key Suspect) surrounded by Phone, Org, Operator, Location
  const centerX = 260
  const centerY = 230

  const nodes = [
    { id: 'ravi', name: 'Ravi', type: 'Key Suspect', icon: '👤', x: centerX, y: centerY, isCenter: true, color: '#B91C1C' },
    { id: 'phone', name: '+91 98214 01920', type: 'Burner SIM', icon: '📱', x: centerX - 150, y: centerY, color: '#0284C7' },
    { id: 'org', name: 'Alpha Trading Ltd', type: 'Shell Front', icon: '🏢', x: centerX + 150, y: centerY, color: '#7C3AED' },
    { id: 'arun', name: 'Arun (Operator)', type: 'Syndicate Cell', icon: '👤', x: centerX, y: centerY - 130, color: '#D97706' },
    { id: 'loc', name: 'Nhava Sector 4', type: 'Safehouse', icon: '📍', x: centerX, y: centerY + 130, color: '#166534' },
  ]

  const links = [
    { from: 'ravi', to: 'phone', label: 'INTERCEPT', delay: 0 },
    { from: 'ravi', to: 'org', label: 'DIRECTOR', delay: 200 },
    { from: 'ravi', to: 'arun', label: 'HANDLER', delay: 400 },
    { from: 'ravi', to: 'loc', label: 'TOWER DUMP', delay: 600 },
  ]

  return (
    <div className="page-transition" style={{ minHeight: '100vh', background: '#F5F7FA', color: '#334155', fontFamily: "'Inter', sans-serif" }}>
      {/* ── Top Navigation Bar (Rule: No animation) ───────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          background: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          zIndex: 100,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo & Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: '#1565C0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Shield size={20} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
                CrimeNet Intelligence
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 500 }}>
                National Crime Records Bureau &bull; SIH-26189
              </div>
            </div>
          </div>

          {/* Navigation Links & Login */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <a href="#hero" style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0F172A' }}>Overview</a>
            <a href="#capabilities" style={{ fontSize: '0.84rem', fontWeight: 500, color: '#0F172A' }}>Capabilities</a>
            <a href="#metrics" style={{ fontSize: '0.84rem', fontWeight: 500, color: '#0F172A' }}>Metrics</a>

            {/* Login Button with 200ms Micro-interaction (Rule 2) */}
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary"
              style={{ padding: '7px 15px', fontSize: '0.82rem' }}
            >
              Investigator Login <ArrowRight size={14} className="btn-arrow" />
            </button>
          </nav>
        </div>
      </header>

      {/* ── Hero Section (Rule 1: NCRB -> Headline -> Description -> Buttons -> Graph) ── */}
      <section
        id="hero"
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          padding: '52px 24px 64px',
          display: 'grid',
          gridTemplateColumns: '1.05fr 0.95fr',
          gap: 48,
          alignItems: 'center',
        }}
      >
        {/* Sequence Left Column */}
        <div>
          {/* Step 1: NCRB Organization Tag */}
          <div className="hero-seq-1" style={{ marginBottom: 16 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 99,
                background: 'rgba(21, 101, 192, 0.08)',
                border: '1px solid rgba(21, 101, 192, 0.2)',
                color: '#1565C0',
                fontSize: '0.74rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
              }}
            >
              <Activity size={12} /> NATIONAL CRIME RECORDS BUREAU // LAW ENFORCEMENT
            </span>
          </div>

          {/* Step 2: Headline */}
          <h1
            className="hero-seq-2"
            style={{
              fontSize: '2.6rem',
              fontWeight: 800,
              lineHeight: 1.18,
              color: '#0F172A',
              letterSpacing: '-0.03em',
              margin: '0 0 16px',
            }}
          >
            Uncover Connections. <br />
            <span style={{ color: '#1565C0' }}>Reveal Intelligence.</span>
          </h1>

          {/* Step 3: Description */}
          <p
            className="hero-seq-3"
            style={{
              fontSize: '1rem',
              color: '#475569',
              lineHeight: 1.6,
              margin: '0 0 28px',
              maxWidth: 520,
            }}
          >
            AI-powered criminal network analysis for investigating officers. Extract entities, trace multi-carrier CDRs, and map hidden syndicate hierarchies from FIRs and charge-sheets.
          </p>

          {/* Step 4: Buttons (Rule 2: Lift 2px, Arrow moves 4px) */}
          <div className="hero-seq-4" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary"
              style={{ padding: '11px 22px', fontSize: '0.9rem' }}
            >
              Explore Platform <ArrowRight size={16} className="btn-arrow" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-outline"
              style={{ padding: '11px 20px', fontSize: '0.9rem' }}
            >
              Sign In to Terminal
            </button>
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: 18, paddingTop: 16, borderTop: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              <CheckCircle2 size={14} color="#166534" /> Section 65B Certified
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              <CheckCircle2 size={14} color="#166534" /> Multi-Carrier CDR Parsing
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.76rem', color: '#64748B', fontWeight: 600 }}>
              <CheckCircle2 size={14} color="#166534" /> Zero-Trust Role Access
            </div>
          </div>
        </div>

        {/* Step 5: Network Visualization (Rule 3: Main Animation ⭐) */}
        <div
          className="hero-seq-5"
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 14,
            padding: 20,
            boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.05)',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16A34A' }} />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0F172A', letterSpacing: '0.04em' }}>
                SYNDICATE TOPOLOGY DEMO
              </span>
            </div>
            <span style={{ fontSize: '0.68rem', color: '#64748B', fontFamily: 'monospace' }}>
              Betweenness: 0.88
            </span>
          </div>

          {/* SVG Product Demonstration Network */}
          <svg
            viewBox="0 0 520 460"
            style={{
              width: '100%',
              height: 'auto',
              background: '#F8FAFC',
              borderRadius: 10,
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
            }}
          >
            {/* Subtle dot pattern */}
            <defs>
              <pattern id="landing-dots" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" fill="#CBD5E1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#landing-dots)" />

            {/* 1. Connections draw themselves progressively (Rule 3) */}
            {graphStep >= 1 &&
              links.map((link, idx) => {
                const s = nodes.find((n) => n.id === link.from)
                const t = nodes.find((n) => n.id === link.to)
                if (!s || !t) return null

                // Compute length for SVG stroke-dashoffset animation
                const length = Math.hypot(t.x - s.x, t.y - s.y)

                return (
                  <g key={idx}>
                    {/* Progressively animated drawing line */}
                    <line
                      x1={s.x}
                      y1={s.y}
                      x2={t.x}
                      y2={t.y}
                      stroke="#94A3B8"
                      strokeWidth="2"
                      strokeDasharray={length}
                      strokeDashoffset={graphStep >= 1 ? 0 : length}
                      style={{
                        transition: `stroke-dashoffset 600ms cubic-bezier(0.16, 1, 0.3, 1) ${link.delay}ms`,
                      }}
                    />

                    {/* Label Badge */}
                    <rect
                      x={(s.x + t.x) / 2 - 36}
                      y={(s.y + t.y) / 2 - 8}
                      width="72"
                      height="16"
                      rx="4"
                      fill="#FFFFFF"
                      stroke="#CBD5E1"
                      strokeWidth="0.8"
                      opacity={graphStep >= 2 ? 1 : 0}
                      style={{ transition: 'opacity 300ms ease 800ms' }}
                    />
                    <text
                      x={(s.x + t.x) / 2}
                      y={(s.y + t.y) / 2 + 3}
                      fontSize="7"
                      fontFamily="monospace"
                      fontWeight="700"
                      fill="#475569"
                      textAnchor="middle"
                      opacity={graphStep >= 2 ? 1 : 0}
                      style={{ transition: 'opacity 300ms ease 800ms' }}
                    >
                      {link.label}
                    </text>
                  </g>
                )
              })}

            {/* 2. Nodes */}
            {nodes.map((node) => {
              const isCenter = node.isCenter

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Central Node subtle pulse (Rule 3) */}
                  {isCenter && graphStep >= 2 && (
                    <circle
                      r="36"
                      fill="none"
                      stroke="#B91C1C"
                      strokeWidth="2"
                      className="pulse-subtle"
                    />
                  )}

                  {/* Card box */}
                  <rect
                    x="-60"
                    y="-24"
                    width="120"
                    height="48"
                    rx="8"
                    fill="#FFFFFF"
                    stroke={isCenter ? '#B91C1C' : '#CBD5E1'}
                    strokeWidth={isCenter ? '2' : '1.2'}
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.04))"
                  />

                  {/* Emoji / Icon */}
                  <text x="-44" y="5" fontSize="15" textAnchor="middle">
                    {node.icon}
                  </text>

                  {/* Node Name */}
                  <text x="-26" y="-3" fontSize="9" fontWeight="700" fill="#0F172A">
                    {node.name.length > 13 ? node.name.slice(0, 12) + '…' : node.name}
                  </text>

                  {/* Node Sub-Role */}
                  <text x="-26" y="10" fontSize="7" fontWeight="600" fill={node.color}>
                    {node.type.toUpperCase()}
                  </text>
                </g>
              )
            })}
          </svg>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, fontSize: '0.72rem', color: '#64748B' }}>
            <span>Identified Target: <strong style={{ color: '#0F172A' }}>Ravi (Degree: 4)</strong></span>
            <span style={{ color: '#1565C0', fontWeight: 600 }}>Forensic Knowledge Graph</span>
          </div>
        </div>
      </section>

      {/* ── Statistics Strip (Rule 5: Counts once to target then stops) ── */}
      <section
        id="metrics"
        style={{
          background: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          borderBottom: '1px solid #E2E8F0',
          padding: '40px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 32,
            textAlign: 'center',
          }}
        >
          <div ref={ref1}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#1565C0', fontFamily: 'monospace' }}>
              {c1}+
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0F172A', marginTop: 4 }}>
              Investigation Dockets
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Synchronized statewide</div>
          </div>

          <div ref={ref2}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#B91C1C', fontFamily: 'monospace' }}>
              {c2}%
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0F172A', marginTop: 4 }}>
              Entity Extraction Accuracy
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Tested on police FIR corpus</div>
          </div>

          <div ref={ref3}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#00897B', fontFamily: 'monospace' }}>
              {c3.toLocaleString()}+
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0F172A', marginTop: 4 }}>
              CDRs Parsed Per Minute
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Multi-carrier tower logs</div>
          </div>

          <div ref={ref4}>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#7C3AED', fontFamily: 'monospace' }}>
              {c4}%
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0F172A', marginTop: 4 }}>
              Section 65B Compliant
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Cryptographic SHA-256 seal</div>
          </div>
        </div>
      </section>

      {/* ── Core Capabilities Grid (Rule 4: Cards hover only, small lift 3px + shadow) ── */}
      <section
        id="capabilities"
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          padding: '64px 24px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1565C0', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            FORENSIC MODULES
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1E293B', margin: '0 0 10px' }}>
            Investigation Capabilities
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#64748B', maxWidth: 540, margin: '0 auto' }}>
            Built strictly for law-enforcement evidentiary standards and automated syndicate extraction.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 20,
          }}
        >
          {[
            {
              icon: <User size={20} color="#1565C0" />,
              title: 'Entity AI Extraction',
              desc: 'Named Entity Recognition extracts suspects, aliases, burner phones, vehicles, and shell firms from unstructured police documents.',
            },
            {
              icon: <Share2 size={20} color="#00897B" />,
              title: 'Relationship AI',
              desc: 'Maps transactional conduits, kinship ties, co-conspirator associations, and command hierarchies automatically.',
            },
            {
              icon: <Layers size={20} color="#7C3AED" />,
              title: 'Network Analysis',
              desc: 'Centrality algorithms (degree, betweenness, closeness) isolate syndicate kingpins and cross-border brokers.',
            },
            {
              icon: <AlertTriangle size={20} color="#B45309" />,
              title: 'CDR Pattern Detection',
              desc: 'Identifies nocturnal burst calling, burner phone swaps, IMEI pairing signatures, and rapid multi-party dispersal.',
            },
            {
              icon: <Cpu size={20} color="#166534" />,
              title: 'Blockchain Audit Ledger',
              desc: 'Tamper-proof SHA-256 cryptographic chain of custody for court-admissible Section 65B electronic proof.',
            },
          ].map((cap, i) => (
            <div
              key={i}
              className="card"
              onClick={() => navigate('/login')}
              style={{
                cursor: 'pointer',
                padding: '22px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {cap.icon}
                </div>
                <ArrowUpRight size={15} color="#94A3B8" />
              </div>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>
                {cap.title}
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
                {cap.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer
        style={{
          background: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          padding: '36px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 1240,
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 20,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Shield size={16} color="#1565C0" />
              <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#0F172A' }}>
                Built for Law Enforcement & Judicial Investigation
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
              National Crime Records Bureau &bull; Smart India Hackathon Prototype (SIH-26189)
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
              Section 65B Indian Evidence Act &bull; Section 63 BSA Compliant
            </span>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary btn-sm"
            >
              Sign In to Terminal <ArrowRight size={13} className="btn-arrow" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
