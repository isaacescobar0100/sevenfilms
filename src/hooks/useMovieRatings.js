import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useTranslation } from 'react-i18next'
import { captureError } from '../lib/sentry'

// Obtener rating de un usuario para una película específica
export function useUserMovieRating(movieId) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['movie-rating', movieId, user?.id],
    queryFn: async () => {
      if (!user) return null

      const { data, error } = await supabase
        .from('movie_ratings')
        .select('*')
        .eq('movie_id', movieId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error
      return data
    },
    enabled: !!user && !!movieId,
  })
}

// Obtener todos los ratings de una película con información de usuarios
export function useMovieRatings(movieId) {
  return useQuery({
    queryKey: ['movie-ratings', movieId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movie_ratings')
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

// Crear o actualizar rating
export function useUpsertMovieRating() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: async ({ movieId, rating, review }) => {
      if (!user) throw new Error('User not authenticated')

      // Usar la función RPC que valida ownership
      const { data, error } = await supabase.rpc('add_or_update_movie_rating', {
        p_movie_id: movieId,
        p_user_id: user.id,
        p_rating: rating,
        p_review_text: review || null,
      })

      if (error) throw error

      // Verificar si la respuesta indica error
      if (data && !data.success) {
        const errorMessage =
          data.error === 'owner_rating_not_allowed'
            ? t('movies.rating.cannotRateOwnMovie')
            : data.message || 'Error saving rating'
        throw new Error(errorMessage)
      }

      return data
    },
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['movie-rating', variables.movieId] })
      queryClient.invalidateQueries({ queryKey: ['movie-ratings', variables.movieId] })
      queryClient.invalidateQueries({ queryKey: ['movies'] })
      queryClient.invalidateQueries({ queryKey: ['featured-movies'] })
    },
    onError: (error, variables) => {
      // Capturar error en Sentry con contexto
      captureError(error, {
        action: 'upsert_movie_rating',
        movieId: variables.movieId,
        rating: variables.rating,
        userId: user?.id,
      })
      console.error('Error submitting rating:', error)
    },
  })
}

// Eliminar rating
export function useDeleteMovieRating() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (movieId) => {
      if (!user) throw new Error('User not authenticated')

      const { error } = await supabase
        .from('movie_ratings')
        .delete()
        .eq('movie_id', movieId)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: (_, movieId) => {
      queryClient.invalidateQueries({ queryKey: ['movie-rating', movieId] })
      queryClient.invalidateQueries({ queryKey: ['movie-ratings', movieId] })
      queryClient.invalidateQueries({ queryKey: ['movies'] })
      queryClient.invalidateQueries({ queryKey: ['featured-movies'] })
    },
  })
}

// Obtener películas destacadas
export function useFeaturedMovies() {
  return useQuery({
    queryKey: ['featured-movies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movies')
        .select(`
          *,
          profiles (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .gt('engagement_score', 0)
        .order('engagement_score', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return data || []
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}
