import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

// Obtener historias de usuarios que sigo (últimas 24 horas)
export function useStories() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['stories'],
    queryFn: async () => {
      if (!user?.id) return []

      // Calcular hace 24 horas
      const twentyFourHoursAgo = new Date()
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

      // Obtener IDs de usuarios que sigo
      const { data: followsData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)

      const followingIds = followsData?.map(f => f.following_id) || []
      // Incluir mis propias historias
      followingIds.push(user.id)

      if (followingIds.length === 0) return []

      // Obtener historias de las últimas 24 horas
      const { data: stories, error } = await supabase
        .from('stories')
        .select('*')
        .in('user_id', followingIds)
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      // Obtener perfiles de usuarios
      const userIds = [...new Set(stories?.map(s => s.user_id) || [])]

      if (userIds.length === 0) return []

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds)

      // Obtener qué historias ya vi
      const { data: viewedData } = await supabase
        .from('story_views')
        .select('story_id')
        .eq('viewer_id', user.id)

      const viewedStoryIds = new Set(viewedData?.map(v => v.story_id) || [])

      // Agrupar historias por usuario
      const storiesByUser = {}
      stories?.forEach(story => {
        const profile = profiles?.find(p => p.id === story.user_id)
        if (!storiesByUser[story.user_id]) {
          storiesByUser[story.user_id] = {
            user_id: story.user_id,
            username: profile?.username || 'Usuario',
            full_name: profile?.full_name,
            avatar_url: profile?.avatar_url,
            stories: [],
            hasUnviewed: false,
            isOwn: story.user_id === user.id,
          }
        }
        const isViewed = viewedStoryIds.has(story.id)
        storiesByUser[story.user_id].stories.push({
          ...story,
          isViewed,
        })
        if (!isViewed) {
          storiesByUser[story.user_id].hasUnviewed = true
        }
      })

      // Convertir a array y ordenar (propias primero, luego no vistas, luego vistas)
      const result = Object.values(storiesByUser).sort((a, b) => {
        if (a.isOwn) return -1
        if (b.isOwn) return 1
        if (a.hasUnviewed && !b.hasUnviewed) return -1
        if (!a.hasUnviewed && b.hasUnviewed) return 1
        return 0
      })

      return result
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 60 * 1000, // Refrescar cada minuto
  })
}

// Obtener mis historias
export function useMyStories() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['stories', 'my'],
    queryFn: async () => {
      if (!user?.id) return []

      const twentyFourHoursAgo = new Date()
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', twentyFourHoursAgo.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!user?.id,
  })
}

// Obtener una historia específica por ID (para ver desde mensajes)
export function useStoryById(storyId, storyOwnerId) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['story', storyId],
    queryFn: async () => {
      if (!storyId || !storyOwnerId) return null

      // Obtener la historia
      const { data: story, error } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single()

      if (error || !story) return null

      // Obtener perfil del usuario
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', storyOwnerId)
        .single()

      // Formatear como storiesData para el StoryViewer
      return [{
        user_id: storyOwnerId,
        username: profile?.username || 'Usuario',
        full_name: profile?.full_name,
        avatar_url: profile?.avatar_url,
        stories: [{
          ...story,
          isViewed: true, // Ya la vimos si estamos en mensajes
        }],
        hasUnviewed: false,
        isOwn: storyOwnerId === user?.id,
      }]
    },
    enabled: !!storyId && !!storyOwnerId,
  })
}

// Obtener una historia por URL de media o texto (para mensajes antiguos sin storyId)
export function useStoryByMediaUrl(mediaUrl, textContent = null) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['story-by-url', mediaUrl, textContent],
    queryFn: async () => {
      if (!mediaUrl && !textContent) return null

      let story = null

      // Buscar por URL de media si existe
      if (mediaUrl) {
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .eq('media_url', mediaUrl)
          .single()

        if (!error && data) {
          story = data
        }
      }

      // Si no encontramos por URL, buscar por texto (usando ilike para búsqueda parcial)
      if (!story && textContent) {
        // Limpiar el texto de comillas y puntos suspensivos
        const cleanText = textContent.replace(/^"|"$/g, '').replace(/\.\.\.$/,'').trim()
        if (cleanText.length >= 1) {
          // Primero intentar búsqueda exacta
          const { data: exactData, error: exactError } = await supabase
            .from('stories')
            .select('*')
            .eq('text_content', cleanText)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (!exactError && exactData) {
            story = exactData
          } else {
            // Si no hay coincidencia exacta, buscar parcial
            const { data, error } = await supabase
              .from('stories')
              .select('*')
              .ilike('text_content', `${cleanText}%`)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()

            if (!error && data) {
              story = data
            }
          }
        }
      }

      if (!story) return null

      // Obtener perfil del usuario
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .eq('id', story.user_id)
        .single()

      // Formatear como storiesData para el StoryViewer
      return [{
        user_id: story.user_id,
        username: profile?.username || 'Usuario',
        full_name: profile?.full_name,
        avatar_url: profile?.avatar_url,
        stories: [{
          ...story,
          isViewed: true,
        }],
        hasUnviewed: false,
        isOwn: story.user_id === user?.id,
      }]
    },
    enabled: !!mediaUrl || !!textContent,
  })
}

// Crear historia
export function useCreateStory() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ mediaUrl, mediaType, text, backgroundColor }) => {
      const { data, error } = await supabase
        .from('stories')
        .insert({
          user_id: user?.id,
          media_url: mediaUrl || null,
          media_type: mediaType || 'text',
          text_content: text || null,
          background_color: backgroundColor || null,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] })
    },
  })
}

