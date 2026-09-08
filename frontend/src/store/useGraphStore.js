import { create } from 'zustand'
import { fetchGraph } from '../api/relationshipApi'
import { fetchEntities } from '../api/entityApi'
import axiosClient from '../api/axiosClient'

const STORAGE_KEY_NODES = 'cni_graph_nodes'
const STORAGE_KEY_LINKS = 'cni_graph_links'

const getCachedNodes = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_NODES)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

const getCachedLinks = () => {
  try {
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
    try {
      const data = await fetchGraph()
      const backendNodes = Array.isArray(data?.nodes) ? data.nodes : []
      const backendLinks = Array.isArray(data?.links) ? data.links : []

      saveToStorage(backendNodes, backendLinks)
      set({
        nodes:       backendNodes,
        links:       backendLinks,
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
    const updatedNodes = nodes.filter(n => n.id !== nodeId)
    const updatedLinks = links.filter(l => {
      const s = typeof l.source === 'object' ? l.source.id : l.source
      const t = typeof l.target === 'object' ? l.target.id : l.target
      return s !== nodeId && t !== nodeId
    })
    saveToStorage(updatedNodes, updatedLinks)
    set({
      nodes: updatedNodes,
      links: updatedLinks,
      selectedNodeId: null,
    })
  },

  /** Reset graph */
  resetGraph: () => {
    try {
      localStorage.removeItem(STORAGE_KEY_NODES)
      localStorage.removeItem(STORAGE_KEY_LINKS)
    } catch {}
    set({ nodes: [], links: [], selectedNodeId: null, error: null })
  },

  /** Purge all entities and relations from both backend and local state */
  purgeAllData: async () => {
    try {
      await axiosClient.post('/reset')
    } catch (e) {
      console.warn('Backend reset API call failed', e)
    }
    try {
      localStorage.removeItem(STORAGE_KEY_NODES)
      localStorage.removeItem(STORAGE_KEY_LINKS)
    } catch {}
    set({ nodes: [], links: [], selectedNodeId: null, error: null })
  },
}))

export default useGraphStore
