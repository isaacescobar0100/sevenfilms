import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { optimizeThumbnail } from './useImageOptimization'
import { CACHE_TIMES, INFINITE_QUERY_CONFIG } from '../lib/queryConfig'

const MOVIES_PAGE_SIZE = 12

// Obtener todas las películas (solo aprobadas para usuarios normales)
export function useMovies(filters = {}) {
  return useQuery({
    queryKey: ['movies', filters],
    queryFn: async () => {
      let query = supabase
        .from('movies')
        .select('*')

      // Filtrar solo películas aprobadas (a menos que se especifique showAll para admin)
      if (!filters.showAll) {
        query = query.eq('status', 'approved')
      }

      // Aplicar ordenamiento
      const sortBy = filters.sortBy || 'popular'
      switch (sortBy) {
        case 'rating':
          query = query.order('average_rating', { ascending: false, nullsLast: true })
          query = query.order('ratings_count', { ascending: false })
          break
        case 'views':
          query = query.order('views', { ascending: false })
          break
        case 'recent':
          query = query.order('created_at', { ascending: false })
          break
        case 'comments':
          query = query.order('comments_count', { ascending: false })
          break
        case 'popular':
        default:
          // Ordenar por combinación de vistas y ratings (engagement)
          query = query.order('views', { ascending: false })
          query = query.order('average_rating', { ascending: false, nullsLast: true })
          query = query.order('created_at', { ascending: false })
          break
      }

      // Aplicar filtros
      if (filters.genre) {
        query = query.eq('genre', filters.genre)
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      const { data: movies, error } = await query

      if (error) throw error
      if (!movies || movies.length === 0) return []

      // OPTIMIZADO: Obtener todos los perfiles en batch (1 query en lugar de N)
      const userIds = [...new Set(movies.map(m => m.user_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds)

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])

      // Combinar películas con perfiles
      return movies.map(movie => ({
        ...movie,
        profiles: profilesMap.get(movie.user_id) || {
          id: movie.user_id,
          username: 'Usuario',
          full_name: 'Usuario Sin Nombre',
          avatar_url: null,
        },
      }))
    },
    ...CACHE_TIMES.MOVIES,
  })
}

// Obtener una película específica
export function useMovie(movieId) {
  return useQuery({
    queryKey: ['movie', movieId],
    queryFn: async () => {
      const { data: movie, error } = await supabase
        .from('movies')
        .select('*')
        .eq('id', movieId)
        .single()

      if (error) throw error

      // Obtener perfil del usuario
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', movie.user_id)
        .maybeSingle()

      // Incrementar vistas
      await supabase
        .from('movies')
        .update({ views: movie.views + 1 })
        .eq('id', movieId)

      return {
        ...movie,
        profiles: profile || {
          id: movie.user_id,
          username: 'Usuario',
          full_name: 'Usuario Sin Nombre',
          avatar_url: null,
        },
      }
    },
    enabled: !!movieId,
    ...CACHE_TIMES.MOVIES,
  })
}

// Obtener películas con paginación infinita (para virtualización)
export function useInfiniteMovies(filters = {}) {
  return useInfiniteQuery({
    queryKey: ['movies-infinite', filters],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('movies')
        .select('*')

      // Filtrar solo películas aprobadas
      if (!filters.showAll) {
        query = query.eq('status', 'approved')
      }

      // Aplicar ordenamiento
      const sortBy = filters.sortBy || 'popular'
      switch (sortBy) {
        case 'rating':
          query = query.order('average_rating', { ascending: false, nullsLast: true })
          query = query.order('ratings_count', { ascending: false })
          break
        case 'views':
          query = query.order('views', { ascending: false })
          break
        case 'recent':
          query = query.order('created_at', { ascending: false })
          break
        case 'comments':
          query = query.order('comments_count', { ascending: false })
          break
        case 'popular':
        default:
          // Ordenar por combinación de vistas y ratings (engagement)
          query = query.order('views', { ascending: false })
          query = query.order('average_rating', { ascending: false, nullsLast: true })
          query = query.order('created_at', { ascending: false })
          break
      }

      // Aplicar filtros
      if (filters.genre) {
        query = query.eq('genre', filters.genre)
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      // Paginación
      query = query.range(pageParam, pageParam + MOVIES_PAGE_SIZE - 1)

      const { data: movies, error, count } = await query

      if (error) throw error
      if (!movies || movies.length === 0) {
        return { data: [], nextCursor: undefined }
      }

      // OPTIMIZADO: Obtener todos los perfiles en batch (1 query en lugar de N)
      const userIds = [...new Set(movies.map(m => m.user_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds)

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])

      // Combinar películas con perfiles
      const moviesWithProfiles = movies.map(movie => ({
        ...movie,
        profiles: profilesMap.get(movie.user_id) || {
          id: movie.user_id,
          username: 'Usuario',
          full_name: 'Usuario Sin Nombre',
          avatar_url: null,
        },
      }))

      return {
        data: moviesWithProfiles,
        nextCursor: movies.length === MOVIES_PAGE_SIZE ? pageParam + MOVIES_PAGE_SIZE : undefined,
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    ...INFINITE_QUERY_CONFIG,
  })
}

// Películas del usuario
export function useUserMovies(userId) {
  return useQuery({
    queryKey: ['movies', 'user', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movies')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!userId,
    ...CACHE_TIMES.MOVIES,
  })
}

// Subir película
export function useUploadMovie() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ title, description, genre, year, videoFile, videoQualities, thumbnailFile, subtitleFile, duration }) => {
      // Subir video original
      const videoExt = videoFile.name.split('.').pop()
      const videoFileName = `${user.id}/${Date.now()}.${videoExt}`

      const { error: videoError } = await supabase.storage
        .from('movies')
        .upload(videoFileName, videoFile)

      if (videoError) throw videoError

      const { data: videoUrlData } = supabase.storage
        .from('movies')
        .getPublicUrl(videoFileName)

      let thumbnailUrl = null
      let subtitleUrl = null
      let video1080pUrl = null
      let video720pUrl = null
      let video480pUrl = null
      let video360pUrl = null

      // Subir diferentes calidades si existen
      if (videoQualities) {
        const timestamp = Date.now()

        if (videoQualities['1080p']) {
          const fileName1080p = `${user.id}/${timestamp}_1080p.mp4`
          const { error } = await supabase.storage
            .from('movies')
            .upload(fileName1080p, videoQualities['1080p'])

          if (!error) {
            const { data } = supabase.storage.from('movies').getPublicUrl(fileName1080p)
            video1080pUrl = data.publicUrl
          }
        }

        if (videoQualities['720p']) {
          const fileName720p = `${user.id}/${timestamp}_720p.mp4`
          const { error } = await supabase.storage
            .from('movies')
            .upload(fileName720p, videoQualities['720p'])

          if (!error) {
            const { data } = supabase.storage.from('movies').getPublicUrl(fileName720p)
            video720pUrl = data.publicUrl
          }
        }

        if (videoQualities['480p']) {
          const fileName480p = `${user.id}/${timestamp}_480p.mp4`
          const { error } = await supabase.storage
            .from('movies')
            .upload(fileName480p, videoQualities['480p'])

          if (!error) {
            const { data } = supabase.storage.from('movies').getPublicUrl(fileName480p)
            video480pUrl = data.publicUrl
          }
        }

        if (videoQualities['360p']) {
          const fileName360p = `${user.id}/${timestamp}_360p.mp4`
          const { error } = await supabase.storage
            .from('movies')
            .upload(fileName360p, videoQualities['360p'])

          if (!error) {
            const { data } = supabase.storage.from('movies').getPublicUrl(fileName360p)
            video360pUrl = data.publicUrl
          }
        }
      }

      // Subir thumbnail si existe (con optimización automática)
      if (thumbnailFile) {
        // Optimizar thumbnail antes de subir
        let optimizedThumb = thumbnailFile
        if (thumbnailFile.type.startsWith('image/')) {
          try {
            const result = await optimizeThumbnail(thumbnailFile)
            optimizedThumb = result.file
          } catch (err) {
            console.warn('[Thumbnail] No se pudo optimizar, usando original:', err)
          }
        }

        const thumbExt = optimizedThumb.name.split('.').pop()
        const thumbFileName = `${user.id}/${Date.now()}_thumb.${thumbExt}`

        const { error: thumbError } = await supabase.storage
          .from('movies') // Usar el mismo bucket 'movies'
          .upload(thumbFileName, optimizedThumb)

        if (!thumbError) {
          const { data: thumbUrlData } = supabase.storage
            .from('movies')
            .getPublicUrl(thumbFileName)
          thumbnailUrl = thumbUrlData.publicUrl
        }
      }

      // Subir subtítulos si existen
      if (subtitleFile) {
        const subExt = subtitleFile.name.split('.').pop()
        const subFileName = `${user.id}/${Date.now()}_sub.${subExt}`

        const { error: subError } = await supabase.storage
          .from('movies') // Usar el mismo bucket 'movies'
          .upload(subFileName, subtitleFile)

        if (!subError) {
          const { data: subUrlData } = supabase.storage
            .from('movies')
            .getPublicUrl(subFileName)
          subtitleUrl = subUrlData.publicUrl
        }
      }

      // Crear registro en la base de datos (con status 'pending' para moderación)
      const { data, error } = await supabase
        .from('movies')
        .insert([
          {
            user_id: user.id,
            title,
            description,
            genre,
            year,
            video_url: videoUrlData.publicUrl,
            video_1080p_url: video1080pUrl,
            video_720p_url: video720pUrl,
            video_480p_url: video480pUrl,
            video_360p_url: video360pUrl,
            thumbnail_url: thumbnailUrl,
            subtitle_url: subtitleUrl,
            duration,
            status: 'pending', // Requiere aprobación de admin
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] })
    },
  })
}

