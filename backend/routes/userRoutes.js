const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const userValidation = require('../validators/user.validation');

const router = express.Router();

router.post('/register', validate(userValidation.register), authController.register);
router.post('/login', validate(userValidation.login), authController.login);
router.post('/logout', auth(), authController.logout);
router.post('/refresh-token', validate(userValidation.refreshToken), authController.refreshToken);
router.get('/profile', auth(), authController.getProfile);

// User sessions (admin only)
router.get('/sessions', auth(), authorize('admin'), userController.getUserSessions);
router.get('/sessions/stats', auth(), authorize('admin'), userController.getUserSessionStats);

// User stats
router.get('/stats', auth(), authorize('admin'), userController.getUserStats);

// User management
router.post('/', auth(), authorize('admin'), validate(userValidation.createUser), userController.createUser);
router.get('/', auth(), authorize('admin'), validate(userValidation.getUsers), userController.getUsers);
router.get('/:id', auth(), authorize('admin'), validate(userValidation.getUser), userController.getUser);
router.patch('/:id', auth(), authorize('admin'), validate(userValidation.updateUser), userController.updateUser);
router.delete('/:id', auth(), authorize('admin'), validate(userValidation.deleteUser), userController.deleteUser);

// User status
router.patch('/:id/status', auth(), authorize('admin'), validate(userValidation.updateUserStatus), userController.updateUserStatus);



module.exports = router; 