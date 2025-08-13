const express = require('express');
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const validate = require('../middleware/validate');
const chatValidation = require('../validators/chat.validation');

const router = express.Router();

router.use(auth());

router.get('/stats', authorize('admin'), chatController.getChatStats);
router.get('/search', validate(chatValidation.searchChats), chatController.searchChats);
router.get('/all', validate(chatValidation.getAllChatsForUser), chatController.getAllChatsForUser);
router.get('/', validate(chatValidation.getChats), chatController.getChats);
router.post('/', validate(chatValidation.createChat), chatController.createChat);

router.get('/:id', validate(chatValidation.getChat), chatController.getChat);
router.patch('/:id', validate(chatValidation.updateChat), chatController.updateChat);
router.delete('/:id', authorize('admin'), validate(chatValidation.deleteChat), chatController.deleteChat);
router.patch('/:id/status', validate(chatValidation.updateChatStatus), chatController.updateChatStatus);
router.patch('/:id/pin', validate(chatValidation.pinChat), chatController.pinChat);

module.exports = router; 