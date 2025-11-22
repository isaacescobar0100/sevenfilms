import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

/**
 * Tipos de acciones con rate limiting en backend
 */
export const RATE_LIMIT_ACTIONS = {
  MOVIE_UPLOAD: 'movie_upload',
  POST_CREATION: 'post_creation',
  MESSAGE_SEND: 'message_send',
  SEARCH_REQUEST: 'search_request',
  PROFILE_UPDATE: 'profile_update',
  LIKE_ACTION: 'like_action',
  COMMENT_ACTION: 'comment_action',
  FOLLOW_ACTION: 'follow_action',
  RATING_ACTION: 'rating_action',
}

/**
 * Hook para rate limiting con validación en backend (Supabase)
 *
 * A diferencia del rate limiting frontend, este NO puede ser bypasseado
 * ya que la validación ocurre en la base de datos via triggers y RPC.
 *
 * @param {string} actionType - Tipo de acción (usar RATE_LIMIT_ACTIONS)
 * @returns {Object} Estado y funciones del rate limit
 *
 * @example
 * const { status, checkBeforeAction, isLimited, remaining } = useBackendRateLimit('post_creation')
 *
 * const handlePost = async () => {
 *   if (isLimited) {
 *     showError('Has alcanzado el límite de posts')
 *     return
 *   }
 *   // El trigger en backend también validará, esto es doble protección
 *   await createPost(data)
 * }
 */
export function useBackendRateLimit(actionType) {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [lastError, setLastError] = useState(null)

  // Query para obtener el estado actual del rate limit
  const {
    data: status,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['rateLimit', actionType, user?.id],
    queryFn: async () => {
      if (!user) return null

      const { data, error } = await supabase.rpc('get_rate_limit_status', {
        p_action_type: actionType,
      })

      if (error) {
        console.error('[BackendRateLimit] Error fetching status:', error)
        throw error
      }

      return data
    },
    enabled: !!user,
    staleTime: 10 * 1000, // 10 segundos - refrescar frecuentemente
    refetchInterval: 30 * 1000, // Refrescar cada 30 segundos
  })

  // Mutation para ejecutar una acción con rate limit
  const performActionMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('perform_rate_limited_action', {
        p_action_type: actionType,
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      if (!data.allowed) {
        setLastError(data.error || 'Límite excedido')
      } else {
        setLastError(null)
      }
      // Invalidar query para actualizar el estado
      queryClient.invalidateQueries({ queryKey: ['rateLimit', actionType] })
    },
    onError: (error) => {
      setLastError(error.message)
    },
  })

  /**
   * Verificar si la acción está permitida antes de ejecutarla
   * Útil para mostrar advertencias antes de intentar
   */
  const checkBeforeAction = useCallback(async () => {
    await refetch()
    return !status?.limited
  }, [refetch, status])

  /**
   * Ejecutar una acción registrándola en el rate limit
   * NOTA: Los triggers ya hacen esto automáticamente para posts, movies, etc.
   * Usar solo para acciones que NO tienen trigger (como búsquedas)
   */
  const recordAction = useCallback(async () => {
    return performActionMutation.mutateAsync()
  }, [performActionMutation])

  /**
   * Formatear tiempo hasta reset
   */
  const formatResetTime = useCallback((resetAt) => {
    if (!resetAt) return null

    const reset = new Date(resetAt)
    const now = new Date()
    const diffMs = reset - now

    if (diffMs <= 0) return 'Disponible ahora'

    const diffMins = Math.ceil(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMins / 60)

    if (diffHours > 0) {
      const mins = diffMins % 60
      return `${diffHours}h ${mins}m`
    }
    return `${diffMins}m`
  }, [])

  return {
    // Estado
    status,
    isLoading,
    error: queryError || lastError,

    // Valores derivados
    isLimited: status?.limited ?? false,
    remaining: status?.remaining ?? 0,
    limit: status?.limit ?? 0,
    used: status?.used ?? 0,
    resetAt: status?.reset_at,
    resetTimeFormatted: formatResetTime(status?.reset_at),
    windowSeconds: status?.window_seconds ?? 0,

    // Funciones
    checkBeforeAction,
    recordAction,
    refetch,

    // Estado de mutation
    isRecording: performActionMutation.isPending,
  }
}

/**
 * Hook para obtener el estado de múltiples rate limits a la vez
 * Útil para dashboards o páginas de perfil
 */
export function useMultipleBackendRateLimits(actionTypes) {
  const { user } = useAuthStore()

  const queries = useQuery({
    queryKey: ['rateLimits', actionTypes, user?.id],
    queryFn: async () => {
      if (!user) return {}

      const results = {}

      await Promise.all(
        actionTypes.map(async (actionType) => {
          const { data, error } = await supabase.rpc('get_rate_limit_status', {
            p_action_type: actionType,
          })

          if (!error && data) {
            results[actionType] = data
          }
        })
      )

      return results
    },
    enabled: !!user && actionTypes.length > 0,
    staleTime: 30 * 1000,
  })

  return queries
}

/**
 * Componente de mensaje de rate limit
 * Muestra un mensaje amigable cuando el usuario está limitado
 */
export function RateLimitMessage({ actionType, className = '' }) {
  const { isLimited, remaining, limit, resetTimeFormatted } = useBackendRateLimit(actionType)

  if (!isLimited) return null

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-yellow-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Límite de tasa alcanzado
          </h3>
          <div className="mt-1 text-sm text-yellow-700">
            <p>
              Has alcanzado el límite de {limit} acciones.
              {resetTimeFormatted && (
                <> Podrás continuar en <strong>{resetTimeFormatted}</strong>.</>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default useBackendRateLimit
