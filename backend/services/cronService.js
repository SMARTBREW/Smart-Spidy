const cron = require('node-cron');
const { generateAllNotifications } = require('./notificationService');
const { processDueRemindersCron } = require('../controllers/reminderController');

console.log('📅 Setting up cron jobs...');

// Function to get Supabase client (only when needed)
const getSupabaseClient = () => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const config = require('../config/config');
    
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      console.warn('⚠️  Supabase configuration not available, skipping session cleanup');
      return null;
    }
    
    return createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  } catch (error) {
    console.warn('⚠️  Failed to create Supabase client:', error.message);
    return null;
  }
};

// Helper to stop the job automatically if an error bubbles up
const createFailSafeJob = ({ name, expression, handler, options }) => {
  const job = cron.schedule(expression, async () => {
    try {
      await handler(job);
    } catch (error) {
      console.error(`❌ ${name} failed:`, error);
      console.warn(`🛑 Stopping "${name}" cron job due to the error.`);
      job.stop();
    }
  }, options);

  return job;
};

// Run daily at 9:00 AM
const dailyNotificationJob = createFailSafeJob({
  name: 'Scheduled notification generation',
  expression: '0 9 * * *',
  options: { timezone: 'Asia/Kolkata' },
  handler: async () => {
    console.log('🕐 Running scheduled notification generation...');
    const result = await generateAllNotifications();
    console.log('✅ Scheduled notification generation completed successfully');
    console.log('📊 Results:', result);
  }
});

// Also run every 6 hours for testing (optional - remove in production)
const recurringNotificationJob = createFailSafeJob({
  name: 'Test notification generation',
  expression: '0 */6 * * *',
  options: { timezone: 'Asia/Kolkata' },
  handler: async () => {
    console.log('🕐 Running test notification generation...');
    const result = await generateAllNotifications();
    console.log('✅ Test notification generation completed');
    console.log('📊 Results:', result);
  }
});

// Process due reminders every 1 minute for more precise timing
const reminderProcessingJob = createFailSafeJob({
  name: 'Reminder processing',
  expression: '* * * * *',
  options: { timezone: 'Asia/Kolkata' },
  handler: async () => {
    console.log('🕐 Running reminder processing...');
    const result = await processDueRemindersCron();
    if (result?.count > 0) {
      console.log(`✅ Reminder processing completed - ${result.count} reminders processed`);
    }
  }
});

// Clean up inactive sessions every 15 minutes (less aggressive)
const sessionCleanupJob = createFailSafeJob({
  name: 'Session cleanup',
  expression: '*/15 * * * *',
  options: { timezone: 'Asia/Kolkata' },
  handler: async () => {
    console.log('🕐 Running session cleanup...');
    const supabaseAdmin = getSupabaseClient();
    if (!supabaseAdmin) {
      console.log('⚠️  Skipping session cleanup - Supabase not available');
      return;
    }
    
    // Use 90 minutes instead of 20 minutes to match frontend timeout
    const ninetyMinutesAgo = new Date(Date.now() - 90 * 60 * 1000).toISOString();
    
    // Find active sessions that haven't been updated in the last 90 minutes
    const { data: inactiveSessions, error: fetchError } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('is_active', true)
      .lt('updated_at', ninetyMinutesAgo);

    if (fetchError) {
      throw fetchError;
    }

    if (inactiveSessions && inactiveSessions.length > 0) {
      console.log(`🔍 Found ${inactiveSessions.length} inactive sessions to cleanup`);
      
      const currentTime = new Date().toISOString();
      
      // Update sessions to mark them as inactive with correct duration calculation
      for (const session of inactiveSessions) {
        const sessionDuration = Math.floor((new Date(currentTime) - new Date(session.login_time)) / 1000);
        
        await supabaseAdmin
          .from('user_sessions')
          .update({
            is_active: false,
            logout_time: currentTime,
            session_duration: sessionDuration, // Calculate actual duration
            timeout_reason: 'server_cleanup',
            updated_at: currentTime
          })
          .eq('id', session.id);
      }

      console.log(`✅ Successfully cleaned up ${inactiveSessions.length} inactive sessions`);
    } else {
      console.log('✅ No inactive sessions found');
    }
  }
});

console.log('✅ Cron jobs scheduled:');
console.log('   - Daily notification generation at 9:00 AM');
console.log('   - Test notification generation every 6 hours');
console.log('   - Reminder processing every 1 minute (notifications 5 min before due)');
console.log('   - Session cleanup every 15 minutes (90 min inactivity threshold)');
console.log('   - Timezone: Asia/Kolkata'); 