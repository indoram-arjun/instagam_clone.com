const pool = require('../db');

function formatProfile(user) {
  return {
    ...user,
    post_count: Number(user.post_count || 0),
    followers_count: Number(user.followers_count || 0),
    following_count: Number(user.following_count || 0),
    is_following: Boolean(user.is_following),
    is_own_profile: Boolean(user.is_own_profile)
  };
}

function formatPost(post) {
  return {
    ...post,
    like_count: Number(post.like_count || 0),
    comment_count: Number(post.comment_count || 0),
    is_liked: Boolean(post.is_liked)
  };
}

async function searchUsers(req, res, next) {
  try {
    const query = String(req.query.q || '').trim().toLowerCase();

    if (!query) {
      return res.json({ users: [] });
    }

    const [users] = await pool.query(
      `
      SELECT id, username, profile_pic, bio
      FROM users
      WHERE username LIKE ?
      ORDER BY username ASC
      LIMIT 20
      `,
      [`%${query}%`]
    );

    return res.json({ users });
  } catch (error) {
    return next(error);
  }
}

async function getUserProfile(req, res, next) {
  try {
    const username = String(req.params.username || '').trim().toLowerCase();
    const viewerId = req.user ? req.user.id : 0;

    const [users] = await pool.query(
      `
      SELECT
        u.id,
        u.username,
        u.profile_pic,
        u.bio,
        u.created_at,
        (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id) AS post_count,
        (SELECT COUNT(*) FROM followers f WHERE f.following_id = u.id) AS followers_count,
        (SELECT COUNT(*) FROM followers f WHERE f.follower_id = u.id) AS following_count,
        EXISTS(
          SELECT 1
          FROM followers vf
          WHERE vf.follower_id = ? AND vf.following_id = u.id
        ) AS is_following,
        (u.id = ?) AS is_own_profile
      FROM users u
      WHERE u.username = ?
      LIMIT 1
      `,
      [viewerId, viewerId, username]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user: formatProfile(users[0]) });
  } catch (error) {
    return next(error);
  }
}

async function getUserPosts(req, res, next) {
  try {
    const username = String(req.params.username || '').trim().toLowerCase();
    const viewerId = req.user ? req.user.id : 0;

    const [posts] = await pool.query(
      `
      SELECT
        p.id,
        p.user_id,
        p.image_url,
        p.caption,
        p.created_at,
        u.username,
        u.profile_pic,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS like_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count,
        EXISTS(
          SELECT 1
          FROM likes viewer_like
          WHERE viewer_like.post_id = p.id AND viewer_like.user_id = ?
        ) AS is_liked
      FROM posts p
      JOIN users u ON u.id = p.user_id
      WHERE u.username = ?
      ORDER BY p.created_at DESC
      `,
      [viewerId, username]
    );

    return res.json({ posts: posts.map(formatPost) });
  } catch (error) {
    return next(error);
  }
}

async function followUser(req, res, next) {
  try {
    const targetId = Number(req.params.id);

    if (!targetId) {
      return res.status(400).json({ message: 'Valid user id is required' });
    }

    if (targetId === req.user.id) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const [targets] = await pool.query('SELECT id FROM users WHERE id = ? LIMIT 1', [targetId]);

    if (targets.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    await pool.query(
      'INSERT IGNORE INTO followers (follower_id, following_id) VALUES (?, ?)',
      [req.user.id, targetId]
    );

    const [counts] = await pool.query(
      'SELECT COUNT(*) AS followers_count FROM followers WHERE following_id = ?',
      [targetId]
    );

    return res.json({
      message: 'User followed',
      is_following: true,
      followers_count: Number(counts[0].followers_count)
    });
  } catch (error) {
    return next(error);
  }
}

async function unfollowUser(req, res, next) {
  try {
    const targetId = Number(req.params.id);

    if (!targetId) {
      return res.status(400).json({ message: 'Valid user id is required' });
    }

    await pool.query(
      'DELETE FROM followers WHERE follower_id = ? AND following_id = ?',
      [req.user.id, targetId]
    );

    const [counts] = await pool.query(
      'SELECT COUNT(*) AS followers_count FROM followers WHERE following_id = ?',
      [targetId]
    );

    return res.json({
      message: 'User unfollowed',
      is_following: false,
      followers_count: Number(counts[0].followers_count)
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  searchUsers,
  getUserProfile,
  getUserPosts,
  followUser,
  unfollowUser
};
