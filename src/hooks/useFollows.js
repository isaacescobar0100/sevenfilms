import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { createNotification } from './useNotifications'
import { CACHE_TIMES } from '../lib/queryConfig'

// Verificar si sigo a un usuario
export function useIsFollowing(userId) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['following', user?.id, userId],
    queryFn: async () => {
      if (!user || !userId || user.id === userId) return false

      const { data, error } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .maybeSingle()

      if (error) throw error
      return !!data
    },
    enabled: !!user && !!userId && user.id !== userId,
    ...CACHE_TIMES.SOCIAL,
  })
}

// Toggle follow (seguir o dejar de seguir)
export function useToggleFollow() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ userId, isFollowing }) => {
      if (!user) throw new Error('User not authenticated')

      if (isFollowing) {
        // Dejar de seguir
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId)

        if (error) throw error

        // Eliminar la notificación de follow asociada
        // (No crear notificación de "dejó de seguirte" - solo eliminar la anterior)
        await supabase
          .from('notifications')
          .delete()
          .eq('user_id', userId)
          .eq('actor_id', user.id)
          .eq('type', 'follow')
          .eq('entity_type', 'user')
      } else {
        // Seguir
        const { error } = await supabase
          .from('follows')
          .insert([
            {
              follower_id: user.id,
              following_id: userId,
            },
          ])

        if (error) throw error

        // Verificar si ya existe una notificación de follow previa
        const { data: existingNotification } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', userId)
          .eq('actor_id', user.id)
          .eq('type', 'follow')
          .eq('entity_type', 'user')
          .maybeSingle()

        // Solo crear notificación si no existe una previa
        if (!existingNotification) {
          await createNotification({
            userId: userId,
            actorId: user.id,
            type: 'follow',
            entityType: 'user',
            entityId: user.id,
          })
        } else {
          // Si ya existe, actualizar la fecha (marcar como no leída y refrescar)
          await supabase
            .from('notifications')
            .update({
              is_read: false,
              created_at: new Date().toISOString()
            })
            .eq('id', existingNotification.id)
        }
      }

      return { userId, isFollowing: !isFollowing }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['following'] })
      queryClient.invalidateQueries({ queryKey: ['followers'] })
      queryClient.invalidateQueries({ queryKey: ['user-stats'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] })
    },
  })
}

// Obtener seguidores de un usuario
export function useFollowers(userId) {
  return useQuery({
    queryKey: ['followers', userId],
    queryFn: async () => {
      // Primero obtener los IDs de seguidores
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('follower_id, created_at')
        .eq('following_id', userId)
        .order('created_at', { ascending: false })

      if (followsError) throw followsError
      if (!followsData || followsData.length === 0) return []

      // Luego obtener los perfiles de esos usuarios
      const followerIds = followsData.map(f => f.follower_id)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', followerIds)

      if (profilesError) throw profilesError

      // Combinar los datos
      return followsData.map(follow => ({
        created_at: follow.created_at,
        follower: profiles.find(p => p.id === follow.follower_id) || null
      })).filter(f => f.follower)
    },
    enabled: !!userId,
    ...CACHE_TIMES.SOCIAL,
  })
}

// Obtener usuarios seguidos
export function useFollowing(userId) {
  return useQuery({
    queryKey: ['following-list', userId],
    queryFn: async () => {
      // Primero obtener los IDs de usuarios seguidos
      const { data: followsData, error: followsError } = await supabase
        .from('follows')
        .select('following_id, created_at')
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })

      if (followsError) throw followsError
      if (!followsData || followsData.length === 0) return []

      // Luego obtener los perfiles de esos usuarios
      const followingIds = followsData.map(f => f.following_id)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', followingIds)

      if (profilesError) throw profilesError

      // Combinar los datos
      return followsData.map(follow => ({
        created_at: follow.created_at,
        following: profiles.find(p => p.id === follow.following_id) || null
      })).filter(f => f.following)
    },
    enabled: !!userId,
    ...CACHE_TIMES.SOCIAL,
  })
}
