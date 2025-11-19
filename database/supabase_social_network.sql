-- =====================================================
-- CINEAMATEUR - SOCIAL NETWORK DATABASE SCHEMA
-- =====================================================
-- Complete database schema for the CineAmateur platform
-- A social media platform for amateur filmmakers
--
-- Platform: Supabase (PostgreSQL)
-- Created: 2025
-- =====================================================

-- =====================================================
-- EXTENSIONS
-- =====================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for additional crypto functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABLES
-- =====================================================

-- -----------------------------------------------------
-- Table: profiles
-- Extended user profile information
-- Linked 1:1 with auth.users
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    bio TEXT,
    location TEXT,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- -----------------------------------------------------
-- Table: projects
-- User's filmmaking projects (legacy feature)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'archived')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for projects
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- -----------------------------------------------------
-- Table: posts
-- Social media posts with text, images, or videos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT,
    media_type TEXT DEFAULT 'none' CHECK (media_type IN ('none', 'image', 'video')),
    media_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for posts
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);

-- -----------------------------------------------------
-- Table: comments
-- Comments on posts
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at);

-- -----------------------------------------------------
-- Table: likes
-- Likes on posts
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    -- Prevent duplicate likes
    UNIQUE(post_id, user_id)
);

-- Indexes for likes
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- -----------------------------------------------------
-- Table: follows
-- Follow relationships between users
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    -- Prevent duplicate follows
    UNIQUE(follower_id, following_id),

    -- Prevent self-follows
    CHECK (follower_id != following_id)
);

-- Indexes for follows
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- -----------------------------------------------------
-- Table: movies
-- Full-length movies uploaded by users
-- Supports multiple quality levels
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS movies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    genre TEXT,
    year INTEGER,
    duration INTEGER, -- Duration in seconds
    video_url TEXT NOT NULL, -- Original quality
    video_1080p_url TEXT,
    video_720p_url TEXT,
    video_480p_url TEXT,
    video_360p_url TEXT,
    thumbnail_url TEXT,
    subtitle_url TEXT,
    views INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for movies
CREATE INDEX IF NOT EXISTS idx_movies_user_id ON movies(user_id);
CREATE INDEX IF NOT EXISTS idx_movies_genre ON movies(genre);
CREATE INDEX IF NOT EXISTS idx_movies_created_at ON movies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_movies_views ON movies(views DESC);

-- -----------------------------------------------------
-- Table: messages
-- Private messages between users
-- Supports soft delete (per-user and per-message)
-- Supports message editing
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,

    -- Soft delete columns
    deleted_by UUID[] DEFAULT '{}' NOT NULL, -- Users who deleted the conversation
    deleted_for_me UUID[] DEFAULT '{}' NOT NULL, -- Users who deleted this specific message
    deleted_for_everyone BOOLEAN DEFAULT false NOT NULL, -- Sender deleted for everyone

    -- Edit tracking
    edited_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    -- Prevent self-messaging
    CHECK (sender_id != receiver_id)
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read) WHERE is_read = false;

-- GIN indexes for array operations (efficient soft delete queries)
CREATE INDEX IF NOT EXISTS idx_messages_deleted_by ON messages USING GIN (deleted_by);
CREATE INDEX IF NOT EXISTS idx_messages_deleted_for_me ON messages USING GIN (deleted_for_me);

-- -----------------------------------------------------
-- Table: notifications
-- User notifications for social interactions
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Recipient
    actor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, -- Person who triggered notification
    type TEXT NOT NULL CHECK (type IN ('like', 'comment', 'follow', 'movie_upload')),
    entity_type TEXT CHECK (entity_type IN ('post', 'user', 'movie', 'message')),
    entity_id UUID,
    is_read BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- =====================================================
-- VIEWS
-- =====================================================

-- -----------------------------------------------------
-- View: user_stats
-- Aggregated user statistics
-- -----------------------------------------------------
CREATE OR REPLACE VIEW user_stats AS
SELECT
    p.id,
    p.username,
    p.full_name,
    COUNT(DISTINCT po.id) AS posts_count,
    COUNT(DISTINCT m.id) AS movies_count,
    COUNT(DISTINCT f1.id) AS followers_count,
    COUNT(DISTINCT f2.id) AS following_count
