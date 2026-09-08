import axios from 'axios'

/**
 * axiosClient — base Axios instance for all API calls.
 * Points to the Spring Boot backend at localhost:8080.
 * All other api/* files import this and use it directly.
 */
const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ── Request interceptor ───────────────────────────────────────
axiosClient.interceptors.request.use(
  (config) => {
    // Attach auth token here when auth is added
    // const token = localStorage.getItem('token')
    // if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor ──────────────────────────────────────
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'Unknown error'

    console.error(`[API Error] ${error.config?.url} →`, message)
    return Promise.reject(new Error(message))
  }
)

export default axiosClient
