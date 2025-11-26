import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { CACHE_TIMES } from '../lib/queryConfig'

// Reacciones disponibles para comentarios (iguales que posts)
export const COMMENT_REACTIONS = {
  like: { emoji: '👍', label: 'Me gusta', color: '#3B82F6' },
  love: { emoji: '❤️', label: 'Me encanta', color: '#EF4444' },
  haha: { emoji: '😂', label: 'Me divierte', color: '#F59E0B' },
  wow: { emoji: '😮', label: 'Me asombra', color: '#8B5CF6' },
  sad: { emoji: '😢', label: 'Me entristece', color: '#6B7280' },
  angry: { emoji: '😠', label: 'Me enoja', color: '#DC2626' },
}

// Obtener reacciones de un comentario
export function useCommentReactions(commentId) {
  return useQuery({
    queryKey: ['comment-reactions', commentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comment_reactions')
        .select('reaction_type')
        .eq('comment_id', commentId)

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
    enabled: !!commentId,
    ...CACHE_TIMES.SOCIAL,
  })
}

// Obtener la reacción del usuario actual en un comentario
export function useUserCommentReaction(commentId) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['comment-reaction', commentId, user?.id],
    queryFn: async () => {
      if (!user) return null

      const { data, error } = await supabase
        .from('comment_reactions')
        .select('id, reaction_type')
        .eq('comment_id', commentId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error
      return data?.reaction_type || null
    },
    enabled: !!commentId && !!user,
    ...CACHE_TIMES.SOCIAL,
  })
}

// Toggle reacción en comentario
export function useToggleCommentReaction() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ commentId, reactionType, currentReaction }) => {
      if (!user) throw new Error('User not authenticated')

      // Si es la misma reacción, eliminarla (toggle off)
      if (currentReaction === reactionType) {
        const { error } = await supabase
          .from('comment_reactions')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id)

        if (error) throw error
        return { commentId, reaction: null }
      }

      // Si ya tiene una reacción diferente, actualizarla
      if (currentReaction) {
        const { error } = await supabase
          .from('comment_reactions')
          .update({ reaction_type: reactionType })
          .eq('comment_id', commentId)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        // Crear nueva reacción
        const { error } = await supabase
          .from('comment_reactions')
          .insert({
            comment_id: commentId,
            user_id: user.id,
            reaction_type: reactionType,
          })

        if (error) throw error
      }

      return { commentId, reaction: reactionType }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['comment-reaction', data.commentId] })
      queryClient.invalidateQueries({ queryKey: ['comment-reactions', data.commentId] })
    },
  })
}
