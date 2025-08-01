const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createMessage = {
  body: Joi.object().keys({
    content: Joi.string().required().max(10000),
    sender: Joi.string().valid('user', 'assistant').required(),
    user_id: Joi.string().custom(objectId),
    chat_id: Joi.string().custom(objectId).required(),
    message_order: Joi.number().integer().min(0),
    feedback: Joi.string().max(1000),
  }),
};

const getMessages = {
  params: Joi.object().keys({
    chatId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
  }),
};

const getMessage = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};

const updateMessage = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      content: Joi.string().max(10000),
      feedback: Joi.string().max(1000),
    })
    .min(1),
};

const deleteMessage = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId).required(),
  }),
};

const createMessages = {
  body: Joi.object().keys({
    chat_id: Joi.string().custom(objectId).required(),
    messages: Joi.array()
      .items(
        Joi.object().keys({
          content: Joi.string().required().max(10000),
          sender: Joi.string().valid('user', 'assistant').required(),
          user_id: Joi.string().custom(objectId),
          message_order: Joi.number().integer().min(0),
          feedback: Joi.string().max(1000),
        })
      )
      .min(1)
      .max(100)
      .required(),
  }),
};

module.exports = {
  createMessage,
  getMessages,
  getMessage,
  updateMessage,
  deleteMessage,
  createMessages,
}; 