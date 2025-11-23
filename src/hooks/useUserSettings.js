import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

// Valores por defecto para las configuraciones
const DEFAULT_SETTINGS = {
  // Notificaciones
  notify_likes: true,
  notify_comments: true,
  notify_followers: true,
  notify_messages: true,
  // Privacidad
  public_profile: true,
  show_activity: true,
}

// Obtener configuraciones del usuario
export function useUserSettings() {
  const { user } = useAuthStore()

  return useQuery({
    queryKey: ['user-settings', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle()

      if (error) {
        console.error('Error fetching user settings:', error)
        // Si hay error (tabla no existe), retornar defaults
        return DEFAULT_SETTINGS
      }

      // Si no hay datos, retornar defaults
      if (!data) {
        return DEFAULT_SETTINGS
      }

      return {
        notify_likes: data.notify_likes ?? DEFAULT_SETTINGS.notify_likes,
        notify_comments: data.notify_comments ?? DEFAULT_SETTINGS.notify_comments,
        notify_followers: data.notify_followers ?? DEFAULT_SETTINGS.notify_followers,
        notify_messages: data.notify_messages ?? DEFAULT_SETTINGS.notify_messages,
        public_profile: data.public_profile ?? DEFAULT_SETTINGS.public_profile,
        show_activity: data.show_activity ?? DEFAULT_SETTINGS.show_activity,
      }
    },
    enabled: !!user?.id,
  })
}

// Actualizar configuraciones del usuario
export function useUpdateUserSettings() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async (settings) => {
      // Usar upsert para crear o actualizar
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user?.id,
          ...settings,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings', user?.id] })
    },
  })
}

// Hook para actualizar una sola configuración
export function useToggleSetting() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ key, value }) => {
      // Primero verificar si existe el registro
      const { data: existing } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle()

      if (existing) {
        // Actualizar
        const { error } = await supabase
          .from('user_settings')
          .update({
            [key]: value,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user?.id)

        if (error) throw error
      } else {
        // Insertar nuevo con defaults + el cambio
        const { error } = await supabase
          .from('user_settings')
          .insert({
            user_id: user?.id,
            ...DEFAULT_SETTINGS,
            [key]: value,
          })

        if (error) throw error
      }
    },
    onMutate: async ({ key, value }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['user-settings', user?.id] })
      const previousSettings = queryClient.getQueryData(['user-settings', user?.id])

      queryClient.setQueryData(['user-settings', user?.id], (old) => ({
        ...old,
        [key]: value,
      }))

      return { previousSettings }
    },
    onError: (err, variables, context) => {
      // Rollback en caso de error
      queryClient.setQueryData(['user-settings', user?.id], context.previousSettings)
      console.error('Error updating setting:', err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user-settings', user?.id] })
    },
  })
}
