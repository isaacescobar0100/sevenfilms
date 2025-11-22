# CineAmateur API Documentation

## Overview

CineAmateur uses Supabase as Backend-as-a-Service (BaaS), providing:
- PostgreSQL database with Row Level Security (RLS)
- Authentication (email/password)
- Storage buckets for media files
- Real-time subscriptions
- RPC functions for complex operations

## Base Configuration

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)
```

---

## Authentication

### Sign In
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})
// Returns: { user, session }
```

### Sign Up
```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      username: 'username',
      full_name: 'Full Name'
    }
  }
})
```

### Sign Out
```javascript
const { error } = await supabase.auth.signOut()
```

### Get Current Session
```javascript
const { data: { session } } = await supabase.auth.getSession()
```

### Listen to Auth Changes
```javascript
supabase.auth.onAuthStateChange((event, session) => {
  // event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED'
})
```

---

## Database Tables

### Profiles

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (FK to auth.users) |
| username | TEXT | Unique username |
| full_name | TEXT | Display name |
| avatar_url | TEXT | Profile picture URL |
| cover_url | TEXT | Cover image URL |
| bio | TEXT | User biography |
| location | TEXT | User location |
| website | TEXT | Personal website |
| created_at | TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | Last update |

#### Get Profile by Username
```javascript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('username', 'johndoe')
  .single()
```

#### Update Profile
```javascript
const { data, error } = await supabase
  .from('profiles')
  .update({ bio: 'New bio', location: 'NYC' })
  .eq('id', userId)
```

---

### Posts

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Author (FK to auth.users) |
| content | TEXT | Post text content |
| media_type | TEXT | 'none', 'image', 'video' |
| media_url | TEXT | Media file URL |
| created_at | TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | Last update |

#### Get Feed Posts
```javascript
const { data, error } = await supabase
  .from('posts')
  .select(`
    *,
    profiles:user_id(*),
    likes(count),
    comments(count)
  `)
  .order('created_at', { ascending: false })
  .limit(20)
```

#### Create Post
```javascript
const { data, error } = await supabase
  .from('posts')
  .insert({
    user_id: userId,
    content: 'Hello world!',
    media_type: 'none'
  })
  .select()
  .single()
```

#### Delete Post
```javascript
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('id', postId)
```

---

### Movies

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Creator (FK to auth.users) |
| title | TEXT | Movie title |
| description | TEXT | Synopsis |
| genre | TEXT | Movie genre |
| year | INTEGER | Release year |
| duration | INTEGER | Duration in seconds |
| video_url | TEXT | Original video URL |
| video_1080p_url | TEXT | 1080p quality URL |
| video_720p_url | TEXT | 720p quality URL |
| video_480p_url | TEXT | 480p quality URL |
| video_360p_url | TEXT | 360p quality URL |
| thumbnail_url | TEXT | Thumbnail image URL |
| subtitle_url | TEXT | Subtitles file URL |
| views | INTEGER | Total view count |
| average_rating | DECIMAL | Average star rating (1-5) |
| ratings_count | INTEGER | Number of ratings |
| comments_count | INTEGER | Number of comments |
| engagement_score | DECIMAL | Calculated engagement metric |
| created_at | TIMESTAMP | Upload date |

#### Get Movies (Paginated)
```javascript
const { data, error } = await supabase
  .from('movies')
  .select(`
    *,
    profiles:user_id(id, username, full_name, avatar_url)
  `)
  .order('created_at', { ascending: false })
  .range(0, 19)
```

#### Get Featured Movies (by Engagement)
```javascript
const { data, error } = await supabase
  .from('movies')
  .select('*, profiles:user_id(*)')
  .order('engagement_score', { ascending: false })
  .limit(10)
```

#### Get Movies by Genre
```javascript
const { data, error } = await supabase
  .from('movies')
  .select('*, profiles:user_id(*)')
  .eq('genre', 'Drama')
  .order('created_at', { ascending: false })
```

#### Update Movie Views
```javascript
const { error } = await supabase
  .from('movies')
  .update({ views: newViewCount })
  .eq('id', movieId)
```

---

