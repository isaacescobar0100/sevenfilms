import { create } from 'zustand'
import { supabase } from '../lib/supabase'

// Helper para obtener el rol del usuario desde profiles
async function fetchUserRole(userId) {
  if (!userId) return null
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user role:', error)
      return 'user' // Default role
    }
    return data?.role || 'user'
  } catch {
    return 'user'
  }
}

export const useAuthStore = create((set) => ({
  user: null,
  session: null,
  role: null,
  loading: true,
  roleLoading: true,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const role = await fetchUserRole(session.user.id)
        set({
          session,
          user: session.user,
          role,
          loading: false,
          roleLoading: false
        })
      } else {
        set({
          session: null,
          user: null,
          role: null,
          loading: false,
          roleLoading: false
        })
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        // Solo recargar rol si es un nuevo login o cambio de usuario
        // Ignorar TOKEN_REFRESHED para evitar loading innecesario
        if (event === 'TOKEN_REFRESHED') {
          // Solo actualizar session sin mostrar loading
          if (session) {
            set({ session, user: session.user })
          }
          return
        }

        if (session?.user) {
          // Verificar si es el mismo usuario para evitar loading innecesario
          const currentState = useAuthStore.getState()
          if (currentState.user?.id === session.user.id && currentState.role) {
            // Mismo usuario, solo actualizar session
            set({ session, user: session.user })
            return
          }

          // Nuevo usuario o sin rol, cargar rol
          set({ roleLoading: true })
          const role = await fetchUserRole(session.user.id)
          set({
            session,
            user: session.user,
            role,
            roleLoading: false
          })
        } else {
          set({
            session: null,
            user: null,
            role: null,
            roleLoading: false
          })
        }
      })
    } catch (error) {
      console.error('Error initializing auth:', error)
      set({ loading: false, roleLoading: false })
    }
  },

  signIn: async (email, password) => {
    set({ roleLoading: true })
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      set({ roleLoading: false })
      throw error
    }

    // Cargar rol inmediatamente después del login
    const role = await fetchUserRole(data.user.id)
    set({ session: data.session, user: data.user, role, roleLoading: false })
    return { ...data, role }
  },

  signUp: async (email, password, metadata = {}) => {
    // Generate a clean username from the name (no spaces, lowercase)
    const cleanUsername = metadata.name
      ? metadata.name.trim().toLowerCase().replace(/\s+/g, '_').replace(/_+/g, '_')
      : null

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          ...metadata,
          username: cleanUsername,
        },
      },
    })
    if (error) throw error
    return data
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    set({ session: null, user: null, role: null })
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  },

  updateProfile: async (updates) => {
    const { data, error } = await supabase.auth.updateUser({
      data: updates,
    })
    if (error) throw error
    set({ user: data.user })
    return data
  },

  // Helper para verificar si es admin
  isAdmin: () => {
    const state = useAuthStore.getState()
    return state.role === 'admin'
  },
}))

// Initialize auth on app start
useAuthStore.getState().initialize()
