import { create } from 'zustand'
import { fetchCases, createCase, updateCase, deleteCase } from '../api/caseApi'

const STORAGE_KEY_CASES = 'cni_cases'

const getCachedCases = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CASES)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

/**
 * useCaseStore — global state for case management.
 * Used by Cases.jsx, Dashboard.jsx, Investigation.jsx.
 */
const useCaseStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────
  cases:        getCachedCases(),
  activeCaseId: null,
  loading:      false,
  error:        null,

  // ── Computed ───────────────────────────────────────────────
  get activeCase() {
    return get().cases.find(c => c.id === get().activeCaseId) || null
  },

  // ── Actions ────────────────────────────────────────────────

  /** Load all cases */
  loadCases: async () => {
    set({ loading: true, error: null })
    try {
      const cases = await fetchCases()
      if (Array.isArray(cases)) {
        try {
          localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(cases))
        } catch {}
        set({ cases, loading: false })
      }
    } catch (err) {
      // Fallback to local storage if network request fails
      const cached = getCachedCases()
      set({ cases: cached, loading: false, error: err.message })
    }
  },

  /** Set the currently active case */
  setActiveCase: (id) => set({ activeCaseId: id }),

  /** Create a new case */
  addCase: async (data) => {
    try {
      const newCase = await createCase(data)
      set(state => {
        const updated = [newCase, ...state.cases.filter(c => c.id !== newCase.id)]
        try {
          localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(updated))
        } catch {}
        return { cases: updated, error: null }
      })
      return newCase
    } catch (err) {
      console.warn('Backend unavailable, creating case in local storage:', err)
      // Resilient local docket creation so the officer is never blocked
      const localCase = {
        id: Date.now(),
        caseNumber: data.caseNumber || `FIR-${Math.floor(100 + Math.random() * 900)}/2026`,
        title: data.title,
        description: data.description || '',
        investigator: data.investigator || 'Lead Investigator',
        department: data.department || 'Crime Branch',
        risk: data.risk || 'medium',
        status: data.status || 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      set(state => {
        const updated = [localCase, ...state.cases]
        try {
          localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(updated))
        } catch {}
        return { cases: updated, error: null }
      })
      return localCase
    }
  },

  /** Update an existing case */
  editCase: async (id, data) => {
    try {
      const updated = await updateCase(id, data)
      set(state => {
        const updatedList = state.cases.map(c => c.id === id ? { ...c, ...updated } : c)
        try {
          localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(updatedList))
        } catch {}
        return { cases: updatedList }
      })
    } catch (err) {
      // Update locally
      set(state => {
        const updatedList = state.cases.map(c => c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c)
        try {
          localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(updatedList))
        } catch {}
        return { cases: updatedList }
      })
    }
  },

  /** Delete a case */
  removeCase: async (id) => {
    try {
      await deleteCase(id)
    } catch (err) {
      console.warn('Backend delete failed, removing locally:', err)
    }
    set(state => {
      const remaining = state.cases.filter(c => c.id !== id)
      try {
        localStorage.setItem(STORAGE_KEY_CASES, JSON.stringify(remaining))
      } catch {}
      return {
        cases: remaining,
        activeCaseId: state.activeCaseId === id ? null : state.activeCaseId,
      }
    })
  },
}))

export default useCaseStore
