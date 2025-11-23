import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

// Crear un post compartido
export function useSharePost() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ originalPostId, comment, shareToUserId }) => {
      // shareToUserId: null = compartir en tu propio perfil, uuid = compartir en perfil de amigo
      const { data, error } = await supabase
        .from('shared_posts')
        .insert({
          user_id: user?.id,
          original_post_id: originalPostId,
          comment: comment?.trim() || null,
          share_to_user_id: shareToUserId || null,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['shared-posts'] })
      queryClient.invalidateQueries({ queryKey: ['user-posts-with-shared'] })
    },
  })
}

// Obtener posts compartidos por un usuario (los que él compartió)
export function useSharedPostsByUser(userId) {
  return useQuery({
    queryKey: ['shared-posts', 'by-user', userId],
    queryFn: async () => {
      // Obtener los shared_posts
      const { data: sharedData, error: sharedError } = await supabase
        .from('shared_posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (sharedError) throw sharedError
      if (!sharedData || sharedData.length === 0) return []

      // Obtener los posts originales y perfiles
      const result = await Promise.all(
        sharedData.map(async (shared) => {
          // Obtener post original
          const { data: post } = await supabase
            .from('posts')
            .select('*')
            .eq('id', shared.original_post_id)
            .maybeSingle()

          if (!post) return null

          // Obtener perfil del autor del post original
          const { data: postAuthor } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', post.user_id)
            .maybeSingle()

          // Obtener perfil del que compartió
          const { data: sharer } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', shared.user_id)
            .maybeSingle()

          // Obtener likes y comments count
          const [likesResult, commentsResult] = await Promise.all([
            supabase.from('likes').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
            supabase.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
          ])

          return {
            ...shared,
            type: 'shared',
            original_post: {
              ...post,
              profiles: postAuthor,
              likes_count: likesResult.count || 0,
              comments_count: commentsResult.count || 0,
            },
            sharer,
          }
        })
      )

      return result.filter(Boolean)
    },
    enabled: !!userId,
  })
}

// Obtener posts compartidos hacia un usuario (en su biografía por otros)
export function useSharedPostsToUser(userId) {
  return useQuery({
    queryKey: ['shared-posts', 'to-user', userId],
    queryFn: async () => {
      const { data: sharedData, error: sharedError } = await supabase
        .from('shared_posts')
        .select('*')
        .eq('share_to_user_id', userId)
        .order('created_at', { ascending: false })

      if (sharedError) throw sharedError
      if (!sharedData || sharedData.length === 0) return []

      // Obtener los posts originales y perfiles
      const result = await Promise.all(
        sharedData.map(async (shared) => {
          const { data: post } = await supabase
            .from('posts')
            .select('*')
            .eq('id', shared.original_post_id)
            .maybeSingle()

          if (!post) return null

          const { data: postAuthor } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', post.user_id)
            .maybeSingle()

          const { data: sharer } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', shared.user_id)
            .maybeSingle()

          const [likesResult, commentsResult] = await Promise.all([
            supabase.from('likes').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
            supabase.from('comments').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
          ])

          return {
            ...shared,
            type: 'shared',
            original_post: {
              ...post,
              profiles: postAuthor,
              likes_count: likesResult.count || 0,
              comments_count: commentsResult.count || 0,
            },
            sharer,
          }
        })
      )

      return result.filter(Boolean)
    },
    enabled: !!userId,
  })
}

// Eliminar un post compartido
export function useDeleteSharedPost() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (sharedPostId) => {
      const { error } = await supabase
        .from('shared_posts')
        .delete()
        .eq('id', sharedPostId)
        .eq('user_id', user?.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['shared-posts'] })
      queryClient.invalidateQueries({ queryKey: ['user-posts-with-shared'] })
    },
  })
}
