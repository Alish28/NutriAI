const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { chat } = require('../controllers/chatController');

// POST /api/chat
// Requires auth so anonymous users can't spam the API
router.post('/', protect, chat);

module.exports = router;