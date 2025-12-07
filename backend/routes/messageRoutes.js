const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/', authMiddleware, messageController.sendMessage); // Envoyer
router.get('/:userId', authMiddleware, messageController.getConversation); // Lire conversation spécifique
router.get('/', authMiddleware, messageController.getConversationsList); // Liste des contacts

module.exports = router;