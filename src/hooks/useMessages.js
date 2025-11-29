import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { useRealtimeSubscription } from './useRealtimeSubscription'

// Obtener conversaciones del usuario
export function useConversations() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // Callback para manejar eventos de mensajes
  const handleMessageEvent = useCallback((payload) => {
    const message = payload.new || payload.old
    // Actualizar si el usuario está involucrado en el mensaje
    if (message && (message.sender_id === user?.id || message.receiver_id === user?.id)) {
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] })
      // Forzar refetch inmediato para eventos DELETE
      if (payload.eventType === 'DELETE') {
        queryClient.refetchQueries({ queryKey: ['conversations', user?.id] })
      }
    }
  }, [user?.id, queryClient])

  // Suscripción con cleanup robusto
  useRealtimeSubscription({
    channelName: `conversations-${user?.id}`,
    table: 'messages',
    event: '*',
    onEvent: handleMessageEvent,
    enabled: !!user,
  })

  return useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async () => {
      if (!user) return []

      // Las políticas RLS de Supabase automáticamente excluyen mensajes
      // donde el usuario actual está en el array deleted_by
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (!messages || messages.length === 0) return []

      // Identificar IDs únicos de otros usuarios
      const otherUserIds = [...new Set(messages.map(m =>
        m.sender_id === user.id ? m.receiver_id : m.sender_id
      ))]

      // OPTIMIZADO: Obtener todos los perfiles en batch (1 query en lugar de N)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', otherUserIds)

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])

      // Agrupar por conversación
      const conversations = new Map()

      for (const message of messages) {
        const otherUserId = message.sender_id === user.id
          ? message.receiver_id
          : message.sender_id

        if (!conversations.has(otherUserId)) {
          conversations.set(otherUserId, {
            ...message,
            otherUser: profilesMap.get(otherUserId) || {
              id: otherUserId,
              username: 'Usuario',
              full_name: 'Usuario Sin Nombre',
              avatar_url: null,
            },
            isUnread: !message.is_read && message.receiver_id === user.id,
          })
        }
      }

      return Array.from(conversations.values())
    },
    enabled: !!user,
  })
}

// Obtener mensajes de una conversación
export function useMessages(otherUserId) {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['messages', user?.id, otherUserId],
    queryFn: async () => {
      if (!user || !otherUserId) return []

      // Las políticas RLS de Supabase automáticamente excluyen mensajes
      // donde el usuario actual está en el array deleted_by
      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
        )
        .order('created_at', { ascending: true })

      if (error) throw error
      if (!messages || messages.length === 0) return []

      // OPTIMIZADO: Obtener perfiles de ambos usuarios en batch (1 query en lugar de N)
      const senderIds = [...new Set(messages.map(m => m.sender_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url')
        .in('id', senderIds)

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])

      // Combinar mensajes con perfiles
      return messages.map(message => ({
        ...message,
        sender: profilesMap.get(message.sender_id) || {
          id: message.sender_id,
          username: 'Usuario',
          full_name: 'Usuario Sin Nombre',
          avatar_url: null,
        },
      }))
    },
    enabled: !!user && !!otherUserId,
  })
}

// Enviar mensaje
export function useSendMessage() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ receiverId, content }) => {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: user?.id,
            receiver_id: receiverId,
            content,
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

// Marcar mensajes como leídos
export function useMarkAsRead() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (senderId) => {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', senderId)
        .eq('receiver_id', user?.id)
        .eq('is_read', false)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

// Eliminar conversación (todos los mensajes con un usuario)
// Soft delete: marca los mensajes como eliminados solo para el usuario actual
export function useDeleteConversation() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (otherUserId) => {
      console.log('[Delete Conversation] Iniciando eliminación suave con usuario:', otherUserId)

      // Usar la función de PostgreSQL para hacer soft delete
      // Esto evita problemas con las políticas RLS
      const { error } = await supabase.rpc('soft_delete_messages_for_user', {
        current_user_id: user?.id,
        other_user_id: otherUserId,
      })

      if (error) {
        console.error('[Delete Conversation] Error en soft delete:', error)
        throw error
      }

      console.log('[Delete Conversation] Conversación ocultada exitosamente para el usuario actual')
    },
    onSuccess: async (_, otherUserId) => {
      console.log('[Delete Conversation] Invalidando queries para usuario:', otherUserId)

      // Remover conversación específica del cache
      queryClient.setQueryData(['conversations', user?.id], (old) => {
        if (!old) return []
        console.log('[Delete Conversation] Filtrando conversación de cache, old:', old?.length)
        const filtered = old.filter(conv => conv.otherUser.id !== otherUserId)
        console.log('[Delete Conversation] Conversaciones restantes:', filtered?.length)
        return filtered
      })

      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['messages', user?.id, otherUserId] })
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['unread-messages-count'] })

      console.log('[Delete Conversation] Cache actualizado')
    },
  })
}

// Editar mensaje
export function useEditMessage() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ messageId, content }) => {
      const { error } = await supabase
        .from('messages')
        .update({
          content,
          edited_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('sender_id', user?.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

// Eliminar mensaje solo para mí
export function useDeleteMessageForMe() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (messageId) => {
      const { error } = await supabase.rpc('delete_message_for_me', {
        message_id: messageId,
        user_id: user?.id,
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

// Eliminar mensaje para todos
export function useDeleteMessageForEveryone() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (messageId) => {
      const { error } = await supabase.rpc('delete_message_for_everyone', {
        message_id: messageId,
        user_id: user?.id,
      })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
    },
  })
}

// Suscribirse a mensajes en tiempo real
export function useRealtimeMessages(otherUserId) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  // Callback para manejar nuevos mensajes
  const handleNewMessage = useCallback((payload) => {
    const message = payload.new
    // Solo actualizar si el mensaje es parte de esta conversación
    if (
      (message.sender_id === user?.id && message.receiver_id === otherUserId) ||
      (message.sender_id === otherUserId && message.receiver_id === user?.id)
    ) {
      queryClient.invalidateQueries({ queryKey: ['messages', user?.id, otherUserId] })
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] })
    }
  }, [user?.id, otherUserId, queryClient])

  // Suscripción con cleanup robusto
  useRealtimeSubscription({
    channelName: `messages-${user?.id}-${otherUserId}`,
    table: 'messages',
    event: 'INSERT',
    onEvent: handleNewMessage,
    enabled: !!user && !!otherUserId,
  })
}

// Obtener contador de mensajes no leídos
export function useUnreadMessagesCount() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // Callback para manejar cambios en mensajes
  const handleUnreadChange = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['unread-messages-count', user?.id] })
  }, [user?.id, queryClient])

  // Suscripción con cleanup robusto
  useRealtimeSubscription({
    channelName: `unread-messages-${user?.id}`,
    table: 'messages',
    event: '*',
    filter: user ? `receiver_id=eq.${user.id}` : undefined,
    onEvent: handleUnreadChange,
    enabled: !!user,
  })

  return useQuery({
    queryKey: ['unread-messages-count', user?.id],
    queryFn: async () => {
      if (!user) return 0

      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false)

      if (error) throw error
      return count || 0
    },
    enabled: !!user,
  })
}
