import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { createNotification } from './useNotifications'
import { CACHE_TIMES } from '../lib/queryConfig'

// Reacciones tradicionales para posts y comentarios (estilo redes sociales)
export const REACTIONS = {
  like: { emoji: '👍', label: 'Me gusta', color: '#3B82F6' },
  love: { emoji: '❤️', label: 'Me encanta', color: '#EF4444' },
  haha: { emoji: '😂', label: 'Me divierte', color: '#F59E0B' },
  wow: { emoji: '😮', label: 'Me asombra', color: '#8B5CF6' },
  sad: { emoji: '😢', label: 'Me entristece', color: '#6B7280' },
  angry: { emoji: '😠', label: 'Me enoja', color: '#DC2626' },
}

// Reacciones especiales para películas (mantener las originales)
export const MOVIE_REACTIONS = {
  masterpiece: { emoji: '🏆', label: 'Obra Maestra', value: 5, color: '#FFD700' },
  excellent: { emoji: '⭐', label: 'Excelente', value: 4, color: '#FFA500' },
  popcorn: { emoji: '🍿', label: 'Entretenido', value: 3, color: '#FF6B6B' },
  meh: { emoji: '👎', label: 'Meh', value: 2, color: '#9CA3AF' },
  boring: { emoji: '💤', label: 'Aburrido', value: 1, color: '#6B7280' },
}

// OPTIMIZADO: Obtener reacciones del usuario para múltiples posts a la vez
export function useBatchUserReactions(postIds) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['batch-post-reactions', postIds, user?.id],
    queryFn: async () => {
      if (!user || !postIds || postIds.length === 0) return new Map()

      const { data, error } = await supabase
        .from('post_reactions')
        .select('post_id, reaction_type')
        .in('post_id', postIds)
        .eq('user_id', user.id)

      if (error) throw error

      // Retornar Map para búsqueda O(1)
      return new Map(data?.map(r => [r.post_id, r.reaction_type]) || [])
    },
    enabled: !!user && !!postIds && postIds.length > 0,
    ...CACHE_TIMES.SOCIAL,
  })
}

// OPTIMIZADO: Obtener conteos de reacciones para múltiples posts
export function useBatchPostReactions(postIds) {
  return useQuery({
    queryKey: ['batch-post-reactions-counts', postIds],
    queryFn: async () => {
      if (!postIds || postIds.length === 0) return new Map()

      const { data, error } = await supabase
        .from('post_reactions')
        .select('post_id, reaction_type')
        .in('post_id', postIds)

      if (error) throw error

      // Agrupar por post y contar
      const reactionsMap = new Map()
      data?.forEach(r => {
        if (!reactionsMap.has(r.post_id)) {
          reactionsMap.set(r.post_id, { counts: {}, total: 0 })
        }
        const postReactions = reactionsMap.get(r.post_id)
        postReactions.counts[r.reaction_type] = (postReactions.counts[r.reaction_type] || 0) + 1
        postReactions.total++
      })

      return reactionsMap
    },
    enabled: !!postIds && postIds.length > 0,
    ...CACHE_TIMES.SOCIAL,
  })
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

        // NO eliminar notificación al quitar reacción
        // La notificación ya fue vista, mantenerla en el historial

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

      // Las notificaciones ahora se crean automáticamente mediante triggers en la base de datos
      // No es necesario crearlas manualmente aquí

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
