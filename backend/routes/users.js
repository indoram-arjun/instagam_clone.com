const express = require('express');
const { authenticate, optionalAuth } = require('../middleware/authMiddleware');
const {
  searchUsers,
  getUserProfile,
  getUserPosts,
  followUser,
  unfollowUser
} = require('../controllers/userController');

const router = express.Router();

router.get('/search', searchUsers);
router.get('/:username/posts', optionalAuth, getUserPosts);
router.get('/:username', optionalAuth, getUserProfile);
router.post('/follow/:id', authenticate, followUser);
router.post('/unfollow/:id', authenticate, unfollowUser);

module.exports = router;
