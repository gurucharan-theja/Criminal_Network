import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Upload,
  Network,
  Search,
  BarChart2,
  FolderOpen,
  PhoneCall,
  ShieldCheck,
  Settings,
  HelpCircle,
  Menu,
  ChevronLeft
} from 'lucide-react'
import useUIStore from '../store/useUIStore'

const navItems = [
  { path: '/dashboard',     label: 'Dashboard',        icon: LayoutDashboard },
  { path: '/upload',        label: 'Upload Data',       icon: Upload },
  { path: '/network',       label: 'Network Analysis',  icon: Network },
  { path: '/investigation', label: 'Investigation',     icon: Search },
  { path: '/cdr',           label: 'Authorized CDR Analysis', icon: PhoneCall },
  { path: '/blockchain',    label: 'Blockchain Audit',  icon: ShieldCheck },
  { path: '/insights',      label: 'Insights',          icon: BarChart2 },
  { path: '/cases',         label: 'Case Files',        icon: FolderOpen },
]

const bottomItems = [
  { path: '/settings', label: 'Settings', icon: Settings },
  { path: '/help',     label: 'Help',     icon: HelpCircle },
]

function NavItem({ path, label, icon: Icon, collapsed }) {
  return (
    <NavLink
      to={path}
      title={collapsed ? label : undefined}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: collapsed ? '10px 0' : '10px 14px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: 'var(--radius-md)',
        textDecoration: 'none',
        fontSize: '0.875rem',
        fontWeight: isActive ? 600 : 500,
        color: isActive ? 'var(--primary)' : 'var(--muted)',
        background: isActive ? 'var(--primary-dim)' : 'transparent',
        border: isActive ? '1px solid rgba(21, 101, 192, 0.2)' : '1px solid transparent',
        transition: 'all var(--transition)',
        position: 'relative',
        whiteSpace: 'nowrap',
      })}
      onMouseEnter={(e) => {
        const a = e.currentTarget
        if (!a.classList.contains('active') && !a.style.background.includes('primary-dim')) {
          a.style.color = 'var(--text)'
          a.style.background = 'var(--panel-light)'
        }
      }}
      onMouseLeave={(e) => {
        const a = e.currentTarget
        const isActive = a.getAttribute('aria-current') === 'page'
        if (!isActive) {
          a.style.color = 'var(--muted)'
          a.style.background = 'transparent'
        }
      }}
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              style={{
                position: 'absolute',
                left: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 3,
                height: 20,
                background: 'var(--primary)',
                borderRadius: '0 99px 99px 0',
              }}
            />
          )}
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20 }}>
            <Icon size={18} />
          </span>
          {!collapsed && <span>{label}</span>}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)

  const width = sidebarCollapsed ? 70 : 'var(--sidebar-w)'

  return (
    <aside
      className="custom-sidebar-scroll"
      style={{
        position: 'fixed',
        top: 'var(--nav-h)',
        left: 0,
        width: width,
        height: 'calc(100vh - var(--nav-h))',
        background: '#FFFFFF',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: sidebarCollapsed ? '16px 8px 24px' : '16px 12px 24px',
        zIndex: 900,
        overflowY: 'auto',
        overflowX: 'hidden',
        boxShadow: '1px 0 3px 0 rgba(0, 0, 0, 0.02)',
        transition: 'width 250ms cubic-bezier(0.16, 1, 0.3, 1), padding 250ms ease',
        scrollbarWidth: 'thin',
        scrollbarColor: '#CBD5E1 transparent',
      }}
    >
      {/* 3-Line Header with Toggle Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: sidebarCollapsed ? 'center' : 'space-between',
        padding: sidebarCollapsed ? '0 0 12px' : '2px 8px 14px',
        borderBottom: '1px solid var(--border)',
        marginBottom: 14,
      }}>
        {!sidebarCollapsed && (
          <div>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              INTELLIGENCE COMMAND
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>
              TACTICAL GRID
            </div>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--muted)',
            borderRadius: 6,
          }}
          title={sidebarCollapsed ? "Expand Menu" : "Collapse Menu"}
        >
          {sidebarCollapsed ? <Menu size={18} color="var(--primary)" /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Section — Operations */}
      <div style={{ marginBottom: 6 }}>
        {!sidebarCollapsed && (
          <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted-dark)', padding: '0 8px', marginBottom: 6 }}>
            Operations
          </div>
        )}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {navItems.map((item) => (
            <NavItem key={item.path} {...item} collapsed={sidebarCollapsed} />
          ))}
        </nav>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />

      {/* Section — System */}
      <div>
        {!sidebarCollapsed && (
          <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--muted-dark)', padding: '0 8px', marginBottom: 6 }}>
            System
          </div>
        )}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {bottomItems.map((item) => (
            <NavItem key={item.path} {...item} collapsed={sidebarCollapsed} />
          ))}
        </nav>
      </div>

      {/* Footer status card (Only in expanded state) */}
      {!sidebarCollapsed && (
        <div style={{ marginTop: 24, paddingTop: 14 }}>
          <div
            style={{
              background: 'var(--panel-light)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.06em', marginBottom: 4 }}>
              AI INFERENCE ENGINE
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 8 }}>
              Multi-class NER active.
            </div>
            <div className="progress-bar" style={{ background: 'var(--border)', height: 4, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: '84%', height: '100%', background: 'var(--secondary)' }} />
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
              <span>Graph Engine</span>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>Active</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
