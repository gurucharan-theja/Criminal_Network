import { create } from 'zustand'
import { fetchGraph } from '../api/relationshipApi'
import { fetchEntities } from '../api/entityApi'
import axiosClient from '../api/axiosClient'

const STORAGE_KEY_NODES = 'cni_graph_nodes'
const STORAGE_KEY_LINKS = 'cni_graph_links'

const getCachedNodes = () => {
  try {
    if (localStorage.getItem('cni_system_cleared') === 'true' || localStorage.getItem('cni_graph_cleared') === 'true') {
      return []
    }
    const saved = localStorage.getItem(STORAGE_KEY_NODES)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

const getCachedLinks = () => {
  try {
    if (localStorage.getItem('cni_system_cleared') === 'true' || localStorage.getItem('cni_graph_cleared') === 'true') {
      return []
    }
    const saved = localStorage.getItem(STORAGE_KEY_LINKS)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

const saveToStorage = (nodes, links) => {
  try {
    if (Array.isArray(nodes)) localStorage.setItem(STORAGE_KEY_NODES, JSON.stringify(nodes))
    if (Array.isArray(links)) localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify(links))
  } catch (e) {
    console.warn('Failed to cache graph to localStorage', e)
  }
}

/**
 * useGraphStore — global state for the criminal network graph.
 * Used by NetworkAnalysis.jsx, Dashboard.jsx, and Insights.jsx.
 */
const useGraphStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────
  nodes:          getCachedNodes(),
  links:          getCachedLinks(),
  selectedNodeId: null,
  hoveredNodeId:  null,
  loading:        false,
  error:          null,
  lastFetched:    null,

  // ── Actions ────────────────────────────────────────────────

  /** Load full graph from backend */
  loadGraph: async () => {
    set({ loading: true, error: null })

    // Check if user explicitly cleared the graph
    try {
      if (localStorage.getItem('cni_graph_cleared') === 'true' || localStorage.getItem('cni_system_cleared') === 'true') {
        set({ nodes: [], links: [], loading: false })
        return
      }
    } catch {}

    try {
      const data = await fetchGraph()
      const backendNodes = Array.isArray(data?.nodes) ? data.nodes : []
      const backendLinks = Array.isArray(data?.links) ? data.links : []

      const cachedNodes = getCachedNodes()
      const cachedLinks = getCachedLinks()

      // Merge backend and cached nodes
      const nodeMap = new Map()
      ;[...backendNodes, ...cachedNodes].forEach(n => {
        if (n && n.id) nodeMap.set(String(n.id), n)
      })
      const mergedNodes = Array.from(nodeMap.values())

      const linkMap = new Map()
      ;[...backendLinks, ...cachedLinks].forEach(l => {
        if (l) {
          const s = typeof l.source === 'object' ? l.source.id : l.source
          const t = typeof l.target === 'object' ? l.target.id : l.target
          linkMap.set(`${s}->${t}:${l.type || ''}`, l)
        }
      })
      const mergedLinks = Array.from(linkMap.values())

      saveToStorage(mergedNodes, mergedLinks)
      set({
        nodes:       mergedNodes,
        links:       mergedLinks,
        loading:     false,
        lastFetched: new Date().toISOString(),
      })
    } catch (err) {
      // On backend network error or offline mode, fallback safely to local cached nodes
      const cachedNodes = getCachedNodes()
      const cachedLinks = getCachedLinks()
      set({
        nodes:   cachedNodes,
        links:   cachedLinks,
        loading: false,
        error:   err.message,
      })
    }
  },

  /** Load only entities (lighter call) */
  loadEntities: async (filters = {}) => {
    set({ loading: true, error: null })
    try {
      const nodes = await fetchEntities(filters)
      if (Array.isArray(nodes) && nodes.length > 0) {
        const { links } = get()
        saveToStorage(nodes, links)
        set({ nodes, loading: false })
      } else {
        set({ loading: false })
      }
    } catch (err) {
      set({ loading: false, error: err.message })
    }
  },

  /** Add newly extracted entities/links to graph (after upload) */
  mergeExtractionResult: (result) => {
    try {
      localStorage.removeItem('cni_graph_cleared')
      localStorage.removeItem('cni_system_cleared')
    } catch {}
    const { nodes, links } = get()
    const existingIds = new Set(nodes.map(n => String(n.id)))
    const incomingEntities = result.entities || []
    const newNodes = incomingEntities.filter(e => e && e.id && !existingIds.has(String(e.id)))

    const existingLinkKeys = new Set(links.map(l => {
      const s = typeof l.source === 'object' ? l.source.id : l.source
      const t = typeof l.target === 'object' ? l.target.id : l.target
      return `${s}->${t}:${l.type || ''}`
    }))

    const incomingLinks = result.relations || []
    const newLinks = incomingLinks.filter(l => {
      if (!l) return false
      const s = typeof l.source === 'object' ? l.source.id : l.source
      const t = typeof l.target === 'object' ? l.target.id : l.target
      const key = `${s}->${t}:${l.type || ''}`
      return !existingLinkKeys.has(key)
    })

    const updatedNodes = [...nodes, ...newNodes]
    const updatedLinks = [...links, ...newLinks]

    saveToStorage(updatedNodes, updatedLinks)
    set({
      nodes: updatedNodes,
      links: updatedLinks,
    })
  },

  /** Select a node (click) */
  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  /** Hover a node */
  hoverNode: (nodeId) => set({ hoveredNodeId: nodeId }),

  /** Clear selection */
  clearSelection: () => set({ selectedNodeId: null, hoveredNodeId: null }),

  /** Remove a node and its edges from local state */
  removeNode: (nodeId) => {
    const { nodes, links } = get()
    const targetNode = nodes.find(n => String(n.id) === String(nodeId))
    const updatedNodes = nodes.filter(n => String(n.id) !== String(nodeId))
    const updatedLinks = links.filter(l => {
      const s = typeof l.source === 'object' ? l.source.id : l.source
      const t = typeof l.target === 'object' ? l.target.id : l.target
      return String(s) !== String(nodeId) && String(t) !== String(nodeId)
    })
    saveToStorage(updatedNodes, updatedLinks)
    set({
      nodes: updatedNodes,
      links: updatedLinks,
      selectedNodeId: null,
    })

    // Cascade prune CDR records matching this node's phone number or IMEI
    if (targetNode) {
      try {
        const rawCdr = localStorage.getItem('crime_net_cdr_records')
        if (rawCdr) {
          const cdrs = JSON.parse(rawCdr)
          const targetNum = targetNode.name ? targetNode.name.replace(/\D/g, '') : ''
          const updatedCdrs = cdrs.filter(c => {
            const callerDigits = String(c.callerNumber || '').replace(/\D/g, '')
            const receiverDigits = String(c.receiverNumber || '').replace(/\D/g, '')
            if (targetNum && (callerDigits.includes(targetNum) || receiverDigits.includes(targetNum))) return false
            return true
          })
          localStorage.setItem('crime_net_cdr_records', JSON.stringify(updatedCdrs))
        }
      } catch (e) {}
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('crime_net_data_changed'))
    }
  },

  /** Reset graph */
  resetGraph: () => {
    try {
      localStorage.setItem(STORAGE_KEY_NODES, JSON.stringify([]))
      localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify([]))
      localStorage.setItem('cni_graph_cleared', 'true')
    } catch {}
    set({ nodes: [], links: [], selectedNodeId: null, error: null })
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('crime_net_data_changed'))
    }
  },

  /** Purge all entities and relations from both backend and local state */
  purgeAllData: async () => {
    try {
      await axiosClient.post('/reset')
    } catch (e) {
      console.warn('Backend reset API call failed', e)
    }
    try {
      localStorage.setItem('cni_system_cleared', 'true')
      localStorage.setItem('cni_graph_cleared', 'true')
      localStorage.setItem(STORAGE_KEY_NODES, JSON.stringify([]))
      localStorage.setItem(STORAGE_KEY_LINKS, JSON.stringify([]))
      localStorage.setItem('crime_net_saved_cases', JSON.stringify([]))
      localStorage.setItem('crime_net_cdr_records', JSON.stringify([]))
      localStorage.setItem('crime_net_blockchain_blocks', JSON.stringify([]))
      localStorage.setItem('crime_net_blockchain_wallets', JSON.stringify([]))
      localStorage.setItem('crime_net_deleted_case_ids', JSON.stringify([]))
    } catch {}
    set({ nodes: [], links: [], selectedNodeId: null, error: null })
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('crime_net_data_changed'))
    }
  },
}))

if (typeof window !== 'undefined') {
  window.addEventListener('crime_net_data_changed', () => {
    const nodes = getCachedNodes()
    const links = getCachedLinks()
    useGraphStore.setState({ nodes, links })
  })
}

export default useGraphStore
