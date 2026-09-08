/**
 * NetworkGraph — Intelligence Card-Node Network Visualization
 *
 * Implements:
 * 1. Dark intelligence dot-matrix background
 * 2. Card-based nodes with risk border colors, badge icons, risk score, and link counts
 * 3. Orthogonal & Smooth Curved links with auto-curving multi-edges
 * 4. Interactive Edge De-Cluttering:
 *    - Label pill badges with translucent background
 *    - Hover/Select spotlight: Selected/hovered node highlights connected edges and dims background edges
 *    - "Labels" toggle button to instantly hide/show all edge text clutter
 * 5. Controls: Zoom In (+), Zoom Out (-), Fit Screen, Best Screen, Toggle Edge Labels, Full Tab
 * 6. Interactive live Mini-Map in the corner with dynamic viewport indicator
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
  Tag,
  Eye,
  EyeOff
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
  const zoomBehaviorRef = useRef(null)
  const simRef = useRef(null)

  const [dims, setDims] = useState({ w: 850, h: height })
  const [currentTransform, setCurrentTransform] = useState(d3.zoomIdentity)
  const [showMiniMap, setShowMiniMap] = useState(true)
  const [isFullTab, setIsFullTab] = useState(false)
  const [showEdgeLabels, setShowEdgeLabels] = useState(true)

  // Track responsive size
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

    // Group parallel edges between same pair of nodes to offset curves
    const edgePairCount = {}
    const simLinks = links.map(l => {
      const sid = typeof l.source === 'object' ? l.source.id : l.source
      const tid = typeof l.target === 'object' ? l.target.id : l.target
      const pairKey = sid < tid ? `${sid}--${tid}` : `${tid}--${sid}`
      edgePairCount[pairKey] = (edgePairCount[pairKey] || 0) + 1
      return {
        ...l,
        source: nodeById.get(sid),
        target: nodeById.get(tid),
        pairIndex: edgePairCount[pairKey] - 1,
        pairKey
      }
    }).filter(l => l.source && l.target)

    // 4. Adaptive Force Simulation to prevent clutter and card overlapping
    const nodeCount = simNodes.length
    const linkDistance = nodeCount > 25 ? 260 : (nodeCount > 10 ? 220 : 190)
    const chargeStrength = nodeCount > 25 ? -1500 : (nodeCount > 10 ? -1200 : -950)
    const collisionRadius = CARD_W * 0.78

    const sim = d3.forceSimulation(simNodes)
      .force('link', d3.forceLink(simLinks).id(d => d.id).distance(linkDistance))
      .force('charge', d3.forceManyBody().strength(chargeStrength))
      .force('center', d3.forceCenter(w / 2, h / 2).strength(0.08))
      .force('collision', d3.forceCollide().radius(collisionRadius).iterations(2))
      .force('x', d3.forceX(w / 2).strength(0.04))
      .force('y', d3.forceY(h / 2).strength(0.04))

    simRef.current = sim

    const RELATION_COLORS = {
      financial: '#16A34A',      // Crisp Green
      communication: '#0284C7',  // Clean Blue
      family: '#7C3AED',         // Purple
      associate: '#D97706',      // Amber
      default: '#64748B'
    }

    // Set of connected node IDs to focusNodeId
    const connectedToFocus = new Set()
    if (focusNodeId) {
      connectedToFocus.add(focusNodeId)
      simLinks.forEach(l => {
        if (l.source.id === focusNodeId) connectedToFocus.add(l.target.id)
        if (l.target.id === focusNodeId) connectedToFocus.add(l.source.id)
      })
    }

    // Render step/curved connector links
    const linkItems = linkLayer.selectAll('.graph-link')
      .data(simLinks)
      .enter()
      .append('g')
      .attr('class', 'graph-link')

    const linkPaths = linkItems.append('path')
      .attr('fill', 'none')
      .attr('stroke', d => RELATION_COLORS[d.type] || RELATION_COLORS.default)
      .attr('stroke-width', d => {
        const isFocused = focusNodeId && (d.source.id === focusNodeId || d.target.id === focusNodeId)
        return isFocused ? 2.5 : 1.4
      })
      .attr('stroke-opacity', d => {
        if (!focusNodeId) return 0.55 // subtle when overview
        return (d.source.id === focusNodeId || d.target.id === focusNodeId) ? 1.0 : 0.15 // spotlight connected edges
      })
      .attr('stroke-dasharray', d => d.type === 'communication' ? '4 3' : 'none')

    // Link pin circles at connections
    const pinSources = linkItems.append('circle')
      .attr('class', 'pin-source')
      .attr('r', 2.8)
      .attr('fill', '#FFFFFF')
      .attr('stroke', d => RELATION_COLORS[d.type] || '#64748b')
      .attr('stroke-width', 1.4)
      .attr('opacity', d => {
        if (!focusNodeId) return 0.7
        return (d.source.id === focusNodeId || d.target.id === focusNodeId) ? 1.0 : 0.15
      })

    const pinTargets = linkItems.append('circle')
      .attr('class', 'pin-target')
      .attr('r', 2.8)
      .attr('fill', '#FFFFFF')
      .attr('stroke', d => RELATION_COLORS[d.type] || '#64748b')
      .attr('stroke-width', 1.4)
      .attr('opacity', d => {
        if (!focusNodeId) return 0.7
        return (d.source.id === focusNodeId || d.target.id === focusNodeId) ? 1.0 : 0.15
      })

    // Edge Label Pill Badges (hidden if showEdgeLabels is false or if not connected during focus)
    const labelGroups = linkItems.append('g')
      .attr('class', 'edge-label-badge')
      .style('display', showEdgeLabels ? 'block' : 'none')
      .attr('opacity', d => {
        if (!focusNodeId) return 0.85
        return (d.source.id === focusNodeId || d.target.id === focusNodeId) ? 1.0 : 0.1
      })

    // Pill background rect
    const labelRects = labelGroups.append('rect')
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', '#FFFFFF')
      .attr('stroke', d => RELATION_COLORS[d.type] || '#CBD5E1')
      .attr('stroke-width', 1)
      .attr('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.06))')

    // Pill label text
    const labelTexts = labelGroups.append('text')
      .attr('font-size', '8px')
      .attr('font-weight', '700')
      .attr('font-family', 'system-ui, -apple-system, sans-serif')
      .attr('fill', d => RELATION_COLORS[d.type] || '#475569')
      .attr('text-anchor', 'middle')
      .attr('dy', '3px')
      .text(d => d.label ? d.label.toUpperCase() : (d.type ? d.type.toUpperCase() : 'LINK'))

    // Size pill rect to fit text
    labelTexts.each(function () {
      const bbox = this.getBBox()
      d3.select(this.parentNode).select('rect')
        .attr('x', bbox.x - 5)
        .attr('y', bbox.y - 2)
        .attr('width', bbox.width + 10)
        .attr('height', bbox.height + 4)
    })

    // 5. Render Node Cards
    const nodeItems = nodeLayer.selectAll('.graph-card')
      .data(simNodes)
      .enter()
      .append('g')
      .attr('class', 'graph-card')
      .style('cursor', 'pointer')
      .attr('opacity', d => {
        if (!focusNodeId) return 1.0
        return connectedToFocus.has(d.id) ? 1.0 : 0.25 // De-clutter unrelated nodes
      })
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
      { cx: 0, cy: -CARD_H / 2 },
      { cx: 0, cy: CARD_H / 2 },
      { cx: -CARD_W / 2, cy: 0 },
      { cx: CARD_W / 2, cy: 0 }
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

    // 6. Smooth Organic Curving Tick router (eliminates sharp overlapping 90-deg staircases)
    sim.on('tick', () => {
      linkPaths.attr('d', d => {
        const sx = d.source.x
        const sy = d.source.y
        const tx = d.target.x
        const ty = d.target.y

        // Calculate smooth curve offset to prevent parallel overlapping edges
        const dx = tx - sx
        const dy = ty - sy
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const offset = (d.pairIndex || 0) * 22

        // Normal vector for gentle curvature
        const nx = -dy / dist
        const ny = dx / dist
        const cx = (sx + tx) / 2 + nx * offset
        const cy = (sy + ty) / 2 + ny * offset

        return `M ${sx} ${sy} Q ${cx} ${cy} ${tx} ${ty}`
      })

      pinSources
        .attr('cx', d => d.source.x)
        .attr('cy', d => d.source.y)

      pinTargets
        .attr('cx', d => d.target.x)
        .attr('cy', d => d.target.y)

      // Position label badge at curve peak
      labelGroups.attr('transform', d => {
        const sx = d.source.x
        const sy = d.source.y
        const tx = d.target.x
        const ty = d.target.y
        const dx = tx - sx
        const dy = ty - sy
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const offset = (d.pairIndex || 0) * 22
        const nx = -dy / dist
        const ny = dx / dist
        const mx = (sx + tx) / 2 + nx * (offset * 0.5)
        const my = (sy + ty) / 2 + ny * (offset * 0.5)
        return `translate(${mx},${my})`
      })

      nodeItems.attr('transform', d => `translate(${d.x},${d.y})`)
    })

    // Initial Zoom to Fit
    setTimeout(() => {
      handleBestScreen()
    }, 400)

    return () => {
      sim.stop()
    }
  }, [nodes, links, dims, focusNodeId, showEdgeLabels])

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

      {/* Control Action Island */}
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

        <div style={{ width: 1, height: 16, background: '#E2E8F0', margin: '0 4px' }} />

        {/* Toggle Edge Labels button */}
        <button
          onClick={() => setShowEdgeLabels(v => !v)}
          className="btn btn-ghost"
          style={{
            padding: '6px 10px',
            fontSize: '0.74rem',
            color: showEdgeLabels ? 'var(--primary)' : 'var(--muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            borderRadius: 4,
            background: showEdgeLabels ? 'rgba(21, 101, 192, 0.08)' : 'transparent'
          }}
          title={showEdgeLabels ? "Hide edge connection labels for cleaner view" : "Show edge connection labels"}
        >
          {showEdgeLabels ? <Eye size={13} color="var(--primary)" /> : <EyeOff size={13} color="var(--muted)" />}
          Labels {showEdgeLabels ? 'ON' : 'OFF'}
        </button>

        <div style={{ width: 1, height: 16, background: '#E2E8F0', margin: '0 4px' }} />

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

        <div style={{ width: 1, height: 16, background: '#E2E8F0', margin: '0 4px' }} />

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
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
            zIndex: 40
          }}
        >
          <div
            style={{
              padding: '4px 8px',
              fontSize: '0.65rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: 'var(--muted)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <span>MINI MAP</span>
            <span style={{ color: 'var(--primary)' }}>{nodes.length} NODES</span>
          </div>

          <svg width={170} height={96} style={{ display: 'block', background: '#F8FAFC' }}>
            {simRef.current?.nodes().map((n, i) => {
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
