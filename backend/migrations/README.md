# Database Migrations

This directory contains database migrations for the Smart-Spidy application.

## Current Migrations

### 1. Add timeout_reason to user_sessions table

**File:** `add_timeout_reason_to_user_sessions.sql`

**Purpose:** Add a field to track why user sessions ended (manual logout, inactivity, server cleanup, etc.)

**Changes:**
- Adds `timeout_reason` VARCHAR(50) column to `user_sessions` table
- Adds CHECK constraint to ensure valid values
- Adds index for better query performance
- Updates existing sessions with appropriate default values

**Valid timeout_reason values:**
- `manual_logout` - User manually logged out
- `inactivity` - Session timed out due to user inactivity
- `server_cleanup` - Session cleaned up by server cron job
- `token_expired` - JWT token expired
- `user_deleted` - User account was deleted
- `system_timeout` - System-initiated timeout

## Running Migrations

### Option 1: Using npm script
```bash
cd backend
npm run migrate
```

### Option 2: Manual execution
```bash
cd backend
node scripts/run_migration.js
```

### Option 3: Direct SQL execution
You can also run the SQL directly in your database management tool or Supabase dashboard.

## Migration Script Features

- **Safe execution** - Handles errors gracefully
- **Idempotent** - Can be run multiple times safely
- **Progress tracking** - Shows which statements are being executed
- **Error handling** - Continues execution even if some statements fail
- **Validation** - Checks if migration was successful

## Backward Compatibility

The migration is designed to be backward compatible:
- Existing sessions without `timeout_reason` will be updated with appropriate defaults
- Active sessions remain unaffected
- No data loss occurs during migration

## Monitoring

After running the migration, you can monitor session timeouts in the admin dashboard:
- View session statistics
- Filter sessions by timeout reason
- Track session duration patterns
- Monitor auto-logout effectiveness 