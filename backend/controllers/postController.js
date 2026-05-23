const fs = require('fs');
const path = require('path');
const pool = require('../db');

function formatPost(post) {
  return {
    ...post,
    is_liked: Boolean(post.is_liked),
    like_count: Number(post.like_count || 0),
    comment_count: Number(post.comment_count || 0)
  };
}

function postSelectSql() {
  return `
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
  `;
}

async function uploadPost(req, res, next) {
  try {
    const caption = String(req.body.caption || '').trim();

    if (!req.file) {
      return res.status(400).json({ message: 'Post image is required' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const [result] = await pool.query(
      'INSERT INTO posts (user_id, image_url, caption) VALUES (?, ?, ?)',
      [req.user.id, imageUrl, caption]
    );

    const [posts] = await pool.query(
      `${postSelectSql()} WHERE p.id = ? LIMIT 1`,
      [req.user.id, result.insertId]
    );

    return res.status(201).json({
      message: 'Post uploaded successfully',
      post: formatPost(posts[0])
    });
  } catch (error) {
    return next(error);
  }
}

async function getFeed(req, res, next) {
  try {
    const [posts] = await pool.query(
      `
      ${postSelectSql()}
      WHERE p.user_id = ?
        OR p.user_id IN (
          SELECT following_id
          FROM followers
          WHERE follower_id = ?
        )
      ORDER BY p.created_at DESC
      `,
      [req.user.id, req.user.id, req.user.id]
    );

    return res.json({ posts: posts.map(formatPost) });
  } catch (error) {
    return next(error);
  }
}

async function getSinglePost(req, res, next) {
  try {
    const postId = Number(req.params.id);
    const viewerId = req.user ? req.user.id : 0;

    if (!postId) {
      return res.status(400).json({ message: 'Valid post id is required' });
    }

    const [posts] = await pool.query(
      `${postSelectSql()} WHERE p.id = ? LIMIT 1`,
      [viewerId, postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    return res.json({ post: formatPost(posts[0]) });
  } catch (error) {
    return next(error);
  }
}

async function deletePost(req, res, next) {
  try {
    const postId = Number(req.params.id);

    if (!postId) {
      return res.status(400).json({ message: 'Valid post id is required' });
    }

    const [posts] = await pool.query(
      'SELECT id, user_id, image_url FROM posts WHERE id = ? LIMIT 1',
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const post = posts[0];

    if (post.user_id !== req.user.id) {
      return res.status(403).json({ message: 'You can delete only your own posts' });
    }

    await pool.query('DELETE FROM posts WHERE id = ?', [postId]);

    if (post.image_url && post.image_url.startsWith('/uploads/')) {
      const fileName = path.basename(post.image_url);
      const filePath = path.join(__dirname, '..', 'uploads', fileName);
      fs.unlink(filePath, () => {});
    }

    return res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  uploadPost,
  getFeed,
  getSinglePost,
  deletePost
};
