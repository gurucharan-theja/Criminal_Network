import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import * as d3 from 'd3'
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Tag, EyeOff, Sparkles, Maximize, Minimize, X, ArrowUpRight } from 'lucide-react'

// Color palette for entity nodes
const TYPE_COLORS = {
  SUSPECT: '#EF4444',      // Tactical Red
  PERSON: '#3B82F6',       // Electric Blue
  ORGANIZATION: '#A855F7', // Deep Purple
  PHONE: '#10B981',        // Emerald Green
  ACCOUNT: '#F59E0B',      // Amber Gold
  LOCATION: '#EC4899',     // Hot Pink
  VEHICLE: '#6366F1',      // Indigo
  DEFAULT: '#64748B'       // Slate Gray
}

// Icon paths for SVG rendering inside node circles
const TYPE_ICONS = {
  SUSPECT: 'M12 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 8a3 3 0 1 1 3-3 3 3 0 0 1-3 3zm9 11v-1a7 7 0 0 0-7-7h-4a7 7 0 0 0-7 7v1h2v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1z',
  PERSON: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  ORGANIZATION: 'M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z',
  PHONE: 'M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2z',
  ACCOUNT: 'M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
  LOCATION: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
  VEHICLE: 'M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-4h14v4z',
  DEFAULT: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z'
}