### Messages

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| sender_id | UUID | Sender (FK to auth.users) |
| receiver_id | UUID | Receiver (FK to auth.users) |
| content | TEXT | Message text |
| is_read | BOOLEAN | Read status |
| deleted_by | UUID[] | Users who deleted conversation |
| created_at | TIMESTAMP | Send date |

#### Get Conversation
```javascript
const { data, error } = await supabase
  .from('messages')
  .select('*, sender:sender_id(*), receiver:receiver_id(*)')
  .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
  .or(`sender_id.eq.${otherUserId},receiver_id.eq.${otherUserId}`)
  .order('created_at', { ascending: true })
```

#### Send Message
```javascript
const { data, error } = await supabase
  .from('messages')
  .insert({
    sender_id: userId,
    receiver_id: otherUserId,
    content: 'Hello!'
  })
  .select()
  .single()
```

#### Mark as Read
```javascript
const { error } = await supabase
  .from('messages')
  .update({ is_read: true })
  .eq('receiver_id', userId)
  .eq('sender_id', otherUserId)
  .eq('is_read', false)
```

---

### Notifications

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Notification recipient |
| actor_id | UUID | User who triggered notification |
| type | TEXT | 'like', 'comment', 'follow', 'message_reply' |
| entity_type | TEXT | 'post', 'movie', 'user', 'message' |
| entity_id | UUID | Related entity ID |
| is_read | BOOLEAN | Read status |
| created_at | TIMESTAMP | Notification date |

#### Get Unread Notifications
```javascript
const { data, error } = await supabase
  .from('notifications')
  .select('*, actor:actor_id(*)')
  .eq('user_id', userId)
  .eq('is_read', false)
  .order('created_at', { ascending: false })
```

#### Mark All as Read
```javascript
const { error } = await supabase
  .from('notifications')
  .update({ is_read: true })
  .eq('user_id', userId)
  .eq('is_read', false)
```

---

## RPC Functions

### Add or Update Movie Rating
Validates that the creator cannot rate their own movie.

```javascript
const { data, error } = await supabase.rpc('add_or_update_movie_rating', {
  p_movie_id: movieId,
  p_user_id: userId,
  p_rating: 5 // 1-5
})
```

**SQL Definition:**
```sql
CREATE OR REPLACE FUNCTION add_or_update_movie_rating(
  p_movie_id UUID,
  p_user_id UUID,
  p_rating INTEGER
) RETURNS VOID AS $$
BEGIN
  -- Validate creator cannot rate own movie
  IF EXISTS (SELECT 1 FROM movies WHERE id = p_movie_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'Cannot rate your own movie';
  END IF;

  -- Insert or update rating
  INSERT INTO movie_ratings (movie_id, user_id, rating)
  VALUES (p_movie_id, p_user_id, p_rating)
  ON CONFLICT (movie_id, user_id)
  DO UPDATE SET rating = p_rating, updated_at = NOW();

  -- Update movie average rating (via trigger)
END;
$$ LANGUAGE plpgsql;
```

---

### Search Confirmed Users
Only returns users with confirmed email addresses.

```javascript
const { data, error } = await supabase.rpc('search_confirmed_users', {
  search_query: 'john',
  result_limit: 20
})
```

**Returns:** Array of profiles matching the search query.

---

### Soft Delete Messages
Allows users to delete conversation without affecting the other party.

```javascript
const { error } = await supabase.rpc('soft_delete_messages_for_user', {
  current_user_id: userId,
  other_user_id: otherUserId
})
```

---

## Backend Rate Limiting

Rate limiting is enforced at the database level via triggers and RPC functions.
Users cannot bypass these limits even by modifying frontend code.

### Rate Limit Configuration

| Action | Limit | Window | Enforcement |
|--------|-------|--------|-------------|
| `movie_upload` | 10 | 24 hours | Trigger |
| `post_creation` | 50 | 24 hours | Trigger |
| `message_send` | 100 | 24 hours | Trigger |
| `search_request` | 100 | 1 hour | RPC |
| `profile_update` | 5 | 1 hour | RPC |
| `like_action` | 60 | 1 minute | Trigger |
| `comment_action` | 30 | 1 minute | Trigger |
| `follow_action` | 30 | 1 minute | Trigger |
| `rating_action` | 20 | 1 minute | Trigger |

