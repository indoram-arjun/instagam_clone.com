const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const {
  toggleLike,
  addComment,
  getComments
} = require('../controllers/interactionController');

const router = express.Router();

router.post('/like/:postId', authenticate, toggleLike);
router.post('/comment/:postId', authenticate, addComment);
router.get('/comments/:postId', getComments);

module.exports = router;