export default function NetworkGraph({
  nodes = [],
  links = [],
  selectedNodeId = null,
  onNodeSelect = () => {},
  height = '100%',
  width = '100%'
}) {
  const containerRef = useRef(null)
  const svgRef = useRef(null)
  const simulationRef = useRef(null)
  const zoomBehaviorRef = useRef(null)

  const [zoomLevel, setZoomLevel] = useState(1)
  const [showEdgeLabels, setShowEdgeLabels] = useState(true)
  const [isFullTab, setIsFullTab] = useState(false)

  const nodesMapRef = useRef(new Map())

  // Active selected node object
  const activeSelectedNode = useMemo(() => {
    if (!selectedNodeId) return null
    return nodes.find(n => String(n.id || n.nodeId) === String(selectedNodeId)) || null
  }, [selectedNodeId, nodes])

  // Direct connected nodes list for popup inspector
  const connectedNodes = useMemo(() => {
    if (!selectedNodeId) return []
    const connectedIds = new Set()
    links.forEach(l => {
      const sId = String(typeof l.source === 'object' ? l.source.id : l.source)
      const tId = String(typeof l.target === 'object' ? l.target.id : l.target)
      if (sId === String(selectedNodeId)) connectedIds.add(tId)
      if (tId === String(selectedNodeId)) connectedIds.add(sId)
    })
    return nodes.filter(n => connectedIds.has(String(n.id || n.nodeId)))
  }, [selectedNodeId, links, nodes])

  // Process data for D3 force simulation
  const getGraphData = useCallback(() => {
    const currentIds = new Set(nodes.map(n => String(n.id || n.nodeId)))
    for (const key of nodesMapRef.current.keys()) {
      if (!currentIds.has(key)) {
        nodesMapRef.current.delete(key)
      }
    }

    const processedNodes = nodes.map(n => {
      const id = String(n.id || n.nodeId)
      const existing = nodesMapRef.current.get(id)
      const type = (n.type || 'PERSON').toUpperCase()
      const risk = n.riskScore ?? n.riskLevel ?? 50

      const nodeObj = {
        ...n,
        id,
        label: n.name || n.label || id,
        type,
        riskScore: Number(risk),
        color: TYPE_COLORS[type] || TYPE_COLORS.DEFAULT,
        x: existing ? existing.x : undefined,
        y: existing ? existing.y : undefined,
        vx: existing ? existing.vx : undefined,
        vy: existing ? existing.vy : undefined,
        fx: existing ? existing.fx : undefined,
        fy: existing ? existing.fy : undefined
      }

      nodesMapRef.current.set(id, nodeObj)
      return nodeObj
    })

    const nodeIds = new Set(processedNodes.map(n => n.id))

    const linkPairs = new Map()

    const processedLinks = links
      .map((l, idx) => {
        const sourceId = String(typeof l.source === 'object' ? l.source.id : l.source)
        const targetId = String(typeof l.target === 'object' ? l.target.id : l.target)

        const pairKey = [sourceId, targetId].sort().join('--')
        const pairCount = (linkPairs.get(pairKey) || 0) + 1
        linkPairs.set(pairKey, pairCount)

        return {
          ...l,
          id: l.id || `${sourceId}-${targetId}-${idx}`,
          source: sourceId,
          target: targetId,
          label: l.type || l.relation || l.label || '',
          pairIndex: pairCount
        }
      })
      .filter(l => nodeIds.has(l.source) && nodeIds.has(l.target))

    return { nodes: processedNodes, links: processedLinks }
  }, [nodes, links])

  // Initialize D3 Force Canvas
  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const { nodes: graphNodes, links: graphLinks } = getGraphData()
    if (graphNodes.length === 0) return

    const container = containerRef.current
    const widthPx = container.clientWidth || 800
    const heightPx = container.clientHeight || 600
    const cx = widthPx / 2
    const cy = heightPx / 2

    const defs = svg.append('defs')

    // CRIME BRANCH TACTICAL RADAR GRID PATTERN
    const tacticalPattern = defs.append('pattern')
      .attr('id', 'crime-branch-grid')
      .attr('width', 60)
      .attr('height', 60)
      .attr('patternUnits', 'userSpaceOnUse')

    tacticalPattern.append('path')
      .attr('d', 'M 60 0 L 0 0 0 60')
      .attr('fill', 'none')
      .attr('stroke', 'rgba(56, 189, 248, 0.07)')
      .attr('stroke-width', '1')

    tacticalPattern.append('circle')
      .attr('cx', 30)
      .attr('cy', 30)
      .attr('r', 1.5)
      .attr('fill', 'rgba(56, 189, 248, 0.25)')

    // Arrowhead Marker
    defs.append('marker')
      .attr('id', 'arrow-head-glow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 32)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#38BDF8')

    // Neon Glow Filter
    const filter = defs.append('filter')
      .attr('id', 'neon-glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%')

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur')

    const feMerge = filter.append('feMerge')
    feMerge.append('feMergeNode').attr('in', 'coloredBlur')
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic')

    // Deep Midnight Tactical Navy Background
    svg.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', '#070A13')

    svg.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'url(#crime-branch-grid)')

    // CRIME BRANCH WATERMARK
    const watermarkGroup = svg.append('g')
      .attr('transform', `translate(${cx}, ${cy})`)
      .attr('opacity', 0.04)
      .attr('pointer-events', 'none')

    watermarkGroup.append('circle').attr('r', 220).attr('fill', 'none').attr('stroke', '#38BDF8').attr('stroke-width', 2).attr('stroke-dasharray', '8 6')
    watermarkGroup.append('circle').attr('r', 180).attr('fill', 'none').attr('stroke', '#38BDF8').attr('stroke-width', 1)
    watermarkGroup.append('line').attr('x1', -260).attr('y1', 0).attr('x2', 260).attr('y2', 0).attr('stroke', '#38BDF8').attr('stroke-width', 1)
    watermarkGroup.append('line').attr('x1', 0).attr('y1', -260).attr('x2', 0).attr('y2', 260).attr('stroke', '#38BDF8').attr('stroke-width', 1)
    watermarkGroup.append('text').attr('text-anchor', 'middle').attr('y', 8).attr('font-size', '22px').attr('font-weight', '900').attr('fill', '#38BDF8').attr('letter-spacing', '8px').text('CRIME BRANCH INTEL CELL')

    // Setup SVG main graph layer
    const g = svg.append('g').attr('class', 'graph-main-group')

    // Zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.15, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
        setZoomLevel(Math.round(event.transform.k * 100) / 100)
      })

    zoomBehaviorRef.current = zoom
    svg.call(zoom)

    // Dynamic Force Scaling
    const dynamicLinkDistance = Math.min(280, Math.max(180, 160 + graphNodes.length * 6))
    const dynamicCharge = -Math.min(1400, Math.max(550, 450 + graphNodes.length * 30))

    // Create Path Edge Elements
    const linkGroup = g.append('g').attr('class', 'links-layer')
    const linkPaths = linkGroup.selectAll('path')
      .data(graphLinks)
      .enter()
      .append('path')
      .attr('class', 'graph-link')
      .attr('fill', 'none')
      .attr('stroke', '#1E293B')
      .attr('stroke-width', l => Math.max(2, Math.min(4, (l.weight || 1) * 1.5)))
      .attr('stroke-opacity', 0.85)
      .attr('marker-end', 'url(#arrow-head-glow)')

    // Create Link Label Badges
    const labelGroup = g.append('g').attr('class', 'link-labels-layer')
    const linkLabels = labelGroup.selectAll('g')
      .data(graphLinks.filter(l => l.label))
      .enter()
      .append('g')
      .attr('class', 'link-label-group')
      .style('display', showEdgeLabels ? 'block' : 'none')

    linkLabels.append('rect')
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('fill', '#0F172A')
      .attr('stroke', '#334155')
      .attr('stroke-width', 1)
      .attr('opacity', 0.95)

    linkLabels.append('text')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('fill', '#38BDF8')
      .attr('text-anchor', 'middle')
      .attr('dy', '3.5px')
      .text(l => l.label)

    linkLabels.each(function() {
      const textNode = d3.select(this).select('text').node()
      if (textNode) {
        const bbox = textNode.getBBox()
        d3.select(this).select('rect')
          .attr('x', bbox.x - 6)
          .attr('y', bbox.y - 3)
          .attr('width', bbox.width + 12)
          .attr('height', bbox.height + 6)
      }
    })

    // Create Node Group Elements
    const nodeGroup = g.append('g').attr('class', 'nodes-layer')
    const nodeContainers = nodeGroup.selectAll('g')
      .data(graphNodes, d => d.id)
      .enter()
      .append('g')
      .attr('class', 'graph-node-group')
      .attr('cursor', 'pointer')
      .attr('filter', 'url(#neon-glow)')

    // Outer Threat Pulse Ring for High Risk Suspects (Risk >= 75)
    nodeContainers.filter(d => d.riskScore >= 75)
      .append('circle')
      .attr('r', 27)
      .attr('fill', 'none')
      .attr('stroke', '#EF4444')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4 4')
      .attr('opacity', 0.8)

    // Node Selection Glow Ring
    nodeContainers.append('circle')
      .attr('class', 'selection-ring')
      .attr('r', 25)
      .attr('fill', 'none')
      .attr('stroke', '#38BDF8')
      .attr('stroke-width', 3)
      .attr('opacity', d => String(d.id) === String(selectedNodeId) ? 1 : 0)

    // Main Node Circle
    nodeContainers.append('circle')
      .attr('class', 'node-circle')
      .attr('r', 20)
      .attr('fill', d => d.color)
      .attr('stroke', '#FFFFFF')
      .attr('stroke-width', 2.5)

    // Inner Vector Icon inside Node Circle
    nodeContainers.append('path')
      .attr('d', d => TYPE_ICONS[d.type] || TYPE_ICONS.DEFAULT)
      .attr('fill', '#FFFFFF')
      .attr('transform', 'translate(-10, -10) scale(0.83)')

    // Node Label Dark Glassmorphism Pill
    nodeContainers.append('rect')
      .attr('class', 'node-label-bg')
      .attr('y', 28)
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('fill', 'rgba(7, 10, 19, 0.95)')
      .attr('stroke', '#1E293B')
      .attr('stroke-width', 1)

    // Node Label Text
    nodeContainers.append('text')
      .attr('class', 'node-label')
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '700')
      .attr('fill', '#F8FAFC')
      .text(d => d.label.length > 18 ? d.label.substring(0, 16) + '…' : d.label)

    nodeContainers.each(function() {
      const textNode = d3.select(this).select('text.node-label').node()
      if (textNode) {
        const bbox = textNode.getBBox()
        d3.select(this).select('rect.node-label-bg')
          .attr('x', bbox.x - 7)
          .attr('width', bbox.width + 14)
          .attr('height', bbox.height + 6)
      }
    })

    // D3 Force Simulation Setup
    const simulation = d3.forceSimulation(graphNodes)
      .force('link', d3.forceLink(graphLinks).id(d => d.id).distance(dynamicLinkDistance).strength(0.6))
      .force('charge', d3.forceManyBody().strength(dynamicCharge).distanceMax(900))
      .force('center', d3.forceCenter(cx, cy))
      .force('collide', d3.forceCollide().radius(65).iterations(3))

    simulationRef.current = simulation

    // Update positions on tick
    simulation.on('tick', () => {
      linkPaths.attr('d', d => {
        const dx = d.target.x - d.source.x
        const dy = d.target.y - d.source.y
        const dr = Math.sqrt(dx * dx + dy * dy)

        if (d.pairIndex && d.pairIndex > 1) {
          const sweep = d.pairIndex % 2 === 0 ? 1 : 0
          return `M${d.source.x},${d.source.y}A${dr * 1.3},${dr * 1.3} 0 0,${sweep} ${d.target.x},${d.target.y}`
        }

        return `M${d.source.x},${d.source.y}L${d.target.x},${d.target.y}`
      })

      linkLabels.attr('transform', d => {
        const midX = (d.source.x + d.target.x) / 2
        const midY = (d.source.y + d.target.y) / 2
        return `translate(${midX}, ${midY})`
      })

      nodeContainers.attr('transform', d => `translate(${d.x}, ${d.y})`)
    })

    // Drag behavior
    const drag = d3.drag()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.15).restart()
        d.fx = d.x
        d.fy = d.y
      })
      .on('drag', (event, d) => {
        d.fx = event.x
        d.fy = event.y
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0)
        d.fx = null
        d.fy = null
      })

    nodeContainers.call(drag)

    // Node Click Handler
    nodeContainers.on('click', (event, d) => {
      event.stopPropagation()
      onNodeSelect(d.id)
    })

    // Click canvas background to deselect
    svg.on('click', () => {
      onNodeSelect(null)
    })

    return () => {
      simulation.stop()
    }
  }, [getGraphData, onNodeSelect, selectedNodeId, showEdgeLabels])

  // ZOOM CONTROLS
  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomBehaviorRef.current.scaleBy, 1.3)
    }
  }

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(300)
        .call(zoomBehaviorRef.current.scaleBy, 0.7)
    }
  }

  const handleFitToView = () => {
    if (!svgRef.current || !zoomBehaviorRef.current || !containerRef.current) return
    const { nodes: graphNodes } = getGraphData()
    if (graphNodes.length === 0) return

    const container = containerRef.current
    const widthPx = container.clientWidth || 800
    const heightPx = container.clientHeight || 600

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
    graphNodes.forEach(n => {
      if (n.x != null) {
        if (n.x < minX) minX = n.x
        if (n.x > maxX) maxX = n.x
      }
      if (n.y != null) {
        if (n.y < minY) minY = n.y
        if (n.y > maxY) maxY = n.y
      }
    })

    if (!isFinite(minX) || !isFinite(maxX)) return

    const dx = maxX - minX || 160
    const dy = maxY - minY || 160
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2

    const scale = Math.max(0.2, Math.min(1.4, 0.7 / Math.max(dx / widthPx, dy / heightPx)))
    const translate = [widthPx / 2 - scale * centerX, heightPx / 2 - scale * centerY]

    d3.select(svgRef.current)
      .transition()
      .duration(750)
      .call(
        zoomBehaviorRef.current.transform,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
      )
  }

  const handleFullZoom = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current)
        .transition()
        .duration(500)
        .call(zoomBehaviorRef.current.transform, d3.zoomIdentity.scale(1))
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: isFullTab ? 'fixed' : 'relative',
        inset: isFullTab ? 0 : 'auto',
        zIndex: isFullTab ? 99999 : 1,
        width: isFullTab ? '100vw' : width,
        height: isFullTab ? '100vh' : height,
        background: '#070A13', // Deep Crime Branch Navy
        borderRadius: isFullTab ? 0 : 14,
        overflow: 'hidden',
        border: isFullTab ? 'none' : '1px solid #1E293B',
        boxShadow: isFullTab ? 'none' : '0 12px 32px rgba(0, 0, 0, 0.4)'
      }}
    >
      {/* Crime Branch Classification Header Bar */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          right: 16,
          background: 'rgba(7, 10, 19, 0.85)',
          backdropFilter: 'blur(10px)',
          padding: '6px 12px',
          borderRadius: 8,
          border: '1px solid #1E293B',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          zIndex: 10,
          fontSize: '0.73rem',
          color: '#38BDF8',
          fontWeight: 700
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
          <span>CRIME BRANCH TACTICAL RADAR</span>
        </div>
        <div style={{ color: '#475569' }}>|</div>
        <div style={{ color: '#94A3B8', fontWeight: 600 }}>GRID: CB-INTEL-99</div>
      </div>

      {/* D3 Canvas */}
      <svg
        ref={svgRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />

      {/* Floating Control Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          display: 'flex',
          gap: 6,
          background: 'rgba(7, 10, 19, 0.92)',
          backdropFilter: 'blur(12px)',
          padding: '6px 12px',
          borderRadius: 10,
          border: '1px solid #1E293B',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
          alignItems: 'center',
          zIndex: 10
        }}
      >
        {/* Fullscreen / Full Tab View Button */}
        <button
          onClick={() => setIsFullTab(!isFullTab)}
          title={isFullTab ? "Exit Full Tab View" : "Full Tab View (100% Screen)"}
          style={{
            ...controlBtnStyle,
            background: isFullTab ? '#EF4444' : 'transparent',
            borderColor: isFullTab ? '#EF4444' : '#1E293B',
            color: isFullTab ? '#FFFFFF' : '#CBD5E1',
            fontWeight: 700,
            gap: 4,
            padding: '6px 10px'
          }}
        >
          {isFullTab ? <Minimize size={14} /> : <Maximize size={14} />}
          <span style={{ fontSize: '0.75rem' }}>{isFullTab ? 'Exit Full Tab' : 'Full Tab View'}</span>
        </button>

        <div style={{ width: 1, height: 18, background: '#1E293B', margin: '0 2px' }} />

        {/* Toggle Edge Labels */}
        <button
          onClick={() => setShowEdgeLabels(!showEdgeLabels)}
          title={showEdgeLabels ? "Hide Edge Labels" : "Show Edge Labels"}
          style={{
            ...controlBtnStyle,
            background: showEdgeLabels ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            borderColor: showEdgeLabels ? '#38BDF8' : '#1E293B',
            color: showEdgeLabels ? '#38BDF8' : '#94A3B8',
            fontWeight: 600,
            gap: 4,
            padding: '6px 10px'
          }}
        >
          {showEdgeLabels ? <Tag size={14} /> : <EyeOff size={14} />}
          <span style={{ fontSize: '0.75rem' }}>{showEdgeLabels ? 'Edge Labels ON' : 'Edge Labels OFF'}</span>
        </button>

        <div style={{ width: 1, height: 18, background: '#1E293B', margin: '0 2px' }} />

        <button onClick={handleZoomIn} title="Zoom In" style={controlBtnStyle}>
          <ZoomIn size={16} />
        </button>

        <button onClick={handleZoomOut} title="Zoom Out" style={controlBtnStyle}>
          <ZoomOut size={16} />
        </button>

        <button onClick={handleFitToView} title="Best Fit" style={{ ...controlBtnStyle, gap: 4, padding: '6px 10px' }}>
          <Maximize2 size={14} />
          <span style={{ fontSize: '0.75rem' }}>Best Fit</span>
        </button>

        <button onClick={handleFullZoom} title="Full Zoom" style={{ ...controlBtnStyle, gap: 4, padding: '6px 10px' }}>
          <RotateCcw size={14} />
          <span style={{ fontSize: '0.75rem' }}>100%</span>
        </button>

        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38BDF8', marginLeft: 4 }}>
          {Math.round(zoomLevel * 100)}%
        </span>
      </div>

      {/* FLOATING POP-UP NODE INSPECTOR OVERLAY CARD (Renders ONLY in Full Tab View when a node is clicked) */}
      {isFullTab && activeSelectedNode && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 320,
            background: 'rgba(7, 10, 19, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid #1E293B',
            borderRadius: 12,
            padding: 18,
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
            zIndex: 100,
            fontFamily: "'Inter', sans-serif"
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <span style={{
                display: 'inline-block',
                fontSize: '0.68rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                padding: '2px 8px',
                borderRadius: 4,
                background: TYPE_COLORS[activeSelectedNode.type] || '#1E293B',
                color: '#FFFFFF',
                marginBottom: 6
              }}>
                {activeSelectedNode.type || 'ENTITY'}
              </span>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                {activeSelectedNode.name || activeSelectedNode.label}
              </h3>
              {activeSelectedNode.alias && (
                <div style={{ fontSize: '0.78rem', color: '#94A3B8', marginTop: 2 }}>
                  Alias: {activeSelectedNode.alias}
                </div>
              )}
            </div>

            <button
              onClick={() => onNodeSelect(null)}
              style={{
                background: '#0F172A',
                border: '1px solid #1E293B',
                borderRadius: '50%',
                color: '#94A3B8',
                cursor: 'pointer',
                width: 26,
                height: 26,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Risk Progress Bar */}
          <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: 8, padding: 10, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: '#CBD5E1', marginBottom: 6 }}>
              <span>Threat Assessment</span>
              <span style={{
                color: (activeSelectedNode.riskScore || 50) >= 75 ? '#EF4444' : (activeSelectedNode.riskScore || 50) >= 50 ? '#F59E0B' : '#10B981'
              }}>
                {activeSelectedNode.riskScore || 50} / 100
              </span>
            </div>
            <div style={{ height: 6, background: '#070A13', borderRadius: 3, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${activeSelectedNode.riskScore || 50}%`,
                  background: (activeSelectedNode.riskScore || 50) >= 75 ? '#EF4444' : (activeSelectedNode.riskScore || 50) >= 50 ? '#F59E0B' : '#10B981'
                }}
              />
            </div>
          </div>

          {/* Direct Connections List */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
              <span>Connected Nodes ({connectedNodes.length})</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
              {connectedNodes.length === 0 ? (
                <div style={{ fontSize: '0.78rem', color: '#64748B', textAlign: 'center', padding: 8 }}>
                  No connected links found
                </div>
              ) : (
                connectedNodes.map(conn => (
                  <div
                    key={conn.id || conn.nodeId}
                    onClick={() => onNodeSelect(conn.id || conn.nodeId)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: '#0F172A',
                      border: '1px solid #1E293B',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#F1F5F9' }}>
                        {conn.name || conn.label}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                        {conn.type}
                      </div>
                    </div>
                    <ArrowUpRight size={13} style={{ color: '#38BDF8' }} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legend Badge */}
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          background: 'rgba(7, 10, 19, 0.85)',
          backdropFilter: 'blur(12px)',
          padding: '10px 14px',
          borderRadius: 10,
          border: '1px solid #1E293B',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          zIndex: 10
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F8FAFC', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={12} style={{ color: '#38BDF8' }} /> Entity Classification
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: color,
                  boxShadow: `0 0 6px ${color}`
                }}
              />
              <span style={{ fontSize: '0.7rem', color: '#CBD5E1', fontWeight: 600 }}>
                {type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const controlBtnStyle = {
  background: 'transparent',
  border: '1px solid #1E293B',
  borderRadius: 6,
  padding: '6px',
  color: '#CBD5E1',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.15s ease'
}
