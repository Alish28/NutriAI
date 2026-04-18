const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { chat } = require('../controllers/chatController');
 
// POST /api/chat
// Protected so only logged-in users can use the chatbot
router.post('/', protect, chat);
 
module.exports = router;