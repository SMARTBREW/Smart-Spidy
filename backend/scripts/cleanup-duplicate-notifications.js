const { supabaseAdmin } = require('../config/supabase');

const cleanupDuplicateNotifications = async () => {
  try {
    console.log('🧹 Starting duplicate notification cleanup...');
    
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
    Object.values(groupedNotifications).forEach(group => {
      if (group.length > 1) {
        // Keep the first notification, delete the rest
        const duplicates = group.slice(1);
        duplicatesToDelete.push(...duplicates);
        console.log(`🔍 Found ${group.length} notifications for chat ${group[0].chat_id}, type ${group[0].notification_type} - keeping 1, deleting ${duplicates.length}`);
      }
    });

    if (duplicatesToDelete.length > 0) {
      // Delete duplicate notifications
      const duplicateIds = duplicatesToDelete.map(n => n.id);
      
      const { error: deleteError } = await supabaseAdmin
        .from('notifications')
        .delete()
        .in('id', duplicateIds);

      if (deleteError) {
        console.error('❌ Error deleting duplicate notifications:', deleteError);
        return;
      }

      console.log(`✅ Successfully deleted ${duplicatesToDelete.length} duplicate notifications`);
    } else {
      console.log('ℹ️ No duplicate notifications found');
    }

    console.log('🎉 Duplicate notification cleanup completed!');

  } catch (error) {
    console.error('❌ Error in duplicate notification cleanup:', error);
  }
};

// Run the cleanup
cleanupDuplicateNotifications()
  .then(() => {
    console.log('✅ Cleanup script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Cleanup script failed:', error);
    process.exit(1);
  }); 