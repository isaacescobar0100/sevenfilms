import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

// OPTIMIZADO: Verificar si múltiples posts están guardados en una sola query
export function useBatchSavedPosts(postIds) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['batch-saved-posts', postIds, user?.id],
    queryFn: async () => {
      if (!user || !postIds || postIds.length === 0) return new Map()

      const { data, error } = await supabase
        .from('saved_posts')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds)

      if (error) throw error

      // Retornar Set para búsqueda O(1)
      return new Set(data?.map(s => s.post_id) || [])
    },
    enabled: !!user && !!postIds && postIds.length > 0,
  })
}

// Obtener posts guardados del usuario
export function useSavedPosts() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['saved-posts', user?.id],
    queryFn: async () => {
      // Primero obtener los IDs de posts guardados
      const { data: savedData, error: savedError } = await supabase
        .from('saved_posts')
        .select('id, post_id, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (savedError) throw savedError
      if (!savedData || savedData.length === 0) return []

      // Filtrar IDs válidos (no null/undefined)
      const postIds = savedData.map(s => s.post_id).filter(Boolean)
      if (postIds.length === 0) return []

      // OPTIMIZADO: Obtener todos los posts y perfiles en batch (2 queries en lugar de N*2)
      const [postsResult, profilesResult] = await Promise.all([
        supabase.from('posts').select('*').in('id', postIds),
        supabase.from('profiles').select('id, username, full_name, avatar_url')
      ])

      if (postsResult.error) throw postsResult.error

      const posts = postsResult.data || []
      const profiles = profilesResult.data || []
      const profilesMap = new Map(profiles.map(p => [p.id, p]))

      // Combinar los datos
      return savedData.map(saved => {
        const post = posts.find(p => p.id === saved.post_id)
        if (!post) return null
        const profile = profilesMap.get(post.user_id)
        return {
          ...post,
          username: profile?.username,
          full_name: profile?.full_name,
          avatar_url: profile?.avatar_url,
          saved_at: saved.created_at,
          saved_id: saved.id,
        }
      }).filter(Boolean)
    },
    enabled: !!user?.id,
  })
}

// Verificar si un post está guardado
export function useIsPostSaved(postId) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['is-saved', 'post', postId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_posts')
        .select('id')
        .eq('user_id', user?.id)
        .eq('post_id', postId)
        .maybeSingle()

      if (error) throw error
      return !!data
    },
    enabled: !!user?.id && !!postId,
  })
}

// Guardar/Quitar de guardados un post
export function useToggleSavePost() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ postId, isSaved }) => {
      if (isSaved) {
        // Quitar de guardados
        const { error } = await supabase
          .from('saved_posts')
          .delete()
          .eq('user_id', user?.id)
          .eq('post_id', postId)

        if (error) throw error
      } else {
        // Guardar post
        const { error } = await supabase
          .from('saved_posts')
          .insert({
            user_id: user?.id,
            post_id: postId,
          })

        if (error) throw error
      }
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['is-saved', 'post', postId] })
      queryClient.invalidateQueries({ queryKey: ['saved-posts'] })
    },
  })
}

// ==================== PELÍCULAS GUARDADAS ====================

// Obtener películas guardadas del usuario
export function useSavedMovies() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['saved-movies', user?.id],
    queryFn: async () => {
      const { data: savedData, error: savedError } = await supabase
        .from('saved_movies')
        .select('id, movie_id, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (savedError) throw savedError
      if (!savedData || savedData.length === 0) return []

      // Filtrar IDs válidos
      const movieIds = savedData.map(s => s.movie_id).filter(Boolean)
      if (movieIds.length === 0) return []

      // OPTIMIZADO: Obtener todas las películas y perfiles en batch (2 queries en lugar de N*2)
      const [moviesResult, profilesResult] = await Promise.all([
        supabase.from('movies').select('*').in('id', movieIds),
        supabase.from('profiles').select('id, username, full_name, avatar_url')
      ])

      if (moviesResult.error) throw moviesResult.error

      const movies = moviesResult.data || []
      const profiles = profilesResult.data || []
      const profilesMap = new Map(profiles.map(p => [p.id, p]))

      // Combinar los datos
      return savedData.map(saved => {
        const movie = movies.find(m => m.id === saved.movie_id)
        if (!movie) return null
        return {
          ...movie,
          profiles: profilesMap.get(movie.user_id),
          saved_at: saved.created_at,
          saved_id: saved.id,
        }
      }).filter(Boolean)
    },
    enabled: !!user?.id,
  })
}

// Verificar si una película está guardada
export function useIsMovieSaved(movieId) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['is-saved', 'movie', movieId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_movies')
        .select('id')
        .eq('user_id', user?.id)
        .eq('movie_id', movieId)
        .maybeSingle()

      if (error) throw error
      return !!data
    },
    enabled: !!user?.id && !!movieId,
  })
}

// Guardar/Quitar de guardados una película
export function useToggleSaveMovie() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ movieId, isSaved }) => {
      if (isSaved) {
        const { error } = await supabase
          .from('saved_movies')
          .delete()
          .eq('user_id', user?.id)
          .eq('movie_id', movieId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('saved_movies')
          .insert({
            user_id: user?.id,
            movie_id: movieId,
          })

        if (error) throw error
      }
    },
    onSuccess: (_, { movieId }) => {
      queryClient.invalidateQueries({ queryKey: ['is-saved', 'movie', movieId] })
      queryClient.invalidateQueries({ queryKey: ['saved-movies'] })
    },
  })
}
