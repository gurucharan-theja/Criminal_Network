import React, { Component } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import UploadData from './pages/UploadData'
import NetworkAnalysis from './pages/NetworkAnalysis'
import Investigation from './pages/Investigation'
import Insights from './pages/Insights'
import Cases from './features/cases/Cases'
import CDRAnalytics from './pages/CDRAnalytics'
import BlockchainAudit from './pages/BlockchainAudit'
import Settings from './pages/Settings'
import Help from './pages/Help'
import Modal from './components/ui/Modal'
import ToastContainer from './components/ui/Toast'
import useAuthStore from './store/useAuthStore'
import useUIStore from './store/useUIStore'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('CrimeNet System Exception Caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F5F7FA',
          padding: 24,
          fontFamily: "'Inter', sans-serif"
        }}>
          <div style={{
            maxWidth: 520,
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            padding: 32,
            boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
            textAlign: 'center'
          }}>
            <div style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: 'rgba(220, 38, 38, 0.1)',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: '1.5rem',
              fontWeight: 800
            }}>!</div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>
              Terminal Interface Notice
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#64748B', marginBottom: 20 }}>
              An interface rendering anomaly was caught and isolated. Your session data remains safe.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => { this.setState({ hasError: false }); window.location.href = '/' }}
                style={{
                  background: '#1565C0',
                  color: '#FFFFFF',
                  padding: '8px 18px',
                  borderRadius: 6,
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Return to Overview
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: '#FFFFFF',
                  color: '#0F172A',
                  padding: '8px 18px',
                  borderRadius: 6,
                  border: '1px solid #CBD5E1',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Reload Terminal
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const sidebarWidth = sidebarCollapsed ? 70 : 248

  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-body" style={{ marginTop: 'var(--nav-h)' }}>
        <Sidebar />
        <main
          className="page-content"
          style={{
            marginLeft: sidebarWidth,
            transition: 'margin-left 250ms cubic-bezier(0.16, 1, 0.3, 1)',
            minHeight: 'calc(100vh - var(--nav-h))',
            background: 'var(--bg)'
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* Authenticated Platform Pages */}
          <Route path="/dashboard"     element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/upload"        element={<ProtectedRoute><UploadData /></ProtectedRoute>} />
          <Route path="/network"       element={<ProtectedRoute><NetworkAnalysis /></ProtectedRoute>} />
          <Route path="/investigation" element={<ProtectedRoute><Investigation /></ProtectedRoute>} />
          <Route path="/cdr"           element={<ProtectedRoute><CDRAnalytics /></ProtectedRoute>} />
          <Route path="/blockchain"    element={<ProtectedRoute><BlockchainAudit /></ProtectedRoute>} />
          <Route path="/insights"      element={<ProtectedRoute><Insights /></ProtectedRoute>} />
          <Route path="/cases"         element={<ProtectedRoute><Cases /></ProtectedRoute>} />
          <Route path="/reports"       element={<Navigate to="/insights" replace />} />
          <Route path="/settings"      element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/help"          element={<ProtectedRoute><Help /></ProtectedRoute>} />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global UI */}
        <Modal />
        <ToastContainer />
      </BrowserRouter>
    </ErrorBoundary>
  )
}
