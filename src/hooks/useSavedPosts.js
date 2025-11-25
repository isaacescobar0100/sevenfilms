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

      // Obtener los posts uno por uno
      const postsPromises = postIds.map(async (postId) => {
        const { data: post, error: postError } = await supabase
          .from('posts')
          .select('*')
          .eq('id', postId)
          .maybeSingle()

        if (postError || !post) {
          console.error('Error fetching post:', postId, postError)
          return null
        }

        // Obtener el perfil del usuario del post
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .eq('id', post.user_id)
          .maybeSingle()

        return {
          ...post,
          username: profile?.username,
          full_name: profile?.full_name,
          avatar_url: profile?.avatar_url,
        }
      })

      const postsData = (await Promise.all(postsPromises)).filter(Boolean)

      // Combinar los datos y transformar
      return savedData.map(saved => {
        const post = postsData?.find(p => p.id === saved.post_id)
        if (!post) return null
        return {
          ...post,
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

      // Obtener las películas una por una
      const moviesPromises = movieIds.map(async (movieId) => {
        const { data: movie, error: movieError } = await supabase
          .from('movies')
          .select('*')
          .eq('id', movieId)
          .maybeSingle()

        if (movieError || !movie) {
          console.error('Error fetching movie:', movieId, movieError)
          return null
        }

        // Obtener el perfil del usuario de la película
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .eq('id', movie.user_id)
          .maybeSingle()

        return {
          ...movie,
          profiles: profile,
        }
      })

      const moviesData = (await Promise.all(moviesPromises)).filter(Boolean)

      return savedData.map(saved => {
        const movie = moviesData?.find(m => m.id === saved.movie_id)
        if (!movie) return null
        return {
          ...movie,
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
