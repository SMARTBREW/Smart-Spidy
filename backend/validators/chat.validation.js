const Joi = require('joi');
const { uuid } = require('./custom.validation');

const createChat = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    user_id: Joi.string().custom(uuid).required(),
    instagram_username: Joi.string().optional().allow(''),
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
    user_id: Joi.string().custom(uuid),
    profession: Joi.string(),
    product: Joi.string(),
    gender: Joi.string(),
  }),
};

const getChat = {
  params: Joi.object().keys({
    id: Joi.string().custom(uuid),
  }),
};

const updateChat = {
  params: Joi.object().keys({
    id: Joi.string().custom(uuid),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      status: Joi.string().valid('green', 'yellow', 'red', 'gold').allow(null),
      pinned: Joi.boolean(),
      pinned_at: Joi.date().allow(null),
      instagram_username: Joi.string().allow(''),
      profession: Joi.string().allow(''),
      product: Joi.string().allow(''),
      gender: Joi.string().allow(''),
      message_count: Joi.number().integer().min(0),
    })
    .min(1),
};

const deleteChat = {
  params: Joi.object().keys({
    id: Joi.string().custom(uuid),
  }),
};

const updateChatStatus = {
  params: Joi.object().keys({
    id: Joi.string().custom(uuid),
  }),
  body: Joi.object().keys({
    status: Joi.string().valid('green', 'yellow', 'red', null),
    makeGold: Joi.boolean(),
  }),
};

const pinChat = {
  params: Joi.object().keys({
    id: Joi.string().custom(uuid),
  }),
  body: Joi.object().keys({
    pinned: Joi.boolean().required(),
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
}; 