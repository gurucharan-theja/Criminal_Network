import { create } from "zustand";
import {
  getCases,
  getCaseStats,
  createCase,
  updateCase,
  deleteCase,
  searchCases,
} from "../services/caseApi";

const useCaseStore = create((set) => ({
  cases: [],
  stats: {
    total: 0,
    open: 0,
    active: 0,
    onHold: 0,
    closed: 0,
  },

  loading: false,
  error: null,

  loadCases: async () => {
    set({ loading: true, error: null });
    try {
      const cases = await getCases();
      set({
        cases: Array.isArray(cases) ? cases : [],
        loading: false,
      });
    } catch (error) {
      console.error("Failed to fetch cases:", error);
      set({
        loading: false,
        error: error.message || "Failed to fetch cases",
      });
    }
  },

  fetchCases: async () => {
    set({ loading: true, error: null });

    try {
      const cases = await getCases();
      set({
        cases: Array.isArray(cases) ? cases : [],
        loading: false,
      });
    } catch (error) {
      console.error("Failed to fetch cases:", error);

      set({
        loading: false,
        error: error.message || "Failed to fetch cases",
      });
    }
  },

  fetchStats: async () => {
    try {
      const stats = await getCaseStats();

      set({
        stats: {
          total: stats?.total ?? 0,
          open: stats?.open ?? 0,
          active: stats?.active ?? 0,
          onHold: stats?.onHold ?? 0,
          closed: stats?.closed ?? 0,
        },
      });
    } catch (error) {
      console.error("Failed to fetch case statistics:", error);
    }
  },

  addCase: async (caseData) => {
    set({ error: null });

    try {
      const newCase = await createCase(caseData);

      set((state) => ({
        cases: [newCase, ...state.cases],
      }));

      return newCase;
    } catch (error) {
      console.error("Failed to create case:", error);

      set({
        error: error.message || "Failed to create case",
      });

      throw error;
    }
  },

  editCase: async (id, updates) => {
    set({ error: null });

    try {
      const updatedCase = await updateCase(id, updates);

      set((state) => ({
        cases: state.cases.map((item) =>
          item.id === id ? updatedCase : item
        ),
      }));

      return updatedCase;
    } catch (error) {
      console.error("Failed to update case:", error);

      set({
        error: error.message || "Failed to update case",
      });

      throw error;
    }
  },

  removeCase: async (id) => {
    set({ error: null });

    try {
      await deleteCase(id);

      set((state) => ({
        cases: state.cases.filter((item) => item.id !== id),
      }));
    } catch (error) {
      console.error("Failed to delete case:", error);

      set({
        error: error.message || "Failed to delete case",
      });

      throw error;
    }
  },

  search: async (query) => {
    if (!query?.trim()) {
      return;
    }

    set({ loading: true, error: null });

    try {
      const results = await searchCases(query);

      set({
        cases: Array.isArray(results) ? results : [],
        loading: false,
      });
    } catch (error) {
      console.error("Failed to search cases:", error);

      set({
        loading: false,
        error: error.message || "Failed to search cases",
      });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useCaseStore;