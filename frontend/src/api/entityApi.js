import axiosClient from './axiosClient'

/**
 * entityApi — CRUD operations for criminal network entities.
 * Talks to GET/DELETE /api/v1/entities on the Spring Boot backend.
 */

/** Fetch all entities, optionally filtered by risk and/or type */
export const fetchEntities = ({ risk, type } = {}) => {
  const params = {}
  if (risk && risk !== 'all') params.risk = risk
  if (type && type !== 'all') params.type = type
  return axiosClient.get('/entities', { params })
}

/** Fetch a single entity by its nodeId */
export const fetchEntityById = (nodeId) =>
  axiosClient.get(`/entities/${nodeId}`)

/** Delete an entity and all its relationships */
export const deleteEntity = (nodeId) =>
  axiosClient.delete(`/entities/${nodeId}`)
