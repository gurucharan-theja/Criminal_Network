import apiClient from "./apiClient";

// Get all evidence
export const getEvidence = async () => {
  const response = await apiClient.get("/evidence");
  return response.data;
};

// Get evidence by ID
export const getEvidenceById = async (id) => {
  const response = await apiClient.get(`/evidence/${id}`);
  return response.data;
};

// Get evidence by evidence number
export const getEvidenceByNumber = async (evidenceNumber) => {
  const response = await apiClient.get(
    `/evidence/number/${encodeURIComponent(evidenceNumber)}`
  );
  return response.data;
};

// Get evidence by status
export const getEvidenceByStatus = async (status) => {
  const response = await apiClient.get(
    `/evidence/status/${encodeURIComponent(status)}`
  );
  return response.data;
};

// Get evidence by source type
export const getEvidenceBySource = async (sourceType) => {
  const response = await apiClient.get(
    `/evidence/source/${encodeURIComponent(sourceType)}`
  );
  return response.data;
};

// Get evidence belonging to a case
export const getEvidenceByCase = async (caseId) => {
  const response = await apiClient.get(`/evidence/case/${caseId}`);
  return response.data;
};

// Create evidence manually
export const createEvidence = async (evidence) => {
  const response = await apiClient.post("/evidence", evidence);
  return response.data;
};

// Update evidence status
export const updateEvidenceStatus = async (id, status) => {
  const response = await apiClient.patch(`/evidence/${id}/status`, {
    status,
  });
  return response.data;
};

// Assign evidence to a case
export const assignEvidenceToCase = async (id, caseId) => {
  const response = await apiClient.patch(`/evidence/${id}/case`, {
    caseId,
  });
  return response.data;
};

// Delete evidence
export const deleteEvidence = async (id) => {
  await apiClient.delete(`/evidence/${id}`);
  return true;
};