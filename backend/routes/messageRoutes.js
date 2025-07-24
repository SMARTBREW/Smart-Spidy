const express = require('express');
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const messageValidation = require('../validators/message.validation');

const router = express.Router();

// All routes require authentication
router.use(auth());

// Create a single message
router.post('/', validate(messageValidation.createMessage), messageController.createMessage);

// Bulk create messages
router.post('/bulk', validate(messageValidation.createMessages), messageController.createMessages);

// Get messages for a specific chat
router.get('/chat/:chatId', validate(messageValidation.getMessages), messageController.getMessages);

// Get a specific message
router.get('/:id', validate(messageValidation.getMessage), messageController.getMessage);

// Update a message
router.patch('/:id', validate(messageValidation.updateMessage), messageController.updateMessage);

// Delete a message (admin only)
router.delete('/:id', authorize('admin'), validate(messageValidation.deleteMessage), messageController.deleteMessage);

module.exports = router; 