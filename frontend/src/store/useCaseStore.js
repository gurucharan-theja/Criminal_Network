import { create } from "zustand";
import {
  getCases,
  getCaseStats,
  createCase,
  updateCase,
  deleteCase,
  searchCases,
} from "../services/caseApi";

const CASES_STORAGE_KEY = "crime_net_saved_cases";

const INITIAL_DEFAULT_CASES = [
  {
    id: "case-001",
    caseNumber: "CR-2026-9041",
    title: "Operation Coastal Storm (Hawala Syndicate)",
    description: "Inter-state illegal Hawala financial transactions and telecom conduit surveillance.",
    investigator: "IO-CBI-771 (Special Tactical Unit)",
    department: "CBI Cyber Division",
    risk: "high",
    status: "active",
    priority: "CRITICAL",
    createdAt: "2026-09-01T10:00:00.000Z",
  },
  {
    id: "case-002",
    caseNumber: "CR-2026-8812",
    title: "Project Red Shield (Contraband Intercept)",
    description: "Nocturnal cell tower triangulation & SIM swap network investigation.",
    investigator: "OFFICER-IB-4902",
    department: "Intelligence Bureau",
    risk: "medium",
    status: "active",
    priority: "HIGH",
    createdAt: "2026-09-05T14:30:00.000Z",
  },
  {
    id: "case-003",
    caseNumber: "CR-2026-7734",
    title: "Ransomware Depository Ledger Investigation",
    description: "Darknet USDT wallet monitoring & Section 65B blockchain forensic trail.",
    investigator: "IO-LE-104 (Cyber Crime Cell)",
    department: "State Special Cell",
    risk: "high",
    status: "pending",
    priority: "HIGH",
    createdAt: "2026-09-10T09:15:00.000Z",
  },
];

const getStoredCases = () => {
  try {
    const saved = localStorage.getItem(CASES_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to read cases from localStorage:", e);
  }
  return INITIAL_DEFAULT_CASES;
};

const saveStoredCases = (cases) => {
  try {
    localStorage.setItem(CASES_STORAGE_KEY, JSON.stringify(cases));
  } catch (e) {
    console.error("Failed to write cases to localStorage:", e);
  }
};

const useCaseStore = create((set, get) => ({
  cases: getStoredCases(),
  stats: {
    total: getStoredCases().length,
    open: getStoredCases().filter((c) => c.status === "active" || c.status === "Active").length,
    active: getStoredCases().filter((c) => c.status === "active" || c.status === "Active").length,
    onHold: getStoredCases().filter((c) => c.status === "pending" || c.status === "Pending").length,
    closed: getStoredCases().filter((c) => c.status === "closed" || c.status === "Closed").length,
  },

  loading: false,
  error: null,

  loadCases: async () => {
    set({ loading: true, error: null });
    try {
      const apiCases = await getCases();
      if (Array.isArray(apiCases) && apiCases.length > 0) {
        // Merge API cases with local cases
        const localCases = getStoredCases();
        const mergedMap = new Map();
        [...apiCases, ...localCases].forEach((c) => {
          const key = c.id || c.caseNumber || c.title;
          if (!mergedMap.has(key)) {
            mergedMap.set(key, c);
          }
        });
        const merged = Array.from(mergedMap.values());
        saveStoredCases(merged);
        set({ cases: merged, loading: false });
        return;
      }
    } catch (error) {
      console.warn("Backend API unavailable for getCases, falling back to localStorage cases:", error.message);
    }
    // Fallback to local stored cases
    set({ cases: getStoredCases(), loading: false });
  },

  fetchCases: async () => {
    return get().loadCases();
  },

  fetchStats: async () => {
    try {
      const stats = await getCaseStats();
      if (stats) {
        set({
          stats: {
            total: stats?.total ?? get().cases.length,
            open: stats?.open ?? 0,
            active: stats?.active ?? 0,
            onHold: stats?.onHold ?? 0,
            closed: stats?.closed ?? 0,
          },
        });
        return;
      }
    } catch (error) {
      console.warn("Backend API unavailable for getCaseStats, calculating locally:", error.message);
    }
    const currentCases = get().cases;
    set({
      stats: {
        total: currentCases.length,
        open: currentCases.filter((c) => c.status === "active" || c.status === "Active").length,
        active: currentCases.filter((c) => c.status === "active" || c.status === "Active").length,
        onHold: currentCases.filter((c) => c.status === "pending" || c.status === "Pending").length,
        closed: currentCases.filter((c) => c.status === "closed" || c.status === "Closed").length,
      },
    });
  },

  addCase: async (caseData) => {
    set({ error: null });
    let createdCase = null;

    try {
      createdCase = await createCase(caseData);
    } catch (error) {
      console.warn("Backend API failed for createCase, creating case locally in localStorage:", error.message);
    }

    if (!createdCase || !createdCase.id) {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      createdCase = {
        id: `case-${Date.now()}`,
        caseNumber: caseData.caseNumber || `CR-2026-${randomNum}`,
        title: caseData.title || "Untitled Investigation Docket",
        description: caseData.description || "",
        investigator: caseData.investigator || "Lead Investigator",
        department: caseData.department || "Law Enforcement Cell",
        risk: caseData.risk || "medium",
        status: caseData.status || "active",
        priority: (caseData.risk === "high" ? "CRITICAL" : "MEDIUM"),
        createdAt: new Date().toISOString(),
      };
    }

    set((state) => {
      const updated = [createdCase, ...state.cases];
      saveStoredCases(updated);
      return { cases: updated, error: null };
    });

    return createdCase;
  },

  editCase: async (id, updates) => {
    set({ error: null });
    let updatedCase = null;

    try {
      updatedCase = await updateCase(id, updates);
    } catch (error) {
      console.warn("Backend API failed for updateCase, updating locally:", error.message);
    }

    set((state) => {
      const updated = state.cases.map((item) =>
        item.id === id ? { ...item, ...updates, ...(updatedCase || {}) } : item
      );
      saveStoredCases(updated);
      return { cases: updated, error: null };
    });

    return updatedCase || { id, ...updates };
  },

  removeCase: async (id) => {
    set({ error: null });
    try {
      await deleteCase(id);
    } catch (error) {
      console.warn("Backend API failed for deleteCase, removing locally:", error.message);
    }

    set((state) => {
      const updated = state.cases.filter((item) => item.id !== id);
      saveStoredCases(updated);
      return { cases: updated, error: null };
    });
  },

  search: async (query) => {
    if (!query?.trim()) {
      return get().loadCases();
    }

    set({ loading: true, error: null });

    try {
      const results = await searchCases(query);
      if (Array.isArray(results) && results.length > 0) {
        set({ cases: results, loading: false });
        return;
      }
    } catch (error) {
      console.warn("Backend API search failed, searching locally:", error.message);
    }

    const q = query.toLowerCase();
    const localMatches = getStoredCases().filter((c) =>
      String(c.title || "").toLowerCase().includes(q) ||
      String(c.caseNumber || "").toLowerCase().includes(q) ||
      String(c.investigator || "").toLowerCase().includes(q) ||
      String(c.description || "").toLowerCase().includes(q)
    );

    set({ cases: localMatches, loading: false });
  },

  clearError: () => set({ error: null }),
}));

export default useCaseStore;