import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthStore } from './authStore'
import { supabase } from '../lib/supabase'

// Mock de supabase ya configurado en setup.js

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      session: null,
      loading: true,
    })
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have null user and session initially', () => {
      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.session).toBeNull()
    })

    it('should have loading true initially', () => {
      const state = useAuthStore.getState()
      expect(state.loading).toBe(true)
    })
  })

  describe('signIn', () => {
    it('should update user and session on successful sign in', async () => {
      const mockUser = { id: '123', email: 'test@test.com' }
      const mockSession = { access_token: 'token123', user: mockUser }

      supabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      await useAuthStore.getState().signIn('test@test.com', 'password123')

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state.session).toEqual(mockSession)
    })

    it('should throw error on failed sign in', async () => {
      const mockError = new Error('Invalid credentials')
      supabase.auth.signInWithPassword.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: mockError,
      })

      await expect(
        useAuthStore.getState().signIn('test@test.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials')
    })
  })

  describe('signUp', () => {
    it('should generate clean username from name', async () => {
      const mockUser = { id: '123', email: 'test@test.com' }
      supabase.auth.signUp.mockResolvedValueOnce({
        data: { user: mockUser, session: null },
        error: null,
      })

      await useAuthStore.getState().signUp('test@test.com', 'password123', {
        name: 'John  Doe',
      })

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
        options: {
          data: {
            name: 'John  Doe',
            username: 'john_doe',
          },
        },
      })
    })

    it('should handle names with multiple spaces', async () => {
      const mockUser = { id: '123', email: 'test@test.com' }
      supabase.auth.signUp.mockResolvedValueOnce({
        data: { user: mockUser, session: null },
        error: null,
      })

      await useAuthStore.getState().signUp('test@test.com', 'password123', {
        name: 'María   Elena   García',
      })

      expect(supabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: {
            data: expect.objectContaining({
              username: 'maría_elena_garcía',
            }),
          },
        })
      )
    })

    it('should throw error on failed sign up', async () => {
      const mockError = new Error('Email already exists')
      supabase.auth.signUp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: mockError,
      })

      await expect(
        useAuthStore.getState().signUp('test@test.com', 'password123', {})
      ).rejects.toThrow('Email already exists')
    })
  })

  describe('signOut', () => {
    it('should clear user and session on sign out', async () => {
      // Set initial authenticated state
      useAuthStore.setState({
        user: { id: '123' },
        session: { access_token: 'token' },
        loading: false,
      })

      supabase.auth.signOut.mockResolvedValueOnce({ error: null })

      await useAuthStore.getState().signOut()

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.session).toBeNull()
    })
  })

  describe('resetPassword', () => {
    it('should call supabase resetPasswordForEmail', async () => {
      supabase.auth.resetPasswordForEmail.mockResolvedValueOnce({ error: null })

      await useAuthStore.getState().resetPassword('test@test.com')

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('test@test.com')
    })
  })

  describe('updateProfile', () => {
    it('should update user metadata', async () => {
      const updatedUser = {
        id: '123',
        user_metadata: { full_name: 'Updated Name' },
      }

      supabase.auth.updateUser.mockResolvedValueOnce({
        data: { user: updatedUser },
        error: null,
      })

      await useAuthStore.getState().updateProfile({ full_name: 'Updated Name' })

      const state = useAuthStore.getState()
      expect(state.user).toEqual(updatedUser)
    })
  })
})
