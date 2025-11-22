import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Hook para manejar suscripciones en tiempo real de Supabase de forma segura
 * Previene memory leaks con cleanup robusto y manejo de estado del componente
 *
 * @param {Object} options - Opciones de configuración
 * @param {string} options.channelName - Nombre único del canal
 * @param {string} options.table - Tabla a escuchar
 * @param {string} options.event - Evento a escuchar ('*', 'INSERT', 'UPDATE', 'DELETE')
 * @param {string} options.filter - Filtro opcional (ej: 'user_id=eq.123')
 * @param {Function} options.onEvent - Callback cuando ocurre un evento
 * @param {boolean} options.enabled - Si la suscripción está habilitada
 *
 * @example
 * useRealtimeSubscription({
 *   channelName: 'my-messages',
 *   table: 'messages',
 *   event: 'INSERT',
 *   filter: `receiver_id=eq.${userId}`,
 *   onEvent: (payload) => refetch(),
 *   enabled: !!userId,
 * })
 */
export function useRealtimeSubscription({
  channelName,
  table,
  event = '*',
  filter,
  schema = 'public',
  onEvent,
  enabled = true,
}) {
  // Refs para rastrear el estado del componente y la suscripción
  const channelRef = useRef(null)
  const isMountedRef = useRef(true)
  const isSubscribedRef = useRef(false)

  // Callback estable para el evento
  const handleEvent = useCallback((payload) => {
    // Solo procesar si el componente está montado
    if (isMountedRef.current && onEvent) {
      onEvent(payload)
    }
  }, [onEvent])

  useEffect(() => {
    // Marcar como montado
    isMountedRef.current = true

    // No suscribir si no está habilitado
    if (!enabled || !channelName || !table) {
      return
    }

    // Evitar suscripciones duplicadas
    if (isSubscribedRef.current) {
      return
    }

    // Crear configuración del canal
    const channelConfig = {
      event,
      schema,
      table,
    }

    // Agregar filtro si existe
    if (filter) {
      channelConfig.filter = filter
    }

    // Crear canal con nombre único
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', channelConfig, handleEvent)
      .subscribe((status) => {
        if (isMountedRef.current) {
          if (status === 'SUBSCRIBED') {
            isSubscribedRef.current = true
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            isSubscribedRef.current = false
          }
        }
      })

    channelRef.current = channel

    // Cleanup robusto
    return () => {
      isMountedRef.current = false
      isSubscribedRef.current = false

      if (channelRef.current) {
        // Usar unsubscribe primero, luego removeChannel
        const currentChannel = channelRef.current
        channelRef.current = null

        // Desuscribirse de forma segura (puede no devolver una Promise en tests)
        try {
          const result = supabase.removeChannel(currentChannel)
          // Si devuelve una Promise, manejarla
          if (result && typeof result.catch === 'function') {
            result.catch(() => {
              // Ignorar errores de cleanup - el canal puede ya estar cerrado
            })
          }
        } catch {
          // Ignorar errores de cleanup
        }
      }
    }
  }, [channelName, table, event, filter, schema, enabled, handleEvent])

  // Función para forzar reconexión
  const reconnect = useCallback(() => {
    if (channelRef.current && isMountedRef.current) {
      channelRef.current.subscribe()
    }
  }, [])

  return { reconnect }
}

/**
 * Hook para múltiples suscripciones en un solo canal
 * Más eficiente cuando necesitas escuchar múltiples tablas
 *
 * @param {Object} options - Opciones de configuración
 * @param {string} options.channelName - Nombre único del canal
 * @param {Array} options.subscriptions - Array de configuraciones de suscripción
 * @param {boolean} options.enabled - Si las suscripciones están habilitadas
 */
export function useMultipleRealtimeSubscriptions({
  channelName,
  subscriptions = [],
  enabled = true,
}) {
  const channelRef = useRef(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    if (!enabled || !channelName || subscriptions.length === 0) {
      return
    }

    // Crear canal
    let channel = supabase.channel(channelName)

    // Agregar cada suscripción
    subscriptions.forEach(({ table, event = '*', filter, schema = 'public', onEvent }) => {
      const config = { event, schema, table }
      if (filter) config.filter = filter

      channel = channel.on('postgres_changes', config, (payload) => {
        if (isMountedRef.current && onEvent) {
          onEvent(payload)
        }
      })
    })

    // Suscribirse
    channel.subscribe()
    channelRef.current = channel

    return () => {
      isMountedRef.current = false

      if (channelRef.current) {
        const currentChannel = channelRef.current
        channelRef.current = null
        try {
          const result = supabase.removeChannel(currentChannel)
          if (result && typeof result.catch === 'function') {
            result.catch(() => {})
          }
        } catch {
          // Ignorar errores de cleanup
        }
      }
    }
  }, [channelName, subscriptions, enabled])
}

export default useRealtimeSubscription