FROM profiles p
LEFT JOIN posts po ON po.user_id = p.id
LEFT JOIN movies m ON m.user_id = p.id
LEFT JOIN follows f1 ON f1.following_id = p.id
LEFT JOIN follows f2 ON f2.follower_id = p.id
GROUP BY p.id, p.username, p.full_name;

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- -----------------------------------------------------
-- Function: update_updated_at_column
-- Automatically updates the updated_at timestamp
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------
-- Function: handle_new_user
-- Creates a profile when a new user signs up
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, username, full_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------
-- Function: soft_delete_messages_for_user
-- Soft delete all messages in a conversation for a user
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION soft_delete_messages_for_user(
    current_user_id UUID,
    other_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Add current_user_id to deleted_by array for all messages in conversation
    UPDATE messages
    SET deleted_by = array_append(deleted_by, current_user_id)
    WHERE
        -- Messages in the conversation
        (
            (sender_id = current_user_id AND receiver_id = other_user_id) OR
            (sender_id = other_user_id AND receiver_id = current_user_id)
        )
        -- Only if user hasn't already deleted
        AND NOT (current_user_id = ANY(deleted_by));
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION soft_delete_messages_for_user(UUID, UUID) TO authenticated;

-- -----------------------------------------------------
-- Function: delete_message_for_me
-- Soft delete a single message for the current user
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION delete_message_for_me(
    message_id UUID,
    user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE messages
    SET deleted_for_me = array_append(deleted_for_me, user_id)
    WHERE id = message_id
        AND (sender_id = user_id OR receiver_id = user_id)
        AND NOT (user_id = ANY(deleted_for_me));
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION delete_message_for_me(UUID, UUID) TO authenticated;

-- -----------------------------------------------------
-- Function: delete_message_for_everyone
-- Delete a message for all participants (sender only)
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION delete_message_for_everyone(
    message_id UUID,
    user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE messages
    SET deleted_for_everyone = true
    WHERE id = message_id
        AND sender_id = user_id
        AND deleted_for_everyone = false;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION delete_message_for_everyone(UUID, UUID) TO authenticated;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- -----------------------------------------------------
-- Trigger: Auto-create profile on user signup
-- -----------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- -----------------------------------------------------
-- Trigger: Auto-update updated_at on projects
-- -----------------------------------------------------
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------
-- Trigger: Auto-update updated_at on posts
-- -----------------------------------------------------
DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------
-- Trigger: Auto-update updated_at on comments
-- -----------------------------------------------------
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------
-- Trigger: Auto-update updated_at on movies
-- -----------------------------------------------------
DROP TRIGGER IF EXISTS update_movies_updated_at ON movies;
CREATE TRIGGER update_movies_updated_at
    BEFORE UPDATE ON movies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------
-- Trigger: Auto-update updated_at on profiles
-- -----------------------------------------------------
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- RLS Policies: profiles
-- -----------------------------------------------------

-- Anyone can view profiles
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT
    USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- -----------------------------------------------------
-- RLS Policies: projects
-- -----------------------------------------------------

CREATE POLICY "Users can view own projects"
    ON projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
    ON projects FOR DELETE
    USING (auth.uid() = user_id);

-- -----------------------------------------------------
-- RLS Policies: posts
-- -----------------------------------------------------

-- All authenticated users can view posts
CREATE POLICY "Posts are viewable by authenticated users"
    ON posts FOR SELECT
    USING (auth.role() = 'authenticated');

-- Users can insert their own posts
CREATE POLICY "Users can insert own posts"
    ON posts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
    ON posts FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts"
    ON posts FOR DELETE
    USING (auth.uid() = user_id);

-- -----------------------------------------------------
-- RLS Policies: comments
-- -----------------------------------------------------

-- All authenticated users can view comments
CREATE POLICY "Comments are viewable by authenticated users"
    ON comments FOR SELECT
    USING (auth.role() = 'authenticated');

-- Users can insert their own comments
CREATE POLICY "Users can insert own comments"
    ON comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
    ON comments FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
    ON comments FOR DELETE
    USING (auth.uid() = user_id);

-- -----------------------------------------------------
-- RLS Policies: likes
-- -----------------------------------------------------

-- All authenticated users can view likes
CREATE POLICY "Likes are viewable by authenticated users"
    ON likes FOR SELECT
    USING (auth.role() = 'authenticated');

-- Users can insert their own likes
CREATE POLICY "Users can insert own likes"
    ON likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete own likes"
    ON likes FOR DELETE
    USING (auth.uid() = user_id);

-- -----------------------------------------------------
-- RLS Policies: follows
-- -----------------------------------------------------

-- All authenticated users can view follows
CREATE POLICY "Follows are viewable by authenticated users"
    ON follows FOR SELECT
    USING (auth.role() = 'authenticated');

-- Users can insert their own follows
CREATE POLICY "Users can insert own follows"
    ON follows FOR INSERT
    WITH CHECK (auth.uid() = follower_id);

-- Users can delete their own follows
CREATE POLICY "Users can delete own follows"
    ON follows FOR DELETE
    USING (auth.uid() = follower_id);

-- -----------------------------------------------------
-- RLS Policies: movies
-- -----------------------------------------------------

-- All authenticated users can view movies
CREATE POLICY "Movies are viewable by authenticated users"
    ON movies FOR SELECT
    USING (auth.role() = 'authenticated');

-- Users can insert their own movies
CREATE POLICY "Users can insert own movies"
    ON movies FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own movies
CREATE POLICY "Users can update own movies"
    ON movies FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own movies
CREATE POLICY "Users can delete own movies"
    ON movies FOR DELETE
    USING (auth.uid() = user_id);

-- -----------------------------------------------------
-- RLS Policies: messages
-- -----------------------------------------------------

-- Users can view their own messages (with soft delete filtering)
CREATE POLICY "Users can view their own messages"
    ON messages FOR SELECT
    USING (
        (auth.uid() = sender_id OR auth.uid() = receiver_id)
        AND NOT (auth.uid() = ANY(deleted_by))
        AND NOT deleted_for_everyone
        AND NOT (auth.uid() = ANY(deleted_for_me))
    );

-- Users can insert messages as sender
CREATE POLICY "Users can insert messages as sender"
    ON messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- Users can update their messages (for editing and marking as read)
CREATE POLICY "Users can update their messages"
    ON messages FOR UPDATE
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can delete their messages
CREATE POLICY "Users can delete their own messages"
    ON messages FOR DELETE
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- -----------------------------------------------------
-- RLS Policies: notifications
-- -----------------------------------------------------

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Allow inserting notifications (handled by application/triggers)
CREATE POLICY "Authenticated users can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- REALTIME CONFIGURATION
-- =====================================================

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- =====================================================
-- STORAGE BUCKETS (Configure in Supabase Dashboard)
-- =====================================================

-- Create storage buckets via Supabase Dashboard or API:
--
-- 1. avatars (public, 5MB limit)
--    - User profile pictures
--    - Path: {user_id}/avatar.{ext}
--
-- 2. covers (public, 10MB limit)
--    - User cover photos
--    - Path: {user_id}/cover.{ext}
--
-- 3. post-images (public, 5MB limit)
--    - Images in posts
--    - Path: {user_id}/{timestamp}.{ext}
--
-- 4. post-videos (public, 50MB limit)
--    - Videos in posts
--    - Path: {user_id}/{timestamp}.{ext}
--
-- 5. movies (public, 500MB limit)
--    - Full-length movie files
--    - Path: {user_id}/{timestamp}.{ext}
--    - Multi-quality: {user_id}/{timestamp}_{quality}.mp4
--
-- 6. movie-thumbnails (public, 5MB limit)
--    - Movie preview thumbnails
--    - Path: {user_id}/{timestamp}.{ext}
--
-- 7. movie-subtitles (public, 1MB limit)
--    - Movie subtitle files
--    - Path: {user_id}/{timestamp}.srt

-- =====================================================
-- INDEXES SUMMARY
-- =====================================================

-- Profiles: username
-- Projects: user_id, status
-- Posts: user_id, created_at
-- Comments: post_id, user_id, created_at
-- Likes: post_id, user_id
-- Follows: follower_id, following_id
-- Movies: user_id, genre, created_at, views
-- Messages: sender_id, receiver_id, created_at, is_read, deleted_by (GIN), deleted_for_me (GIN)
-- Notifications: user_id, is_read, created_at

-- =====================================================
-- COMPLETION
-- =====================================================

-- Schema creation complete!
-- Next steps:
-- 1. Configure storage buckets in Supabase Dashboard
-- 2. Set up email templates for authentication
-- 3. Configure authentication providers
-- 4. Test RLS policies with different user scenarios
-- 5. Set up periodic cleanup jobs for old data (optional)

-- =====================================================
-- END OF SCHEMA
-- =====================================================
