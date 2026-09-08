import { useState, useMemo, useCallback } from 'react'

/**
 * useSearch — debounced search + multi-field filtering hook.
 *
 * Usage:
 *   const { query, setQuery, filtered } = useSearch(entities, ['name', 'role', 'location'])
 *
 * @param {Array}  items      — full list to search through
 * @param {Array}  fields     — object keys to search within each item
 * @param {number} debounceMs — debounce delay in ms (default 200)
 */
const useSearch = (items = [], fields = ['name'], debounceMs = 200) => {
  const [query,     setQueryRaw] = useState('')
  const [debounced, setDebounced] = useState('')

  // Debounce the actual search term
  const setQuery = useCallback((val) => {
    setQueryRaw(val)
    const t = setTimeout(() => setDebounced(val), debounceMs)
    return () => clearTimeout(t)
  }, [debounceMs])

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase()
    if (!q) return items

    return items.filter(item =>
      fields.some(field => {
        const val = item[field]
        return val && String(val).toLowerCase().includes(q)
      })
    )
  }, [items, fields, debounced])

  const highlight = useCallback((text) => {
    if (!debounced.trim() || !text) return text
    const regex = new RegExp(`(${debounced.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return String(text).replace(regex, '<mark>$1</mark>')
  }, [debounced])

  return {
    query,
    setQuery,
    filtered,
    highlight,       // Returns HTML string with <mark> tags
    resultCount: filtered.length,
    hasQuery: debounced.trim().length > 0,
  }
}

export default useSearch
