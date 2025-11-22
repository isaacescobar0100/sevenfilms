import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useFeed,
  useUserPosts,
  usePost,
  useCreatePost,
  useUpdatePost,
  useDeletePost,
  useTrending,
  useSearchPosts,
} from './usePosts'

// Mock de supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          range: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          single: vi.fn(() => Promise.resolve({
            data: { id: 'post-1', content: 'Test post', user_id: 'user-1' },
            error: null,
          })),
          maybeSingle: vi.fn(() => Promise.resolve({
            data: { id: 'user-1', username: 'testuser', full_name: 'Test User', avatar_url: null },
            error: null,
          })),
        })),
        or: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
        gte: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'new-post', content: 'New post' },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { id: 'post-1', content: 'Updated post' },
              error: null,
            })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/image.jpg' } })),
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

describe('usePosts hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useFeed', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useFeed(), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
    })

    it('should accept filter parameter', () => {
      const { result } = renderHook(() => useFeed('following'), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
    })

    it('should have pagination functions', () => {
      const { result } = renderHook(() => useFeed('all'), {
        wrapper: createWrapper(),
      })

      expect(result.current.fetchNextPage).toBeDefined()
      expect(result.current.hasNextPage).toBeDefined()
    })
  })

  describe('useUserPosts', () => {
    it('should not fetch when userId is null', () => {
      const { result } = renderHook(() => useUserPosts(null), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
    })

    it('should fetch when userId is provided', () => {
      const { result } = renderHook(() => useUserPosts('user-123'), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('usePost', () => {
    it('should not fetch when postId is null', () => {
      const { result } = renderHook(() => usePost(null), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
    })

    it('should fetch when postId is provided', () => {
      const { result } = renderHook(() => usePost('post-123'), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('useCreatePost', () => {
    it('should provide mutation function', () => {
      const { result } = renderHook(() => useCreatePost(), {
        wrapper: createWrapper(),
      })

      expect(result.current.mutate).toBeDefined()
      expect(result.current.mutateAsync).toBeDefined()
      expect(result.current.isPending).toBe(false)
    })

    it('should have correct initial state', () => {
      const { result } = renderHook(() => useCreatePost(), {
        wrapper: createWrapper(),
      })

      expect(result.current.isPending).toBe(false)
      expect(result.current.isError).toBe(false)
      expect(result.current.isSuccess).toBe(false)
    })
  })

  describe('useUpdatePost', () => {
    it('should provide mutation function', () => {
      const { result } = renderHook(() => useUpdatePost(), {
        wrapper: createWrapper(),
      })

      expect(result.current.mutate).toBeDefined()
      expect(result.current.mutateAsync).toBeDefined()
      expect(result.current.isPending).toBe(false)
    })
  })

  describe('useDeletePost', () => {
    it('should provide mutation function', () => {
      const { result } = renderHook(() => useDeletePost(), {
        wrapper: createWrapper(),
      })

      expect(result.current.mutate).toBeDefined()
      expect(result.current.mutateAsync).toBeDefined()
      expect(result.current.isPending).toBe(false)
    })
  })

  describe('useTrending', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useTrending(), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('useSearchPosts', () => {
    it('should not fetch when query is empty', () => {
      const { result } = renderHook(() => useSearchPosts(''), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
    })

    it('should not fetch when query is less than 2 characters', () => {
      const { result } = renderHook(() => useSearchPosts('a'), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
    })

    it('should fetch when query has 2+ characters', () => {
      const { result } = renderHook(() => useSearchPosts('test'), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
    })
  })
})

describe('Feed filters', () => {
  it('should handle "all" filter', () => {
    const { result } = renderHook(() => useFeed('all'), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
  })

  it('should handle "following" filter', () => {
    const { result } = renderHook(() => useFeed('following'), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
  })
})
