import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useTranslation } from 'react-i18next'

// Obtener comentarios de una película
export function useMovieComments(movieId) {
  return useQuery({
    queryKey: ['movie-comments', movieId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movie_comments')
        .select(`
          *,
          profiles (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('movie_id', movieId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!movieId,
  })
}

// Crear comentario
export function useCreateMovieComment() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: async ({ movieId, content }) => {
      if (!user) throw new Error('User not authenticated')

      // Usar la función RPC que valida ownership
      const { data, error } = await supabase.rpc('add_movie_comment', {
        p_movie_id: movieId,
        p_user_id: user.id,
        p_content: content,
      })

      if (error) throw error

      // Verificar si la respuesta indica error (ya no hay error para owners)
      if (data && !data.success) {
        throw new Error(data.message || 'Error adding comment')
      }

      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['movie-comments', variables.movieId] })
      queryClient.invalidateQueries({ queryKey: ['movies'] })
      queryClient.invalidateQueries({ queryKey: ['featured-movies'] })
    },
  })
}

// Actualizar comentario
export function useUpdateMovieComment() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ commentId, content, movieId }) => {
      if (!user) throw new Error('User not authenticated')

      // Usar la función RPC que valida ownership
      const { data, error } = await supabase.rpc('update_movie_comment', {
        p_comment_id: commentId,
        p_user_id: user.id,
        p_content: content,
      })

      if (error) throw error

      // Verificar si la respuesta indica error
      if (data && !data.success) {
        throw new Error(data.message || 'Error updating comment')
      }

      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['movie-comments', variables.movieId] })
    },
  })
}

// Eliminar comentario
export function useDeleteMovieComment() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ commentId, movieId }) => {
      if (!user) throw new Error('User not authenticated')

      // Usar la función RPC que valida ownership
      const { data, error } = await supabase.rpc('delete_movie_comment', {
        p_comment_id: commentId,
        p_user_id: user.id,
      })

      if (error) throw error

      // Verificar si la respuesta indica error
      if (data && !data.success) {
        throw new Error(data.message || 'Error deleting comment')
      }

      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['movie-comments', variables.movieId] })
      queryClient.invalidateQueries({ queryKey: ['movies'] })
      queryClient.invalidateQueries({ queryKey: ['featured-movies'] })
    },
  })
}
