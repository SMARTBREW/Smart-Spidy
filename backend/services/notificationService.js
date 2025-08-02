const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

// Helper function to check if notification already exists for a chat today
const checkExistingNotification = async (chatId, notificationType) => {
  try {
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    
    const { data: existingNotifications, error } = await supabaseAdmin
      .from('notifications')
      .select('id')
      .eq('chat_id', chatId)
      .eq('notification_type', notificationType)
      .gte('created_at', todayStart.toISOString())
      .limit(1);

    if (error) {
      console.error('❌ Error checking existing notifications:', error);
      return false;
    }

    return existingNotifications && existingNotifications.length > 0;
  } catch (error) {
    console.error('❌ Error checking existing notifications:', error);
    return false;
  }
};

// Generate notifications for inactive chats (2-day and 5-day)
const generateInactiveChatNotifications = async () => {
  try {
    console.log('🔄 Starting daily inactive chat notification generation...');
    
    const today = new Date();
    const twoDaysAgo = new Date(today.getTime() - (2 * 24 * 60 * 60 * 1000));
    const fiveDaysAgo = new Date(today.getTime() - (5 * 24 * 60 * 60 * 1000));
    
    // Set time to start and end of the target days
    const twoDaysAgoStart = new Date(twoDaysAgo);
    twoDaysAgoStart.setHours(0, 0, 0, 0);
    const twoDaysAgoEnd = new Date(twoDaysAgo);
    twoDaysAgoEnd.setHours(23, 59, 59, 999);
    
    const fiveDaysAgoStart = new Date(fiveDaysAgo);
    fiveDaysAgoStart.setHours(0, 0, 0, 0);
    const fiveDaysAgoEnd = new Date(fiveDaysAgo);
    fiveDaysAgoEnd.setHours(23, 59, 59, 999);

    // Find chats inactive for at least 2 days (any status, not gold)
    const { data: twoDayInactiveChats, error: twoDayError } = await supabaseAdmin
      .from('chats')
      .select(`
        id,
        name,
        user_id,
        message_count,
        updated_at,
        status,
        is_gold
      `)
      .lt('updated_at', twoDaysAgoStart.toISOString()) // Find chats inactive for at least 2 days
      .eq('is_gold', false); // Only regular chats, not fundraisers

    if (twoDayError) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error fetching 2-day inactive chats: ${twoDayError.message}`);
    }

    // Find chats inactive for at least 5 days (any status, not gold)
    const { data: fiveDayInactiveChats, error: fiveDayError } = await supabaseAdmin
      .from('chats')
      .select(`
        id,
        name,
        user_id,
        message_count,
        updated_at,
        status,
        is_gold
      `)
      .lt('updated_at', fiveDaysAgoStart.toISOString()) // Find chats inactive for at least 5 days
      .eq('is_gold', false); // Only regular chats, not fundraisers

    if (fiveDayError) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error fetching 5-day inactive chats: ${fiveDayError.message}`);
    }

    console.log(`📊 Found ${twoDayInactiveChats.length} 2-day inactive chats and ${fiveDayInactiveChats.length} 5-day inactive chats`);

    // Filter out chats that already have notifications today
    const twoDayNotifications = [];
    const fiveDayNotifications = [];

    // Check and create 2-day notifications
    for (const chat of twoDayInactiveChats) {
      const hasExistingNotification = await checkExistingNotification(chat.id, 'chat_inactive_2days');
      if (!hasExistingNotification) {
        twoDayNotifications.push({
          chat_id: chat.id,
          user_id: chat.user_id,
          title: 'Chat Inactive Alert',
          message: `Chat "${chat.name}" has been inactive for 2 days. Consider re-engaging!`,
          chat_name: chat.name,
          message_count: chat.message_count,
          days_inactive: 2,
          last_activity_date: chat.updated_at,
          notification_type: 'chat_inactive_2days',
          is_read: false,
          is_sent: false
        });
      }
    }

    // Check and create 5-day notifications
    for (const chat of fiveDayInactiveChats) {
      const hasExistingNotification = await checkExistingNotification(chat.id, 'chat_inactive_4days');
      if (!hasExistingNotification) {
        fiveDayNotifications.push({
          chat_id: chat.id,
          user_id: chat.user_id,
          title: 'Chat Action Required',
          message: `Chat "${chat.name}" has been inactive for 5 days. Time to take action!`,
          chat_name: chat.name,
          message_count: chat.message_count,
          days_inactive: 5,
          last_activity_date: chat.updated_at,
          notification_type: 'chat_inactive_4days', // Changed from 5days to 4days to match DB constraint
          is_read: false,
          is_sent: false
        });
      }
    }

    // Insert all notifications
    const allNotifications = [...twoDayNotifications, ...fiveDayNotifications];
    
    if (allNotifications.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('notifications')
        .insert(allNotifications);

      if (insertError) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error inserting notifications: ${insertError.message}`);
      }

      console.log(`✅ Generated ${twoDayNotifications.length} 2-day notifications and ${fiveDayNotifications.length} 5-day notifications`);
    } else {
      console.log('ℹ️ No new inactive chat notifications to generate (all existing)');
    }

    return {
      twoDayCount: twoDayNotifications.length,
      fiveDayCount: fiveDayNotifications.length,
      totalGenerated: allNotifications.length
    };

  } catch (error) {
    console.error('❌ Error generating inactive chat notifications:', error);
    throw error;
  }
};

// Generate notifications for inactive fundraisers (2-day and 5-day)
const generateInactiveFundraiserChatNotifications = async () => {
  try {
    console.log('🔄 Starting daily inactive fundraiser notification generation...');
    
    const today = new Date();
    const twoDaysAgo = new Date(today.getTime() - (2 * 24 * 60 * 60 * 1000));
    const fiveDaysAgo = new Date(today.getTime() - (5 * 24 * 60 * 60 * 1000));
    
    // Set time to start and end of the target days
    const twoDaysAgoStart = new Date(twoDaysAgo);
    twoDaysAgoStart.setHours(0, 0, 0, 0);
    const twoDaysAgoEnd = new Date(twoDaysAgo);
    twoDaysAgoEnd.setHours(23, 59, 59, 999);
    
    const fiveDaysAgoStart = new Date(fiveDaysAgo);
    fiveDaysAgoStart.setHours(0, 0, 0, 0);
    const fiveDaysAgoEnd = new Date(fiveDaysAgo);
    fiveDaysAgoEnd.setHours(23, 59, 59, 999);

    // Find fundraisers (is_gold: true) inactive for at least 2 days (any status)
    const { data: twoDayInactiveFundraisers, error: twoDayError } = await supabaseAdmin
      .from('chats')
      .select(`
        id,
        name,
        user_id,
        message_count,
        updated_at,
        status,
        is_gold
      `)
      .lt('updated_at', twoDaysAgoStart.toISOString()) // Find fundraisers inactive for at least 2 days
      .eq('is_gold', true); // Only fundraisers

    if (twoDayError) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error fetching 2-day inactive fundraisers: ${twoDayError.message}`);
    }

    // Find fundraisers (is_gold: true) inactive for at least 5 days (any status)
    const { data: fiveDayInactiveFundraisers, error: fiveDayError } = await supabaseAdmin
      .from('chats')
      .select(`
        id,
        name,
        user_id,
        message_count,
        updated_at,
        status,
        is_gold
      `)
      .lt('updated_at', fiveDaysAgoStart.toISOString()) // Find fundraisers inactive for at least 5 days
      .eq('is_gold', true); // Only fundraisers

    if (fiveDayError) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error fetching 5-day inactive fundraisers: ${fiveDayError.message}`);
    }

    console.log(`📊 Found ${twoDayInactiveFundraisers.length} 2-day inactive fundraisers and ${fiveDayInactiveFundraisers.length} 5-day inactive fundraisers`);

    // Filter out fundraisers that already have notifications today
    const twoDayNotifications = [];
    const fiveDayNotifications = [];

    // Check and create 2-day fundraiser notifications
    for (const fundraiser of twoDayInactiveFundraisers) {
      const hasExistingNotification = await checkExistingNotification(fundraiser.id, 'fundraiser_inactive_2days');
      if (!hasExistingNotification) {
        twoDayNotifications.push({
          chat_id: fundraiser.id,
          user_id: fundraiser.user_id,
          title: 'Fundraiser Alert',
          message: `Your fundraiser "${fundraiser.name}" has been inactive for 2 days. Don't lose momentum!`,
          chat_name: fundraiser.name,
          message_count: fundraiser.message_count,
          days_inactive: 2,
          last_activity_date: fundraiser.updated_at,
          notification_type: 'fundraiser_inactive_2days',
          is_read: false,
          is_sent: false
        });
      }
    }

    // Check and create 5-day fundraiser notifications
    for (const fundraiser of fiveDayInactiveFundraisers) {
      const hasExistingNotification = await checkExistingNotification(fundraiser.id, 'fundraiser_inactive_4days');
      if (!hasExistingNotification) {
        fiveDayNotifications.push({
          chat_id: fundraiser.id,
          user_id: fundraiser.user_id,
          title: 'Fundraiser Action Required',
          message: `Your fundraiser "${fundraiser.name}" has been inactive for 5 days. Immediate action required!`,
          chat_name: fundraiser.name,
          message_count: fundraiser.message_count,
          days_inactive: 5,
          last_activity_date: fundraiser.updated_at,
          notification_type: 'fundraiser_inactive_4days', // Changed from 5days to 4days to match DB constraint
          is_read: false,
          is_sent: false
        });
      }
    }

    // Insert all notifications
    const allNotifications = [...twoDayNotifications, ...fiveDayNotifications];
    
    if (allNotifications.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('notifications')
        .insert(allNotifications);

      if (insertError) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error inserting fundraiser notifications: ${insertError.message}`);
      }

      console.log(`✅ Generated ${twoDayNotifications.length} 2-day fundraiser notifications and ${fiveDayNotifications.length} 5-day fundraiser notifications`);
    } else {
      console.log('ℹ️ No new inactive fundraiser notifications to generate (all existing)');
    }

    return {
      twoDayCount: twoDayNotifications.length,
      fiveDayCount: fiveDayNotifications.length,
      totalGenerated: allNotifications.length
    };

  } catch (error) {
    console.error('❌ Error generating inactive fundraiser notifications:', error);
    throw error;
  }
};

// Clean up old notifications (remove notifications from previous days)
const cleanupOldNotifications = async () => {
  try {
    console.log('🧹 Starting daily notification cleanup...');
    
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);

    // Remove all notifications not created today
    const { data: deletedNotifications, error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .lt('created_at', todayStart.toISOString())
      .select('id');

    if (error) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error cleaning up old notifications: ${error.message}`);
    }

    console.log(`✅ Cleaned up ${deletedNotifications?.length || 0} old notifications (removed notifications from previous days)`);
    return { deletedCount: deletedNotifications?.length || 0 };

  } catch (error) {
    console.error('❌ Error cleaning up old notifications:', error);
    throw error;
  }
};

