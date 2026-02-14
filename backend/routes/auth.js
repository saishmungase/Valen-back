const express = require('express');
const multer = require('multer');
const authController = require('../controllers/authController');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed'));
    }
  }
});

router.post('/send-code', authController.sendCode);
router.post('/verified-signup', upload.array('images', 3), authController.verifiedSignup);
router.post('/login', authController.login);

module.exports = router;