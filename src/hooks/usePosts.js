import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

// Obtener feed de posts (todos los posts o solo de seguidos)
export function useFeed(filter = 'all') {
  const { user } = useAuthStore()

  return useInfiniteQuery({
    queryKey: ['posts', 'feed', filter],
    queryFn: async ({ pageParam = 0 }) => {
      const limit = 10
      const start = pageParam * limit
      const end = start + limit - 1

      // Si el filtro es 'following', obtener solo posts de usuarios seguidos
      let userIds = []
      if (filter === 'following' && user) {
        const { data: following } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)

        userIds = following?.map(f => f.following_id) || []
        if (userIds.length === 0) {
          return { data: [], hasMore: false }
        }
      }

      let query = supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(start, end)

      if (filter === 'following' && userIds.length > 0) {
        query = query.in('user_id', userIds)
      }

      const { data: posts, error } = await query

      if (error) throw error

      // Obtener datos de perfil, likes y comentarios para cada post
      const postsWithDetails = await Promise.all(
        posts.map(async (post) => {
          const [profileResult, likesResult, commentsResult] = await Promise.all([
            supabase.from('profiles').select('id, username, full_name, avatar_url').eq('id', post.user_id).maybeSingle(),
            supabase.from('likes').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
            supabase.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
          ])

          console.log('Post:', post.id, 'User ID:', post.user_id, 'Profile:', profileResult.data)

          return {
            ...post,
            username: profileResult.data?.username || 'Usuario',
            full_name: profileResult.data?.full_name || 'Usuario Sin Nombre',
            avatar_url: profileResult.data?.avatar_url || null,
            likes_count: likesResult.count || 0,
            comments_count: commentsResult.count || 0,
          }
        })
      )

      return {
        data: postsWithDetails,
        hasMore: posts.length === limit,
      }
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length : undefined
    },
    enabled: !!user,
  })
}

// Obtener posts de un usuario específico
export function useUserPosts(userId) {
  return useQuery({
    queryKey: ['posts', 'user', userId],
    queryFn: async () => {
      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Obtener datos de perfil, likes y comentarios para cada post
      const postsWithDetails = await Promise.all(
        posts.map(async (post) => {
          const [profileResult, likesResult, commentsResult] = await Promise.all([
            supabase.from('profiles').select('id, username, full_name, avatar_url').eq('id', post.user_id).maybeSingle(),
            supabase.from('likes').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
            supabase.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
          ])

          return {
            ...post,
            username: profileResult.data?.username || 'Usuario',
            full_name: profileResult.data?.full_name || 'Usuario Sin Nombre',
            avatar_url: profileResult.data?.avatar_url || null,
            likes_count: likesResult.count || 0,
            comments_count: commentsResult.count || 0,
          }
        })
      )

      return postsWithDetails
    },
    enabled: !!userId,
  })
}

// Obtener un post específico
export function usePost(postId) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts_with_details')
        .select('*')
        .eq('id', postId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!postId,
  })
}

// Crear post
export function useCreatePost() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ content, mediaType, mediaUrl }) => {
      const { data, error } = await supabase
        .from('posts')
        .insert([
          {
            user_id: user?.id,
            content,
            media_type: mediaType || 'none',
            media_url: mediaUrl || null,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

// Actualizar post
export function useUpdatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, content }) => {
      const { data, error } = await supabase
        .from('posts')
        .update({ content })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['post', data.id] })
    },
  })
}

// Eliminar post
export function useDeletePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('posts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

// Obtener tendencias (hashtags más usados)
export function useTrending() {
  return useQuery({
    queryKey: ['trending'],
    queryFn: async () => {
      // Obtener todos los posts recientes (últimos 7 días)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: posts, error } = await supabase
        .from('posts')
        .select('content')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      // Extraer hashtags de todos los posts
      const hashtagCounts = {}
      const hashtagRegex = /#[\w\u00C0-\u017F]+/g

      posts.forEach((post) => {
        const hashtags = post.content?.match(hashtagRegex) || []
        hashtags.forEach((tag) => {
          const normalizedTag = tag.toLowerCase()
          hashtagCounts[normalizedTag] = (hashtagCounts[normalizedTag] || 0) + 1
        })
      })

      // Convertir a array y ordenar por cantidad
      const trending = Object.entries(hashtagCounts)
        .map(([tag, count]) => ({
          hashtag: tag,
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5) // Top 5 hashtags

      return trending
    },
    refetchInterval: 60000, // Actualizar cada minuto
  })
}

// Buscar posts
export function useSearchPosts(query) {
  return useQuery({
    queryKey: ['posts', 'search', query],
    queryFn: async () => {
      if (!query || query.length < 2) return []

      const { data: posts, error } = await supabase
        .from('posts')
        .select('*')
        .or(`content.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      // Obtener datos de perfil, likes y comentarios para cada post
      const postsWithDetails = await Promise.all(
        posts.map(async (post) => {
          const [profileResult, likesResult, commentsResult] = await Promise.all([
            supabase.from('profiles').select('id, username, full_name, avatar_url').eq('id', post.user_id).maybeSingle(),
            supabase.from('likes').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
            supabase.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
          ])

          return {
            ...post,
            username: profileResult.data?.username || 'Usuario',
            full_name: profileResult.data?.full_name || 'Usuario Sin Nombre',
            avatar_url: profileResult.data?.avatar_url || null,
            likes_count: likesResult.count || 0,
            comments_count: commentsResult.count || 0,
          }
        })
      )

      return postsWithDetails
    },
    enabled: !!query && query.length >= 2,
  })
}

// Subir imagen/video
export async function uploadMedia(file, type = 'image') {
  const { user } = useAuthStore.getState()
  if (!user) throw new Error('User not authenticated')

  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/${Date.now()}.${fileExt}`
  const bucket = type === 'image' ? 'post-images' : 'post-videos'

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file)

  if (error) throw error

  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName)

  return urlData.publicUrl
}
