-- Migration: Add timeout_reason field to user_sessions table
-- This field will track why a session ended (manual logout, inactivity, server cleanup, etc.)

-- Add the timeout_reason column
ALTER TABLE user_sessions 
ADD COLUMN timeout_reason VARCHAR(50) CHECK (
  timeout_reason IN (
    'manual_logout',
    'inactivity', 
    'server_cleanup',
    'token_expired',
    'user_deleted',
    'system_timeout'
  )
);

-- Add an index for better query performance
CREATE INDEX idx_user_sessions_timeout_reason ON user_sessions(timeout_reason);

-- Update existing sessions to have a default reason
UPDATE user_sessions 
SET timeout_reason = CASE 
  WHEN is_active = false AND logout_time IS NOT NULL THEN 'manual_logout'
  WHEN is_active = false AND logout_time IS NULL THEN 'system_timeout'
  ELSE NULL
END
WHERE timeout_reason IS NULL;

-- Add a comment to document the field
COMMENT ON COLUMN user_sessions.timeout_reason IS 'Reason why the session ended (manual_logout, inactivity, server_cleanup, etc.)'; 