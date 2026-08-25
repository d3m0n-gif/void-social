CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- VOID SOCIAL
-- DATABASE SCHEMA
-- ============================================================

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    username VARCHAR(32) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,

    display_name VARCHAR(64),
    avatar_url TEXT,
    bio TEXT,

    role VARCHAR(20) NOT NULL DEFAULT 'user',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SERVERS
-- ============================================================

CREATE TABLE IF NOT EXISTS servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,
    icon_url TEXT,

    owner_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SERVER MEMBERS
-- ============================================================

CREATE TABLE IF NOT EXISTS server_members (
    server_id UUID NOT NULL
        REFERENCES servers(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (server_id, user_id)
);

-- ============================================================
-- CHANNELS
-- ============================================================

CREATE TABLE IF NOT EXISTS channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    server_id UUID NOT NULL
        REFERENCES servers(id)
        ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,

    type VARCHAR(20) NOT NULL DEFAULT 'text',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SERVER MESSAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    author_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    channel_id UUID NOT NULL
        REFERENCES channels(id)
        ON DELETE CASCADE,

    content TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ,

    deleted_at TIMESTAMPTZ
);

-- ============================================================
-- DIRECT MESSAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS dm_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dm_members (
    conversation_id UUID NOT NULL
        REFERENCES dm_conversations(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS dm_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    conversation_id UUID NOT NULL
        REFERENCES dm_conversations(id)
        ON DELETE CASCADE,

    author_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    content TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    deleted_at TIMESTAMPTZ
);

-- ============================================================
-- PRIVATE GROUP CHATS
-- MAXIMUM 15 MEMBERS
-- ============================================================

CREATE TABLE IF NOT EXISTS group_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,

    created_by UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_members (
    group_id UUID NOT NULL
        REFERENCES group_chats(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS group_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    group_id UUID NOT NULL
        REFERENCES group_chats(id)
        ON DELETE CASCADE,

    author_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    content TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    deleted_at TIMESTAMPTZ
);

-- ============================================================
-- BANS
-- ============================================================

CREATE TABLE IF NOT EXISTS bans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    moderator_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    reason TEXT NOT NULL,

    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MUTES
-- ============================================================

CREATE TABLE IF NOT EXISTS mutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    moderator_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    reason TEXT NOT NULL,

    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VIDEOS
-- ============================================================

CREATE TABLE IF NOT EXISTS videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    creator_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    title VARCHAR(200) NOT NULL,

    description TEXT,

    video_url TEXT NOT NULL,

    thumbnail_url TEXT,

    is_short BOOLEAN NOT NULL DEFAULT FALSE,

    comments_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    views BIGINT NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- VIDEO COMMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS video_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    video_id UUID NOT NULL
        REFERENCES videos(id)
        ON DELETE CASCADE,

    author_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    content TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    deleted_at TIMESTAMPTZ
);

-- ============================================================
-- VIDEO LIKES
-- ============================================================

CREATE TABLE IF NOT EXISTS video_likes (
    video_id UUID NOT NULL
        REFERENCES videos(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (video_id, user_id)
);

-- ============================================================
-- POSTS
-- ============================================================

CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    author_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    caption TEXT,

    media_url TEXT,

    media_type VARCHAR(20),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- POST LIKES
-- ============================================================

CREATE TABLE IF NOT EXISTS post_likes (
    post_id UUID NOT NULL
        REFERENCES posts(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (post_id, user_id)
);

-- ============================================================
-- FOLLOWERS
-- ============================================================

CREATE TABLE IF NOT EXISTS followers (
    follower_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    following_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (follower_id, following_id),

    CHECK (follower_id <> following_id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL
        REFERENCES users(id)
        ON DELETE CASCADE,

    type VARCHAR(50) NOT NULL,

    message TEXT NOT NULL,

    read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_messages_channel
ON messages(channel_id);

CREATE INDEX IF NOT EXISTS idx_messages_author
ON messages(author_id);

CREATE INDEX IF NOT EXISTS idx_dm_messages_conversation
ON dm_messages(conversation_id);

CREATE INDEX IF NOT EXISTS idx_group_messages_group
ON group_messages(group_id);

CREATE INDEX IF NOT EXISTS idx_videos_creator
ON videos(creator_id);

CREATE INDEX IF NOT EXISTS idx_video_comments_video
ON video_comments(video_id);

CREATE INDEX IF NOT EXISTS idx_posts_author
ON posts(author_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user
ON notifications(user_id);

CREATE INDEX IF NOT EXISTS idx_bans_user
ON bans(user_id);

CREATE INDEX IF NOT EXISTS idx_mutes_user
ON mutes(user_id);
