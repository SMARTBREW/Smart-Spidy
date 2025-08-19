const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');


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
      console.error('Error checking existing notifications:', error);
      return false;
    }

    return existingNotifications && existingNotifications.length > 0;
  } catch (error) {
    console.error('Error checking existing notifications:', error);
    return false;
  }
};


const generateInactiveChatNotifications = async () => {
  try {
    console.log('Starting daily inactive chat notification generation...');
    
    const today = new Date();
    const twoDaysAgo = new Date(today.getTime() - (2 * 24 * 60 * 60 * 1000));
    const fiveDaysAgo = new Date(today.getTime() - (5 * 24 * 60 * 60 * 1000));
    

    const twoDaysAgoStart = new Date(twoDaysAgo);
    twoDaysAgoStart.setHours(0, 0, 0, 0);
    const twoDaysAgoEnd = new Date(twoDaysAgo);
    twoDaysAgoEnd.setHours(23, 59, 59, 999);
    
    const fiveDaysAgoStart = new Date(fiveDaysAgo);
    fiveDaysAgoStart.setHours(0, 0, 0, 0);
    const fiveDaysAgoEnd = new Date(fiveDaysAgo);
    fiveDaysAgoEnd.setHours(23, 59, 59, 999);


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
      .gte('updated_at', twoDaysAgoStart.toISOString())
      .lt('updated_at', twoDaysAgoEnd.toISOString())
      .or('is_gold.eq.true,status.neq.null')

    if (twoDayError) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error fetching 2-day inactive chats: ${twoDayError.message}`);
    }


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
      .gte('updated_at', fiveDaysAgoStart.toISOString())
      .lt('updated_at', fiveDaysAgoEnd.toISOString())
      .or('is_gold.eq.true,status.neq.null')

    if (fiveDayError) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error fetching 5-day inactive chats: ${fiveDayError.message}`);
    }

    console.log(`Found ${twoDayInactiveChats.length} chats inactive for exactly 2 days and ${fiveDayInactiveChats.length} chats inactive for exactly 5 days`);


    const twoDayNotifications = [];
    const fiveDayNotifications = [];


    for (const chat of twoDayInactiveChats) {
      const has2DayNotification = await checkExistingNotification(chat.id, 'chat_inactive_2days');
      const has5DayNotification = await checkExistingNotification(chat.id, 'chat_inactive_4days');
      
      if (!has2DayNotification && !has5DayNotification) {
        const shouldNotify = 
          (!chat.is_gold && chat.status === 'green') ||
          (!chat.is_gold && chat.status === 'yellow') ||
          (chat.is_gold && chat.status === 'green') ||
          (chat.is_gold && chat.status === 'yellow') ||
          (chat.is_gold && !chat.status);

        if (shouldNotify) {
          const isFundraiser = chat.is_gold;
          const title = isFundraiser ? 'Fundraiser Alert' : 'Chat Inactive Alert';
          const message = isFundraiser 
            ? `Your fundraiser "${chat.name}" has been inactive for 2 days. Don't lose momentum!`
            : `Chat "${chat.name}" has been inactive for 2 days. Consider re-engaging!`;

          twoDayNotifications.push({
            chat_id: chat.id,
            user_id: chat.user_id,
            title: title,
            message: message,
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
    }


    for (const chat of fiveDayInactiveChats) {
      const has2DayNotification = await checkExistingNotification(chat.id, 'chat_inactive_2days');
      const has5DayNotification = await checkExistingNotification(chat.id, 'chat_inactive_4days');
      
      if (!has2DayNotification && !has5DayNotification) {
        const shouldNotify = 
          (!chat.is_gold && chat.status === 'red') ||
          (chat.is_gold && chat.status === 'red');

        if (shouldNotify) {
          const isFundraiser = chat.is_gold;
          const title = isFundraiser ? 'Fundraiser Action Required' : 'Chat Action Required';
          const message = isFundraiser 
            ? `Your fundraiser "${chat.name}" has been inactive for 5 days. Immediate action required!`
            : `Chat "${chat.name}" has been inactive for 5 days. Time to take action!`;

          fiveDayNotifications.push({
            chat_id: chat.id,
            user_id: chat.user_id,
            title: title,
            message: message,
            chat_name: chat.name,
            message_count: chat.message_count,
            days_inactive: 5,
            last_activity_date: chat.updated_at,
            notification_type: 'chat_inactive_4days',
            is_read: false,
            is_sent: false
          });
        }
      }
    }


    const allNotifications = [...twoDayNotifications, ...fiveDayNotifications];
    
    if (allNotifications.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('notifications')
        .insert(allNotifications);

      if (insertError) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error inserting notifications: ${insertError.message}`);
      }

      console.log(`Generated ${twoDayNotifications.length} 2-day notifications and ${fiveDayNotifications.length} 5-day notifications`);
    } else {
      console.log('No new inactive chat notifications to generate (all existing)');
    }

    return {
      twoDayCount: twoDayNotifications.length,
      fiveDayCount: fiveDayNotifications.length,
      totalGenerated: allNotifications.length
    };

  } catch (error) {
    console.error('Error generating inactive chat notifications:', error);
    throw error;
  }
};




const cleanupOldNotifications = async () => {
  try {
    console.log('Starting daily notification cleanup...');
    
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);


    const { data: deletedNotifications, error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .lt('created_at', todayStart.toISOString())
      .select('id');

    if (error) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Error cleaning up old notifications: ${error.message}`);
    }

    console.log(`Cleaned up ${deletedNotifications?.length || 0} old notifications (removed notifications from previous days)`);
    return { deletedCount: deletedNotifications?.length || 0 };

  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
    throw error;
  }
};


const updateChatLastActivity = async (chatId) => {
  try {
    const { error } = await supabaseAdmin
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId);

    if (error) {
      console.error('Error updating chat updated_at:', error);
    }
  } catch (error) {
    console.error('Error updating chat updated_at:', error);
  }
};


const updateFundraiserLastActivity = async (fundraiserId) => {
  try {
    const { error } = await supabaseAdmin
      .from('chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', fundraiserId)
      .eq('is_gold', true);

    if (error) {
      console.error('Error updating fundraiser updated_at:', error);
    }
  } catch (error) {
    console.error('Error updating fundraiser updated_at:', error);
  }
};


const generateAllNotifications = async () => {
  try {
    console.log('Starting daily notification generation process...');
    
    const cleanupResults = await cleanupOldNotifications();
    const notificationResults = await generateInactiveChatNotifications();

    console.log('Daily notification generation process completed successfully');
    
    return {
      cleanup: cleanupResults,
      notifications: notificationResults,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error in notification generation process:', error);
    throw error;
  }
};

module.exports = {
  generateInactiveChatNotifications,
  cleanupOldNotifications,
  updateChatLastActivity,
  updateFundraiserLastActivity,
  generateAllNotifications
}; 