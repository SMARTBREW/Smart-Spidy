const httpStatus = require('http-status');
const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const sanitizeReminder = (reminder) => ({
  id: reminder.id,
  userId: reminder.user_id,
  chatId: reminder.chat_id,
  title: reminder.title,
  message: reminder.message,
  reminderTime: reminder.reminder_time,
  isRecurring: reminder.is_recurring,
  recurrencePattern: reminder.recurrence_pattern,
  isActive: reminder.is_active,
  isSent: reminder.is_sent,
  sentAt: reminder.sent_at,
  createdAt: reminder.created_at,
  updatedAt: reminder.updated_at
});

// Create a new reminder
const createReminder = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const reminderData = {
    ...req.body,
    user_id: userId
  };

  const { data: reminder, error } = await supabaseAdmin
    .from('reminders')
    .insert(reminderData)
    .select('*')
    .single();

  if (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }

  res.status(httpStatus.CREATED).send(sanitizeReminder(reminder));
});

// Get user's reminders
const getUserReminders = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { data: reminders, error } = await supabaseAdmin
    .from('reminders')
    .select(`
      *,
      chats!reminders_chat_id_fkey (
        id,
        name
      )
    `)
    .eq('user_id', userId)
    .order('reminder_time', { ascending: true });

  if (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }

  const sanitizedReminders = reminders?.map(reminder => ({
    ...sanitizeReminder(reminder),
    chatName: reminder.chats?.name || 'General Reminder'
  })) || [];

  res.send({
    reminders: sanitizedReminders,
    count: sanitizedReminders.length
  });
});

// Get a specific reminder
const getReminder = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const { data: reminder, error } = await supabaseAdmin
    .from('reminders')
    .select(`
      *,
      chats!reminders_chat_id_fkey (
        id,
        name
      )
    `)
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Reminder not found');
  }

  const sanitizedReminder = {
    ...sanitizeReminder(reminder),
    chatName: reminder.chats?.name || 'General Reminder'
  };

  res.send(sanitizedReminder);
});

// Update a reminder
const updateReminder = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const updateData = req.body;

  const { data: reminder, error } = await supabaseAdmin
    .from('reminders')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Reminder not found');
  }

  res.send(sanitizeReminder(reminder));
});

// Delete a reminder
const deleteReminder = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const { error } = await supabaseAdmin
    .from('reminders')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }

  res.status(httpStatus.NO_CONTENT).send();
});

// Toggle reminder active status
const toggleReminderStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // First get the current status
  const { data: currentReminder, error: fetchError } = await supabaseAdmin
    .from('reminders')
    .select('is_active')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (fetchError) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Reminder not found');
  }

  // Toggle the status
  const newStatus = !currentReminder.is_active;

  const { data: reminder, error } = await supabaseAdmin
    .from('reminders')
    .update({ is_active: newStatus })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }

  res.send(sanitizeReminder(reminder));
});

// Process due reminders and create notifications (for cron jobs)
const processDueRemindersCron = async () => {
  const now = new Date();
  
  // Calculate 5 minutes from now - this is when we want to send notifications
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
  
  const { data: dueReminders, error } = await supabaseAdmin
    .from('reminders')
    .select(`
      *,
      chats!reminders_chat_id_fkey (
        id,
        name
      )
    `)
    .eq('is_active', true)
    .eq('is_sent', false)
    .lte('reminder_time', fiveMinutesFromNow.toISOString())  // Process reminders due within next 5 minutes
    .gte('reminder_time', now.toISOString());  // But not already past due

  if (error) {
    console.error('Error fetching due reminders:', error);
    return { processedReminders: [], createdNotifications: [], count: 0 };
  }

  const processedReminders = [];
  const createdNotifications = [];

  for (const reminder of dueReminders || []) {
    try {
      // Create notification for the reminder (5 minutes before due time)
      const reminderTime = new Date(reminder.reminder_time);
      const timeUntilDue = Math.ceil((reminderTime.getTime() - now.getTime()) / (1000 * 60)); // minutes
      
      const notificationData = {
        user_id: reminder.user_id,
        chat_id: reminder.chat_id,
        title: `⏰ ${reminder.title}`,
        message: `${reminder.message}\n\n⏰ Due in ${timeUntilDue} minute${timeUntilDue !== 1 ? 's' : ''}`,
        chat_name: reminder.chats?.name || 'General Reminder',
        message_count: 0,
        days_inactive: 0,
        last_activity_date: now.toISOString(),
        notification_type: reminder.chat_id ? 'chat_reminder' : 'user_reminder',
        is_read: false,
        is_sent: false
      };

      const { data: notification, error: notificationError } = await supabaseAdmin
        .from('notifications')
        .insert(notificationData)
        .select('*')
        .single();

      if (notificationError) {
        console.error('Error creating notification for reminder:', notificationError);
        continue;
      }

      // Update reminder as sent
      const { error: updateError } = await supabaseAdmin
        .from('reminders')
        .update({ 
          is_sent: true, 
          sent_at: now.toISOString() 
        })
        .eq('id', reminder.id);

      if (updateError) {
        console.error('Error updating reminder status:', updateError);
      }

      // Handle recurring reminders
      if (reminder.is_recurring && reminder.recurrence_pattern) {
        const nextReminderTime = calculateNextReminderTime(reminder.reminder_time, reminder.recurrence_pattern);
        
        if (nextReminderTime) {
          const { error: recurringError } = await supabaseAdmin
            .from('reminders')
            .update({ 
              reminder_time: nextReminderTime.toISOString(),
              is_sent: false,
              sent_at: null
            })
            .eq('id', reminder.id);

          if (recurringError) {
            console.error('Error updating recurring reminder:', recurringError);
          }
        }
      }

      processedReminders.push(sanitizeReminder(reminder));
      createdNotifications.push(notification);

    } catch (error) {
      console.error('Error processing reminder:', error);
    }
  }

  return {
    processedReminders,
    createdNotifications,
    count: processedReminders.length
  };
};

// Process due reminders and create notifications (for API endpoints)
const processDueReminders = catchAsync(async (req, res) => {
  const result = await processDueRemindersCron();
  res.send(result);
});

// Helper function to calculate next reminder time for recurring reminders
const calculateNextReminderTime = (currentTime, pattern) => {
  const date = new Date(currentTime);
  
  switch (pattern) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      return null;
  }
  
  return date;
};

module.exports = {
  createReminder,
  getUserReminders,
  getReminder,
  updateReminder,
  deleteReminder,
  toggleReminderStatus,
  processDueReminders,
  processDueRemindersCron
};
