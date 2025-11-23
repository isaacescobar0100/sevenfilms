import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { createNotification } from './useNotifications'
import { CACHE_TIMES } from '../lib/queryConfig'

// Definición de reacciones disponibles
export const REACTIONS = {
  masterpiece: { emoji: '🏆', label: 'Obra Maestra', value: 5, color: '#FFD700' },
  excellent: { emoji: '⭐', label: 'Excelente', value: 4, color: '#FFA500' },
  popcorn: { emoji: '🍿', label: 'Entretenido', value: 3, color: '#FF6B6B' },
  meh: { emoji: '👎', label: 'Meh', value: 2, color: '#9CA3AF' },
  boring: { emoji: '💤', label: 'Aburrido', value: 1, color: '#6B7280' },
}

// Obtener la reacción del usuario actual en un post
export function useUserReaction(postId) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['post-reaction', postId, user?.id],
    queryFn: async () => {
      if (!user) return null

      const { data, error } = await supabase
        .from('post_reactions')
        .select('id, reaction_type')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error
      return data?.reaction_type || null
    },
    enabled: !!postId && !!user,
    ...CACHE_TIMES.SOCIAL,
  })
}

// Obtener todas las reacciones de un post (conteo por tipo)
export function usePostReactions(postId) {
  return useQuery({
    queryKey: ['post-reactions', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_reactions')
        .select('reaction_type')
        .eq('post_id', postId)

      if (error) throw error

      // Contar reacciones por tipo
      const counts = {}
      let total = 0

      data?.forEach(r => {
        counts[r.reaction_type] = (counts[r.reaction_type] || 0) + 1
        total++
      })

      return { counts, total }
    },
    enabled: !!postId,
    ...CACHE_TIMES.SOCIAL,
  })
}

// Obtener usuarios que reaccionaron a un post (para el panel de detalles)
export function usePostReactionUsers(postId) {
  return useQuery({
    queryKey: ['post-reactions-users', postId],
    queryFn: async () => {
      // Primero obtener las reacciones
      const { data: reactions, error: reactionsError } = await supabase
        .from('post_reactions')
        .select('reaction_type, created_at, user_id')
        .eq('post_id', postId)
        .order('created_at', { ascending: false })

      if (reactionsError) throw reactionsError
      if (!reactions || reactions.length === 0) return []

      // Obtener los user_ids únicos
      const userIds = [...new Set(reactions.map(r => r.user_id))]

      // Obtener los perfiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds)

      if (profilesError) throw profilesError

      // Crear un mapa de perfiles por id
      const profilesMap = {}
      profiles?.forEach(p => {
        profilesMap[p.id] = p
      })

      // Combinar reacciones con perfiles
      return reactions.map(r => ({
        ...r,
        profiles: profilesMap[r.user_id] || null
      }))
    },
    enabled: !!postId,
    ...CACHE_TIMES.SOCIAL,
  })
}

// Toggle o cambiar reacción
export function useToggleReaction() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ postId, reactionType, currentReaction, postOwnerId }) => {
      if (!user) throw new Error('User not authenticated')

      // Si es la misma reacción, eliminarla (toggle off)
      if (currentReaction === reactionType) {
        const { error } = await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)

        if (error) throw error

        // Eliminar notificación
        if (postOwnerId && postOwnerId !== user.id) {
          await supabase
            .from('notifications')
            .delete()
            .eq('user_id', postOwnerId)
            .eq('actor_id', user.id)
            .eq('type', 'reaction')
            .eq('entity_type', 'post')
            .eq('entity_id', postId)
        }

        return { postId, reaction: null }
      }

      // Si ya tiene una reacción diferente, actualizarla
      if (currentReaction) {
        const { error } = await supabase
          .from('post_reactions')
          .update({ reaction_type: reactionType })
          .eq('post_id', postId)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        // Crear nueva reacción
        const { error } = await supabase
          .from('post_reactions')
          .insert({
            post_id: postId,
            user_id: user.id,
            reaction_type: reactionType,
          })

        if (error) throw error
      }

      // Crear o actualizar notificación
      if (postOwnerId && postOwnerId !== user.id) {
        const { data: existingNotification } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', postOwnerId)
          .eq('actor_id', user.id)
          .eq('type', 'reaction')
          .eq('entity_type', 'post')
          .eq('entity_id', postId)
          .maybeSingle()

        if (!existingNotification) {
          await createNotification({
            userId: postOwnerId,
            actorId: user.id,
            type: 'reaction',
            entityType: 'post',
            entityId: postId,
            metadata: { reaction: reactionType }
          })
        } else {
          await supabase
            .from('notifications')
            .update({
              is_read: false,
              created_at: new Date().toISOString()
            })
            .eq('id', existingNotification.id)
        }
      }

      return { postId, reaction: reactionType }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['post-reaction', data.postId] })
      queryClient.invalidateQueries({ queryKey: ['post-reactions', data.postId] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] })
    },
  })
}
