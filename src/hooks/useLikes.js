import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { createNotification } from './useNotifications'
import { CACHE_TIMES } from '../lib/queryConfig'

// Verificar si el usuario dio like a un post
export function useHasLiked(postId) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['like', postId, user?.id],
    queryFn: async () => {
      if (!user) return false

      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error
      return !!data
    },
    enabled: !!postId && !!user,
    ...CACHE_TIMES.SOCIAL,
  })
}

// Toggle like (dar o quitar like)
export function useToggleLike() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ postId, hasLiked, postOwnerId }) => {
      if (!user) throw new Error('User not authenticated')

      if (hasLiked) {
        // Quitar like
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)

        if (error) throw error

        // Eliminar la notificación de like asociada
        if (postOwnerId && postOwnerId !== user.id) {
          await supabase
            .from('notifications')
            .delete()
            .eq('user_id', postOwnerId)
            .eq('actor_id', user.id)
            .eq('type', 'like')
            .eq('entity_type', 'post')
            .eq('entity_id', postId)
        }
      } else {
        // Dar like
        const { error } = await supabase
          .from('likes')
          .insert([
            {
              post_id: postId,
              user_id: user.id,
            },
          ])

        if (error) throw error

        // Verificar si ya existe una notificación de like para este post del mismo usuario
        if (postOwnerId && postOwnerId !== user.id) {
          const { data: existingNotification } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', postOwnerId)
            .eq('actor_id', user.id)
            .eq('type', 'like')
            .eq('entity_type', 'post')
            .eq('entity_id', postId)
            .maybeSingle()

          // Solo crear notificación si no existe una previa
          if (!existingNotification) {
            await createNotification({
              userId: postOwnerId,
              actorId: user.id,
              type: 'like',
              entityType: 'post',
              entityId: postId,
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
      }

      return { postId, hasLiked: !hasLiked }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['like', data.postId] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] })
    },
  })
}

// Obtener usuarios que dieron like a un post
export function usePostLikes(postId) {
  return useQuery({
    queryKey: ['likes', 'users', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('likes')
        .select(`
          created_at,
          profiles (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!postId,
    ...CACHE_TIMES.SOCIAL,
  })
}
