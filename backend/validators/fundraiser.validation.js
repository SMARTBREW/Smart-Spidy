const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createFundraiser = {
  body: Joi.object().keys({
    name: Joi.string().required(),
    created_by: Joi.string().custom(objectId).required(),
    chat_id: Joi.string().custom(objectId).optional().allow(null),
  }),
};

const getFundraisers = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
    name: Joi.string(),
    created_by: Joi.string().custom(objectId),
    chat_id: Joi.string().custom(objectId),
    last_week: Joi.string().valid('true', 'false').optional(),
    start_date: Joi.string().isoDate().optional(),
    end_date: Joi.string().isoDate().optional(),
  }),
};

const getFundraiser = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
};

const updateFundraiser = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string(),
      created_by: Joi.string().custom(objectId),
      chat_id: Joi.string().custom(objectId).allow(null),
    })
    .min(1),
};

const deleteFundraiser = {
  params: Joi.object().keys({
    id: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createFundraiser,
  getFundraisers,
  getFundraiser,
  updateFundraiser,
  deleteFundraiser,
}; 