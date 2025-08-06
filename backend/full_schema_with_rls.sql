-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) CHECK (role IN ('user', 'admin')) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- CHATS TABLE
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  pinned BOOLEAN DEFAULT false,
  pinned_at TIMESTAMPTZ,
  status VARCHAR(50),
  message_count INTEGER DEFAULT 0,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  instagram_username VARCHAR(255),
  executive_instagram_username VARCHAR(255),
  profession VARCHAR(255),
  product VARCHAR(255),
  gender VARCHAR(50)
);
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_status ON chats(status);
CREATE INDEX idx_chats_product ON chats(product);
CREATE INDEX idx_chats_gender ON chats(gender);
CREATE INDEX idx_chats_executive_instagram_username ON chats(executive_instagram_username);
CREATE INDEX idx_chats_created_at ON chats(created_at);
CREATE INDEX idx_chats_last_activity ON chats(last_activity);

-- MESSAGES TABLE
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  sender VARCHAR(50) CHECK (sender IN ('user', 'assistant')) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  message_order INTEGER,
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_message_order ON messages(chat_id, message_order);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- INSTAGRAM ACCOUNTS TABLE
DROP TABLE IF EXISTS instagram_accounts CASCADE;

CREATE TABLE instagram_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ig_user_id VARCHAR(50) NOT NULL, -- Instagram user ID from API
  username VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255), -- Display name
  biography TEXT,
  website VARCHAR(255),
  followers_count INTEGER,
  follows_count INTEGER,
  media_count INTEGER,
  account_type VARCHAR(100),
  is_verified BOOLEAN,
  ig_id VARCHAR(50), -- Instagram's internal ID
  audience_gender_age JSONB, -- Demographics
  audience_country JSONB,
  audience_city JSONB,
  audience_locale JSONB,
  insights JSONB, -- Account-level insights (impressions, reach, etc.)
  mentions JSONB, -- Posts/comments where this account is mentioned
  media JSONB, -- Array of media objects (posts, reels, stories) - excludes media_url for privacy/performance
  ai_analysis_score INTEGER CHECK (ai_analysis_score >= 0 AND ai_analysis_score <= 100), -- AI-generated score (0-100)
  ai_analysis_details JSONB, -- Detailed AI analysis (strengths, weaknesses, recommendations)
  fetched_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  raw_json JSONB, -- Full API response for future-proofing
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_instagram_accounts_username ON instagram_accounts(username);
CREATE INDEX idx_instagram_accounts_fetched_by_user_id ON instagram_accounts(fetched_by_user_id);
CREATE INDEX idx_instagram_accounts_fetched_at ON instagram_accounts(fetched_at);

-- USER SESSIONS TABLE
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  login_time TIMESTAMPTZ DEFAULT NOW(),
  logout_time TIMESTAMPTZ,
  session_duration INTEGER,
  is_active BOOLEAN DEFAULT true,
  timeout_reason VARCHAR(50) CHECK (
    timeout_reason IN (
      'manual_logout',
      'inactivity', 
      'server_cleanup',
      'token_expired',
      'user_deleted',
      'system_timeout'
    )
  ),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_login_time ON user_sessions(login_time);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);
CREATE INDEX idx_user_sessions_updated_at ON user_sessions(updated_at);
CREATE INDEX idx_user_sessions_timeout_reason ON user_sessions(timeout_reason);

-- FUNDRAISERS TABLE
CREATE TABLE fundraisers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'paused')),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_fundraisers_created_by ON fundraisers(created_by);
CREATE INDEX idx_fundraisers_chat_id ON fundraisers(chat_id);
CREATE INDEX idx_fundraisers_status ON fundraisers(status);
CREATE INDEX idx_fundraisers_last_activity ON fundraisers(last_activity);

-- NOTIFICATIONS TABLE
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  fundraiser_id UUID REFERENCES fundraisers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  chat_name VARCHAR(255) NOT NULL,
  message_count INTEGER NOT NULL,
  days_inactive INTEGER NOT NULL,
  last_activity_date TIMESTAMPTZ NOT NULL,
  notification_type VARCHAR(50) DEFAULT 'chat_inactive_2days' CHECK (
    notification_type IN (
      'chat_inactive_2days',
      'chat_inactive_4days', 
      'fundraiser_inactive_2days',
      'fundraiser_inactive_4days',
      'system_alert',
      'status_update'
    )
  ),
  is_read BOOLEAN DEFAULT false,
  is_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);
