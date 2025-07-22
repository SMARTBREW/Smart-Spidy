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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  instagram_username VARCHAR(255),
  profession VARCHAR(255),
  product VARCHAR(255),
  gender VARCHAR(50)
);
CREATE INDEX idx_chats_user_id ON chats(user_id);
CREATE INDEX idx_chats_status ON chats(status);
CREATE INDEX idx_chats_product ON chats(product);
CREATE INDEX idx_chats_gender ON chats(gender);
CREATE INDEX idx_chats_created_at ON chats(created_at);

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
CREATE TABLE instagram_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  account_type VARCHAR(100),
  biography TEXT,
  followers_count INTEGER,
  media_count INTEGER,
  website VARCHAR(255),
  profile_picture_url TEXT,
  fetched_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  raw_json JSONB,
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_login_time ON user_sessions(login_time);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);

-- FUNDRAISERS TABLE
CREATE TABLE fundraisers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_fundraisers_created_by ON fundraisers(created_by);
CREATE INDEX idx_fundraisers_chat_id ON fundraisers(chat_id);

-- NOTIFICATIONS TABLE
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  chat_name VARCHAR(255) NOT NULL,
  message_count INTEGER NOT NULL,
  days_inactive INTEGER NOT NULL,
  last_activity_date TIMESTAMPTZ NOT NULL,
  notification_type VARCHAR(50) DEFAULT 'chat_inactive_2days',
  is_read BOOLEAN DEFAULT false,
  is_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);
CREATE INDEX idx_notifications_chat_id ON notifications(chat_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_is_sent ON notifications(is_sent);
CREATE INDEX idx_notifications_days_inactive ON notifications(days_inactive);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- =====================
-- RLS POLICIES SECTION
-- =====================

-- Enable RLS
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE fundraisers ENABLE ROW LEVEL SECURITY;

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

-- (Optional) Admins can do anything
CREATE POLICY "Admins can do anything on chats"
  ON chats
  FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can do anything on fundraisers"
  ON fundraisers
  FOR ALL
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')); 