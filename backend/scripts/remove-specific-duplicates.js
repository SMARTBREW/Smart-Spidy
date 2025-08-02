const { supabaseAdmin } = require('../config/supabase');

const removeSpecificDuplicates = async () => {
  try {
    console.log('🧹 Starting specific duplicate removal...');
    
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

    // Find specific duplicates based on chat_name and message_count
    const duplicatesToRemove = [];
    
    // Group by chat_name and message_count to find exact duplicates
    const groupedByChat = {};
    
    todayNotifications.forEach(notification => {
      const key = `${notification.chat_name}_${notification.message_count}`;
      
      if (!groupedByChat[key]) {
        groupedByChat[key] = [];
      }
      
      groupedByChat[key].push(notification);
    });

    // Find duplicates and keep only the first one
    Object.entries(groupedByChat).forEach(([key, group]) => {
      if (group.length > 1) {
        console.log(`🔍 Found ${group.length} notifications for "${group[0].chat_name}" (${group[0].message_count} messages)`);
        
        // Sort by created_at to keep the oldest one
        group.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        // Keep the first (oldest) one, mark the rest for deletion
        const duplicates = group.slice(1);
        duplicatesToRemove.push(...duplicates);
        
        console.log(`   Keeping: ${group[0].id} (created: ${group[0].created_at})`);
        duplicates.forEach(dup => {
          console.log(`   Deleting: ${dup.id} (created: ${dup.created_at})`);
        });
      }
    });

    if (duplicatesToRemove.length > 0) {
      console.log(`🗑️ Removing ${duplicatesToRemove.length} duplicate notifications...`);
      
      // Delete duplicates
      for (const duplicate of duplicatesToRemove) {
        const { error: deleteError } = await supabaseAdmin
          .from('notifications')
          .delete()
          .eq('id', duplicate.id);

        if (deleteError) {
          console.error(`❌ Error deleting ${duplicate.id}:`, deleteError);
        } else {
          console.log(`✅ Deleted: ${duplicate.chat_name} (${duplicate.message_count} messages)`);
        }
      }

      console.log(`✅ Successfully removed ${duplicatesToRemove.length} duplicates`);
    } else {
      console.log('ℹ️ No specific duplicates found');
    }

    // Final count
    const { data: finalNotifications, error: finalError } = await supabaseAdmin
      .from('notifications')
      .select('*')
      .gte('created_at', todayStart.toISOString());

    if (!finalError) {
      console.log(`📊 Final count: ${finalNotifications.length} notifications remaining`);
    }

    console.log('🎉 Specific duplicate removal completed!');

  } catch (error) {
    console.error('❌ Error in specific duplicate removal:', error);
  }
};

// Run the cleanup
removeSpecificDuplicates()
  .then(() => {
    console.log('✅ Specific cleanup script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Specific cleanup script failed:', error);
    process.exit(1);
  }); 