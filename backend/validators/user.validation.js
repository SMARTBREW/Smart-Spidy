const Joi = require('joi');
const { password, uuid, mobile } = require('./custom.validation');

const createUser = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    email: Joi.string().required().email(),
    password: Joi.string().required().custom(password),
    role: Joi.string().valid('user', 'admin').default('user'),
    is_active: Joi.boolean().default(true),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    role: Joi.string().valid('user', 'admin'),
    name: Joi.string(),
  }),
};

const getUser = {
  params: Joi.object().keys({
    id: Joi.string().custom(uuid),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    id: Joi.string().custom(uuid),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      email: Joi.string().email(),
      role: Joi.string().valid('user', 'admin'),
      is_active: Joi.boolean(),
    })
    .min(1),
};

const deleteUser = {
  params: Joi.object().keys({
    id: Joi.string().custom(uuid),
  }),
};

const updateUserStatus = {
  params: Joi.object().keys({
    id: Joi.string().custom(uuid),
  }),
  body: Joi.object().keys({
    is_active: Joi.boolean().required(),
  }),
};

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  updateUserStatus,
};