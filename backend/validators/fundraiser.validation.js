const Joi = require('joi');
const { uuid } = require('./custom.validation');

const createFundraiser = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    created_by: Joi.string().custom(uuid).required(),
    chat_id: Joi.string().custom(uuid).optional().allow(null),
  }),
};

const getFundraisers = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    name: Joi.string(),
    created_by: Joi.string().custom(uuid),
    chat_id: Joi.string().custom(uuid),
  }),
};

const getFundraiser = {
  params: Joi.object().keys({
    id: Joi.string().custom(uuid),
  }),
};

const updateFundraiser = {
  params: Joi.object().keys({
    id: Joi.string().custom(uuid),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      created_by: Joi.string().custom(uuid),
      chat_id: Joi.string().custom(uuid).allow(null),
    })
    .min(1),
};

const deleteFundraiser = {
  params: Joi.object().keys({
    id: Joi.string().custom(uuid),
  }),
};

module.exports = {
  createFundraiser,
  getFundraisers,
  getFundraiser,
  updateFundraiser,
  deleteFundraiser,
}; 