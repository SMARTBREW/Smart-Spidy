const { supabaseAdmin } = require('../config/supabase');

const forceCleanupDuplicates = async () => {
  try {
    console.log('🧹 Starting force duplicate notification cleanup...');
    
    // Get all notifications from today
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    
    const { data: todayNotifications, error: fetchError } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .gte('created_at', todayStart.toISOString())
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching notifications:', fetchError);
      return;
    }

    console.log(`📊 Found ${todayNotifications.length} notifications from today`);

    // Group notifications by chat_id and notification_type
    const groupedNotifications = {};
    const duplicatesToDelete = [];

    todayNotifications.forEach(notification => {
      const key = `${notification.chat_id}_${notification.notification_type}`;
      
      if (!groupedNotifications[key]) {
        groupedNotifications[key] = [];
      }
      
      groupedNotifications[key].push(notification);
    });

    // Find duplicates (keep the first one, mark others for deletion)
    Object.entries(groupedNotifications).forEach(([key, group]) => {
      if (group.length > 1) {
        // Keep the first notification, delete the rest
        const duplicates = group.slice(1);
        duplicatesToDelete.push(...duplicates);
        console.log(`🔍 Found ${group.length} notifications for key ${key} - keeping 1, deleting ${duplicates.length}`);
        console.log(`   Chat: ${group[0].chat_name}, Type: ${group[0].notification_type}`);
      }
    });

    if (duplicatesToDelete.length > 0) {
      console.log(`🗑️ Preparing to delete ${duplicatesToDelete.length} duplicate notifications...`);
      
      // Delete duplicate notifications one by one to be safe
      for (const duplicate of duplicatesToDelete) {
        const { error: deleteError } = await supabaseAdmin
          .from('notifications')
          .delete()
          .eq('id', duplicate.id);

        if (deleteError) {
          console.error(`❌ Error deleting notification ${duplicate.id}:`, deleteError);
        } else {
          console.log(`✅ Deleted duplicate: ${duplicate.chat_name} (${duplicate.notification_type})`);
        }
      }

      console.log(`✅ Successfully deleted ${duplicatesToDelete.length} duplicate notifications`);
    } else {
      console.log('ℹ️ No duplicate notifications found');
    }

    // Verify cleanup by checking again
    const { data: remainingNotifications, error: verifyError } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .gte('created_at', todayStart.toISOString());

    if (!verifyError) {
      console.log(`📊 After cleanup: ${remainingNotifications.length} notifications remaining`);
    }

    console.log('🎉 Force duplicate notification cleanup completed!');

  } catch (error) {
    console.error('❌ Error in force duplicate notification cleanup:', error);
  }
};

// Run the cleanup
forceCleanupDuplicates()
  .then(() => {
    console.log('✅ Force cleanup script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Force cleanup script failed:', error);
    process.exit(1);
  }); 