import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRateLimit, formatResetTime } from './useRateLimit'

describe('useRateLimit', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('with valid action type', () => {
    it('should allow action when not rate limited', () => {
      const { result } = renderHook(() => useRateLimit('likeActions'))

      expect(result.current.canPerformAction).toBe(true)
      expect(result.current.isLimited).toBe(false)
      expect(result.current.remaining).toBe(30) // likeActions limit
    })

    it('should track actions correctly', () => {
      const { result } = renderHook(() => useRateLimit('likeActions'))

      act(() => {
        result.current.performAction()
      })

      expect(result.current.remaining).toBe(29)
    })

    it('should rate limit after max attempts', () => {
      // Use profileUpdates which has limit of 5
      const { result } = renderHook(() => useRateLimit('profileUpdates'))

      // Perform all 5 actions one by one to ensure state updates properly
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.performAction()
        })
      }

      expect(result.current.remaining).toBe(0)
      expect(result.current.canPerformAction).toBe(false)
    })

    it('should return false when trying to exceed limit after reaching it', () => {
      const { result } = renderHook(() => useRateLimit('profileUpdates')) // limit: 5

      // Perform actions up to limit
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.performAction()
        })
      }

      // Try one more - should return false
      let actionResult
      act(() => {
        actionResult = result.current.performAction()
      })

      expect(actionResult).toBe(false)
    })

    it('should allow manual reset via resetCounter', () => {
      const { result } = renderHook(() => useRateLimit('profileUpdates'))

      // Use all attempts
      for (let i = 0; i < 5; i++) {
        act(() => {
          result.current.performAction()
        })
      }

      expect(result.current.remaining).toBe(0)

      // Reset
      act(() => {
        result.current.resetCounter()
      })

      expect(result.current.isLimited).toBe(false)
      expect(result.current.canPerformAction).toBe(true)
      expect(result.current.remaining).toBe(5)
    })

    it('should provide limit info', () => {
      const { result } = renderHook(() => useRateLimit('movieUpload'))

      expect(result.current.limit).toBe(10)
    })

    it('should persist state in localStorage', () => {
      const { result } = renderHook(() => useRateLimit('likeActions'))

      // Perform actions separately to ensure state updates
      act(() => {
        result.current.performAction()
      })
      act(() => {
        result.current.performAction()
      })

      // Check localStorage was updated
      const stored = localStorage.getItem('rateLimit_likeActions')
      expect(stored).toBeTruthy()
      const history = JSON.parse(stored)
      expect(history.length).toBe(2)
    })
  })

  describe('with invalid action type', () => {
    it('should return unlimited state for unknown action types', () => {
      const { result } = renderHook(() => useRateLimit('unknownAction'))

      expect(result.current.canPerformAction).toBe(true)
      expect(result.current.remaining).toBe(Infinity)
      expect(result.current.isLimited).toBe(false)
    })

    it('should allow unlimited actions for unknown types', () => {
      const { result } = renderHook(() => useRateLimit('unknownAction'))

      let actionResult
      act(() => {
        actionResult = result.current.performAction()
      })

      expect(actionResult).toBe(true)
    })
  })
})

describe('formatResetTime', () => {
  it('should return null for null input', () => {
    expect(formatResetTime(null)).toBeNull()
  })

  it('should return "Disponible ahora" for past times', () => {
    const pastTime = new Date(Date.now() - 1000)
    expect(formatResetTime(pastTime)).toBe('Disponible ahora')
  })

  it('should format minutes correctly', () => {
    const futureTime = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes from now
    const result = formatResetTime(futureTime)
    expect(result).toMatch(/\d+m/)
  })

  it('should format hours and minutes correctly', () => {
    const futureTime = new Date(Date.now() + 2 * 60 * 60 * 1000 + 30 * 60 * 1000) // 2h 30m from now
    const result = formatResetTime(futureTime)
    expect(result).toMatch(/\d+h \d+m/)
  })
})
