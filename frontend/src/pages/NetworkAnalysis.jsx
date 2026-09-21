import React, { useEffect, useState, useMemo } from 'react'
import {
  Network, Search, Filter, RefreshCw, ShieldAlert,
  Users, ArrowUpRight, Info, HelpCircle, Layers, CheckCircle2,
  GitBranch, Target, Zap, ChevronRight, Trash2
} from 'lucide-react'
import NetworkGraph from '../graph/NetworkGraph'
import useNetworkStore from '../store/useNetworkStore'
import useGraphStore from '../store/useGraphStore'
import useToast from '../hooks/useToast'

// Demo network dataset if database backend is clean
const DEMO_ENTITIES = [
  { id: '1', name: 'Vikram "Kala" Sharma', type: 'SUSPECT', riskScore: 92, alias: 'Shadow Boss', phone: '+91 98765 43210' },
  { id: '2', name: 'Rajesh Malhotra', type: 'PERSON', riskScore: 78, alias: 'Financier', phone: '+91 98123 45678' },
  { id: '3', name: 'Apex Logistics Corp', type: 'ORGANIZATION', riskScore: 65, alias: 'Front Company', location: 'Mumbai Port' },
  { id: '4', name: 'Ananya Roy', type: 'PERSON', riskScore: 45, alias: 'Operative', phone: '+91 97111 22233' },
  { id: '5', name: '+91 99999 88888', type: 'PHONE', riskScore: 85, alias: 'Burner Line 01' },
  { id: '6', name: 'ACC-8849-XXXX', type: 'ACCOUNT', riskScore: 88, alias: 'Offshore Vault' },
  { id: '7', name: 'MH-02-CX-4491', type: 'VEHICLE', riskScore: 50, alias: 'Armored SUV' },
  { id: '8', name: 'Safehouse Alpha', type: 'LOCATION', riskScore: 70, location: 'Goa Coast' },
  { id: '9', name: 'Sanjay Dutt (Alias)', type: 'SUSPECT', riskScore: 82, alias: 'Courier' },
]

const DEMO_RELATIONSHIPS = [
  { id: 'r1', source: '1', target: '2', type: 'FINANCIAL_TX', weight: 4 },
  { id: 'r2', source: '1', target: '3', type: 'BENEFICIAL_OWNER', weight: 3 },
  { id: 'r3', source: '2', target: '6', type: 'ACCOUNT_HOLDER', weight: 5 },
  { id: 'r4', source: '3', target: '7', type: 'REGISTERED_TO', weight: 2 },
  { id: 'r5', source: '1', target: '5', type: 'FREQUENT_CALL', weight: 3 },
  { id: 'r6', source: '4', target: '1', type: 'ASSOCIATE', weight: 2 },
  { id: 'r7', source: '4', target: '8', type: 'VISITED', weight: 1 },
  { id: 'r8', source: '9', target: '1', type: 'RECRUIT', weight: 3 },
  { id: 'r9', source: '9', target: '6', type: 'WIRE_TRANSFER', weight: 4 },
]

