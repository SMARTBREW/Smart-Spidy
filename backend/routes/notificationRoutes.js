const express = require('express');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const notificationValidation = require('../validators/notification.validation');
const notificationController = require('../controllers/notificationController');

const router = express.Router();

// Health check endpoint (no auth required)
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    lastRun: new Date().toISOString(),
    nextRun: '9:00 AM daily',
    message: 'Notification system is running'
  });
});


router.use(auth());

router.get('/', validate(notificationValidation.getUserNotifications), notificationController.getUserNotifications);
router.get('/stats', notificationController.getNotificationStats);
router.patch('/:id/read', validate(notificationValidation.markAsRead), notificationController.markAsRead);

// Admin routes (require admin authorization)
router.get('/all', authorize('admin'), validate(notificationValidation.getAllNotifications), notificationController.getAllNotifications);
router.post('/', authorize('admin'), validate(notificationValidation.createNotification), notificationController.createNotification);
router.delete('/:id', authorize('admin'), validate(notificationValidation.deleteNotification), notificationController.deleteNotification);

module.exports = router; 