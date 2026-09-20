import apiClient from "./apiClient";

export const getGraph = async () => {
  const response = await apiClient.get("/graph");
  return response.data;
};

export const getStats = async () => {
  const response = await apiClient.get("/stats");
  return response.data;
};