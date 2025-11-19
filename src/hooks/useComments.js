import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { createNotification } from './useNotifications'

// Obtener comentarios de un post
export function useComments(postId) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data: comments, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Obtener perfiles de los usuarios que comentaron
      const commentsWithProfiles = await Promise.all(
        comments.map(async (comment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, full_name, avatar_url')
            .eq('id', comment.user_id)
            .maybeSingle()

          return {
            ...comment,
            profiles: profile || {
              username: 'Usuario',
              full_name: 'Usuario Sin Nombre',
              avatar_url: null,
            },
          }
        })
      )

      return commentsWithProfiles
    },
    enabled: !!postId,
  })
}

// Crear comentario
export function useCreateComment() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ postId, content, postOwnerId }) => {
      const { data, error } = await supabase
        .from('comments')
        .insert([
          {
            post_id: postId,
            user_id: user?.id,
            content,
          },
        ])
        .select()
        .single()

      if (error) throw error

      // Crear notificación para el dueño del post
      if (postOwnerId && postOwnerId !== user.id) {
        await createNotification({
          userId: postOwnerId,
          actorId: user.id,
          type: 'comment',
          entityType: 'post',
          entityId: postId,
        })
      }

      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['comments', data.post_id] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] })
    },
  })
}

// Actualizar comentario
export function useUpdateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, content, postId }) => {
      const { data, error } = await supabase
        .from('comments')
        .update({ content })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { data, postId }
    },
    onSuccess: ({ postId }) => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
    },
  })
}

// Eliminar comentario
export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, postId }) => {
      const { error } = await supabase.from('comments').delete().eq('id', id)
      if (error) throw error
      return postId
    },
    onSuccess: (postId) => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}
