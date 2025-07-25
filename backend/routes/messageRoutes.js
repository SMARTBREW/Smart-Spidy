const express = require('express');
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const messageValidation = require('../validators/message.validation');

const router = express.Router();

// All routes require authentication
router.use(auth());
router.post('/', validate(messageValidation.createMessage), messageController.createMessage);
router.post('/bulk', validate(messageValidation.createMessages), messageController.createMessages);
router.get('/', authorize('admin'), messageController.getAllMessages);
router.get('/chat/:chatId', validate(messageValidation.getMessages), messageController.getMessages);
router.get('/:id', validate(messageValidation.getMessage), messageController.getMessage);
router.patch('/:id', validate(messageValidation.updateMessage), messageController.updateMessage);
router.delete('/:id', authorize('admin'), validate(messageValidation.deleteMessage), messageController.deleteMessage);

module.exports = router; 