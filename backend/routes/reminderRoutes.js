const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const reminderValidation = require('../validators/reminder.validation');
const reminderController = require('../controllers/reminderController');

const router = express.Router();

// Protected routes - require authentication
router.use(auth());

// Create a new reminder
router.post(
  '/',
  validate(reminderValidation.createReminder),
  reminderController.createReminder
);

// Get user's reminders
router.get(
  '/',
  validate(reminderValidation.getUserReminders),
  reminderController.getUserReminders
);

// Get a specific reminder
router.get(
  '/:id',
  validate(reminderValidation.getReminder),
  reminderController.getReminder
);

// Update a reminder
router.patch(
  '/:id',
  validate(reminderValidation.updateReminder),
  reminderController.updateReminder
);

// Delete a reminder
router.delete(
  '/:id',
  validate(reminderValidation.deleteReminder),
  reminderController.deleteReminder
);

// Toggle reminder status
router.patch(
  '/:id/toggle',
  validate(reminderValidation.toggleReminderStatus),
  reminderController.toggleReminderStatus
);

// Process due reminders (for cron jobs)
router.post(
  '/process-due',
  reminderController.processDueReminders
);

module.exports = router;
