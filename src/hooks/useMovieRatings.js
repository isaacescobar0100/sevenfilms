import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useTranslation } from 'react-i18next'
import { captureError } from '../lib/sentry'
import { CACHE_TIMES } from '../lib/queryConfig'

// Mapeo de reacciones cinematográficas a valores numéricos
export const MOVIE_REACTION_VALUES = {
  masterpiece: 5,
  excellent: 4,
  popcorn: 3,
  meh: 2,
  boring: 1,
}

// Mapeo inverso: valor numérico a tipo de reacción
export const VALUE_TO_MOVIE_REACTION = {
  5: 'masterpiece',
  4: 'excellent',
  3: 'popcorn',
  2: 'meh',
  1: 'boring',
}

// Convertir tipo de reacción a valor numérico
export function reactionToValue(reactionType) {
  return MOVIE_REACTION_VALUES[reactionType] || 3
}

// Convertir valor numérico a tipo de reacción
export function valueToReaction(value) {
  const roundedValue = Math.round(value)
  return VALUE_TO_MOVIE_REACTION[roundedValue] || 'popcorn'
}

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
    ...CACHE_TIMES.SOCIAL,
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
    ...CACHE_TIMES.SOCIAL,
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

      // Usar la función RPC que valida ownership (con 4 parámetros para evitar ambigüedad)
      const { data, error } = await supabase.rpc('add_or_update_movie_rating', {
        p_movie_id: movieId,
        p_user_id: user.id,
        p_rating: rating,
        p_review_text: review || null,
      })

      if (error) {
        // Capturar en Sentry INMEDIATAMENTE
        captureError(new Error(error.message || JSON.stringify(error)), {
          action: 'upsert_movie_rating',
          movieId,
          rating,
          userId: user.id,
          supabaseError: error,
        })
        throw error
      }

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
      const { data: movies, error } = await supabase
        .from('movies')
        .select('*')
        .gt('views', 0)
        .order('views', { ascending: false })
        .order('average_rating', { ascending: false, nullsLast: true })
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      // Obtener perfiles de los usuarios
      const moviesWithProfiles = await Promise.all(
        (movies || []).map(async (movie) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', movie.user_id)
            .maybeSingle()

          return {
            ...movie,
            profiles: profile || {
              id: movie.user_id,
              username: 'Usuario',
              full_name: 'Usuario Sin Nombre',
              avatar_url: null,
            },
          }
        })
      )

      return moviesWithProfiles
    },
    ...CACHE_TIMES.COMPUTED,
  })
}
