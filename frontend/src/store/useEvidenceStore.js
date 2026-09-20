import { create } from "zustand";
import {
  getEvidence,
  getEvidenceByCase,
  getEvidenceByStatus,
  assignEvidenceToCase,
  deleteEvidence,
} from "../services/evidenceApi";

const useEvidenceStore = create((set) => ({
  evidence: [],
  loading: false,
  error: null,

  fetchEvidence: async () => {
    set({ loading: true, error: null });

    try {
      const data = await getEvidence();

      set({
        evidence: Array.isArray(data) ? data : [],
        loading: false,
      });
    } catch (error) {
      console.error("Failed to fetch evidence:", error);

      set({
        loading: false,
        error: error.message || "Failed to fetch evidence",
      });
    }
  },

  fetchEvidenceByCase: async (caseId) => {
    set({ loading: true, error: null });

    try {
      const data = await getEvidenceByCase(caseId);

      set({
        evidence: Array.isArray(data) ? data : [],
        loading: false,
      });
    } catch (error) {
      console.error("Failed to fetch case evidence:", error);

      set({
        loading: false,
        error:
          error.message || "Failed to fetch case evidence",
      });
    }
  },

  fetchEvidenceByStatus: async (status) => {
    set({ loading: true, error: null });

    try {
      const data = await getEvidenceByStatus(status);

      set({
        evidence: Array.isArray(data) ? data : [],
        loading: false,
      });
    } catch (error) {
      console.error(
        "Failed to fetch evidence by status:",
        error
      );

      set({
        loading: false,
        error:
          error.message ||
          "Failed to fetch evidence by status",
      });
    }
  },

  assignToCase: async (evidenceId, caseId) => {
    try {
      const updated = await assignEvidenceToCase(
        evidenceId,
        caseId
      );

      set((state) => ({
        evidence: state.evidence.map((item) =>
          item.id === evidenceId ? updated : item
        ),
      }));

      return updated;
    } catch (error) {
      console.error(
        "Failed to assign evidence to case:",
        error
      );

      set({
        error:
          error.message ||
          "Failed to assign evidence to case",
      });

      throw error;
    }
  },

  removeEvidence: async (id) => {
    try {
      await deleteEvidence(id);

      set((state) => ({
        evidence: state.evidence.filter(
          (item) => item.id !== id
        ),
      }));
    } catch (error) {
      console.error("Failed to delete evidence:", error);

      set({
        error:
          error.message || "Failed to delete evidence",
      });

      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

export default useEvidenceStore;