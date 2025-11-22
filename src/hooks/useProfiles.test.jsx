import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useProfile,
  useProfileByUsername,
  useUserStats,
  useUpdateProfile,
  useSearchUsers,
  useSuggestedUsers,
} from './useProfiles'

// Mock de supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'user-1',
              username: 'testuser',
              full_name: 'Test User',
              avatar_url: null,
              bio: 'Test bio',
            },
            error: null,
          })),
        })),
        or: vi.fn(() => ({
          not: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        ilike: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { id: 'user-1', username: 'testuser', full_name: 'Updated User' },
              error: null,
            })),
          })),
        })),
      })),
    })),
    rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/avatar.jpg' } })),
      })),
    },
  },
}))

// Mock de authStore
vi.mock('../store/authStore', () => ({
  useAuthStore: Object.assign(
    vi.fn(() => ({
      user: { id: 'user-1', email: 'test@test.com' },
    })),
    {
      getState: vi.fn(() => ({
        user: { id: 'user-1', email: 'test@test.com' },
      })),
    }
  ),
}))

// Wrapper para React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useProfiles hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useProfile', () => {
    it('should not fetch when userId is null', () => {
      const { result } = renderHook(() => useProfile(null), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
    })

    it('should fetch when userId is provided', () => {
      const { result } = renderHook(() => useProfile('user-123'), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('useProfileByUsername', () => {
    it('should not fetch when username is null', () => {
      const { result } = renderHook(() => useProfileByUsername(null), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
    })

    it('should fetch when username is provided', () => {
      const { result } = renderHook(() => useProfileByUsername('testuser'), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('useUserStats', () => {
    it('should not fetch when userId is null', () => {
      const { result } = renderHook(() => useUserStats(null), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
    })

    it('should fetch when userId is provided', () => {
      const { result } = renderHook(() => useUserStats('user-123'), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('useUpdateProfile', () => {
    it('should provide mutation function', () => {
      const { result } = renderHook(() => useUpdateProfile(), {
        wrapper: createWrapper(),
      })

      expect(result.current.mutate).toBeDefined()
      expect(result.current.mutateAsync).toBeDefined()
      expect(result.current.isPending).toBe(false)
    })

    it('should have correct initial state', () => {
      const { result } = renderHook(() => useUpdateProfile(), {
        wrapper: createWrapper(),
      })

      expect(result.current.isPending).toBe(false)
      expect(result.current.isError).toBe(false)
      expect(result.current.isSuccess).toBe(false)
    })
  })

  describe('useSearchUsers', () => {
    it('should not fetch when query is empty', () => {
      const { result } = renderHook(() => useSearchUsers(''), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(false)
    })

    it('should not fetch when query is less than 2 characters', () => {
      const { result } = renderHook(() => useSearchUsers('a'), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(false)
    })

    it('should fetch when query has 2+ characters', () => {
      const { result } = renderHook(() => useSearchUsers('test'), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
    })

    it('should handle whitespace-only queries', () => {
      const { result } = renderHook(() => useSearchUsers('   '), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('useSuggestedUsers', () => {
    it('should fetch when user is authenticated', () => {
      const { result } = renderHook(() => useSuggestedUsers(), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
    })
  })
})

describe('Profile queries state', () => {
  it('useProfile should handle different user IDs', () => {
    const userIds = ['user-1', 'user-2', 'user-3']

    userIds.forEach((userId) => {
      const { result } = renderHook(() => useProfile(userId), {
        wrapper: createWrapper(),
      })
      expect(result.current.isLoading).toBe(true)
    })
  })

  it('useProfileByUsername should handle different usernames', () => {
    const usernames = ['john', 'jane', 'filmmaker123']

    usernames.forEach((username) => {
      const { result } = renderHook(() => useProfileByUsername(username), {
        wrapper: createWrapper(),
      })
      expect(result.current.isLoading).toBe(true)
    })
  })
})
