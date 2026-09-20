import apiClient from "./apiClient";

export const getCases = async () => {
  const response = await apiClient.get("/cases");
  return response.data;
};

export const getCaseById = async (id) => {
  const response = await apiClient.get(`/cases/${id}`);
  return response.data;
};

export const getCaseByNumber = async (caseNumber) => {
  const response = await apiClient.get(`/cases/number/${caseNumber}`);
  return response.data;
};

export const createCase = async (caseData) => {
  const response = await apiClient.post("/cases", caseData);
  return response.data;
};

export const updateCase = async (id, updates) => {
  const response = await apiClient.patch(`/cases/${id}`, updates);
  return response.data;
};

export const deleteCase = async (id) => {
  await apiClient.delete(`/cases/${id}`);
};

export const searchCases = async (query) => {
  const response = await apiClient.get("/cases/search", {
    params: { q: query },
  });

  return response.data;
};

export const getCaseStats = async () => {
  const response = await apiClient.get("/cases/stats");
  return response.data;
};

export const getCaseEntities = async (caseId) => {
  const response = await apiClient.get(`/cases/${caseId}/entities`);
  return response.data;
};

export const addEntityToCase = async (
  caseId,
  entityId,
  evidenceSource
) => {
  const response = await apiClient.post(
    `/cases/${caseId}/entities/${entityId}`,
    null,
    {
      params: evidenceSource
        ? { evidenceSource }
        : {},
    }
  );

  return response.data;
};

export const removeEntityFromCase = async (caseId, entityId) => {
  await apiClient.delete(
    `/cases/${caseId}/entities/${entityId}`
  );
};

export const getCaseRelationships = async (caseId) => {
  const response = await apiClient.get(
    `/cases/${caseId}/relationships`
  );

  return response.data;
};

export const addRelationshipToCase = async (
  caseId,
  relationshipId,
  evidenceSource
) => {
  const response = await apiClient.post(
    `/cases/${caseId}/relationships/${relationshipId}`,
    null,
    {
      params: evidenceSource
        ? { evidenceSource }
        : {},
    }
  );

  return response.data;
};

export const removeRelationshipFromCase = async (
  caseId,
  relationshipId
) => {
  await apiClient.delete(
    `/cases/${caseId}/relationships/${relationshipId}`
  );
};