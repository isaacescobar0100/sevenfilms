// ============================================
// TIPOS PRINCIPALES DEL PROYECTO CINEAMATEUR
// ============================================

// ============ AUTH & USER ============

export interface User {
  id: string
  email: string
  user_metadata: UserMetadata
  created_at: string
  updated_at?: string
}

export interface UserMetadata {
  username: string
  full_name?: string
  avatar_url?: string
  cover_url?: string
}

export interface Session {
  access_token: string
  refresh_token: string
  user: User
  expires_at?: number
}

export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ user: User; session: Session }>
  signUp: (email: string, password: string, metadata?: Partial<UserMetadata>) => Promise<{ user: User }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (updates: Partial<UserMetadata>) => Promise<{ user: User }>
}

// ============ PROFILES ============

export interface Profile {
  id: string
  username: string
  full_name?: string
  avatar_url?: string
  cover_url?: string
  bio?: string
  location?: string
  website?: string
  created_at: string
  updated_at?: string
}

// ============ POSTS ============

export type MediaType = 'none' | 'image' | 'video'

export interface Post {
  id: string
  user_id: string
  content: string
  media_type: MediaType
  media_url?: string
  created_at: string
  updated_at?: string
  profiles?: Profile
  likes?: Like[]
  comments?: Comment[]
  _count?: {
    likes: number
    comments: number
  }
}

export interface CreatePostInput {
  content: string
  media_type?: MediaType
  media_url?: string
}

// ============ COMMENTS ============

export interface Comment {
  id: string
  post_id?: string
  movie_id?: string
  user_id: string
  content: string
  created_at: string
  updated_at?: string
  profiles?: Profile
}

export interface CreateCommentInput {
  content: string
  post_id?: string
  movie_id?: string
}

// ============ LIKES ============

export interface Like {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

// ============ FOLLOWS ============

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  created_at: string
}

export interface FollowStats {
  followers_count: number
  following_count: number
  is_following?: boolean
}

// ============ MOVIES ============

export type MovieGenre =
  | 'Drama'
  | 'Comedia'
  | 'Acción'
  | 'Terror'
  | 'Ciencia Ficción'
  | 'Romance'
  | 'Documental'
  | 'Animación'
  | 'Thriller'
  | 'Aventura'
  | 'Fantasía'
  | 'Musical'
  | 'Western'
  | 'Otro'

export interface Movie {
  id: string
  user_id: string
  title: string
  description?: string
  genre?: MovieGenre
  year?: number
  duration?: number // in seconds
  video_url?: string
  video_1080p_url?: string
  video_720p_url?: string
  video_480p_url?: string
  video_360p_url?: string
  thumbnail_url?: string
  subtitle_url?: string
  views: number
  watch_percentage_sum?: number
  completed_views?: number
  average_rating?: number
  ratings_count: number
  comments_count: number
  engagement_score?: number
  created_at: string
  updated_at?: string
  profiles?: Profile
}

export interface CreateMovieInput {
  title: string
  description?: string
  genre?: MovieGenre
  year?: number
  duration?: number
}

export interface MovieQuality {
  name: string
  url: string
  height: number
}

// ============ MOVIE RATINGS ============

export interface MovieRating {
  id: string
  movie_id: string
  user_id: string
  rating: number // 1-5
  review?: string
  created_at: string
  updated_at?: string
  profiles?: Profile
}

// ============ MESSAGES ============

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  deleted_by?: string[]
  deleted_for_me?: string[]
  deleted_for_everyone?: boolean
  edited_at?: string
  created_at: string
  sender?: Profile
  receiver?: Profile
}

export interface Conversation {
  user: Profile
  lastMessage: Message
  unreadCount: number
}

// ============ NOTIFICATIONS ============

export type NotificationType = 'like' | 'comment' | 'follow' | 'message_reply'
export type EntityType = 'post' | 'movie' | 'user' | 'message'

export interface Notification {
  id: string
  user_id: string
  actor_id: string
  type: NotificationType
  entity_type: EntityType
  entity_id?: string
  is_read: boolean
  created_at: string
  actor?: Profile
}

// ============ RATE LIMITING ============

export interface RateLimitConfig {
  limit: number
  windowMs: number
}

export interface RateLimitState {
  canPerformAction: boolean
  performAction: () => boolean
  remaining: number
  limit: number
  resetTime: Date | null
  isLimited: boolean
  resetCounter: () => void
}

// ============ FFMPEG ============

export interface FFmpegState {
  loaded: boolean
  loading: boolean
  error: string | null
}

export interface VideoQualities {
  '1080p'?: File
  '720p'?: File
  '480p'?: File
  '360p'?: File
}

export interface VideoResolution {
  width: number
  height: number
}

export interface QualityProgress {
  current: number
  total: number
  quality: string
}

// ============ API RESPONSES ============

export interface ApiResponse<T> {
  data: T | null
  error: Error | null
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  hasMore: boolean
}

// ============ FORM SCHEMAS ============

export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  name: string
}

export interface ProfileFormData {
  full_name?: string
  bio?: string
  location?: string
  website?: string
}

// ============ COMPONENT PROPS ============

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'danger' | 'warning' | 'info'
}
