import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Loader2, User, Building, MapPin, Phone, Car, ArrowRight, ShieldAlert } from 'lucide-react'
import axiosClient from '../api/axiosClient'
import useGraphStore from '../store/useGraphStore'

const TYPE_ICONS = {
  Person:       <User size={13} color="var(--secondary)" />,
  Organization: <Building size={13} color="var(--primary)" />,
  Location:     <MapPin size={13} color="var(--success)" />,
  Phone:        <Phone size={13} color="#A78BFA" />,
  Vehicle:      <Car size={13} color="var(--warning)" />,
}

export default function SearchBar({
  placeholder = 'Search Entities (e.g. Suspects, Locations, Tags)...',
  onSearch,
  suggestions,
  size = 'md',
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const navigate = useNavigate()
  const timer = useRef(null)

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    if (onSearch) {
      onSearch(val)
    }
  }

  useEffect(() => {
    const q = query.trim().toLowerCase()
    if (!q || q.length < 2) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      let matched = []

      // 1. Query live Spring Boot backend
      try {
        const data = await axiosClient.get('/entities/search', { params: { q } })
        if (Array.isArray(data) && data.length > 0) {
          matched = data
        }
      } catch {
        // Backend empty or unreachable
      }

      // 2. Query live Zustand graph store nodes (holds freshly uploaded or extracted nodes)
      if (matched.length === 0) {
        const liveNodes = useGraphStore.getState().nodes || []
        matched = liveNodes.filter(e =>
          e.name?.toLowerCase().includes(q) ||
          e.role?.toLowerCase().includes(q) ||
          e.location?.toLowerCase().includes(q) ||
          e.bio?.toLowerCase().includes(q) ||
          (Array.isArray(e.tags) && e.tags.some(t => t.toLowerCase().includes(q)))
        )
      }

      // 3. If parent provided suggestions and still no matches
      if (matched.length === 0 && Array.isArray(suggestions) && suggestions.length > 0) {
        matched = suggestions
      }

      setResults(matched.slice(0, 6))
      setLoading(false)
    }, 200)

    return () => clearTimeout(timer.current)
  }, [query, suggestions])

  const handleSelect = (item) => {
    setFocused(false)
    setQuery('')
    if (onSearch) onSearch(item.name || item.id)
    navigate(`/investigation?q=${encodeURIComponent(item.name || item.id)}`)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      setFocused(false)
      if (onSearch) onSearch(query.trim())
      navigate(`/investigation?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const showDropdown = focused && (results.length > 0 || (query.length >= 2 && !loading))
  const height = size === 'sm' ? 34 : 38

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Search Input Box */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          height,
          padding: '0 14px',
          background: focused ? '#FFFFFF' : '#F8FAFC',
          border: `1px solid ${focused ? 'var(--primary)' : 'var(--border)'}`,
          borderRadius: 'var(--radius-md)',
          boxShadow: focused ? '0 0 0 3px var(--primary-dim)' : 'none',
          transition: 'all var(--transition)',
        }}
      >
        {loading ? (
          <Loader2 size={14} color="var(--primary)" style={{ animation: 'spin 700ms linear infinite', flexShrink: 0 }} />
        ) : (
          <Search size={14} color={focused ? 'var(--primary)' : 'var(--muted)'} style={{ flexShrink: 0 }} />
        )}

        <input
          value={query}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text)',
            fontSize: size === 'sm' ? '0.78rem' : '0.84rem',
            fontFamily: 'inherit',
          }}
          autoComplete="off"
        />

        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
              if (onSearch) onSearch('')
            }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--muted)', display: 'flex', padding: 2,
              transition: 'color var(--transition)'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--danger)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Live Intelligence Search Dropdown */}
      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 12px 32px -4px rgba(15, 23, 42, 0.15), 0 4px 12px -2px rgba(15, 23, 42, 0.08)',
            overflow: 'hidden',
            zIndex: 3000,
            animation: 'fadeInUp 150ms both',
          }}
        >
          {results.length > 0 ? (
            <div>
              <div style={{
                padding: '8px 14px',
                borderBottom: '1px solid #E2E8F0',
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#64748B',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                background: '#F8FAFC'
              }}>
                Matched Intelligence Nodes ({results.length})
              </div>

              {results.map((item, idx) => (
                <div
                  key={item.id || idx}
                  onMouseDown={() => handleSelect(item)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    cursor: 'pointer',
                    borderBottom: idx < results.length - 1 ? '1px solid #F1F5F9' : 'none',
                    transition: 'background var(--transition)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F1F5F9')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    {TYPE_ICONS[item.type] || <ShieldAlert size={13} color="#1565C0" />}
                  </span>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#1E293B' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                      {item.role || item.location || item.type}
                    </div>
                  </div>

                  {item.risk === 'high' && (
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      background: 'rgba(185, 28, 28, 0.08)',
                      color: '#B91C1C',
                      border: '1px solid rgba(185, 28, 28, 0.25)',
                      padding: '2px 7px',
                      borderRadius: 4
                    }}>
                      HIGH RISK
                    </span>
                  )}

                  <ArrowRight size={13} color="#94A3B8" />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '16px', textAlign: 'center', color: '#64748B', fontSize: '0.8rem' }}>
              No suspect or entity found matching "{query}". Press Enter to search records.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
