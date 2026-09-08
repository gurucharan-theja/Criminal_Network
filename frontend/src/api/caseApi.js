import axiosClient from './axiosClient'

/**
 * caseApi — real Spring Boot backend calls for case management.
 * All endpoints: /api/v1/cases
 */

/** Fetch all cases (newest first) */
export const fetchCases = () =>
  axiosClient.get('/cases')

/** Fetch a single case by DB id */
export const fetchCaseById = (id) =>
  axiosClient.get(`/cases/${id}`)

/** Search cases by title / caseNumber / investigator */
export const searchCases = (q) =>
  axiosClient.get('/cases/search', { params: { q } })

/** Case count stats { total, active, closed, pending } */
export const fetchCaseStats = () =>
  axiosClient.get('/cases/stats')

/** Create a new case */
export const createCase = (data) =>
  axiosClient.post('/cases', data)

/** Partial update (send only fields to change) */
export const updateCase = (id, data) =>
  axiosClient.put(`/cases/${id}`, data)

/** Delete a case */
export const deleteCase = (id) =>
  axiosClient.delete(`/cases/${id}`)
