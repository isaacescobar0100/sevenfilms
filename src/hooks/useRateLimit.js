import { useState, useEffect, useCallback } from 'react'

/**
 * Hook para implementar rate limiting en el frontend
 * Almacena contadores en localStorage con ventanas de tiempo
 */

const RATE_LIMITS = {
  // Límites por día (24 horas)
  movieUpload: { limit: 10, windowMs: 24 * 60 * 60 * 1000 }, // 10 películas por día
  postCreation: { limit: 50, windowMs: 24 * 60 * 60 * 1000 }, // 50 posts por día
  messages: { limit: 100, windowMs: 24 * 60 * 60 * 1000 }, // 100 mensajes por día

  // Límites por hora
  searchRequests: { limit: 100, windowMs: 60 * 60 * 1000 }, // 100 búsquedas por hora
  profileUpdates: { limit: 5, windowMs: 60 * 60 * 1000 }, // 5 actualizaciones de perfil por hora

  // Límites por minuto
  likeActions: { limit: 30, windowMs: 60 * 1000 }, // 30 likes por minuto
  commentActions: { limit: 20, windowMs: 60 * 1000 }, // 20 comentarios por minuto
  followActions: { limit: 20, windowMs: 60 * 1000 }, // 20 follows/unfollows por minuto
}

/**
 * Obtener el historial de acciones desde localStorage
 */
function getActionHistory(actionType) {
  try {
    const key = `rateLimit_${actionType}`
    const stored = localStorage.getItem(key)
    if (!stored) return []

    const history = JSON.parse(stored)
    return Array.isArray(history) ? history : []
  } catch (error) {
    console.error('Error reading rate limit history:', error)
    return []
  }
}

/**
 * Guardar el historial de acciones en localStorage
 */
function saveActionHistory(actionType, history) {
  try {
    const key = `rateLimit_${actionType}`
    localStorage.setItem(key, JSON.stringify(history))
  } catch (error) {
    console.error('Error saving rate limit history:', error)
  }
}

/**
 * Limpiar acciones antiguas fuera de la ventana de tiempo
 */
function cleanOldActions(history, windowMs) {
  const now = Date.now()
  return history.filter(timestamp => now - timestamp < windowMs)
}

/**
 * Hook de rate limiting
 * @param {string} actionType - Tipo de acción (movieUpload, postCreation, etc.)
 * @returns {Object} - { canPerformAction, performAction, remaining, resetTime, isLimited }
 */
export function useRateLimit(actionType) {
  const config = RATE_LIMITS[actionType]

  if (!config) {
    console.warn(`Rate limit config not found for: ${actionType}`)
    return {
      canPerformAction: true,
      performAction: () => true,
      remaining: Infinity,
      resetTime: null,
      isLimited: false,
    }
  }

  const [state, setState] = useState(() => {
    const history = getActionHistory(actionType)
    const cleanHistory = cleanOldActions(history, config.windowMs)
    const remaining = Math.max(0, config.limit - cleanHistory.length)
    const canPerform = remaining > 0

    return {
      history: cleanHistory,
      remaining,
      canPerform,
      isLimited: !canPerform,
    }
  })

  // Calcular tiempo hasta el reset
  const getResetTime = useCallback(() => {
    if (state.history.length === 0) return null
    const oldestAction = Math.min(...state.history)
    return new Date(oldestAction + config.windowMs)
  }, [state.history, config.windowMs])

  // Actualizar estado periódicamente para limpiar acciones antiguas
  useEffect(() => {
    const interval = setInterval(() => {
      const cleanHistory = cleanOldActions(state.history, config.windowMs)

      if (cleanHistory.length !== state.history.length) {
        const remaining = Math.max(0, config.limit - cleanHistory.length)
        const canPerform = remaining > 0

        setState({
          history: cleanHistory,
          remaining,
          canPerform,
          isLimited: !canPerform,
        })

        saveActionHistory(actionType, cleanHistory)
      }
    }, 10000) // Revisar cada 10 segundos

    return () => clearInterval(interval)
  }, [actionType, config.limit, config.windowMs, state.history])

  /**
   * Registrar una nueva acción
   * @returns {boolean} - true si la acción fue permitida, false si se alcanzó el límite
   */
  const performAction = useCallback(() => {
    const now = Date.now()
    const cleanHistory = cleanOldActions(state.history, config.windowMs)

    // Verificar si aún hay espacio
    if (cleanHistory.length >= config.limit) {
      setState({
        history: cleanHistory,
        remaining: 0,
        canPerform: false,
        isLimited: true,
      })
      return false
    }

    // Registrar la nueva acción
    const newHistory = [...cleanHistory, now]
    const remaining = Math.max(0, config.limit - newHistory.length)
    const canPerform = remaining > 0

    setState({
      history: newHistory,
      remaining,
      canPerform,
      isLimited: !canPerform,
    })

    saveActionHistory(actionType, newHistory)
    return true
  }, [actionType, config.limit, config.windowMs, state.history])

  /**
   * Resetear manualmente el contador (útil para pruebas o admin)
   */
  const resetCounter = useCallback(() => {
    setState({
      history: [],
      remaining: config.limit,
      canPerform: true,
      isLimited: false,
    })
    saveActionHistory(actionType, [])
  }, [actionType, config.limit])

  return {
    canPerformAction: state.canPerform,
    performAction,
    remaining: state.remaining,
    limit: config.limit,
    resetTime: getResetTime(),
    isLimited: state.isLimited,
    resetCounter, // Útil para pruebas o administración
  }
}

/**
 * Hook para obtener información de múltiples rate limits
 */
export function useMultipleRateLimits(actionTypes) {
  const limits = {}

  actionTypes.forEach(type => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    limits[type] = useRateLimit(type)
  })

  return limits
}

/**
 * Función auxiliar para formatear el tiempo de reset
 */
export function formatResetTime(resetTime) {
  if (!resetTime) return null

  const now = new Date()
  const diff = resetTime - now

  if (diff <= 0) return 'Disponible ahora'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export default useRateLimit
