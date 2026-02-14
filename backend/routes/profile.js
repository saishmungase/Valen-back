const express = require('express');
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.get('/me', authMiddleware, profileController.getProfile);
router.get('/user/:userId', authMiddleware, profileController.getUserById);

module.exports = router;