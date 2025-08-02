const passport = require('passport');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

const auth = () => (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err || info || !user) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
    }
    req.user = user;
    next();
  })(req, res, next);
};

module.exports = auth;