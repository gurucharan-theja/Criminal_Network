import React, { useState } from 'react'
import {
  Shield,
  Award,
  Radio,
  FileCheck2,
  Crosshair,
  Lock,
  ExternalLink,
  CheckCircle2,
  AlertOctagon,
  X,
  ChevronRight,
  Fingerprint
} from 'lucide-react'
import useAuthStore from '../store/useAuthStore'

export default function OfficerDossierModal({ isOpen, onClose }) {
  if (!isOpen) return null

  const [activeTab, setActiveTab] = useState('dossier') // dossier | commendations | operations
  const officer = useAuthStore((s) => s.officer)

  const officerName = officer?.name || 'Inspector Vikram Rathore'
  const officerBadge = officer?.badge || 'NCRB-INV-7041'
  const officerRole = officer?.role || 'Lead Investigator'
  const officerUnit = officer?.unit || 'Criminal Network Intelligence Unit'

  const initials = officerName
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'VR'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2500,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 150ms both',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          width: '100%',
          maxWidth: 680,
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.12), 0 0 1px 1px rgba(0,0,0,0.04)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeInUp 200ms both',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {/* Classified Top Banner */}
        <div
          style={{
            background: '#FEF2F2',
            borderBottom: '1px solid #FEE2E2',
            padding: '9px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.72rem',
            letterSpacing: '0.08em',
            fontWeight: 700,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#DC2626' }}>
            <Lock size={13} />
            <span>CLASSIFICATION: TOP SECRET // LAW ENFORCEMENT SENSITIVE (LES)</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748B',
              display: 'flex',
              padding: 2,
              borderRadius: 4,
              transition: 'color 150ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#0F172A')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Officer Dossier Header */}
        <div style={{ padding: '24px 24px 18px', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* Avatar with Security Ring */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #1565C0, #0D47A1)',
                border: '2px solid #FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(21, 101, 192, 0.3)',
                color: '#FFFFFF',
                fontWeight: 800,
                fontSize: '1.35rem',
                letterSpacing: '0.05em',
              }}
            >
              {initials}
            </div>
            <span
              style={{
                position: 'absolute',
                bottom: -5,
                right: -5,
                background: '#166534',
                color: '#FFFFFF',
                fontSize: '0.62rem',
                fontWeight: 800,
                padding: '2px 6px',
                borderRadius: 99,
                boxShadow: '0 1px 4px rgba(22, 101, 52, 0.4)',
              }}
            >
              ACTIVE
            </span>
          </div>

          {/* Core Identification */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                {officerName}
              </h2>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'rgba(21, 101, 192, 0.08)',
                  color: '#1565C0',
                  border: '1px solid rgba(21, 101, 192, 0.25)',
                  fontFamily: 'monospace',
                }}
              >
                BADGE: {officerBadge}
              </span>
            </div>

            <div style={{ fontSize: '0.82rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 600, color: '#1565C0' }}>{officerRole}</span>
              <span>&bull;</span>
              <span>{officerUnit}</span>
              <span>&bull;</span>
              <span style={{ color: '#00897B', fontWeight: 600 }}>Tier-1 Clearance</span>
            </div>

            <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#64748B' }}>
                <Radio size={13} color="#166534" /> Inter-Agency Liaison: Central Crime Desk / Cyber Forensics / INTERPOL
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: '#64748B' }}>
                <Fingerprint size={13} color="#1565C0" /> Biometric Key: RSA-4096-VERIFIED
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
            padding: '0 24px 16px',
          }}
        >
          {[
            { label: 'Syndicates Neutralized', value: '14', color: '#DC2626' },
            { label: 'Asset Forfeitures Tracked', value: '₹420 Cr', color: '#166534' },
            { label: 'Conviction Success Rate', value: '96.4%', color: '#1565C0' },
            { label: 'Active Red Notices', value: '03', color: '#D97706' },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: 8,
                padding: '10px 12px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600, marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: stat.color, fontFamily: 'monospace' }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #E2E8F0',
            padding: '0 24px',
            gap: 20,
          }}
        >
          {[
            { id: 'dossier', label: 'Tactical Record & Dossier' },
            { id: 'commendations', label: 'Medals & State Honors' },
            { id: 'operations', label: 'Major Declassified Ops' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                padding: '10px 0',
                color: activeTab === tab.id ? '#1565C0' : '#64748B',
                fontSize: '0.82rem',
                fontWeight: activeTab === tab.id ? 700 : 500,
                borderBottom: activeTab === tab.id ? '2px solid #1565C0' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 150ms',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div style={{ padding: '18px 24px 22px', maxHeight: 290, overflowY: 'auto' }}>
          {activeTab === 'dossier' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: '0.84rem', color: '#334155', lineHeight: 1.6 }}>
                <strong>Career Background:</strong> Commissioned into the Indian Police Service (IPS, 2011 Batch). Deputed to the Central Bureau of Investigation in 2019 following groundbreaking counter-narcotics interventions along western seaports. Specialized in forensic graph triangulation and Hawala money trail recovery.
              </div>

              <div
                style={{
                  background: 'rgba(21, 101, 192, 0.04)',
                  border: '1px solid rgba(21, 101, 192, 0.18)',
                  borderRadius: 8,
                  padding: '14px 16px',
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1565C0', marginBottom: 6 }}>
                  Current Investigative Mandates:
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>
                  <li>Supervision of Multi-Agency Taskforce against counterfeit currency cartels.</li>
                  <li>Lead Interrogator for Intercept Case: <strong>Operation Coastal Storm</strong>.</li>
                  <li>Special Liaison for Financial Intelligence Unit (FIU-IND) cross-border disclosures.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'commendations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                {
                  title: "President's Police Medal for Gallantry (PPMG)",
                  year: '2023',
                  desc: 'Awarded for neutralizing an international armed arms-smuggling ring in high-seas coordinated action.',
                },
                {
                  title: 'Union Home Minister’s Medal for Excellence in Investigation',
                  year: '2021',
                  desc: 'Pioneered automated CDR graph correlation resulting in 100% asset recovery in ₹300 Cr Hawala racket.',
                },
                {
                  title: 'CBI Director’s Commendation Gold Disc',
                  year: '2020',
                  desc: 'Exemplary performance during high-profile extradition proceedings from Dubai & Southeast Asia.',
                },
              ].map((award, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '10px 14px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 8,
                  }}
                >
                  <Award size={18} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                        {award.title}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#D97706', fontFamily: 'monospace', fontWeight: 700 }}>
                        {award.year}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>{award.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'operations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                {
                  code: 'OP-BLACK-TIDE',
                  status: 'CONCLUDED // 100% RECOVERY',
                  target: 'Coastal Contraband Syndicate',
                  result: '18 arrests, ₹140 Cr contraband confiscated',
                },
                {
                  code: 'OP-SHADOW-LEDGER',
                  status: 'JUDICIAL PROCEEDING',
                  target: 'Transnational Hawala Conduit',
                  result: 'Extradition red notice issued, 41 shell bank accounts frozen',
                },
                {
                  code: 'OP-HAWK-EYE',
                  status: 'CONCLUDED',
                  target: 'Encrypted Radio Smuggling Ring',
                  result: '12 high-powered transceivers seized, cell dismantled',
                },
              ].map((op, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 14px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1565C0', fontFamily: 'monospace' }}>
                      {op.code}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: '#0F172A', fontWeight: 600, marginTop: 2 }}>{op.target}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>{op.result}</div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 4,
                      background: op.status.includes('CONCLUDED') ? 'rgba(22, 101, 52, 0.08)' : 'rgba(217, 119, 6, 0.08)',
                      color: op.status.includes('CONCLUDED') ? '#166534' : '#D97706',
                      border: `1px solid ${op.status.includes('CONCLUDED') ? 'rgba(22, 101, 52, 0.25)' : 'rgba(217, 119, 6, 0.25)'}`,
                    }}
                  >
                    {op.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            background: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.72rem',
            color: '#64748B',
          }}
        >
          <span style={{ fontFamily: 'monospace' }}>SESSION ID: #CBI-AUTH-{officerBadge.slice(-4) || '8849'}</span>
          <button
            onClick={onClose}
            style={{
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: 6,
              padding: '6px 16px',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#0F172A',
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
            Dismiss Dossier
          </button>
        </div>
      </div>
    </div>
  )
}