// Actualizar película
export function useUpdateMovie() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, title, description, genre, year }) => {
      const { data, error } = await supabase
        .from('movies')
        .update({ title, description, genre, year })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['movies'] })
      queryClient.invalidateQueries({ queryKey: ['movie', data.id] })
    },
  })
}

// Actualizar status de película (aprobar/rechazar) - Solo admin
export function useUpdateMovieStatus() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ movieId, status, rejectionReason = null }) => {
      const updateData = {
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      }

      if (status === 'rejected' && rejectionReason) {
        updateData.rejection_reason = rejectionReason
      }

      const { data, error } = await supabase
        .from('movies')
        .update(updateData)
        .eq('id', movieId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] })
      queryClient.invalidateQueries({ queryKey: ['movies-infinite'] })
      queryClient.invalidateQueries({ queryKey: ['pending-movies'] })
    },
  })
}

// Obtener películas pendientes de aprobación (solo admin)
export function usePendingMovies() {
  return useQuery({
    queryKey: ['pending-movies'],
    queryFn: async () => {
      const { data: movies, error } = await supabase
        .from('movies')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true }) // Las más antiguas primero

      if (error) throw error
      if (!movies || movies.length === 0) return []

      // Obtener perfiles de usuarios
      const userIds = [...new Set(movies.map(m => m.user_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds)

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])

      return movies.map(movie => ({
        ...movie,
        profiles: profilesMap.get(movie.user_id) || {
          id: movie.user_id,
          username: 'Usuario',
          full_name: 'Usuario Sin Nombre',
          avatar_url: null,
        },
      }))
    },
    staleTime: 30 * 1000, // 30 segundos
  })
}

