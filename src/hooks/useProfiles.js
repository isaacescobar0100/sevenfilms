import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { optimizeAvatar, optimizeCover } from './useImageOptimization'
import { CACHE_TIMES } from '../lib/queryConfig'

// Obtener perfil de un usuario
export function useProfile(userId) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!userId,
    ...CACHE_TIMES.PROFILE,
  })
}

// Obtener perfil por username
export function useProfileByUsername(username) {
  return useQuery({
    queryKey: ['profile', 'username', username],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!username,
    ...CACHE_TIMES.PROFILE,
  })
}

// Obtener estadísticas de usuario
export function useUserStats(userId) {
  return useQuery({
    queryKey: ['user-stats', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!userId,
    ...CACHE_TIMES.SOCIAL,
  })
}

// Actualizar perfil
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (updates) => {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user?.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['profile', data.id] })
    },
  })
}

// Subir avatar (con optimización automática)
export async function uploadAvatar(file) {
  const { user } = useAuthStore.getState()
  if (!user) throw new Error('User not authenticated')

  // Optimizar imagen antes de subir
  let optimizedFile = file
  if (file.type.startsWith('image/')) {
    try {
      const result = await optimizeAvatar(file)
      optimizedFile = result.file
      console.log(`[Avatar] Optimizado: ${result.savings.toFixed(1)}% de ahorro`)
    } catch (err) {
      console.warn('[Avatar] No se pudo optimizar, usando original:', err)
    }
  }

  const fileExt = optimizedFile.name.split('.').pop()
  const fileName = `${user.id}/avatar.${fileExt}`

  const { error } = await supabase.storage
    .from('avatars')
    .upload(fileName, optimizedFile, { upsert: true })

  if (error) throw error

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName)

  // Actualizar perfil con la nueva URL
  await supabase
    .from('profiles')
    .update({ avatar_url: data.publicUrl })
    .eq('id', user.id)

  return data.publicUrl
}

// Subir foto de portada (con optimización automática)
export async function uploadCover(file) {
  const { user } = useAuthStore.getState()
  if (!user) throw new Error('User not authenticated')

  // Optimizar imagen antes de subir
  let optimizedFile = file
  if (file.type.startsWith('image/')) {
    try {
      const result = await optimizeCover(file)
      optimizedFile = result.file
      console.log(`[Cover] Optimizado: ${result.savings.toFixed(1)}% de ahorro`)
    } catch (err) {
      console.warn('[Cover] No se pudo optimizar, usando original:', err)
    }
  }

  const fileExt = optimizedFile.name.split('.').pop()
  const fileName = `${user.id}/cover.${fileExt}`

  const { error } = await supabase.storage
    .from('covers')
    .upload(fileName, optimizedFile, { upsert: true })

  if (error) throw error

  const { data } = supabase.storage
    .from('covers')
    .getPublicUrl(fileName)

  // Actualizar perfil con la nueva URL
  await supabase
    .from('profiles')
    .update({ cover_url: data.publicUrl })
    .eq('id', user.id)

  return data.publicUrl
}

// Buscar usuarios (solo confirmados)
export function useSearchUsers(query) {
  return useQuery({
    queryKey: ['search', 'users', query],
    queryFn: async () => {
      if (!query || query.trim().length < 2) return []

      // Usar función RPC para buscar solo usuarios confirmados
      const { data, error } = await supabase
        .rpc('search_confirmed_users', {
          search_query: query,
          result_limit: 20
        })

      if (error) {
        console.error('Error searching confirmed users:', error)
        throw error
      }

      return data || []
    },
    enabled: Boolean(query && query.trim().length >= 2),
    ...CACHE_TIMES.SEARCH,
  })
}

// Sugerencias de usuarios para seguir (solo confirmados)
export function useSuggestedUsers() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['suggested-users', user?.id],
    queryFn: async () => {
      if (!user) return []

      // Usar función RPC para obtener sugerencias de usuarios confirmados
      const { data, error } = await supabase
        .rpc('get_suggested_confirmed_users', {
          current_user_id: user.id,
          result_limit: 5
        })

      if (error) {
        console.error('Error fetching suggested users:', error)
        throw error
      }

      return data || []
    },
    enabled: !!user,
    ...CACHE_TIMES.COMPUTED,
  })
}
