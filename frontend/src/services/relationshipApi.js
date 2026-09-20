import apiClient from "./apiClient";

export const getRelationships = async (params = {}) => {
  const response = await apiClient.get(
    "/relationships",
    {
      params,
    }
  );

  return response.data;
};