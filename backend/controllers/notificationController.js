const httpStatus = require('http-status');
const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const sanitizeNotification = (notification) => ({
  id: notification.id,
  chatId: notification.chat_id,
  fundraiserId: notification.fundraiser_id,
  userId: notification.user_id,
  userName: notification.user_name, // Add user name
  userEmail: notification.user_email, // Add user email
  title: notification.title,
  message: notification.message,
  chatName: notification.chat_name,
  messageCount: notification.message_count,
  daysInactive: notification.days_inactive,
  lastActivityDate: notification.last_activity_date,
  notificationType: notification.notification_type,
  isRead: notification.is_read,
  isSent: notification.is_sent,
  createdAt: notification.created_at,
  sentAt: notification.sent_at
});

const getUserNotifications = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { data: notifications, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
  const sanitizedNotifications = notifications?.map(sanitizeNotification) || [];
  res.send({
    notifications: sanitizedNotifications,
    count: sanitizedNotifications.length
  });
});


const getNotificationStats = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { data: notifications, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', userId);
  if (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
  const total = notifications?.length || 0;
  const unread = notifications?.filter(n => !n.is_read)?.length || 0;
  const read = total - unread;
  res.send({
    total,
    unread,
    read
  });
});


const getAllNotifications = catchAsync(async (req, res) => {
  const { data: notifications, error } = await supabaseAdmin
    .from('notifications')
    .select(`
      *,
      users!notifications_user_id_fkey (
        name,
        email
      )
    `)
    .order('created_at', { ascending: false });
  
  if (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
  
  const sanitizedNotifications = notifications?.map(notification => ({
    ...sanitizeNotification(notification),
    userName: notification.users?.name || 'Unknown User',
    userEmail: notification.users?.email || 'No email'
  })) || [];
  
  res.send({
    notifications: sanitizedNotifications,
    count: sanitizedNotifications.length
  });
});


const markAsRead = catchAsync(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { data: updatedNotification, error } = await supabaseAdmin
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single();
  if (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
  res.send(sanitizeNotification(updatedNotification));
});


const deleteNotification = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (req.user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only admins can delete notifications');
  }
  const { error } = await supabaseAdmin
    .from('notifications')
    .delete()
    .eq('id', id);
  if (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
  res.status(httpStatus.NO_CONTENT).send();
});


const createNotification = catchAsync(async (req, res) => {
  const notificationData = req.body;
  const userId = req.user.id;
  if (!notificationData.user_id) {
    notificationData.user_id = userId;
  }
  const { data: notification, error } = await supabaseAdmin
    .from('notifications')
    .insert(notificationData)
    .select('*')
    .single();
  if (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
  res.status(httpStatus.CREATED).send(sanitizeNotification(notification));
});


const updateNotification = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const userId = req.user.id;
  const { data: updatedNotification, error } = await supabaseAdmin
    .from('notifications')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select('*')
    .single();
  if (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, error.message);
  }
  res.send(sanitizeNotification(updatedNotification));
});

module.exports = {
  getUserNotifications,
  getAllNotifications,
  markAsRead,
  deleteNotification,
  createNotification,
  updateNotification,
  getNotificationStats
}; 