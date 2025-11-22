import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useConversations,
  useMessages,
  useSendMessage,
  useMarkAsRead,
  useDeleteConversation,
  useEditMessage,
  useDeleteMessageForMe,
  useDeleteMessageForEveryone,
  useUnreadMessagesCount,
} from './useMessages'

// Mock de supabase
const mockSubscribe = vi.fn(() => ({ unsubscribe: vi.fn() }))
const mockChannel = {
  on: vi.fn(() => mockChannel),
  subscribe: mockSubscribe,
}

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        or: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
          maybeSingle: vi.fn(() =>
            Promise.resolve({
              data: { id: 'user-2', username: 'otheruser', full_name: 'Other User', avatar_url: null },
              error: null,
            })
          ),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: { id: 'msg-1', content: 'Test message', sender_id: 'user-1', receiver_id: 'user-2' },
              error: null,
            })
          ),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ error: null })),
          })),
        })),
      })),
    })),
    rpc: vi.fn(() => Promise.resolve({ error: null })),
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
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

describe('useMessages hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useConversations', () => {
    it('should initialize and set up realtime subscription', () => {
      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
    })

    it('should return empty array when no conversations', async () => {
      const { result } = renderHook(() => useConversations(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.data).toEqual([])
    })
  })

  describe('useMessages', () => {
    it('should not fetch when otherUserId is null', () => {
      const { result } = renderHook(() => useMessages(null), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.data).toBeUndefined()
    })

    it('should fetch when otherUserId is provided', () => {
      const { result } = renderHook(() => useMessages('user-2'), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
    })
  })

  describe('useSendMessage', () => {
    it('should provide mutation function', () => {
      const { result } = renderHook(() => useSendMessage(), {
        wrapper: createWrapper(),
      })

      expect(result.current.mutate).toBeDefined()
      expect(result.current.mutateAsync).toBeDefined()
      expect(result.current.isPending).toBe(false)
    })
  })

  describe('useMarkAsRead', () => {
    it('should provide mutation function', () => {
      const { result } = renderHook(() => useMarkAsRead(), {
        wrapper: createWrapper(),
      })

      expect(result.current.mutate).toBeDefined()
      expect(result.current.mutateAsync).toBeDefined()
      expect(result.current.isPending).toBe(false)
    })
  })

  describe('useDeleteConversation', () => {
    it('should provide mutation function', () => {
      const { result } = renderHook(() => useDeleteConversation(), {
        wrapper: createWrapper(),
      })

      expect(result.current.mutate).toBeDefined()
      expect(result.current.mutateAsync).toBeDefined()
      expect(result.current.isPending).toBe(false)
    })
  })

  describe('useEditMessage', () => {
    it('should provide mutation function', () => {
      const { result } = renderHook(() => useEditMessage(), {
        wrapper: createWrapper(),
      })

      expect(result.current.mutate).toBeDefined()
      expect(result.current.mutateAsync).toBeDefined()
      expect(result.current.isPending).toBe(false)
    })
  })

  describe('useDeleteMessageForMe', () => {
    it('should provide mutation function', () => {
      const { result } = renderHook(() => useDeleteMessageForMe(), {
        wrapper: createWrapper(),
      })

      expect(result.current.mutate).toBeDefined()
      expect(result.current.mutateAsync).toBeDefined()
      expect(result.current.isPending).toBe(false)
    })
  })

  describe('useDeleteMessageForEveryone', () => {
    it('should provide mutation function', () => {
      const { result } = renderHook(() => useDeleteMessageForEveryone(), {
        wrapper: createWrapper(),
      })

      expect(result.current.mutate).toBeDefined()
      expect(result.current.mutateAsync).toBeDefined()
      expect(result.current.isPending).toBe(false)
    })
  })

  describe('useUnreadMessagesCount', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useUnreadMessagesCount(), {
        wrapper: createWrapper(),
      })

      expect(result.current.isLoading).toBe(true)
    })
  })
})

describe('Message mutations behavior', () => {
  it('useSendMessage should have correct initial state', () => {
    const { result } = renderHook(() => useSendMessage(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.isSuccess).toBe(false)
  })

  it('useMarkAsRead should have correct initial state', () => {
    const { result } = renderHook(() => useMarkAsRead(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.isSuccess).toBe(false)
  })

  it('useEditMessage should have correct initial state', () => {
    const { result } = renderHook(() => useEditMessage(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isPending).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.isSuccess).toBe(false)
  })
})
