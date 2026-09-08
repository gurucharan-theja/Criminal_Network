import React, { useState } from 'react'
import {
  HelpCircle,
  ShieldAlert,
  FileText,
  Search,
  Network,
  Download,
  AlertTriangle,
  FolderOpen,
  PhoneCall,
  Terminal,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Lock,
  Cpu
} from 'lucide-react'

const SOP_ITEMS = [
  {
    id: 'fir-ingest',
    title: 'SOP 01: Ingesting Raw FIRs & Call Data Records (CDR)',
    badge: 'STAGE 1: INGESTION',
    content: `1. Navigate to the "Upload Data" workspace.
2. Drag and drop police First Information Reports (PDF/DOCX), intercepted call detail transcripts, or financial bank transaction ledgers (CSV).
3. The Apache Tika & Python NLP engine parses Indian phone codes (+91), vehicle registrations (e.g. MH-12, DL-04), suspected aliases, and shell corporations.
4. Verify the extraction summary table before dispatching the entities to the live tactical graph.`
  },
  {
    id: 'graph-analysis',
    title: 'SOP 02: Tactical Force-Directed Graph Analysis & Kingpin Identification',
    badge: 'STAGE 2: ANALYSIS',
    content: `1. Navigate to the "Network Analysis" tab to interact with the multi-dimensional force simulation.
2. Degree centrality dictates node sizing: suspects with high link densities and financial conduits are highlighted in high-threat red.
3. Click any suspect node to bring up the intelligence sidebar: phone details, associated shell companies, known aliases, and linked evidence sentences.
4. Use filters to isolate specific connection vectors (e.g., exclusively view "Financial / Hawala" ties to locate money mules).`
  },
  {
    id: 'case-file',
    title: 'SOP 03: Linking Intelligence to Active Case Folders',
    badge: 'STAGE 3: CASE FILE',
    content: `1. Open "Case Files" to track active syndicate inquiries (e.g., Operation Coastal Storm).
2. Group newly identified suspects and evidence documents directly under specific FIR numbers and lead investigators.
3. Mark cases as Active, Pending Judicial Clearance, or Closed upon suspect apprehensions.`
  },
  {
    id: 'court-export',
    title: 'SOP 04: Generating Judicial-Grade Evidence Packages',
    badge: 'STAGE 4: PROSECUTION',
    content: `1. Open the "Insights" page.
2. Review aggregated KPI metrics: Threat Distribution, High-Risk Conduits, and Relationship Classification.
3. Click "Export Intelligence Dossier" to generate cryptographically structured JSON or CSV evidence tables admissible under Section 65B of the Indian Evidence Act.
4. Use browser print (Ctrl+P or "Print Dossier") to snapshot the complete graph layout as a color-coded prosecution exhibit.`
  }
]

export default function Help() {
  const [openSection, setOpenSection] = useState('fir-ingest')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSop = SOP_ITEMS.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid var(--secondary)',
              borderRadius: 'var(--radius-md)',
              padding: '6px 10px',
              color: 'var(--secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.08em'
            }}>
              <ShieldAlert size={14} /> INVESTIGATOR MANUAL & PROTOCOLS
            </div>
            <span style={{
              fontSize: '0.72rem',
              color: 'var(--warning)',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid var(--warning)',
              padding: '2px 8px',
              borderRadius: 4,
              fontWeight: 600
            }}>
              CLASSIFICATION: OFFICIAL USE
            </span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.45rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            Federal Crime Intelligence Standard Operating Procedures (SOP)
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text)', fontSize: '0.875rem' }}>
            Tactical guide for investigating organized syndicates, financial money laundering, and digital forensics.
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 14px'
        }}>
          <PhoneCall size={16} color="var(--danger)" />
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Cyber Crime Rapid Response</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
              1930 / +91-11-2436-1234
            </div>
          </div>
        </div>
      </div>

      {/* Quick Search */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 600 }}>
        <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
        <input
          className="input"
          style={{ width: '100%', paddingLeft: 42, boxSizing: 'border-box' }}
          placeholder="Search investigative directives (e.g. Hawala, Section 65B, Kingpin, CDR)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Emergency Tactical Directive Alert */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(245, 158, 11, 0.08))',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 16
      }}>
        <AlertTriangle size={24} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <h4 style={{ margin: '0 0 4px', fontSize: '0.92rem', color: 'var(--danger)', fontWeight: 700 }}>
            CRITICAL EVIDENTIARY MANDATE (INDIAN IT ACT & BNSS)
          </h4>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--muted)', lineHeight: 1.5 }}>
            All entities extracted from telecom tower dumps and bank transactions carry metadata hashes. Tampering or editing node properties directly without supervisory token approval invalidates digital chain-of-custody for judicial submissions.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {/* Left Column: Standard Operating Procedures Accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '1rem', color: 'var(--text)' }}>
            Investigative Workflows
          </h3>

          {filteredSop.map((sop) => {
            const isOpen = openSection === sop.id
            return (
              <div
                key={sop.id}
                className="card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  borderColor: isOpen ? 'var(--primary)' : 'var(--border)',
                  transition: 'border-color var(--transition)'
                }}
              >
                <div
                  onClick={() => setOpenSection(isOpen ? '' : sop.id)}
                  style={{
                    padding: '16px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: isOpen ? 'rgba(34, 211, 238, 0.04)' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {isOpen ? <ChevronDown size={18} color="var(--primary)" /> : <ChevronRight size={18} color="var(--muted)" />}
                    <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.06em' }}>
                        {sop.badge}
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>
                        {sop.title}
                      </div>
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div style={{
                    padding: '0 18px 18px 48px',
                    fontSize: '0.82rem',
                    color: 'var(--muted)',
                    lineHeight: 1.7,
                    whiteSpace: 'pre-line',
                    borderTop: '1px solid var(--border)'
                  }}>
                    {sop.content}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Right Column: Tactical Reference Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '1rem', color: 'var(--text)' }}>
            Investigation Code Reference
          </h3>

          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Terminal size={18} color="var(--primary)" />
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Graph Visual Semantics</h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--danger)', boxShadow: '0 0 8px var(--danger)' }} />
                <span style={{ color: 'var(--text)' }}>Red Node:</span>
                <span style={{ color: 'var(--muted)' }}>High-Threat Accused / Syndicate Mastermind</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--primary)' }} />
                <span style={{ color: 'var(--text)' }}>Cyan Node:</span>
                <span style={{ color: 'var(--muted)' }}>Communication Conduit / Shell Front</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--success)' }} />
                <span style={{ color: 'var(--text)' }}>Green Line:</span>
                <span style={{ color: 'var(--muted)' }}>Financial Transfer / Hawala Route</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#A78BFA' }} />
                <span style={{ color: 'var(--text)' }}>Purple Line:</span>
                <span style={{ color: 'var(--muted)' }}>Kinship / Blood Relative Connection</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Lock size={18} color="var(--warning)" />
              <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Inter-Agency Collaboration Desks</h4>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.5 }}>
              In inquiries involving transnational fugitives or cross-border narcotics smuggling, route your case intelligence file via secure channels:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg)', borderRadius: 4 }}>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>ED (Enforcement Directorate):</span>
                <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>hawala.desk@gov.in</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg)', borderRadius: 4 }}>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>NIA Operations Center:</span>
                <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>ops.counterterror@gov.in</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg)', borderRadius: 4 }}>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>NCB (Narcotics Control):</span>
                <span style={{ color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>interdict.hq@gov.in</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
