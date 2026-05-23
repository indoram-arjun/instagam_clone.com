const pool = require('../db');

async function getLikeCount(postId) {
  const [counts] = await pool.query(
    'SELECT COUNT(*) AS like_count FROM likes WHERE post_id = ?',
    [postId]
  );

  return Number(counts[0].like_count);
}

async function postExists(postId) {
  const [posts] = await pool.query('SELECT id FROM posts WHERE id = ? LIMIT 1', [postId]);
  return posts.length > 0;
}

async function toggleLike(req, res, next) {
  try {
    const postId = Number(req.params.postId);

    if (!postId) {
      return res.status(400).json({ message: 'Valid post id is required' });
    }

    if (!(await postExists(postId))) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const [existingLikes] = await pool.query(
      'SELECT id FROM likes WHERE user_id = ? AND post_id = ? LIMIT 1',
      [req.user.id, postId]
    );

    if (existingLikes.length > 0) {
      await pool.query('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [req.user.id, postId]);

      return res.json({
        message: 'Post unliked',
        liked: false,
        like_count: await getLikeCount(postId)
      });
    }

    await pool.query(
      'INSERT INTO likes (user_id, post_id) VALUES (?, ?)',
      [req.user.id, postId]
    );

    return res.json({
      message: 'Post liked',
      liked: true,
      like_count: await getLikeCount(postId)
    });
  } catch (error) {
    return next(error);
  }
}

async function addComment(req, res, next) {
  try {
    const postId = Number(req.params.postId);
    const text = String(req.body.text || '').trim();

    if (!postId) {
      return res.status(400).json({ message: 'Valid post id is required' });
    }

    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    if (!(await postExists(postId))) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const [result] = await pool.query(
      'INSERT INTO comments (user_id, post_id, text) VALUES (?, ?, ?)',
      [req.user.id, postId, text]
    );

    const [comments] = await pool.query(
      `
      SELECT c.id, c.user_id, c.post_id, c.text, c.created_at, u.username, u.profile_pic
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.id = ?
      LIMIT 1
      `,
      [result.insertId]
    );

    return res.status(201).json({
      message: 'Comment added',
      comment: comments[0]
    });
  } catch (error) {
    return next(error);
  }
}

async function getComments(req, res, next) {
  try {
    const postId = Number(req.params.postId);

    if (!postId) {
      return res.status(400).json({ message: 'Valid post id is required' });
    }

    const [comments] = await pool.query(
      `
      SELECT c.id, c.user_id, c.post_id, c.text, c.created_at, u.username, u.profile_pic
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
      `,
      [postId]
    );

    return res.json({ comments });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  toggleLike,
  addComment,
  getComments
};
