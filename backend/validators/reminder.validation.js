const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createReminder = {
  body: Joi.object().keys({
    chat_id: Joi.string().custom(objectId).optional(),
    title: Joi.string().required().max(500),        // Increased to match database schema
    message: Joi.string().required(),
    reminder_time: Joi.date().iso().required(),
    is_recurring: Joi.boolean().default(false),
    recurrence_pattern: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly').when('is_recurring', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    is_active: Joi.boolean().default(true)
  })
};

const updateReminder = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  }),
  body: Joi.object().keys({
    title: Joi.string().max(500),        // Increased to match database schema
    message: Joi.string(),
    reminder_time: Joi.date().iso(),
    is_recurring: Joi.boolean(),
    recurrence_pattern: Joi.string().valid('daily', 'weekly', 'monthly', 'yearly'),
    is_active: Joi.boolean()
  }).min(1)
};

const getReminder = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  })
};

const deleteReminder = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  })
};

const toggleReminderStatus = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required()
  })
};

const getUserReminders = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    filter: Joi.string().valid('all', 'active', 'inactive', 'due').default('all')
  })
};

module.exports = {
  createReminder,
  updateReminder,
  getReminder,
  deleteReminder,
  toggleReminderStatus,
  getUserReminders
};
