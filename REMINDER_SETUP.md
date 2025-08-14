# Smart Spidy - Reminder Feature Setup Guide

## 🎯 Overview

The reminder feature allows users to set custom notifications for their chats with the following capabilities:

- **Custom Reminders**: Set reminders for specific chats or general reminders
- **Recurring Reminders**: Daily, weekly, monthly, or yearly recurring reminders
- **Automatic Notifications**: Reminders automatically create notifications when due
- **Real-time Processing**: Cron jobs process due reminders every 5 minutes

## 🗄️ Database Setup

### 1. Run the Migration

The reminder feature requires a new database table. Run the migration script:

```bash
cd backend
npm run migrate
```

Or manually execute the SQL in `backend/migrations/add_reminders_table.sql`:

```sql
-- Add reminders table for user-defined notification reminders
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  reminder_time TIMESTAMPTZ NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern VARCHAR(50) CHECK (
    recurrence_pattern IN (
      'daily',
      'weekly',
      'monthly',
      'yearly'
    )
  ),
  is_active BOOLEAN DEFAULT true,
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for reminders table
CREATE INDEX idx_reminders_user_id ON reminders(user_id);
CREATE INDEX idx_reminders_chat_id ON reminders(chat_id);
CREATE INDEX idx_reminders_reminder_time ON reminders(reminder_time);
CREATE INDEX idx_reminders_is_active ON reminders(is_active);
CREATE INDEX idx_reminders_is_sent ON reminders(is_sent);
CREATE INDEX idx_reminders_created_at ON reminders(created_at);

-- Enable RLS for reminders table
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies for reminders
CREATE POLICY "Users can select their own reminders"
  ON reminders
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own reminders"
  ON reminders
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reminders"
  ON reminders
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own reminders"
  ON reminders
  FOR DELETE
  USING (user_id = auth.uid());

-- Add reminder-related notification types to existing notifications table
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS check_notification_type;

ALTER TABLE notifications 
ADD CONSTRAINT check_notification_type 
CHECK (notification_type IN (
  'chat_inactive_2days',
  'chat_inactive_4days', 
  'fundraiser_inactive_2days',
  'fundraiser_inactive_4days',
  'system_alert',
  'status_update',
  'user_reminder',
  'chat_reminder'
));
```

## 🚀 Backend Setup

### 1. New Files Added

- `backend/controllers/reminderController.js` - Handles reminder CRUD operations
- `backend/validators/reminder.validation.js` - Input validation for reminders
- `backend/routes/reminderRoutes.js` - API routes for reminders
- `backend/migrations/add_reminders_table.sql` - Database migration

### 2. Updated Files

- `backend/index.js` - Added reminder routes
- `backend/services/cronService.js` - Added reminder processing cron job

### 3. API Endpoints

```
POST   /api/reminders              - Create a new reminder
GET    /api/reminders              - Get user's reminders
GET    /api/reminders/:id          - Get specific reminder
PATCH  /api/reminders/:id          - Update reminder
DELETE /api/reminders/:id          - Delete reminder
PATCH  /api/reminders/:id/toggle   - Toggle reminder status
POST   /api/reminders/process-due  - Process due reminders (cron)
```

## 🎨 Frontend Setup

### 1. New Files Added

- `src/services/reminder.ts` - Frontend API service for reminders
- `src/components/ReminderModal.tsx` - Modal for creating/editing reminders
- `src/components/RemindersList.tsx` - Component to display and manage reminders

### 2. Updated Files

- `src/types/index.ts` - Added Reminder and ReminderStats interfaces
- `src/components/ChatInterface.tsx` - Added reminders button and panel

### 3. New UI Features

- **Reminders Button**: Clock icon in the top-right corner next to notifications
- **Reminders Panel**: Slide-out panel showing all user reminders
- **Create/Edit Modal**: Form for creating and editing reminders
- **Reminder Management**: Toggle, edit, and delete reminders

## ⚙️ Configuration

### 1. Environment Variables

#### For Development (Local Testing)

If you're testing locally, update your `.env` file to point to the local backend:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_SERVICE_KEY=your_supabase_service_key
```

**Quick Setup Scripts:**
- Run `./setup-dev-env.sh` to configure for local development
- Run `./restore-env.sh` to restore production settings

#### For Production

Ensure your `.env` file has the required configuration:

```env
VITE_API_URL=https://api.smartbrew.in/api
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_SERVICE_KEY=your_supabase_service_key
```

### 2. Cron Jobs

The system automatically processes reminders every 5 minutes. The cron job is configured in `backend/services/cronService.js`:

```javascript
// Process due reminders every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('🕐 Running reminder processing...');
  try {
    const result = await processDueReminders();
    console.log('✅ Reminder processing completed');
  } catch (error) {
    console.error('❌ Reminder processing failed:', error);
  }
}, {
  timezone: "Asia/Kolkata"
});
```

## 🎯 How It Works

### 1. Creating Reminders

1. Click the clock icon (🕐) in the top-right corner
2. Click "New Reminder" button
3. Fill in the form:
   - **Title**: Reminder title
   - **Message**: Reminder message
   - **Chat**: Optional - select a specific chat
   - **Reminder Time**: When the reminder should trigger
   - **Recurring**: Enable for recurring reminders
   - **Recurrence Pattern**: Daily, weekly, monthly, or yearly
   - **Active**: Enable/disable the reminder

### 2. Automatic Processing

- Every 5 minutes, the system checks for due reminders
- When a reminder is due, it creates a notification
- For recurring reminders, it automatically schedules the next occurrence
- Notifications appear in the notifications panel

### 3. Reminder Types

- **General Reminders**: Not tied to any specific chat
- **Chat Reminders**: Associated with a specific chat
- **Recurring Reminders**: Automatically repeat based on the pattern
- **One-time Reminders**: Trigger once and are marked as sent

## 🔧 Troubleshooting

### 1. Migration Issues

If the migration fails, manually execute the SQL commands in your Supabase dashboard.

### 2. Cron Job Issues

Check the backend logs for cron job errors:

```bash
cd backend
npm start
```

### 3. Frontend Issues

Ensure all new components are properly imported and the types are updated.

## 🎉 Features Summary

✅ **Custom Reminders**: Set reminders for any chat or general purpose  
✅ **Recurring Reminders**: Daily, weekly, monthly, yearly patterns  
✅ **Real-time Processing**: Automatic reminder processing every 5 minutes  
✅ **Modern UI**: Beautiful, responsive interface with animations  
✅ **Chat Integration**: Reminders can be tied to specific chats  
✅ **Status Management**: Enable/disable reminders as needed  
✅ **Automatic Notifications**: Due reminders create notifications automatically  

## 🚀 Next Steps

1. Run the database migration
2. Start the backend server
3. Test the reminder creation and processing
4. Verify notifications are created when reminders are due
5. Test recurring reminders functionality

The reminder feature is now fully integrated into Smart Spidy! 🎯
