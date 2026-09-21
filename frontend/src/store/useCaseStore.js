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

const DELETED_CASES_KEY = "crime_net_deleted_case_ids";

const getDeletedCaseIds = () => {
  try {
    const raw = localStorage.getItem(DELETED_CASES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

const addDeletedCaseId = (caseId, caseNumber) => {
  try {
    const deleted = getDeletedCaseIds();
    const toAdd = [];
    if (caseId) toAdd.push(String(caseId));
    if (caseNumber) toAdd.push(String(caseNumber));
    const updated = Array.from(new Set([...deleted, ...toAdd]));
    localStorage.setItem(DELETED_CASES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save deleted case id:", e);
  }
};

const isCaseDeleted = (c, deletedIds) => {
  if (!c) return true;
  const idStr = String(c.id || "");
  const numStr = String(c.caseNumber || "");
  return (idStr && deletedIds.includes(idStr)) || (numStr && deletedIds.includes(numStr));
};

const getStoredCases = () => {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('cni_system_cleared') === 'true') {
      return [];
    }
  } catch (e) {}
  const deletedIds = getDeletedCaseIds();
  try {
    const saved = localStorage.getItem(CASES_STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.filter((c) => !isCaseDeleted(c, deletedIds));
      }
    }
  } catch (e) {
    console.error("Failed to read cases from localStorage:", e);
  }
  return INITIAL_DEFAULT_CASES.filter((c) => !isCaseDeleted(c, deletedIds));
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
      if (typeof localStorage !== 'undefined' && localStorage.getItem('cni_system_cleared') === 'true') {
        set({ cases: [], loading: false, stats: { total: 0, open: 0, active: 0, onHold: 0, closed: 0 } });
        return;
      }
    } catch (e) {}

    const deletedIds = getDeletedCaseIds();
    const saved = localStorage.getItem(CASES_STORAGE_KEY);

    // If local storage has already been initialized (including empty array []), respect local storage
    if (saved !== null) {
      const localCases = getStoredCases();
      set({ cases: localCases, loading: false });
      return;
    }

    try {
      const apiCases = await getCases();
      if (Array.isArray(apiCases) && apiCases.length > 0) {
        const filteredApiCases = apiCases.filter((c) => !isCaseDeleted(c, deletedIds));
        saveStoredCases(filteredApiCases);
        set({ cases: filteredApiCases, loading: false });
        return;
      }
    } catch (error) {
      console.warn("Backend API unavailable for getCases, falling back to localStorage cases:", error.message);
    }
    const filteredDefaults = INITIAL_DEFAULT_CASES.filter((c) => !isCaseDeleted(c, deletedIds));
    saveStoredCases(filteredDefaults);
    set({ cases: filteredDefaults, loading: false });
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

    const targetCase = get().cases.find((c) => String(c.id) === String(id) || c.caseNumber === id);
    addDeletedCaseId(id, targetCase?.caseNumber);

    const updated = get().cases.filter((item) => String(item.id) !== String(id) && item.caseNumber !== id);
    saveStoredCases(updated);

    set({ cases: updated, error: null });

    // CASCADE DELETE: Prune Graph nodes, CDRs, and Blockchain blocks linked to this case
    cascadeDeleteCaseData(id, targetCase);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("crime_net_data_changed"));
    }
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

function cascadeDeleteCaseData(caseId, targetCase) {
  const caseIdStr = String(caseId);
  const caseNumStr = targetCase?.caseNumber ? String(targetCase.caseNumber) : '';
  const caseTitleStr = targetCase?.title ? String(targetCase.title).toLowerCase() : '';

  // 1. Cascade Delete Graph Nodes & Links in localStorage
  try {
    const rawNodes = localStorage.getItem('cni_graph_nodes');
    const rawLinks = localStorage.getItem('cni_graph_links');
    const nodes = rawNodes ? JSON.parse(rawNodes) : [];
    const links = rawLinks ? JSON.parse(rawLinks) : [];

    const updatedNodes = nodes.filter((n) => {
      if (!n) return false;
      const nCaseId = String(n.caseId || '');
      const nCaseIds = Array.isArray(n.caseIds) ? n.caseIds.map(String) : [];
      if (nCaseId === caseIdStr || (caseNumStr && nCaseId === caseNumStr)) return false;
      if (nCaseIds.includes(caseIdStr) || (caseNumStr && nCaseIds.includes(caseNumStr))) return false;
      return true;
    });

    const nodeIdsLeft = new Set(updatedNodes.map((n) => String(n.id)));
    const updatedLinks = links.filter((l) => {
      if (!l) return false;
      const s = String(typeof l.source === 'object' ? l.source.id : l.source);
      const t = String(typeof l.target === 'object' ? l.target.id : l.target);
      return nodeIdsLeft.has(s) && nodeIdsLeft.has(t);
    });

    localStorage.setItem('cni_graph_nodes', JSON.stringify(updatedNodes));
    localStorage.setItem('cni_graph_links', JSON.stringify(updatedLinks));
  } catch (e) {
    console.error('Error cascade deleting graph nodes:', e);
  }

  // 2. Cascade Delete Blockchain Audit Blocks in localStorage
  try {
    const rawBlocks = localStorage.getItem('crime_net_blockchain_blocks');
    if (rawBlocks) {
      const blocks = JSON.parse(rawBlocks);
      const updatedBlocks = blocks.filter((b) => {
        if (!b) return false;
        const committed = String(b.evidenceCommitted || '').toLowerCase();
        if (committed.includes(caseIdStr.toLowerCase())) return false;
        if (caseNumStr && committed.includes(caseNumStr.toLowerCase())) return false;
        if (caseTitleStr && committed.includes(caseTitleStr)) return false;
        return true;
      });
      localStorage.setItem('crime_net_blockchain_blocks', JSON.stringify(updatedBlocks));
    }
  } catch (e) {
    console.error('Error cascade deleting blockchain blocks:', e);
  }

  // 3. Cascade Delete CDR Records in localStorage
  try {
    const rawCdr = localStorage.getItem('crime_net_cdr_records');
    if (rawCdr) {
      const cdrs = JSON.parse(rawCdr);
      const updatedCdrs = cdrs.filter((c) => {
        if (!c) return false;
        const cId = String(c.caseId || '');
        if (cId === caseIdStr || (caseNumStr && cId === caseNumStr)) return false;
        return true;
      });
      localStorage.setItem('crime_net_cdr_records', JSON.stringify(updatedCdrs));
    }
  } catch (e) {
    console.error('Error cascade deleting CDR records:', e);
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("crime_net_data_changed", () => {
    const cases = getStoredCases();
    useCaseStore.setState({ cases });
  });
}

export default useCaseStore;