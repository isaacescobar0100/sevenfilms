import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useMovies, useMovie, useUserMovies, useUploadMovie, useUpdateMovie, useDeleteMovie } from './useMovies'

// Mock de supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => ({
          order: vi.fn(() => ({
            eq: vi.fn(() => ({
              or: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
            or: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'movie-1',
              title: 'Test Movie',
              user_id: 'user-1',
              views: 10,
            },
            error: null,
          })),
          maybeSingle: vi.fn(() => Promise.resolve({
            data: { id: 'user-1', username: 'testuser', full_name: 'Test User', avatar_url: null },
            error: null,
          })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'new-movie', title: 'New Movie' },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { id: 'movie-1', title: 'Updated Movie' },
              error: null,
            })),
          })),
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      })),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/video.mp4' } })),
        remove: vi.fn(() => Promise.resolve({ error: null })),
      })),
    },
  },
}))

// Mock de authStore
vi.mock('../store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    user: { id: 'user-1', email: 'test@test.com' },
  })),
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

describe('useMovies', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useMovies hook', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useMovies(), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
    })

    it('should accept filter options', () => {
      const filters = { genre: 'drama', sortBy: 'rating' }
      const { result } = renderHook(() => useMovies(filters), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
    })

    it('should handle different sort options', () => {
      const sortOptions = ['popular', 'rating', 'views', 'recent', 'comments']

      sortOptions.forEach((sortBy) => {
        const { result } = renderHook(() => useMovies({ sortBy }), {
          wrapper: createWrapper(),
        })
        expect(result.current.isLoading).toBe(true)
      })
    })
  })

  describe('useMovie hook', () => {
    it('should not fetch when movieId is null', () => {
      const { result } = renderHook(() => useMovie(null), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
    })

    it('should fetch when movieId is provided', () => {
      const { result } = renderHook(() => useMovie('movie-123'), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('useUserMovies hook', () => {
    it('should not fetch when userId is null', () => {
      const { result } = renderHook(() => useUserMovies(null), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
    })

    it('should fetch when userId is provided', () => {
      const { result } = renderHook(() => useUserMovies('user-123'), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('useUploadMovie hook', () => {
    it('should provide mutation function', () => {
      const { result } = renderHook(() => useUploadMovie(), {
        wrapper: createWrapper(),
      })

      expect(result.current.mutate).toBeDefined()
      expect(result.current.mutateAsync).toBeDefined()
      expect(result.current.isPending).toBe(false)
    })
  })

  describe('useUpdateMovie hook', () => {
    it('should provide mutation function', () => {
      const { result } = renderHook(() => useUpdateMovie(), {
        wrapper: createWrapper(),
      })

      expect(result.current.mutate).toBeDefined()
      expect(result.current.mutateAsync).toBeDefined()
      expect(result.current.isPending).toBe(false)
    })
  })

  describe('useDeleteMovie hook', () => {
    it('should provide mutation function', () => {
      const { result } = renderHook(() => useDeleteMovie(), {
        wrapper: createWrapper(),
      })

      expect(result.current.mutate).toBeDefined()
      expect(result.current.mutateAsync).toBeDefined()
      expect(result.current.isPending).toBe(false)
    })
  })
})

describe('useMovies filters', () => {
  it('should handle genre filter', () => {
    const { result } = renderHook(() => useMovies({ genre: 'comedy' }), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
  })

  it('should handle userId filter', () => {
    const { result } = renderHook(() => useMovies({ userId: 'user-1' }), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
  })

  it('should handle search filter', () => {
    const { result } = renderHook(() => useMovies({ search: 'test movie' }), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
  })

  it('should handle combined filters', () => {
    const { result } = renderHook(
      () =>
        useMovies({
          genre: 'drama',
          sortBy: 'rating',
          search: 'film',
        }),
      {
        wrapper: createWrapper(),
      }
    )

    expect(result.current.isLoading).toBe(true)
  })
})
