import axiosClient from './axiosClient'

/**
 * analysisApi — document upload and AI extraction pipeline.
 * Talks to POST /api/v1/analyse and GET /api/v1/stats.
 */

/**
 * Upload a document for AI analysis.
 * @param {File} file — the document to analyse (PDF/DOCX/TXT/CSV)
 * @param {function} onProgress — optional upload progress callback (0–100)
 * @returns {Promise} — extraction result with entities + relationships
 */
export const analyseDocument = (file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)

  return axiosClient.post('/analyse', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    },
  })
}

/** Fetch dashboard summary statistics */
export const fetchStats = () =>
  axiosClient.get('/stats')
