import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

/**
 * Buscar usuarios para menciones
 * Prioriza amigos (seguidores mutuos) y luego otros usuarios
 */
export function useSearchMentions(searchTerm) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['mention-search', searchTerm, user?.id],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 1) return []

      // Buscar usuarios que coincidan con el término
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
        .neq('id', user?.id) // Excluir al usuario actual
        .limit(10)

      if (error) throw error
      if (!users || users.length === 0) return []

      // Si hay usuario autenticado, ordenar por amigos primero
      if (user) {
        // Obtener usuarios que sigo
        const { data: following } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)

        const followingIds = new Set(following?.map(f => f.following_id) || [])

        // Ordenar: amigos primero
        return users.sort((a, b) => {
          const aIsFollowing = followingIds.has(a.id)
          const bIsFollowing = followingIds.has(b.id)
          if (aIsFollowing && !bIsFollowing) return -1
          if (!aIsFollowing && bIsFollowing) return 1
          return 0
        })
      }

      return users
    },
    enabled: !!searchTerm && searchTerm.length >= 1,
    staleTime: 30000, // 30 segundos
  })
}

/**
 * Obtener amigos (usuarios que sigo) para sugerencias rápidas
 */
export function useFriendsSuggestions() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['friends-suggestions', user?.id],
    queryFn: async () => {
      if (!user) return []

      const { data, error } = await supabase
        .from('follows')
        .select(`
          following:profiles!follows_following_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('follower_id', user.id)
        .limit(20)

      if (error) throw error
      return data?.map(d => d.following).filter(Boolean) || []
    },
    enabled: !!user,
    staleTime: 60000, // 1 minuto
  })
}

/**
 * Extraer menciones de un texto
 * @param {string} text - Texto con menciones (@usuario)
 * @returns {string[]} - Array de usernames mencionados
 */
export function extractMentions(text) {
  if (!text) return []
  const mentions = text.match(/@(\w+)/g)
  return mentions ? mentions.map(m => m.slice(1)) : []
}

/**
 * Crear notificaciones para usuarios mencionados
 */
export async function notifyMentionedUsers(mentionedUsernames, actorId, entityType, entityId, postId = null) {
  if (!mentionedUsernames || mentionedUsernames.length === 0) return

  // Obtener IDs de los usuarios mencionados
  const { data: users } = await supabase
    .from('profiles')
    .select('id, username')
    .in('username', mentionedUsernames)

  if (!users || users.length === 0) return

  // Crear notificaciones para cada usuario mencionado
  const notifications = users
    .filter(u => u.id !== actorId) // No notificar al autor
    .map(u => ({
      user_id: u.id,
      actor_id: actorId,
      type: 'mention',
      entity_type: entityType,
      entity_id: entityId,
      post_id: postId,
    }))

  if (notifications.length > 0) {
    await supabase.from('notifications').insert(notifications)
  }
}