export default function NetworkAnalysis() {
  const toast = useToast()
  const {
    entities: storeEntities,
    relationships: storeRelationships,
    loading,
    fetchNetwork,
    selectedNodeId,
    selectNode,
    removeEntity,
    clearNetwork,
  } = useNetworkStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')
  const [selectedCategory, setSelectedCategory] = useState('all') // 'all', 'case', 'evidence', 'blockchain', 'cdr'
  const [degreeMode, setDegreeMode] = useState('all') // 'all', '1-hop', '2-hop'
  const [showGuide, setShowGuide] = useState(false)

  const handleRemoveSingleEntity = (node) => {
    if (!node) return
    const name = node.name || node.label || 'Entity'
    if (window.confirm(`Are you sure you want to remove target entity "${name}" from the network graph? All associated relationship links will also be removed.`)) {
      useGraphStore.getState().removeNode(node.id || node.nodeId)
      removeEntity(node.id || node.nodeId)
      toast.success(`Entity "${name}" removed from graph`)
    }
  }

  const handleClearAllNetworkData = () => {
    if (window.confirm('⚠️ Are you sure you want to clear all network graph entities and relationships? This will reset the graph workspace to empty.')) {
      useGraphStore.getState().resetGraph()
      clearNetwork()
      toast.success('Network graph data cleared')
    }
  }

  // Fetch from store on load
  useEffect(() => {
    fetchNetwork()
  }, [fetchNetwork])

  // Determine base dataset (Store or Demo fallback, respecting explicit deletions)
  const isGraphCleared = typeof localStorage !== 'undefined' && localStorage.getItem('cni_graph_cleared') === 'true'
  const baseEntities = isGraphCleared ? storeEntities : (storeEntities.length > 0 ? storeEntities : DEMO_ENTITIES)
  const baseRelationships = isGraphCleared ? storeRelationships : (storeRelationships.length > 0 ? storeRelationships : DEMO_RELATIONSHIPS)

  // Category Source Filtered Entities (Case, Evidence, Blockchain, CDR)
  const categoryFilteredEntities = useMemo(() => {
    if (selectedCategory === 'all') return baseEntities

    return baseEntities.filter(e => {
      const typeUpper = String(e.type || '').toUpperCase()
      const roleLower = String(e.role || '').toLowerCase()
      const sourceCatLower = String(e.sourceCategory || e.sourceFile || '').toLowerCase()

      if (selectedCategory === 'case') {
        return e.caseId || e.caseNumber || e.caseIds || typeUpper === 'PERSON' || typeUpper === 'SUSPECT' || roleLower.includes('kingpin') || roleLower.includes('suspect')
      }

      if (selectedCategory === 'evidence') {
        return sourceCatLower.includes('fir') || sourceCatLower.includes('police') || e.sourceFile || typeUpper === 'LOCATION' || typeUpper === 'ORGANIZATION'
      }

      if (selectedCategory === 'blockchain') {
        return typeUpper === 'WALLET' || typeUpper === 'ACCOUNT' || sourceCatLower.includes('financial') || sourceCatLower.includes('blockchain') || roleLower.includes('hawala') || roleLower.includes('vault')
      }

      if (selectedCategory === 'cdr') {
        return typeUpper === 'PHONE' || sourceCatLower.includes('cdr') || roleLower.includes('telecom') || roleLower.includes('call') || roleLower.includes('burner')
      }

      return true
    })
  }, [baseEntities, selectedCategory])

  // Active selected entity object
  const activeSelectedNode = useMemo(() => {
    if (!selectedNodeId) return null
    return baseEntities.find(e => String(e.id || e.nodeId) === String(selectedNodeId)) || null
  }, [selectedNodeId, baseEntities])

  // Compute 1st and 2nd Degree Hop node IDs when a node is selected and degree filter is active
  const degreeFilteredNodeIds = useMemo(() => {
    if (degreeMode === 'all' || !selectedNodeId) {
      return null // No degree hop restriction
    }

    const sId = String(selectedNodeId)
    const set1Hop = new Set()

    // 1-Hop Neighbors
    baseRelationships.forEach(r => {
      const src = String(typeof r.source === 'object' ? r.source.id : r.source)
      const tgt = String(typeof r.target === 'object' ? r.target.id : r.target)
      if (src === sId) set1Hop.add(tgt)
      if (tgt === sId) set1Hop.add(src)
    })

    if (degreeMode === '1-hop') {
      return new Set([sId, ...set1Hop])
    }

    // 2-Hop Neighbors
    const set2Hop = new Set([...set1Hop])
    baseRelationships.forEach(r => {
      const src = String(typeof r.source === 'object' ? r.source.id : r.source)
      const tgt = String(typeof r.target === 'object' ? r.target.id : r.target)

      if (set1Hop.has(src)) set2Hop.add(tgt)
      if (set1Hop.has(tgt)) set2Hop.add(src)
    })

    return new Set([sId, ...set2Hop])
  }, [selectedNodeId, degreeMode, baseRelationships])

  // Compute Final Visible Entities
  const finalFilteredEntities = useMemo(() => {
    let result = categoryFilteredEntities

    if (degreeFilteredNodeIds) {
      result = result.filter(e => degreeFilteredNodeIds.has(String(e.id || e.nodeId)))
    }

    if (selectedType !== 'ALL') {
      result = result.filter(e => (e.type || '').toUpperCase() === selectedType.toUpperCase())
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim()
      result = result.filter(e =>
        (e.name || e.label || '').toLowerCase().includes(term) ||
        (e.alias || '').toLowerCase().includes(term) ||
        (e.type || '').toLowerCase().includes(term)
      )
    }

    return result
  }, [categoryFilteredEntities, degreeFilteredNodeIds, selectedType, searchTerm])

  const finalFilteredNodeIds = useMemo(() => new Set(finalFilteredEntities.map(e => String(e.id || e.nodeId))), [finalFilteredEntities])

  // Filter relationships connecting only visible entities
  const finalFilteredRelationships = useMemo(() => {
    return baseRelationships.filter(r => {
      const sId = String(typeof r.source === 'object' ? r.source.id : r.source)
      const tId = String(typeof r.target === 'object' ? r.target.id : r.target)
      return finalFilteredNodeIds.has(sId) && finalFilteredNodeIds.has(tId)
    })
  }, [baseRelationships, finalFilteredNodeIds])

  // Direct connected nodes for selected entity
  const connectedNodes = useMemo(() => {
    if (!selectedNodeId) return []
    const connectedIds = new Set()
    baseRelationships.forEach(r => {
      const sId = String(typeof r.source === 'object' ? r.source.id : r.source)
      const tId = String(typeof r.target === 'object' ? r.target.id : r.target)
      if (sId === String(selectedNodeId)) connectedIds.add(tId)
      if (tId === String(selectedNodeId)) connectedIds.add(sId)
    })
    return baseEntities.filter(e => connectedIds.has(String(e.id || e.nodeId)))
  }, [selectedNodeId, baseRelationships, baseEntities])

  // Stats calculation
  const highRiskCount = useMemo(() => baseEntities.filter(e => (e.riskScore ?? 50) >= 75).length, [baseEntities])

  return (
    <div style={{ padding: '24px', maxWidth: '1650px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            color: '#3B82F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
          }}>
            <Network size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
              Criminal Network Topology & Link Analysis
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>
              Multi-hop syndicate path discovery, degree analysis & intelligence mapping
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => setShowGuide(!showGuide)}
            style={{
              ...actionBtnStyle,
              background: showGuide ? '#EFF6FF' : '#FFFFFF',
              borderColor: showGuide ? '#BFDBFE' : '#CBD5E1',
              color: showGuide ? '#1D4ED8' : '#334155'
            }}
          >
            <HelpCircle size={15} />
            <span>Degree Hops Guide</span>
          </button>

          <button
            onClick={() => fetchNetwork()}
            disabled={loading}
            style={actionBtnStyle}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Sync Network Data</span>
          </button>

          <button
            onClick={handleClearAllNetworkData}
            style={{
              ...actionBtnStyle,
              background: '#FEF2F2',
              borderColor: '#FCA5A5',
              color: '#DC2626'
            }}
            title="Clear all network nodes and relationships"
          >
            <Trash2 size={14} />
            <span>Clear Graph Data</span>
          </button>
        </div>
      </div>

      {/* Top Quick Stats Ribbon */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 12,
        marginBottom: 16
      }}>
        <div style={statCardStyle}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Total Network Nodes</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{baseEntities.length} Entities</div>
        </div>

        <div style={statCardStyle}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Relationships</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2563EB', marginTop: 2 }}>{baseRelationships.length} Links</div>
        </div>

        <div style={statCardStyle}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>High Risk Suspects</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#DC2626', marginTop: 2 }}>{highRiskCount} Threat Targets</div>
        </div>

        <div style={statCardStyle}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Active Hop Filter</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              padding: '3px 8px',
              borderRadius: 4,
              fontSize: '0.75rem',
              fontWeight: 800,
              background: degreeMode === 'all' ? '#F1F5F9' : degreeMode === '1-hop' ? '#DBEAFE' : '#FCE7F3',
              color: degreeMode === 'all' ? '#475569' : degreeMode === '1-hop' ? '#1D4ED8' : '#9D174D'
            }}>
              {degreeMode === 'all' ? 'FULL NETWORK' : degreeMode === '1-hop' ? '1st DEGREE (1-HOP)' : '2nd DEGREE (2-HOP)'}
            </span>
          </div>
        </div>
      </div>

      {/* Explanatory Banner for 1st & 2nd Degree Hops */}
      {showGuide && (
        <div style={{
          background: 'linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 100%)',
          border: '1px solid #BFDBFE',
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          position: 'relative'
        }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1E40AF', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Info size={16} /> What are 1st Degree and 2nd Degree Network Hop Options?
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, fontSize: '0.83rem', color: '#334155' }}>
            <div style={{ background: '#FFFFFF', padding: 10, borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>🌐 Full Network Mode</div>
              Shows the global network of all suspects, companies, phone numbers, and accounts across all cases simultaneously.
            </div>

            <div style={{ background: '#FFFFFF', padding: 10, borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <div style={{ fontWeight: 700, color: '#1D4ED8', marginBottom: 4 }}>🎯 1st Degree Hop (Direct)</div>
              Focuses strictly on the **selected entity** and its **direct connections** (1-hop neighbors like immediate associates or burner phones).
            </div>

            <div style={{ background: '#FFFFFF', padding: 10, borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <div style={{ fontWeight: 700, color: '#9D174D', marginBottom: 4 }}>🌿 2nd Degree Hop (Extended)</div>
              Expands the view to include **2nd-tier contacts** (contacts of contacts) to uncover indirect conduits, offshore laundering vaults, and hidden syndicate rings.
            </div>
          </div>
        </div>
      )}

      {/* Active Filter Notification Bar if Hop Filter is active */}
      {degreeMode !== 'all' && activeSelectedNode && (
        <div style={{
          background: '#FEF3C7',
          border: '1px solid #FCD34D',
          borderRadius: 8,
          padding: '10px 14px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.85rem',
          color: '#92400E'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
            <Target size={16} />
            <span>
              Filtering {degreeMode === '1-hop' ? '1st Degree (Direct Connections)' : '2nd Degree (Extended Ring)'} centered on target: <strong>{activeSelectedNode.name || activeSelectedNode.label}</strong> ({finalFilteredEntities.length} nodes visible)
            </span>
          </div>

          <button
            onClick={() => setDegreeMode('all')}
            style={{
              background: '#FFFFFF',
              border: '1px solid #F59E0B',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#B45309',
              cursor: 'pointer'
            }}
          >
            Show Full Network
          </button>
        </div>
      )}

      {/* Main Graph Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: activeSelectedNode ? '1fr 340px' : '1fr', gap: 16 }}>
        {/* Left Section: Controls & D3 Viewport */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Controls Bar */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            {/* Source Category Toolbar (Case, Evidence, Blockchain, CDR) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: 4 }}>
                INTELLIGENCE SOURCE:
              </span>
              {[
                { id: 'all',        label: '🌐 All Data',           color: '#2563EB' },
                { id: 'case',       label: '📁 Case Dockets',       color: '#7C3AED' },
                { id: 'evidence',   label: '📄 Document Evidence', color: '#16A34A' },
                { id: 'blockchain', label: '⛓️ Blockchain Audit',  color: '#D97706' },
                { id: 'cdr',        label: '📞 CDR Telecom',       color: '#DC2626' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    border: `1.5px solid ${selectedCategory === cat.id ? cat.color : '#CBD5E1'}`,
                    background: selectedCategory === cat.id ? '#FFFFFF' : '#F8FAFC',
                    color: selectedCategory === cat.id ? cat.color : '#475569',
                    fontWeight: selectedCategory === cat.id ? 800 : 500,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    boxShadow: selectedCategory === cat.id ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 150ms ease'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              {/* Search Box */}
            <div style={{ position: 'relative', width: 260 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: '#94A3B8' }} />
              <input
                type="text"
                placeholder="Search entities, aliases..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Type Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={14} style={{ color: '#64748B' }} />
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  fontSize: '0.88rem',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Entity Types</option>
                <option value="SUSPECT">Suspects</option>
                <option value="PERSON">Persons</option>
                <option value="ORGANIZATION">Organizations</option>
                <option value="PHONE">Phones</option>
                <option value="ACCOUNT">Accounts</option>
                <option value="LOCATION">Locations</option>
                <option value="VEHICLE">Vehicles</option>
              </select>
            </div>

            {/* Degree Analysis Selector Buttons */}
            <div style={{ display: 'flex', background: '#F1F5F9', padding: 3, borderRadius: 8, border: '1px solid #CBD5E1' }}>
              <button
                onClick={() => setDegreeMode('all')}
                style={{
                  ...degreeBtnStyle,
                  background: degreeMode === 'all' ? '#FFFFFF' : 'transparent',
                  color: degreeMode === 'all' ? '#2563EB' : '#64748B',
                  fontWeight: degreeMode === 'all' ? 700 : 500,
                  boxShadow: degreeMode === 'all' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                Full Network
              </button>

              <button
                onClick={() => {
                  if (selectedNodeId) {
                    setDegreeMode('1-hop')
                  } else {
                    alert('Please click on a node in the graph first to analyze its 1st Degree connections.')
                  }
                }}
                style={{
                  ...degreeBtnStyle,
                  background: degreeMode === '1-hop' ? '#FFFFFF' : 'transparent',
                  color: degreeMode === '1-hop' ? '#1D4ED8' : '#64748B',
                  fontWeight: degreeMode === '1-hop' ? 700 : 500,
                  boxShadow: degreeMode === '1-hop' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                1st Degree
              </button>

              <button
                onClick={() => {
                  if (selectedNodeId) {
                    setDegreeMode('2-hop')
                  } else {
                    alert('Please click on a node in the graph first to analyze its 2nd Degree connections.')
                  }
                }}
                style={{
                  ...degreeBtnStyle,
                  background: degreeMode === '2-hop' ? '#FFFFFF' : 'transparent',
                  color: degreeMode === '2-hop' ? '#9D174D' : '#64748B',
                  fontWeight: degreeMode === '2-hop' ? 700 : 500,
                  boxShadow: degreeMode === '2-hop' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                2nd Degree
              </button>
            </div>
          </div>
        </div>

          {/* D3 Graph Viewport */}
          <div style={{ height: 680, position: 'relative' }}>
            <NetworkGraph
              nodes={finalFilteredEntities}
              links={finalFilteredRelationships}
              selectedNodeId={selectedNodeId}
              onNodeSelect={id => selectNode(id)}
            />
          </div>
        </div>

        {/* Right Section: Selected Entity Inspector */}
        {activeSelectedNode && (
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{
                  display: 'inline-block',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: '#F1F5F9',
                  color: '#475569',
                  marginBottom: 6
                }}>
                  {activeSelectedNode.type || 'ENTITY'}
                </span>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {activeSelectedNode.name || activeSelectedNode.label}
                </h3>
                {activeSelectedNode.alias && (
                  <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                    Alias: {activeSelectedNode.alias}
                  </div>
                )}
              </div>

              <button
                onClick={() => selectNode(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: 4
                }}
              >
                ✕
              </button>
            </div>

            {/* Quick Degree Hop Filter Action Buttons for target */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                onClick={() => setDegreeMode('1-hop')}
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: degreeMode === '1-hop' ? '2px solid #2563EB' : '1px solid #CBD5E1',
                  background: degreeMode === '1-hop' ? '#EFF6FF' : '#F8FAFC',
                  color: degreeMode === '1-hop' ? '#1D4ED8' : '#334155',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4
                }}
              >
                <Target size={14} /> 1st Degree Hop
              </button>

              <button
                onClick={() => setDegreeMode('2-hop')}
                style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: degreeMode === '2-hop' ? '2px solid #DB2777' : '1px solid #CBD5E1',
                  background: degreeMode === '2-hop' ? '#FDF2F8' : '#F8FAFC',
                  color: degreeMode === '2-hop' ? '#9D174D' : '#334155',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4
                }}
              >
                <GitBranch size={14} /> 2nd Degree Hop
              </button>
            </div>

            {/* Risk Score */}
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              padding: 12
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                <span>Risk Assessment Score</span>
                <span style={{
                  color: (activeSelectedNode.riskScore || 50) >= 75 ? '#DC2626' : (activeSelectedNode.riskScore || 50) >= 50 ? '#D97706' : '#059669',
                  fontWeight: 800
                }}>
                  {activeSelectedNode.riskScore || 50} / 100
                </span>
              </div>
              <div style={{ height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${activeSelectedNode.riskScore || 50}%`,
                    background: (activeSelectedNode.riskScore || 50) >= 75 ? '#EF4444' : (activeSelectedNode.riskScore || 50) >= 50 ? '#F59E0B' : '#10B981',
                    borderRadius: 3
                  }}
                />
              </div>
            </div>

            {/* Direct Connections List */}
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Connected Entities</span>
                <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                  ({connectedNodes.length})
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
                {connectedNodes.length === 0 ? (
                  <div style={{ fontSize: '0.82rem', color: '#94A3B8', textAlign: 'center', padding: 12 }}>
                    No immediate connections found
                  </div>
                ) : (
                  connectedNodes.map(conn => (
                    <div
                      key={conn.id || conn.nodeId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 10px',
                        borderRadius: 6,
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <div
                        onClick={() => selectNode(conn.id || conn.nodeId)}
                        style={{ cursor: 'pointer', flex: 1 }}
                      >
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>
                          {conn.name || conn.label}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                          {conn.type}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveSingleEntity(conn)
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#94A3B8',
                            cursor: 'pointer',
                            padding: 2,
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#DC2626')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
                          title="Remove entity from graph"
                        >
                          <Trash2 size={13} />
                        </button>

                        <ArrowUpRight size={14} style={{ color: '#94A3B8', cursor: 'pointer' }} onClick={() => selectNode(conn.id || conn.nodeId)} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Target Entity Node Removal Button */}
            <button
              onClick={() => handleRemoveSingleEntity(activeSelectedNode)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 8,
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#DC2626',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                marginTop: 4
              }}
            >
              <Trash2 size={15} />
              Remove Target Node & Edges
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const statCardStyle = {
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 10,
  padding: '12px 16px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
}

const actionBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid #CBD5E1',
  background: '#FFFFFF',
  color: '#0F172A',
  fontSize: '0.85rem',
  fontWeight: 600,
  cursor: 'pointer'
}

const degreeBtnStyle = {
  padding: '6px 12px',
  border: 'none',
  borderRadius: 6,
  fontSize: '0.8rem',
  cursor: 'pointer',
  transition: 'all 0.15s ease'
}
