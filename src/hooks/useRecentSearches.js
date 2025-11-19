import { useState, useEffect } from 'react'

const MAX_RECENT_SEARCHES = 10
const STORAGE_KEY = 'cineamateur_recent_searches'

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState([])

  // Cargar búsquedas recientes del localStorage al montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setRecentSearches(parsed)
      }
    } catch (error) {
      console.error('Error loading recent searches:', error)
    }
  }, [])

  // Guardar búsquedas recientes en localStorage cuando cambien
  const saveToStorage = (searches) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(searches))
    } catch (error) {
      console.error('Error saving recent searches:', error)
    }
  }

  // Agregar una nueva búsqueda
  const addSearch = (query, type = 'general') => {
    if (!query || query.trim().length < 2) return

    const trimmedQuery = query.trim()

    setRecentSearches((prev) => {
      // Filtrar búsqueda duplicada (case-insensitive)
      const filtered = prev.filter(
        (item) => item.query.toLowerCase() !== trimmedQuery.toLowerCase()
      )

      // Agregar nueva búsqueda al inicio
      const newSearches = [
        {
          query: trimmedQuery,
          type,
          timestamp: Date.now(),
        },
        ...filtered,
      ].slice(0, MAX_RECENT_SEARCHES) // Limitar a MAX_RECENT_SEARCHES

      saveToStorage(newSearches)
      return newSearches
    })
  }

  // Eliminar una búsqueda específica
  const removeSearch = (query) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.query !== query)
      saveToStorage(filtered)
      return filtered
    })
  }

  // Limpiar todas las búsquedas
  const clearSearches = () => {
    setRecentSearches([])
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    recentSearches,
    addSearch,
    removeSearch,
    clearSearches,
  }
}