// Marcar historia como vista
export function useViewStory() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (storyId) => {
      // Verificar si ya la vi
      const { data: existing } = await supabase
        .from('story_views')
        .select('id')
        .eq('story_id', storyId)
        .eq('viewer_id', user?.id)
        .maybeSingle()

      if (existing) return existing

      const { data, error } = await supabase
        .from('story_views')
        .insert({
          story_id: storyId,
          viewer_id: user?.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] })
    },
  })
}

// Eliminar historia
export function useDeleteStory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (storyId) => {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stories'] })
    },
  })
}

// Obtener vistas de una historia (solo para el dueño)
export function useStoryViews(storyId) {
  return useQuery({
    queryKey: ['story-views', storyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('story_views')
        .select('viewer_id, viewed_at')
        .eq('story_id', storyId)

      if (error) throw error

      if (!data || data.length === 0) return []

      // Obtener perfiles
      const userIds = data.map(v => v.viewer_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', userIds)

      return data.map(view => ({
        ...view,
        user_id: view.viewer_id,
        profile: profiles?.find(p => p.id === view.viewer_id),
      }))
    },
    enabled: !!storyId,
  })
}

// Reaccionar a una historia
export function useStoryReaction() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ storyId, reaction }) => {
      // Verificar si ya reaccioné con esta reacción
      const { data: existing } = await supabase
        .from('story_reactions')
        .select('id, reaction')
        .eq('story_id', storyId)
        .eq('user_id', user?.id)
        .maybeSingle()

      // Si ya existe la misma reacción, eliminarla (toggle)
      if (existing?.reaction === reaction) {
        const { error } = await supabase
          .from('story_reactions')
          .delete()
          .eq('id', existing.id)
        if (error) throw error
        return { removed: true }
      }

      // Si existe otra reacción, actualizarla
      if (existing) {
        const { data, error } = await supabase
          .from('story_reactions')
          .update({ reaction })
          .eq('id', existing.id)
          .select()
          .single()
        if (error) throw error
        return data
      }

      // Si no existe, crear nueva
      const { data, error } = await supabase
        .from('story_reactions')
        .insert({
          story_id: storyId,
          user_id: user?.id,
          reaction,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['story-reactions', variables.storyId] })
    },
  })
}

// Obtener reacciones de una historia
export function useStoryReactions(storyId) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['story-reactions', storyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('story_reactions')
        .select('id, user_id, reaction, created_at')
        .eq('story_id', storyId)

      if (error) throw error

      // Obtener perfiles de usuarios que reaccionaron
      const userIds = [...new Set(data?.map(r => r.user_id) || [])]
      let profiles = []
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', userIds)
        profiles = profilesData || []
      }

      // Agregar perfil a cada reacción
      const reactionsWithProfiles = data?.map(r => ({
        ...r,
        profile: profiles.find(p => p.id === r.user_id),
      })) || []

      // Obtener mi reacción
      const myReaction = data?.find(r => r.user_id === user?.id)?.reaction || null

      // Contar reacciones por tipo
      const reactionCounts = {}
      data?.forEach(r => {
        reactionCounts[r.reaction] = (reactionCounts[r.reaction] || 0) + 1
      })

      return {
        reactions: reactionsWithProfiles,
        myReaction,
        counts: reactionCounts,
        total: data?.length || 0,
      }
    },
    enabled: !!storyId,
  })
}

// Responder a una historia (envía como mensaje directo)
export function useStoryReply() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ storyId, storyOwnerId, message }) => {
      // Obtener info de la historia para contexto
      const { data: story } = await supabase
        .from('stories')
        .select('media_url, text_content, media_type')
        .eq('id', storyId)
        .single()

      // Crear mensaje con referencia a la historia incluyendo media si existe
      // Formato: [STORY_REPLY:storyId:storyOwnerId:media_url:media_type]\nTexto de historia\n\nMensaje
      let replyContent = ''

      if (story?.media_url) {
        // Incluir la imagen/video de la historia como preview con IDs para navegación
        replyContent = `[STORY_REPLY:${storyId}:${storyOwnerId}:${story.media_url}:${story.media_type || 'image'}]\n`
        if (story?.text_content) {
          replyContent += `"${story.text_content.substring(0, 50)}${story.text_content.length > 50 ? '...' : ''}"\n\n`
        }
        replyContent += message
      } else if (story?.text_content) {
        // Historia de solo texto con IDs
        replyContent = `[STORY_REPLY_TEXT:${storyId}:${storyOwnerId}]\n"${story.text_content.substring(0, 100)}${story.text_content.length > 100 ? '...' : ''}"\n\n${message}`
      } else {
        replyContent = `📩 Respondió a tu historia\n\n${message}`
      }

      // Enviar mensaje directo al dueño de la historia
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user?.id,
          receiver_id: storyOwnerId,
          content: replyContent,
        })
        .select()
        .single()

      if (error) throw error
      return { message: data }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['messages'] })
    },
  })
}

// Subir media de historia
export async function uploadStoryMedia(file) {
  const { user } = useAuthStore.getState()
  if (!user) throw new Error('User not authenticated')

  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/${Date.now()}.${fileExt}`
  const isVideo = file.type.startsWith('video/')

  const { data, error } = await supabase.storage
    .from('stories')
    .upload(fileName, file)

  if (error) throw error

  const { data: urlData } = supabase.storage
    .from('stories')
    .getPublicUrl(fileName)

  return {
    url: urlData.publicUrl,
    type: isVideo ? 'video' : 'image',
  }
}
