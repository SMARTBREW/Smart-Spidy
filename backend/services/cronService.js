const cron = require('node-cron');
const { generateAllNotifications } = require('./notificationService');

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

// Run daily at 9:00 AM
cron.schedule('0 9 * * *', async () => {
  console.log('🕐 Running scheduled notification generation...');
  try {
    const result = await generateAllNotifications();
    console.log('✅ Scheduled notification generation completed successfully');
    console.log('📊 Results:', result);
  } catch (error) {
    console.error('❌ Scheduled notification generation failed:', error);
  }
}, {
  timezone: "Asia/Kolkata" // Adjust to your timezone
});

// Also run every 6 hours for testing (optional - remove in production)
cron.schedule('0 */6 * * *', async () => {
  console.log('🕐 Running test notification generation...');
  try {
    const result = await generateAllNotifications();
    console.log('✅ Test notification generation completed');
    console.log('📊 Results:', result);
  } catch (error) {
    console.error('❌ Test notification generation failed:', error);
  }
}, {
  timezone: "Asia/Kolkata"
});

// Clean up inactive sessions every 5 minutes
cron.schedule('*/5 * * * *', async () => {
  console.log('🕐 Running session cleanup...');
  try {
    const supabaseAdmin = getSupabaseClient();
    if (!supabaseAdmin) {
      console.log('⚠️  Skipping session cleanup - Supabase not available');
      return;
    }
    
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    
    // Find active sessions that haven't been updated in the last 20 minutes
    const { data: inactiveSessions, error: fetchError } = await supabaseAdmin
      .from('user_sessions')
      .select('*')
      .eq('is_active', true)
      .lt('updated_at', twentyMinutesAgo);

    if (fetchError) {
      console.error('❌ Error fetching inactive sessions:', fetchError);
      return;
    }

    if (inactiveSessions && inactiveSessions.length > 0) {
      console.log(`🔍 Found ${inactiveSessions.length} inactive sessions to cleanup`);
      
      const sessionIds = inactiveSessions.map(session => session.id);
      const currentTime = new Date().toISOString();
      
      // Update sessions to mark them as inactive
      const { error: updateError } = await supabaseAdmin
        .from('user_sessions')
        .update({
          is_active: false,
          logout_time: currentTime,
          session_duration: 1200, // 20 minutes in seconds
          timeout_reason: 'server_cleanup',
          updated_at: currentTime
        })
        .in('id', sessionIds);

      if (updateError) {
        console.error('❌ Error updating inactive sessions:', updateError);
      } else {
        console.log(`✅ Successfully cleaned up ${inactiveSessions.length} inactive sessions`);
      }
    } else {
      console.log('✅ No inactive sessions found');
    }
  } catch (error) {
    console.error('❌ Session cleanup failed:', error);
  }
}, {
  timezone: "Asia/Kolkata"
});

console.log('✅ Cron jobs scheduled:');
console.log('   - Daily notification generation at 9:00 AM');
console.log('   - Test notification generation every 6 hours');
console.log('   - Session cleanup every 5 minutes');
console.log('   - Timezone: Asia/Kolkata'); 