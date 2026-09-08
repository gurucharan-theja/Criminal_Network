/**
 * NetworkGraph — Intelligence Card-Node Network Visualization
 *
 * Implements:
 * 1. Dark intelligence dot-matrix background
 * 2. Card-based nodes with risk border colors, badge icons, risk score, and link counts
 * 3. Orthogonal / elbow step-links with source/target port pins and association labels
 * 4. Controls: Zoom In (+), Zoom Out (-), Fit Screen (Center & Zoom to Fit), Best Screen (Reset zoom & optimal layout)
 * 5. Interactive live Mini-Map in the corner with dynamic viewport indicator
 */
import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Scan,
  Fullscreen,
  Minimize2,
  User,
  Building,
  MapPin,
  Car,
  Phone,
  CreditCard,
  Layers
} from 'lucide-react'


const CARD_W = 160
const CARD_H = 88

const RISK_BORDER = {
  high: '#B91C1C',
  medium: '#B45309',
  low: '#166534',
}

const TYPE_ICONS = {
  Person: 'P',
  Organization: 'O',
  Location: 'L',
  Vehicle: 'V',
  Phone: 'T',
  Account: '$',
}

export default function NetworkGraph({
  nodes = [],
  links = [],
  onNodeClick,
  onNodeHover,
  focusNodeId = null,
  selectedEntity = null,
  onClearSelected = null,
  height = 540,
}) {

  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const miniSvgRef = useRef(null)
  const zoomBehaviorRef = useRef(null)
  const simRef = useRef(null)

  const [dims, setDims] = useState({ w: 850, h: height })
  const [currentTransform, setCurrentTransform] = useState(d3.zoomIdentity)
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [isFullTab, setIsFullTab] = useState(false)

  // Track responsive size (accounting for full-tab mode)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const updateDims = () => {
      const currentH = isFullTab ? window.innerHeight : height
      setDims({ w: el.clientWidth, h: currentH })
    }
    const ro = new ResizeObserver(updateDims)
    ro.observe(el)
    window.addEventListener('resize', updateDims)
    updateDims()
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', updateDims)
    }
  }, [height, isFullTab])


  // Simulation & D3 Rendering
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return

    const { w, h } = dims
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // 1. Defs (Glows and dot pattern)
    const defs = svg.append('defs')

    // Dot grid pattern
    const pattern = defs.append('pattern')
      .attr('id', 'dot-grid')
      .attr('width', 24)
      .attr('height', 24)
      .attr('patternUnits', 'userSpaceOnUse')

    pattern.append('circle')
      .attr('cx', 12)
      .attr('cy', 12)
      .attr('r', 1.2)
      .attr('fill', '#CBD5E1')
      .attr('opacity', 0.8)

    // Base background with dots
    svg.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', '#F8FAFC')

    svg.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'url(#dot-grid)')

    // 2. Root zoomable layer
    const rootG = svg.append('g').attr('class', 'graph-root')

    // Links container and Nodes container
    const linkLayer = rootG.append('g').attr('class', 'links-layer')
    const nodeLayer = rootG.append('g').attr('class', 'nodes-layer')

    // 3. Zoom setup
    const zoom = d3.zoom()
      .scaleExtent([0.2, 3.0])
      .on('zoom', (event) => {
        rootG.attr('transform', event.transform)
        setCurrentTransform(event.transform)
      })

    svg.call(zoom)
    zoomBehaviorRef.current = zoom

    // Clone data for simulation
    const linkCountMap = {}
    links.forEach(l => {
      const s = typeof l.source === 'object' ? l.source.id : l.source
      const t = typeof l.target === 'object' ? l.target.id : l.target
      linkCountMap[s] = (linkCountMap[s] || 0) + 1
      linkCountMap[t] = (linkCountMap[t] || 0) + 1
    })

    const simNodes = nodes.map(n => ({
      ...n,
      linkCount: linkCountMap[n.id] || n.connections || 1,
      riskScore: n.riskScore || (n.risk === 'high' ? Math.floor(Math.random() * 20 + 75) : n.risk === 'medium' ? Math.floor(Math.random() * 20 + 45) : Math.floor(Math.random() * 25 + 15)),
      width: CARD_W,
      height: CARD_H
    }))

    const nodeById = new Map(simNodes.map(d => [d.id, d]))

    const simLinks = links.map(l => ({
      ...l,
      source: nodeById.get(typeof l.source === 'object' ? l.source.id : l.source),
      target: nodeById.get(typeof l.target === 'object' ? l.target.id : l.target),
    })).filter(l => l.source && l.target)

    // 4. Force Simulation
    const sim = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink(simLinks).id(d => d.id).distance(180))
      .force('charge', d3.forceManyBody().strength(-900))
      .force('center', d3.forceCenter(w / 2, h / 2))
      .force('collision', d3.forceCollide().radius(CARD_W * 0.75))

    simRef.current = sim

    // Render step-connector links
    const linkItems = linkLayer.selectAll('.graph-link')
      .data(simLinks)
      .enter()
      .append('g')
      .attr('class', 'graph-link')

    const RELATION_COLORS = {
      financial: '#22c55e',      // Green - money conduit
      communication: '#38bdf8',  // Cyan - calls/messages
      family: '#a78bfa',         // Purple - kinship
      associate: '#f59e0b',      // Amber - co-conspirators
      default: '#475569'
    }

    const linkPaths = linkItems.append('path')
      .attr('fill', 'none')
      .attr('stroke', d => RELATION_COLORS[d.type] || RELATION_COLORS.default)
      .attr('stroke-width', d => d.strength === 'strong' ? 2.2 : 1.4)
      .attr('stroke-opacity', 0.85)
      .attr('stroke-dasharray', d => d.type === 'communication' ? '5 3' : 'none')

    // Link pin circles at intersections
    linkItems.append('circle')
      .attr('class', 'pin-source')
      .attr('r', 3.2)
      .attr('fill', '#090d16')
      .attr('stroke', d => RELATION_COLORS[d.type] || '#64748b')
      .attr('stroke-width', 1.5)

    linkItems.append('circle')
      .attr('class', 'pin-target')
      .attr('r', 3.2)
      .attr('fill', '#090d16')
      .attr('stroke', d => RELATION_COLORS[d.type] || '#64748b')
      .attr('stroke-width', 1.5)

    // Link labels with colored text
    const linkTexts = linkItems.append('text')
      .attr('font-size', '8.5px')
      .attr('font-weight', '700')
      .attr('font-family', 'monospace')
      .attr('fill', d => RELATION_COLORS[d.type] || '#94a3b8')
      .attr('text-anchor', 'middle')
      .attr('dy', -4)
      .text(d => d.label ? d.label.toUpperCase() : (d.type ? d.type.toUpperCase() : 'CONNECTED TO'))


    // 5. Render Node Cards
    const nodeItems = nodeLayer.selectAll('.graph-card')
      .data(simNodes)
      .enter()
      .append('g')
      .attr('class', 'graph-card')
      .style('cursor', 'pointer')
      .call(
        d3.drag()
          .on('start', (event, d) => {
            if (!event.active) sim.alphaTarget(0.3).restart()
            d.fx = d.x
            d.fy = d.y
          })
          .on('drag', (event, d) => {
            d.fx = event.x
            d.fy = event.y
          })
          .on('end', (event, d) => {
            if (!event.active) sim.alphaTarget(0)
            d.fx = null
            d.fy = null
          })
      )
      .on('click', (event, d) => {
        event.stopPropagation()
        onNodeClick?.(d)
      })
      .on('mouseenter', (event, d) => {
        onNodeHover?.(d)
      })
      .on('mouseleave', () => {
        onNodeHover?.(null)
      })

    // Outer card body
    nodeItems.append('rect')
      .attr('x', -CARD_W / 2)
      .attr('y', -CARD_H / 2)
      .attr('width', CARD_W)
      .attr('height', CARD_H)
      .attr('rx', 10)
      .attr('fill', '#FFFFFF')
      .attr('stroke', d => {
        if (focusNodeId === d.id) return 'var(--primary)'
        return RISK_BORDER[d.risk] || '#CBD5E1'
      })
      .attr('stroke-width', d => (focusNodeId === d.id ? 2.5 : 1.5))
      .attr('filter', 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.06))')

    // Port connection pins on card borders
    const pinOffsets = [
      { cx: 0, cy: -CARD_H / 2 }, // Top
      { cx: 0, cy: CARD_H / 2 },  // Bottom
      { cx: -CARD_W / 2, cy: 0 }, // Left
      { cx: CARD_W / 2, cy: 0 }   // Right
    ]
    pinOffsets.forEach(pos => {
      nodeItems.append('circle')
        .attr('cx', pos.cx)
        .attr('cy', pos.cy)
        .attr('r', 2.8)
        .attr('fill', '#FFFFFF')
        .attr('stroke', d => RISK_BORDER[d.risk] || '#94A3B8')
        .attr('stroke-width', 1.2)
    })

    // Badge Icon Square (top-left inside card)
    nodeItems.append('rect')
      .attr('x', -CARD_W / 2 + 10)
      .attr('y', -CARD_H / 2 + 10)
      .attr('width', 18)
      .attr('height', 18)
      .attr('rx', 4)
      .attr('fill', '#F1F5F9')
      .attr('stroke', '#E2E8F0')

    nodeItems.append('text')
      .attr('x', -CARD_W / 2 + 19)
      .attr('y', -CARD_H / 2 + 23)
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('font-family', 'monospace')
      .attr('fill', 'var(--primary)')
      .attr('text-anchor', 'middle')
      .text(d => TYPE_ICONS[d.type] || 'N')

    // Entity Category Type Label (uppercase)
    nodeItems.append('text')
      .attr('x', -CARD_W / 2 + 34)
      .attr('y', -CARD_H / 2 + 22)
      .attr('font-size', '8.5px')
      .attr('font-weight', '700')
      .attr('letter-spacing', '0.08em')
      .attr('fill', '#64748B')
      .text(d => (d.type || 'ENTITY').toUpperCase())

    // Node Main Title / Suspect Name (bold center)
    nodeItems.append('text')
      .attr('x', -CARD_W / 2 + 12)
      .attr('y', 0)
      .attr('font-size', '12px')
      .attr('font-weight', '700')
      .attr('fill', '#0F172A')
      .text(d => {
        const name = d.name || d.id
        return name.length > 18 ? name.slice(0, 16) + '…' : name
      })

    // Bottom info row: Risk score + Link counts
    nodeItems.append('text')
      .attr('x', -CARD_W / 2 + 12)
      .attr('y', CARD_H / 2 - 12)
      .attr('font-size', '9px')
      .attr('fill', '#64748B')
      .text('Risk')

    nodeItems.append('text')
      .attr('x', -CARD_W / 2 + 36)
      .attr('y', CARD_H / 2 - 12)
      .attr('font-size', '10px')
      .attr('font-weight', '800')
      .attr('font-family', 'monospace')
      .attr('fill', d => RISK_BORDER[d.risk] || 'var(--text)')
      .text(d => d.riskScore)

    nodeItems.append('text')
      .attr('x', CARD_W / 2 - 12)
      .attr('y', CARD_H / 2 - 12)
      .attr('font-size', '9px')
      .attr('font-family', 'monospace')
      .attr('fill', '#64748B')
      .attr('text-anchor', 'end')
      .text(d => `${d.linkCount} links`)

    // 6. Tick function for Orthogonal / Step Router
    sim.on('tick', () => {
      // Draw orthogonal 90-degree lines between nodes
      linkPaths.attr('d', d => {
        const sx = d.source.x
        const sy = d.source.y
        const tx = d.target.x
        const ty = d.target.y

        // Determine midpoint elbow
        const mx = (sx + tx) / 2
        return `M ${sx} ${sy} L ${mx} ${sy} L ${mx} ${ty} L ${tx} ${ty}`
      })

      // Update pin positions
      linkItems.select('.pin-source')
        .attr('cx', d => d.source.x)
        .attr('cy', d => d.source.y)

      linkItems.select('.pin-target')
        .attr('cx', d => d.target.x)
        .attr('cy', d => d.target.y)

      // Position label midway on elbow
      linkTexts
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2)

      nodeItems.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    // Initial Zoom to Fit
    setTimeout(() => {
      handleBestScreen()
    }, 400)

    return () => {
      sim.stop()
    }
  }, [nodes, links, dims, focusNodeId])

  // --- Zoom & Viewport Handlers ---
  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return
    d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 1.25)
  }

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return
    d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 0.8)
  }

  const handleFitScreen = () => {
    if (!svgRef.current || !zoomBehaviorRef.current || nodes.length === 0) return
    const svg = d3.select(svgRef.current)
    const { w, h } = dims

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    simRef.current?.nodes().forEach(d => {
      if (d.x < minX) minX = d.x
      if (d.x > maxX) maxX = d.x
      if (d.y < minY) minY = d.y
      if (d.y > maxY) maxY = d.y
    })

    const boundsW = (maxX - minX) + CARD_W * 1.5
    const boundsH = (maxY - minY) + CARD_H * 1.5
    const midX = (minX + maxX) / 2
    const midY = (minY + maxY) / 2

    const scale = Math.max(0.3, Math.min(1.4, Math.min(w / boundsW, h / boundsH)))
    const tx = w / 2 - scale * midX
    const ty = h / 2 - scale * midY

    svg.transition().duration(500).call(
      zoomBehaviorRef.current.transform,
      d3.zoomIdentity.translate(tx, ty).scale(scale)
    )
  }

  const handleBestScreen = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return
    const { w, h } = dims
    // Optimal default view centered on primary suspects
    d3.select(svgRef.current).transition().duration(400).call(
      zoomBehaviorRef.current.transform,
      d3.zoomIdentity.translate(w * 0.05, h * 0.05).scale(0.9)
    )
  }

  const toggleFullTab = () => {
    setIsFullTab(prev => !prev)
    setTimeout(() => {
      handleFitScreen()
    }, 150)
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: isFullTab ? 'fixed' : 'relative',
        inset: isFullTab ? 0 : 'auto',
        width: '100%',
        height: isFullTab ? '100vh' : height,
        background: '#F8FAFC',
        overflow: 'hidden',
        userSelect: 'none',
        zIndex: isFullTab ? 2000 : 1
      }}
    >
      {/* Main D3 Canvas */}
      <svg ref={svgRef} width={dims.w} height={dims.h} style={{ display: 'block', cursor: 'grab' }} />

      {/* Control Action Island: Zoom In, Zoom Out, Fit Screen, Best Screen, Full Tab */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 4,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          zIndex: 50
        }}
      >
        <button
          onClick={handleZoomIn}
          className="btn btn-ghost"
          style={{ padding: '6px 9px', color: 'var(--text)', borderRadius: 4 }}
          title="Zoom In (+)"
        >
          <ZoomIn size={15} />
        </button>
        <button
          onClick={handleZoomOut}
          className="btn btn-ghost"
          style={{ padding: '6px 9px', color: 'var(--text)', borderRadius: 4 }}
          title="Zoom Out (-)"
        >
          <ZoomOut size={15} />
        </button>

        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

        <button
          onClick={handleFitScreen}
          className="btn btn-ghost"
          style={{ padding: '6px 10px', fontSize: '0.74rem', color: 'var(--text)', display: 'flex', gap: 5, borderRadius: 4 }}
          title="Zoom to Fit Entire Network"
        >
          <Maximize2 size={13} color="var(--primary)" /> Fit Screen
        </button>

        <button
          onClick={handleBestScreen}
          className="btn btn-ghost"
          style={{ padding: '6px 10px', fontSize: '0.74rem', color: 'var(--primary)', display: 'flex', gap: 5, borderRadius: 4 }}
          title="Best Screen (Optimal 1:1 Perspective)"
        >
          <Scan size={13} color="var(--primary)" /> Best Screen
        </button>

        <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

        <button
          onClick={toggleFullTab}
          className="btn btn-ghost"
          style={{
            padding: '6px 10px',
            fontSize: '0.74rem',
            color: isFullTab ? 'var(--warning)' : 'var(--text)',
            display: 'flex',
            gap: 5,
            borderRadius: 4,
            background: isFullTab ? 'rgba(245, 158, 11, 0.12)' : 'transparent'
          }}
          title={isFullTab ? 'Exit Full Tab Visualization (Esc)' : 'Expand to Full Tab Visualization'}
        >
          {isFullTab ? <Minimize2 size={13} color="var(--warning)" /> : <Fullscreen size={13} color="var(--primary)" />}
          {isFullTab ? 'Exit Full Tab' : 'Full Tab'}
        </button>
      </div>


      {/* Mini-Map Overlay Component */}
      {showMiniMap && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            width: 170,
            height: 120,
            background: '#FFFFFF',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            zIndex: 50
          }}
        >
          <div
            style={{
              padding: '4px 8px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.65rem',
              color: 'var(--muted)',
              fontWeight: 700,
              letterSpacing: '0.06em'
            }}
          >
            <span>MINI MAP</span>
            <span style={{ color: 'var(--primary)' }}>{nodes.length} NODES</span>
          </div>

          <svg width={170} height={96} style={{ display: 'block', background: '#F8FAFC' }}>
            {/* Render mini nodes */}
            {simRef.current?.nodes().map((n, i) => {
              // Normalize positions to minimap coordinates
              const mx = 85 + (n.x - dims.w / 2) * 0.12
              const my = 48 + (n.y - dims.h / 2) * 0.12
              return (
                <rect
                  key={n.id || i}
                  x={mx - 6}
                  y={my - 3}
                  width={12}
                  height={7}
                  rx={1.5}
                  fill="#FFFFFF"
                  stroke={RISK_BORDER[n.risk] || '#94A3B8'}
                  strokeWidth={0.8}
                />
              )
            })}

            {/* Viewport Indicator Rectangle */}
            <rect
              x={Math.max(2, 85 - (currentTransform.x * 0.07))}
              y={Math.max(2, 48 - (currentTransform.y * 0.07))}
              width={Math.min(160, (dims.w / (currentTransform.k || 1)) * 0.1)}
              height={Math.min(90, (dims.h / (currentTransform.k || 1)) * 0.1)}
              fill="rgba(21, 101, 192, 0.08)"
              stroke="var(--primary)"
              strokeWidth={1}
              strokeDasharray="2 2"
            />
          </svg>
        </div>
      )}
      {/* Floating Tactical Entity Detail Drawer in Full Tab Mode */}
      {isFullTab && selectedEntity && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 320,
            maxHeight: 'calc(100vh - 32px)',
            background: '#FFFFFF',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            overflowY: 'auto',
            padding: 20,
            zIndex: 100,
            animation: 'fadeInUp 200ms both'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Tactical Dossier // {selectedEntity.type || 'ENTITY'}
            </span>
            <button
              onClick={() => onClearSelected?.()}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4 }}
            >
              ✕
            </button>
          </div>

          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                border: `2px solid ${RISK_BORDER[selectedEntity.risk] || 'var(--primary)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                fontSize: '1.2rem',
                fontWeight: 800,
                color: 'var(--text)',
                boxShadow: `0 0 16px ${selectedEntity.risk === 'high' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 211, 238, 0.3)'}`
              }}
            >
              {selectedEntity.avatar || selectedEntity.name?.slice(0, 2)?.toUpperCase() || 'ID'}
            </div>
            <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', color: 'var(--text)', fontWeight: 700 }}>
              {selectedEntity.name}
            </h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
              {selectedEntity.role || 'Unspecified Role'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 10 }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: selectedEntity.risk === 'high' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: RISK_BORDER[selectedEntity.risk] || 'var(--text)',
                  border: `1px solid ${RISK_BORDER[selectedEntity.risk] || 'var(--border)'}`
                }}
              >
                {selectedEntity.risk?.toUpperCase()} THREAT
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'rgba(34, 211, 238, 0.1)',
                  color: 'var(--primary)',
                  border: '1px solid rgba(34, 211, 238, 0.25)'
                }}
              >
                {selectedEntity.type}
              </span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Status', val: selectedEntity.status },
              { label: 'Location', val: selectedEntity.location },
              { label: 'Connections', val: `${selectedEntity.connections || selectedEntity.linkCount || 0} links` },
              { label: 'First Detected', val: selectedEntity.firstSeen || '2023-01-10' },
              { label: 'Last Activity', val: selectedEntity.lastSeen || '2024-11-02' }
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--muted)' }}>{f.label}</span>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{f.val}</span>
              </div>
            ))}
          </div>

          {selectedEntity.bio && (
            <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4 }}>
                INTELLIGENCE SYNOPSIS
              </div>
              <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                {selectedEntity.bio}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

