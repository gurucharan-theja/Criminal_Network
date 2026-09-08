import React, { useState, useEffect } from 'react'
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
  Search,
  CheckCircle2,
  FileText,
  Lock,
  Layers,
  Activity,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate()

  // Dynamic animation state for hero network visualization
  // Step 1: Entities appear (0s) -> Step 2: Relationships connect (1s) -> Step 3: Central node highlights (2s)
  const [animStage, setAnimStage] = useState(1)
  const [hoveredNode, setHoveredNode] = useState(null)

  useEffect(() => {
    const t1 = setTimeout(() => setAnimStage(2), 700)
    const t2 = setTimeout(() => setAnimStage(3), 1600)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  // Nodes for the Hero Network Visualization
  const nodes = [
    { id: 'ravi', name: 'Ravi', label: 'PERSON', type: 'person', role: 'Key Suspect', x: 260, y: 70, color: '#B91C1C', icon: User },
    { id: 'phone1', name: '+91 98214 01920', label: 'PHONE', type: 'phone', role: 'Burner MSISDN', x: 100, y: 180, color: '#B45309', icon: Phone },
    { id: 'org', name: 'Alpha Logistics Ltd', label: 'ORGANIZATION', type: 'org', role: 'Front Entity', x: 420, y: 180, color: '#7C3AED', icon: Building },
    { id: 'arun', name: 'Arun', label: 'PERSON', type: 'person', role: 'Syndicate Operator', x: 260, y: 280, color: '#B91C1C', icon: User },
    { id: 'loc', name: 'Nhava Sheva Sector 4', label: 'LOCATION', type: 'loc', role: 'Transit Point', x: 260, y: 400, color: '#166534', icon: MapPin },
  ]

  // Links connecting the nodes
  const links = [
    { from: 'ravi', to: 'phone1', label: 'COMMUNICATED_VIA', delay: '0.2s' },
    { from: 'ravi', to: 'org', label: 'DIRECTOR_OF', delay: '0.4s' },
    { from: 'phone1', to: 'arun', label: 'FREQUENT_CALLS (Night)', delay: '0.6s' },
    { from: 'org', to: 'arun', label: 'PAYROLL_TRANSACTION', delay: '0.8s' },
    { from: 'arun', to: 'loc', label: 'CO-LOCATED_TOWER', delay: '1.0s' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', color: '#334155', fontFamily: "'Inter', sans-serif" }}>
      {/* ── Top Navigation Bar ─────────────────────────────────── */}
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
          {/* Neutral Project & Organization Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #1565C0, #0D47A1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 2px 6px rgba(21,101,192,0.25)',
              }}
            >
              <Shield size={22} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
                  CNI // CrimeNet Intelligence
                </span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'rgba(21,101,192,0.08)',
                    color: '#1565C0',
                    border: '1px solid rgba(21,101,192,0.2)',
                  }}
                >
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 500 }}>
                National Crime Records Intelligence &bull; AI Network Analytics
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <a href="#hero" style={{ textDecoration: 'none', color: '#0F172A', fontSize: '0.85rem', fontWeight: 600 }}>Home</a>
            <a href="#capabilities" style={{ textDecoration: 'none', color: '#0F172A', fontSize: '0.85rem', fontWeight: 500 }}>Capabilities</a>
            <a href="#workflow" style={{ textDecoration: 'none', color: '#0F172A', fontSize: '0.85rem', fontWeight: 500 }}>How It Works</a>
        

            {/* Officer Login Button */}
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                fontSize: '0.85rem',
                fontWeight: 600,
                borderRadius: 6,
                background: '#1565C0',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <LogIn size={15} /> Investigator Login
            </button>
          </nav>
        </div>
      </header>

      {/* ── Hero Section ────────────────────────────────────────── */}
      <section
        id="hero"
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          padding: '56px 24px 72px',
          display: 'grid',
          gridTemplateColumns: '1.05fr 0.95fr',
          gap: 48,
          alignItems: 'center',
        }}
      >
        {/* Hero Text */}
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 12px',
              borderRadius: 99,
              background: 'rgba(21, 101, 192, 0.08)',
              border: '1px solid rgba(21, 101, 192, 0.25)',
              color: '#1565C0',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.06em',
              marginBottom: 20,
            }}
          >
            <Activity size={13} /> AI-POWERED INVESTIGATION PLATFORM
          </div>

          <h1
            style={{
              fontSize: '2.75rem',
              fontWeight: 800,
              lineHeight: 1.18,
              color: '#0F172A',
              letterSpacing: '-0.03em',
              margin: '0 0 18px',
            }}
          >
            Uncover Connections. <br />
            <span style={{ color: '#1565C0' }}>Reveal Intelligence.</span>
          </h1>

          <p
            style={{
              fontSize: '1.05rem',
              color: '#334155',
              lineHeight: 1.6,
              margin: '0 0 32px',
              maxWidth: 540,
            }}
          >
            Analyze structured and unstructured crime data to discover entities, relationships, suspicious patterns, and interconnected criminal networks across multi-jurisdiction dockets.
          </p>

          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 36 }}>
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                borderRadius: 8,
                background: '#1565C0',
                color: '#FFFFFF',
                fontSize: '0.92rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(21,101,192,0.3)',
                transition: 'all 150ms',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#0D47A1')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#1565C0')}
            >
              Explore Platform <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 22px',
                borderRadius: 8,
                background: '#FFFFFF',
                color: '#0F172A',
                fontSize: '0.92rem',
                fontWeight: 600,
                border: '1px solid #CBD5E1',
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#1565C0'
                e.currentTarget.style.color = '#1565C0'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#CBD5E1'
                e.currentTarget.style.color = '#0F172A'
              }}
            >
              <LogIn size={16} color="#1565C0" /> Investigator Login
            </button>
          </div>

          {/* Trust & Evidence Badges */}
          <div style={{ display: 'flex', gap: 20, paddingTop: 18, borderTop: '1px solid #E2E8F0', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
              <CheckCircle2 size={15} color="#166534" /> Section 65B Certified Proofs
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
              <CheckCircle2 size={15} color="#166534" /> Multi-Carrier CDR Ingestion
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
              <CheckCircle2 size={15} color="#166534" /> Zero-Trust Role Access
            </div>
          </div>
        </div>

        {/* Hero Network Visualization (Live-looking Animated Crime Network) */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.02)',
            position: 'relative',
          }}
        >
          {/* Interactive Card Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid #F1F5F9', paddingBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#166534' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A', letterSpacing: '0.04em' }}>
                SYNDICATE NETWORK TOPOLOGY // LIVE INFERENCE
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#64748B', fontFamily: 'monospace' }}>
              Centrality: 0.942
            </span>
          </div>

          {/* SVG Animated Canvas */}
          <svg
            viewBox="0 0 520 480"
            style={{
              width: '100%',
              height: 'auto',
              background: '#F8FAFC',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
            }}
          >
            {/* Subtle Dot Grid */}
            <defs>
              <pattern id="landing-dots" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1" fill="#CBD5E1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#landing-dots)" />

            {/* Connecting Edges (Stage 2+) */}
            {animStage >= 2 &&
              links.map((link, idx) => {
                const s = nodes.find((n) => n.id === link.from)
                const t = nodes.find((n) => n.id === link.to)
                if (!s || !t) return null
                return (
                  <g key={idx}>
                    <line
                      x1={s.x}
                      y1={s.y}
                      x2={t.x}
                      y2={t.y}
                      stroke="#94A3B8"
                      strokeWidth="2"
                      strokeDasharray="4 3"
                      style={{
                        animation: 'dashAnimation 30s linear infinite',
                      }}
                    />
                    {/* Edge Midpoint Label */}
                    <rect
                      x={(s.x + t.x) / 2 - 40}
                      y={(s.y + t.y) / 2 - 9}
                      width="80"
                      height="16"
                      rx="4"
                      fill="#FFFFFF"
                      stroke="#E2E8F0"
                    />
                    <text
                      x={(s.x + t.x) / 2}
                      y={(s.y + t.y) / 2 + 3}
                      fontSize="7.5"
                      fontFamily="monospace"
                      fontWeight="600"
                      fill="#64748B"
                      textAnchor="middle"
                    >
                      {link.label.split(' ')[0]}
                    </text>
                  </g>
                )
              })}

            {/* Nodes (Stage 1+) */}
            {nodes.map((node) => {
              const isHovered = hoveredNode === node.id
              const isKeyTarget = node.id === 'ravi' && animStage >= 3

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  style={{ cursor: 'pointer', transition: 'all 200ms' }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Outer Pulsing Halo for Key Suspect (Ravi) */}
                  {isKeyTarget && (
                    <circle
                      r="36"
                      fill="none"
                      stroke="#B91C1C"
                      strokeWidth="2"
                      opacity="0.3"
                      style={{ animation: 'pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
                    />
                  )}

                  {/* Node Background Card */}
                  <rect
                    x="-65"
                    y="-28"
                    width="130"
                    height="56"
                    rx="8"
                    fill="#FFFFFF"
                    stroke={isKeyTarget ? '#B91C1C' : isHovered ? '#1565C0' : '#E2E8F0'}
                    strokeWidth={isKeyTarget || isHovered ? '2' : '1.5'}
                    filter="drop-shadow(0 2px 4px rgba(0,0,0,0.05))"
                  />

                  {/* Left Category Indicator Dot */}
                  <circle cx="-48" cy="0" r="10" fill={node.color} opacity="0.12" />
                  <circle cx="-48" cy="0" r="4.5" fill={node.color} />

                  {/* Category Type Small Label */}
                  <text
                    x="-32"
                    y="-9"
                    fontSize="7.5"
                    fontWeight="800"
                    letterSpacing="0.06em"
                    fill="#64748B"
                  >
                    {node.label}
                  </text>

                  {/* Entity Name */}
                  <text
                    x="-32"
                    y="6"
                    fontSize="10"
                    fontWeight="700"
                    fill="#0F172A"
                  >
                    {node.name.length > 14 ? node.name.slice(0, 13) + '…' : node.name}
                  </text>

                  {/* Entity Role */}
                  <text
                    x="-32"
                    y="17"
                    fontSize="7"
                    fontWeight="500"
                    fill="#94A3B8"
                  >
                    {node.role}
                  </text>
                </g>
              )
            })}
          </svg>

          {/* Explanatory Caption */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: '0.72rem', color: '#64748B' }}>
            <span>Identified Hub: <strong>Ravi (Degree: 4, Betweenness: 0.88)</strong></span>
            <span style={{ color: '#1565C0', fontWeight: 600 }}>Interactive Graph Preview</span>
          </div>
        </div>
      </section>

      {/* ── Core Capabilities Grid ──────────────────────────────── */}
      <section
        id="capabilities"
        style={{
          background: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          borderBottom: '1px solid #E2E8F0',
          padding: '64px 24px',
        }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1565C0', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
              MODULAR INTELLIGENCE ENGINE
            </div>
            <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1E293B', margin: '0 0 10px' }}>
              Core Capabilities
            </h2>
            <p style={{ fontSize: '0.92rem', color: '#334155', maxWidth: 600, margin: '0 auto' }}>
              Architected specifically for law-enforcement evidentiary standards, multi-source ingestion, and automated syndicate extraction.
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
                icon: <User size={22} color="#1565C0" />,
                title: 'Entity AI Extraction',
                desc: 'Deep NER extracts suspects, aliases, phone numbers, vehicles, and shell companies from unstructured FIRs and charge-sheets.',
              },
              {
                icon: <Share2 size={22} color="#00897B" />,
                title: 'Relationship AI',
                desc: 'Identifies transactional conduits, familial ties, co-conspirator associations, and command hierarchies automatically.',
              },
              {
                icon: <Layers size={22} color="#7C3AED" />,
                title: 'Network Analysis',
                desc: 'Degree, closeness, and betweenness centrality graph algorithms to isolate syndicate kingpins and cross-border brokers.',
              },
              {
                icon: <AlertTriangle size={22} color="#B45309" />,
                title: 'Pattern Detection',
                desc: 'Nocturnal burst ping detection, burner phone swaps, IMEI pairing signatures, and rapid multi-party dispersal alerts.',
              },
              {
                icon: <Cpu size={22} color="#166534" />,
                title: 'Investigator Intelligence',
                desc: 'Natural language investigation assistant answering complex relational graph queries and generating Section 65B dossier briefs.',
              },
            ].map((cap, i) => (
              <div
                key={i}
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: 12,
                  padding: '24px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  transition: 'all 200ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#1565C0'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.04)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E2E8F0'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {cap.icon}
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>
                  {cap.title}
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.5, margin: 0 }}>
                  {cap.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works (Pipeline Workflow) ────────────────────── */}
      <section
        id="workflow"
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          padding: '64px 24px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#00897B', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            EVIDENTIARY PIPELINE
          </div>
          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1E293B', margin: '0 0 10px' }}>
            How It Works
          </h2>
          <p style={{ fontSize: '0.92rem', color: '#334155' }}>
            From raw evidentiary intake to judicial proof in five structured forensic phases.
          </p>
        </div>

        {/* Step Flow Ribbon */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 16,
            position: 'relative',
          }}
        >
          {[
            { step: '01', title: 'Upload', desc: 'Ingest FIRs, police dockets, carrier CDR dumps, or bank statements.' },
            { step: '02', title: 'Extract', desc: 'Named Entity Recognition parses phones, vehicles, suspects, and dates.' },
            { step: '03', title: 'Connect', desc: 'Graph engine forms co-occurrence and relational links across files.' },
            { step: '04', title: 'Analyze', desc: 'Compute centrality scores, tower co-locations, and nocturnal rings.' },
            { step: '05', title: 'Intelligence', desc: 'Export court-ready Section 65B certified audit ledgers.' },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '20px 18px',
                position: 'relative',
                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              <div
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: '#1565C0',
                  opacity: 0.35,
                  fontFamily: 'monospace',
                  marginBottom: 8,
                }}
              >
                {item.step}
              </div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', margin: '0 0 6px' }}>
                {item.title}
              </h4>
              <p style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.45, margin: 0 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Built for Investigation / Footer ─────────────────────── */}
      <footer
        id="compliance"
        style={{
          background: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          padding: '40px 24px',
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
              <Shield size={18} color="#1565C0" />
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0F172A' }}>
                Built for Law Enforcement & Judicial Investigation
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
              National Crime Records Intelligence &bull; Smart India Hackathon (SIH 2026 Prototype)
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
              Compliant with Section 65B Indian Evidence Act &bull; Section 63 BSA
            </span>
            <button
              onClick={() => navigate('/login')}
              style={{
                background: '#1565C0',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 6,
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Sign In to Terminal &rarr;
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}