CREATE INDEX idx_notifications_chat_id ON notifications(chat_id);
CREATE INDEX idx_notifications_fundraiser_id ON notifications(fundraiser_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_is_sent ON notifications(is_sent);
CREATE INDEX idx_notifications_days_inactive ON notifications(days_inactive);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_type ON notifications(notification_type);

-- =====================
-- RLS POLICIES SECTION
-- =====================

-- Enable RLS
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundraisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS for chats
CREATE POLICY "Users can select their own chats"
  ON chats
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own chats"
  ON chats
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own chats"
  ON chats
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own chats"
  ON chats
  FOR DELETE
  USING (user_id = auth.uid());

-- RLS for fundraisers
CREATE POLICY "Users can select their own fundraisers"
  ON fundraisers
  FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can insert their own fundraisers"
  ON fundraisers
  FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own fundraisers"
  ON fundraisers
  FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own fundraisers"
  ON fundraisers
  FOR DELETE
  USING (created_by = auth.uid());

-- RLS for notifications
CREATE POLICY "Users can select their own notifications"
  ON notifications
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON notifications
  FOR DELETE
  USING (user_id = auth.uid());

-- (Optional) Admins can do anything
CREATE POLICY "Admins can do anything on chats"
  ON chats
  FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can do anything on fundraisers"
  ON fundraisers
  FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can do anything on notifications"
  ON notifications
  FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- =====================
-- UPDATE COMMANDS FOR EXISTING TABLES
-- =====================

-- Update commands to run if tables already exist
-- Run these commands in your database to update existing tables

-- 1. Update Chats Table - Add last_activity field
ALTER TABLE chats ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_chats_last_activity ON chats(last_activity);

-- 2. Update Fundraisers Table - Add status and last_activity fields
ALTER TABLE fundraisers ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE fundraisers ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE fundraisers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add CHECK constraint for fundraisers status (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_fundraiser_status' 
        AND table_name = 'fundraisers'
    ) THEN
        ALTER TABLE fundraisers ADD CONSTRAINT check_fundraiser_status 
        CHECK (status IN ('active', 'inactive', 'completed', 'paused'));
    END IF;
END $$;

-- Add indexes for fundraisers
CREATE INDEX IF NOT EXISTS idx_fundraisers_status ON fundraisers(status);
CREATE INDEX IF NOT EXISTS idx_fundraisers_last_activity ON fundraisers(last_activity);

-- 3. Update Notifications Table - Add missing fields and constraints
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS fundraiser_id UUID REFERENCES fundraisers(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title VARCHAR(255) NOT NULL DEFAULT 'Notification';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT 'Notification message';

-- Add CHECK constraint for notification_type (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_notification_type' 
        AND table_name = 'notifications'
    ) THEN
        ALTER TABLE notifications ADD CONSTRAINT check_notification_type 
        CHECK (notification_type IN (
            'chat_inactive_2days',
            'chat_inactive_4days', 
            'fundraiser_inactive_2days',
            'fundraiser_inactive_4days',
            'system_alert',
            'status_update'
        ));
    END IF;
END $$;

-- Add indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_fundraiser_id ON notifications(fundraiser_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);

-- 4. Update existing notification records with proper content
UPDATE notifications 
SET 
  title = CASE 
    WHEN notification_type = 'chat_inactive_2days' THEN 'Chat Inactive Alert'
    WHEN notification_type = 'chat_inactive_4days' THEN 'Chat Action Required'
    WHEN notification_type = 'fundraiser_inactive_2days' THEN 'Fundraiser Alert'
    WHEN notification_type = 'fundraiser_inactive_4days' THEN 'Fundraiser Action Required'
    ELSE 'System Notification'
  END,
  message = CASE 
    WHEN notification_type = 'chat_inactive_2days' THEN CONCAT('Chat "', chat_name, '" has been inactive for 2 days. Consider re-engaging!')
    WHEN notification_type = 'chat_inactive_4days' THEN CONCAT('Chat "', chat_name, '" has been inactive for 4 days. Time to take action!')
    WHEN notification_type = 'fundraiser_inactive_2days' THEN CONCAT('Your fundraiser "', chat_name, '" needs attention. Don''t lose momentum!')
    WHEN notification_type = 'fundraiser_inactive_4days' THEN CONCAT('Your fundraiser "', chat_name, '" is at risk. Immediate action required!')
    ELSE 'System notification'
  END
WHERE title = 'Notification' OR message = 'Notification message';

-- 5. Verification queries
-- Check if all columns were added successfully
SELECT 'Chats table updated successfully' as status;
SELECT 'Fundraisers table updated successfully' as status;
SELECT 'Notifications table updated successfully' as status;

-- Verify columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'chats' AND column_name = 'last_activity';

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'fundraisers' AND column_name IN ('status', 'last_activity', 'updated_at');

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notifications' AND column_name IN ('fundraiser_id', 'title', 'message');

-- Check if indexes were created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('chats', 'fundraisers', 'notifications') 
AND (indexname LIKE '%last_activity%' OR indexname LIKE '%status%' OR indexname LIKE '%fundraiser_id%' OR indexname LIKE '%type%'); 

-- Migration: Add updated_at column to user_sessions table
-- This migration adds the updated_at column to track when sessions are modified

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_sessions' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE user_sessions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Create index on updated_at column if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_user_sessions_updated_at ON user_sessions(updated_at);

-- Update existing records to have updated_at = created_at
UPDATE user_sessions 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Set updated_at to NOT NULL after populating existing records
ALTER TABLE user_sessions ALTER COLUMN updated_at SET NOT NULL; 