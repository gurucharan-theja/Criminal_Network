import axiosClient from './axiosClient'

/**
 * relationshipApi — operations for criminal network edges.
 * Talks to GET /api/v1/relationships on the Spring Boot backend.
 */

/** Fetch all relationships, optionally filtered by type */
export const fetchRelationships = ({ type } = {}) => {
  const params = {}
  if (type && type !== 'all') params.type = type
  return axiosClient.get('/relationships', { params })
}

/** Fetch the full graph (nodes + links) ready for D3 */
export const fetchGraph = () =>
  axiosClient.get('/graph')
