import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useRealtimeSubscription } from './useRealtimeSubscription'
import { CACHE_TIMES } from '../lib/queryConfig'

// Obtener notificaciones del usuario
export function useNotifications() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // Callback para manejar cambios en notificaciones
  const handleNotificationChange = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })
    queryClient.invalidateQueries({ queryKey: ['unread-notifications-count', user?.id] })
  }, [user?.id, queryClient])

  // Suscripción con cleanup robusto
  useRealtimeSubscription({
    channelName: `notifications-${user?.id}`,
    table: 'notifications',
    event: '*',
    filter: user ? `user_id=eq.${user.id}` : undefined,
    onEvent: handleNotificationChange,
    enabled: !!user,
  })

  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return []

      // Calcular fecha de hace 7 días
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      // Paso 1: Obtener las notificaciones
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(50)

      if (notificationsError) throw notificationsError
      if (!notificationsData || notificationsData.length === 0) return []

      // Paso 2: Obtener los perfiles de los actores (usuarios que realizaron las acciones)
      const actorIds = [...new Set(notificationsData.map(n => n.actor_id).filter(Boolean))]

      if (actorIds.length === 0) {
        return notificationsData.map(n => ({ ...n, actor: null }))
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', actorIds)

      if (profilesError) throw profilesError

      // Paso 3: Para notificaciones de tipo 'reaction', obtener el tipo de reacción de post_reactions
      const reactionNotifications = notificationsData.filter(n => n.type === 'reaction' && n.entity_type === 'post')
      let reactionsMap = {}

      if (reactionNotifications.length > 0) {
        // Obtener las reacciones actuales de esos posts
        const postIds = reactionNotifications.map(n => n.entity_id)
        const actorIds = reactionNotifications.map(n => n.actor_id)

        const { data: reactions } = await supabase
          .from('post_reactions')
          .select('post_id, user_id, reaction_type')
          .in('post_id', postIds)
          .in('user_id', actorIds)

        // Crear mapa de reacciones por post_id + user_id
        reactions?.forEach(r => {
          reactionsMap[`${r.post_id}-${r.user_id}`] = r.reaction_type
        })
      }

      // Paso 4: Combinar notificaciones con perfiles y datos de reacción
      return notificationsData.map(notification => {
        const result = {
          ...notification,
          actor: profiles?.find(p => p.id === notification.actor_id) || null
        }

        // Si es una notificación de reacción, agregar el tipo de reacción al metadata
        if (notification.type === 'reaction' && notification.entity_type === 'post') {
          const reactionType = reactionsMap[`${notification.entity_id}-${notification.actor_id}`]
          if (reactionType) {
            result.metadata = { reaction: reactionType }
          }
        }

        return result
      })
    },
    enabled: !!user,
    ...CACHE_TIMES.REALTIME,
  })
}

// Obtener contador de notificaciones no leídas
export function useUnreadNotificationsCount() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // Callback para manejar cambios en notificaciones
  const handleUnreadChange = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['unread-notifications-count', user?.id] })
  }, [user?.id, queryClient])

  // Suscripción con cleanup robusto
  useRealtimeSubscription({
    channelName: `unread-notifications-${user?.id}`,
    table: 'notifications',
    event: '*',
    filter: user ? `user_id=eq.${user.id}` : undefined,
    onEvent: handleUnreadChange,
    enabled: !!user,
  })

  return useQuery({
    queryKey: ['unread-notifications-count', user?.id],
    queryFn: async () => {
      if (!user) return 0

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) throw error
      return count || 0
    },
    enabled: !!user,
    ...CACHE_TIMES.REALTIME,
  })
}

// Marcar notificación como leída
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (notificationId) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] })
    },
  })
}

// Marcar todas las notificaciones como leídas
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] })
    },
  })
}

// Crear notificación
export async function createNotification({ userId, actorId, type, entityType, entityId, metadata = null }) {
  // No crear notificación para el mismo usuario
  if (userId === actorId) return

  const { data, error } = await supabase
    .from('notifications')
    .insert([
      {
        user_id: userId,
        actor_id: actorId,
        type,
        entity_type: entityType,
        entity_id: entityId,
        is_read: false,
        metadata,
      },
    ])

  if (error) throw error
  return data
}

// Eliminar una notificación específica
export function useDeleteNotification() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (notificationId) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user?.id) // Seguridad: solo eliminar propias notificaciones

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] })
    },
  })
}

// Eliminar todas las notificaciones del usuario
export function useDeleteAllNotifications() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async () => {
      if (!user) return

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] })
    },
  })
}

// Eliminar notificaciones antiguas (más de 30 días)
export function useCleanOldNotifications() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async () => {
      if (!user) return

      // Calcular fecha de hace 30 días
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id)
        .lt('created_at', thirtyDaysAgo.toISOString())

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] })
    },
  })
}
