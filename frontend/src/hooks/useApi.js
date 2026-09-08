import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * useApi — generic hook for calling any async API function.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useApi(fetchEntities, { risk: 'high' })
 *
 * @param {function} apiFn   — async function to call
 * @param {any}      params  — params passed to apiFn (changing this triggers a refetch)
 * @param {object}   options — { immediate: bool (default true), initialData }
 */
const useApi = (apiFn, params = null, { immediate = true, initialData = null } = {}) => {
  const [data,    setData]    = useState(initialData)
  const [loading, setLoading] = useState(immediate)
  const [error,   setError]   = useState(null)

  // Keep a stable ref to apiFn so it doesn't cause infinite loops
  const apiFnRef = useRef(apiFn)
  apiFnRef.current = apiFn

  const execute = useCallback(async (overrideParams) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiFnRef.current(overrideParams ?? params)
      setData(result)
      return result
    } catch (err) {
      setError(err.message || 'Request failed')
      return null
    } finally {
      setLoading(false)
    }
  }, [params]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (immediate) execute()
  }, [immediate, execute])

  return { data, loading, error, refetch: execute }
}

export default useApi
