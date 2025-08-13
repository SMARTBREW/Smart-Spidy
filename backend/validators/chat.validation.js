const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createChat = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    user_id: Joi.string().custom(objectId).required(),
    instagram_username: Joi.string().optional().allow(''),
    executive_instagram_username: Joi.string().optional().allow(''),
    profession: Joi.string().optional().allow(''),
    product: Joi.string().optional().allow(''),
    gender: Joi.string().optional().allow(''),
  }),
};

const getChats = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    name: Joi.string(),
    status: Joi.string().valid('green', 'yellow', 'red', 'gold'),
    pinned: Joi.boolean(),
    user_id: Joi.string().custom(objectId),
    profession: Joi.string(),
    product: Joi.string(),
    gender: Joi.string(),
  }),
};

const getChat = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
};

const updateChat = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      status: Joi.string().valid('green', 'yellow', 'red', 'gold').allow(null),
      pinned: Joi.boolean(),
      pinned_at: Joi.date().allow(null),
      instagram_username: Joi.string().allow(''),
      executive_instagram_username: Joi.string().allow(''),
      profession: Joi.string().allow(''),
      product: Joi.string().allow(''),
      gender: Joi.string().allow(''),
      message_count: Joi.number().integer().min(0),
    })
    .min(1),
};

const deleteChat = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
};

const updateChatStatus = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    status: Joi.string().valid('green', 'yellow', 'red', null),
    makeGold: Joi.boolean(),
  }),
};

const pinChat = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    pinned: Joi.boolean().required(),
  }),
};

const searchChats = {
  query: Joi.object().keys({
    q: Joi.string().min(1).max(500).required(),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    include_messages: Joi.boolean().default(true),
    user_id: Joi.string().custom(objectId), // For admin to specify which user to search
  }),
};

const getAllChatsForUser = {
  query: Joi.object().keys({
    user_id: Joi.string().custom(objectId), // For admin to specify which user to get chats for
  }),
};

module.exports = {
  createChat,
  getChats,
  getChat,
  updateChat,
  deleteChat,
  updateChatStatus,
  pinChat,
  searchChats,
  getAllChatsForUser,
}; 