// Update last_activity when a message is sent
const updateChatLastActivity = async (chatId) => {
  try {
    const { error } = await supabaseAdmin
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId);

    if (error) {
      console.error('❌ Error updating chat updated_at:', error);
    }
  } catch (error) {
    console.error('❌ Error updating chat updated_at:', error);
  }
};

// Update fundraiser last_activity when a message is sent
const updateFundraiserLastActivity = async (fundraiserId) => {
  try {
    const { error } = await supabaseAdmin
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', fundraiserId)
      .eq('is_gold', true);

    if (error) {
      console.error('❌ Error updating fundraiser updated_at:', error);
    }
  } catch (error) {
    console.error('❌ Error updating fundraiser updated_at:', error);
  }
};

// Main function to run all notification generation
const generateAllNotifications = async () => {
  try {
    console.log('🚀 Starting daily notification generation process...');
    
    // First, clean up old notifications from previous days
    const cleanupResults = await cleanupOldNotifications();
    
    // Then generate new notifications for today
    const chatResults = await generateInactiveChatNotifications();
    const fundraiserResults = await generateInactiveFundraiserChatNotifications();

    console.log('✅ Daily notification generation process completed successfully');
    
    return {
      cleanup: cleanupResults,
      chatNotifications: chatResults,
      fundraiserNotifications: fundraiserResults,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error in notification generation process:', error);
    throw error;
  }
};

module.exports = {
  generateInactiveChatNotifications,
  generateInactiveFundraiserChatNotifications,
  cleanupOldNotifications,
  updateChatLastActivity,
  updateFundraiserLastActivity,
  generateAllNotifications
}; 