const path = require('path');
const express = require('express');
const multer = require('multer');
const { authenticate, optionalAuth } = require('../middleware/authMiddleware');
const {
  uploadPost,
  getFeed,
  getSinglePost,
  deletePost
} = require('../controllers/postController');

const router = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname).toLowerCase()}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter(req, file, cb) {
    if (!file.mimetype.startsWith('image/')) {
      const error = new Error('Only image files are allowed');
      error.status = 400;
      return cb(error);
    }

    return cb(null, true);
  }
});

router.post('/upload', authenticate, upload.single('image'), uploadPost);
router.get('/feed', authenticate, getFeed);
router.get('/:id', optionalAuth, getSinglePost);
router.delete('/:id', authenticate, deletePost);

module.exports = router;