### Check Rate Limit Status
```javascript
const { data, error } = await supabase.rpc('get_rate_limit_status', {
  p_action_type: 'post_creation'
})
// Returns: { limited, limit, remaining, used, window_seconds, reset_at }
```

### Perform Rate-Limited Action (Manual)
For actions without automatic triggers (like searches):
```javascript
const { data, error } = await supabase.rpc('perform_rate_limited_action', {
  p_action_type: 'search_request'
})
// Returns: { allowed, limit, remaining, window_seconds } or { allowed: false, error, reset_at }
```

### Using the Hook
```javascript
import { useBackendRateLimit, RATE_LIMIT_ACTIONS } from '@/hooks/useBackendRateLimit'

function PostButton() {
  const { isLimited, remaining, resetTimeFormatted } = useBackendRateLimit(
    RATE_LIMIT_ACTIONS.POST_CREATION
  )

  if (isLimited) {
    return <p>Límite alcanzado. Reinicio en {resetTimeFormatted}</p>
  }

  return <button>Publicar ({remaining} restantes)</button>
}
```

### Error Handling
When a rate limit is exceeded via trigger, Supabase returns an error:
```javascript
try {
  await supabase.from('posts').insert({ ... })
} catch (error) {
  if (error.message.includes('Rate limit exceeded')) {
    // Show rate limit message to user
  }
}
```

---

## Storage Buckets

| Bucket | Max Size | Content Type |
|--------|----------|--------------|
| `avatars` | 5 MB | Images (jpg, png, webp) |
| `covers` | 10 MB | Images |
| `post-images` | 5 MB | Images |
| `post-videos` | 50 MB | Videos (mp4, webm) |
| `movies` | 500 MB | Videos |
| `movie-thumbnails` | 5 MB | Images |
| `movie-subtitles` | 1 MB | Text (vtt, srt) |

### Upload File
```javascript
const fileName = `${userId}/${Date.now()}.jpg`
const { data, error } = await supabase.storage
  .from('avatars')
  .upload(fileName, file, {
    cacheControl: '3600',
    upsert: false
  })
```

### Get Public URL
```javascript
const { data } = supabase.storage
  .from('avatars')
  .getPublicUrl(fileName)
// data.publicUrl
```

### Delete File
```javascript
const { error } = await supabase.storage
  .from('avatars')
  .remove([fileName])
```

---

## Real-time Subscriptions

### Subscribe to Messages
```javascript
const channel = supabase
  .channel('messages-channel')
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'messages',
      filter: `receiver_id=eq.${userId}`
    },
    (payload) => {
      console.log('New message:', payload.new)
    }
  )
  .subscribe()

// Cleanup
supabase.removeChannel(channel)
```

### Subscribe to Notifications
```javascript
const channel = supabase
  .channel('notifications-channel')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      // Show toast notification
    }
  )
  .subscribe()
```

---

## Error Handling

```javascript
const { data, error } = await supabase.from('posts').select()

if (error) {
  switch (error.code) {
    case '42501':
      // RLS violation - unauthorized
      break
    case '23505':
      // Unique constraint violation
      break
    case 'PGRST116':
      // No rows found
      break
    default:
      console.error('Database error:', error.message)
  }
}
```

---

## Rate Limits (Frontend)

| Action | Limit | Window |
|--------|-------|--------|
| Movie Upload | 10 | 24 hours |
| Post Creation | 50 | 24 hours |
| Messages | 100 | 24 hours |
| Search | 100 | 1 hour |
| Profile Updates | 5 | 1 hour |
| Likes | 30 | 1 minute |
| Comments | 20 | 1 minute |
| Follows | 20 | 1 minute |

```javascript
import { useRateLimit } from '@/hooks/useRateLimit'

const { canPerformAction, performAction, remaining } = useRateLimit('movieUpload')

if (canPerformAction) {
  performAction()
  // Upload movie
} else {
  // Show rate limit message
}
```

---

## Engagement Score Formula

Movies are ranked by engagement score, calculated automatically via triggers:

```
engagement_score = (completed_views * 10)
                 + (average_rating * ratings_count * 20)
                 + (comments_count * 5)
```

Where:
- `completed_views`: Users who watched >70% of the movie
- `average_rating`: 1-5 star rating
- `ratings_count`: Total number of ratings
- `comments_count`: Total comments (excluding creator's)
