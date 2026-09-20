import apiClient from "../services/apiClient";
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

// ============================================================
// DOCUMENT ANALYSIS
// ============================================================

export const analyseDocument = async (file, caseId = null) => {
  const formData = new FormData();
  formData.append("file", file);

  if (caseId !== null && caseId !== undefined) {
    formData.append("caseId", caseId);
  }

  const response = await apiClient.post("/analyse", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// ============================================================
// DASHBOARD / NETWORK STATISTICS
// ============================================================

export const fetchStats = async () => {
  const response = await axios.get(`${API_BASE_URL}/stats`);
  return response.data;
};

// ============================================================
// EVIDENCE
// ============================================================

export const fetchEvidence = async () => {
  const response = await axios.get(`${API_BASE_URL}/evidence`);
  return response.data;
};

export const fetchCdrEvidence = async () => {
  const response = await axios.get(
    `${API_BASE_URL}/evidence/source/CDR`
  );

  return response.data;
};

export const fetchFinancialEvidence = async () => {
  const response = await axios.get(
    `${API_BASE_URL}/evidence/source/FINANCIAL_TRANSACTION`
  );

  return response.data;
};

export const fetchEvidenceByStatus = async (status) => {
  const response = await axios.get(
    `${API_BASE_URL}/evidence/status/${status}`
  );

  return response.data;
};