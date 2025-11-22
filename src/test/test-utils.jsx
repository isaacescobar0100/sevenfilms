import React from 'react'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { I18nextProvider } from 'react-i18next'
import i18n from '../i18n'

// Crear un QueryClient para tests
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

// Provider wrapper para tests
function AllTheProviders({ children }) {
  const queryClient = createTestQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <BrowserRouter>{children}</BrowserRouter>
      </I18nextProvider>
    </QueryClientProvider>
  )
}

// Custom render que incluye todos los providers
const customRender = (ui, options) =>
  render(ui, { wrapper: AllTheProviders, ...options })

// Re-exportar todo de @testing-library/react
export * from '@testing-library/react'
export { userEvent } from '@testing-library/user-event'

// Override del render default
export { customRender as render }

// Helper para crear mock de usuario autenticado
export const mockAuthUser = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  user_metadata: {
    username: 'testuser',
    full_name: 'Test User',
    avatar_url: null,
  },
}

// Helper para crear mock de sesión
export const mockSession = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  user: mockAuthUser,
}

// Helper para crear mock de perfil
export const mockProfile = {
  id: 'test-user-id-123',
  username: 'testuser',
  full_name: 'Test User',
  avatar_url: null,
  cover_url: null,
  bio: 'Test bio',
  location: 'Test City',
  website: 'https://test.com',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

// Helper para crear mock de post
export const mockPost = {
  id: 'test-post-id-123',
  user_id: 'test-user-id-123',
  content: 'Test post content',
  media_type: 'none',
  media_url: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  profiles: mockProfile,
  likes: [],
  comments: [],
}

// Helper para crear mock de película
export const mockMovie = {
  id: 'test-movie-id-123',
  user_id: 'test-user-id-123',
  title: 'Test Movie',
  description: 'Test description',
  genre: 'Drama',
  year: 2024,
  duration: 3600,
  video_url: 'https://test.com/video.mp4',
  thumbnail_url: 'https://test.com/thumb.jpg',
  views: 100,
  average_rating: 4.5,
  ratings_count: 10,
  comments_count: 5,
  created_at: '2024-01-01T00:00:00Z',
  profiles: mockProfile,
}
