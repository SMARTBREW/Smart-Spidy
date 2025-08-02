const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createNotification = {
  body: Joi.object().keys({
    chat_id: Joi.string().custom(objectId).optional(),
    fundraiser_id: Joi.string().custom(objectId).optional(),
    user_id: Joi.string().custom(objectId).optional(),
    title: Joi.string().required().max(255),
    message: Joi.string().required(),
    chat_name: Joi.string().required().max(255),
    message_count: Joi.number().integer().min(0).required(),
    days_inactive: Joi.number().integer().min(0).required(),
    last_activity_date: Joi.date().iso().required(),
    notification_type: Joi.string().valid(
      'chat_inactive_2days',
      'chat_inactive_4days',
      'fundraiser_inactive_2days',
      'fundraiser_inactive_4days',
      'system_alert',
      'status_update'
    ).required(),
    is_read: Joi.boolean().default(false),
    is_sent: Joi.boolean().default(false)
  })
};

const updateNotification = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  }),
  body: Joi.object().keys({
    title: Joi.string().max(255),
    message: Joi.string(),
    is_read: Joi.boolean(),
    is_sent: Joi.boolean(),
    notification_type: Joi.string().valid(
      'chat_inactive_2days',
      'chat_inactive_4days',
      'fundraiser_inactive_2days',
      'fundraiser_inactive_4days',
      'system_alert',
      'status_update'
    )
  }).min(1)
};

const markAsRead = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  })
};

const deleteNotification = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  })
};

const getUserNotifications = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    filter: Joi.string().valid('all', 'unread', 'read').default('all')
  })
};

const getAllNotifications = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    filter: Joi.string().valid('all', 'unread', 'read').default('all'),
    notificationType: Joi.string().valid(
      'chat_inactive_2days',
      'chat_inactive_4days',
      'fundraiser_inactive_2days',
      'fundraiser_inactive_4days',
      'system_alert',
      'status_update'
    )
  })
};

module.exports = {
  createNotification,
  updateNotification,
  markAsRead,
  deleteNotification,
  getUserNotifications,
  getAllNotifications
}; 