// Eliminar película
export function useDeleteMovie() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (id) => {
      // Primero obtener la información de la película para eliminar archivos
      const { data: movie } = await supabase
        .from('movies')
        .select('*')
        .eq('id', id)
        .single()

      // Eliminar el registro de la base de datos
      const { error } = await supabase
        .from('movies')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id) // Asegurar que solo el dueño pueda eliminar

      if (error) throw error

      // Opcionalmente, eliminar archivos de storage (opcional)
      // Esto puede fallar si los archivos no existen, pero no es crítico
      if (movie) {
        try {
          if (movie.video_url) {
            const videoPath = movie.video_url.split('/movies/')[1]
            if (videoPath) {
              await supabase.storage.from('movies').remove([videoPath])
            }
          }
          if (movie.thumbnail_url) {
            const thumbPath = movie.thumbnail_url.split('/movies/')[1]
            if (thumbPath) {
              await supabase.storage.from('movies').remove([thumbPath])
            }
          }
          if (movie.subtitle_url) {
            const subPath = movie.subtitle_url.split('/movies/')[1]
            if (subPath) {
              await supabase.storage.from('movies').remove([subPath])
            }
          }
        } catch (storageError) {
          console.warn('Error deleting storage files:', storageError)
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movies'] })
      queryClient.invalidateQueries({ queryKey: ['user-movies'] })
    },
  })
}
