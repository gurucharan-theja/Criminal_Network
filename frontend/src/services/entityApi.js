import apiClient from "./apiClient";

export const getEntities = async (params = {}) => {
  const response = await apiClient.get("/entities", {
    params,
  });

  return response.data;
};

export const getEntityByNodeId = async (nodeId) => {
  const response = await apiClient.get(
    `/entities/${nodeId}`
  );

  return response.data;
};

export const searchEntities = async (query) => {
  const response = await apiClient.get(
    "/entities/search",
    {
      params: { q: query },
    }
  );

  return response.data;
};

export const deleteEntity = async (nodeId) => {
  await apiClient.delete(`/entities/${nodeId}`);
};