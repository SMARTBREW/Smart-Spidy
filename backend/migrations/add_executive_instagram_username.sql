-- Migration: Add executive_instagram_username field to chats table
-- This field stores the Instagram username of the sales executive who created the chat

-- Add the new column
ALTER TABLE chats ADD COLUMN executive_instagram_username VARCHAR(255);

-- Add a comment to document the field
COMMENT ON COLUMN chats.executive_instagram_username IS 'Instagram username of the sales executive who created this chat';

-- Create an index for better query performance
CREATE INDEX idx_chats_executive_instagram_username ON chats(executive_instagram_username);

-- Update existing chats to have a default value (optional)
-- UPDATE chats SET executive_instagram_username = '' WHERE executive_instagram_username IS NULL; 