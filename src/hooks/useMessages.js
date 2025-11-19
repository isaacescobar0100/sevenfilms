import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

// Obtener conversaciones del usuario
export function useConversations() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!user) return

    console.log('[Conversations] Suscribiéndose a cambios en tiempo real...')

    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('[Conversations] Evento recibido:', payload.eventType, payload)
          const message = payload.new || payload.old
          // Actualizar si el usuario está involucrado en el mensaje
          if (message && (message.sender_id === user.id || message.receiver_id === user.id)) {
            console.log('[Conversations] Actualizando conversaciones...')
            queryClient.invalidateQueries({ queryKey: ['conversations', user.id] })
            // Forzar refetch inmediato para eventos DELETE
            if (payload.eventType === 'DELETE') {
              console.log('[Conversations] Evento DELETE detectado, forzando refetch...')
              queryClient.refetchQueries({ queryKey: ['conversations', user.id] })
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[Conversations] Estado de suscripción:', status)
      })

    return () => {
      console.log('[Conversations] Desuscribiéndose...')
      supabase.removeChannel(channel)
    }
  }, [user, queryClient])

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

      // Agrupar por conversación y obtener perfiles
      const conversations = new Map()

      for (const message of messages) {
        const otherUserId = message.sender_id === user.id
          ? message.receiver_id
          : message.sender_id

        if (!conversations.has(otherUserId)) {
          // Obtener perfil del otro usuario
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', otherUserId)
            .maybeSingle()

          conversations.set(otherUserId, {
            ...message,
            otherUser: profile || {
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

      // Obtener perfil del sender para cada mensaje
      const messagesWithProfiles = await Promise.all(
        messages.map(async (message) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', message.sender_id)
            .maybeSingle()

          return {
            ...message,
            sender: profile || {
              id: message.sender_id,
              username: 'Usuario',
              full_name: 'Usuario Sin Nombre',
              avatar_url: null,
            },
          }
        })
      )

      return messagesWithProfiles
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

  useEffect(() => {
    if (!user || !otherUserId) return

    console.log(`[Messages RT] Suscribiéndose a conversación con usuario ${otherUserId}`)

    const channel = supabase
      .channel(`messages-${user.id}-${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('[Messages RT] Nuevo mensaje recibido:', payload)
          const message = payload.new
          // Solo actualizar si el mensaje es parte de esta conversación
          if (
            (message.sender_id === user.id && message.receiver_id === otherUserId) ||
            (message.sender_id === otherUserId && message.receiver_id === user.id)
          ) {
            console.log('[Messages RT] Actualizando mensajes...')
            queryClient.invalidateQueries({ queryKey: ['messages', user.id, otherUserId] })
            queryClient.invalidateQueries({ queryKey: ['conversations', user.id] })
          }
        }
      )
      .subscribe((status) => {
        console.log('[Messages RT] Estado de suscripción:', status)
      })

    return () => {
      console.log('[Messages RT] Desuscribiéndose...')
      supabase.removeChannel(channel)
    }
  }, [user, otherUserId, queryClient])
}

// Obtener contador de mensajes no leídos
export function useUnreadMessagesCount() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    if (!user) return

    console.log('[Unread Count] Suscribiéndose a mensajes no leídos...')

    const channel = supabase
      .channel('unread-messages-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[Unread Count] Cambio detectado:', payload)
          queryClient.invalidateQueries({ queryKey: ['unread-messages-count', user.id] })
        }
      )
      .subscribe((status) => {
        console.log('[Unread Count] Estado de suscripción:', status)
      })

    return () => {
      console.log('[Unread Count] Desuscribiéndose...')
      supabase.removeChannel(channel)
    }
  }, [user, queryClient])

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
