const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { jwtSecret } = require('../middleware/authMiddleware');

function cleanUsername(username) {
  return String(username || '').trim().toLowerCase();
}

function cleanEmail(email) {
  return String(email || '').trim().toLowerCase();
}

async function register(req, res, next) {
  try {
    const username = cleanUsername(req.body.username);
    const email = cleanEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    return res.status(201).json({
      message: 'Registration successful',
      user: {
        id: result.insertId,
        username,
        email,
        profile_pic: 'default.jpg'
      }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Username or email already exists' });
    }

    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const email = cleanEmail(req.body.email);
    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const [users] = await pool.query(
      'SELECT id, username, email, password, profile_pic FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];
    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      profile_pic: user.profile_pic
    };

    const token = jwt.sign(safeUser, jwtSecret, { expiresIn: '7d' });

    return res.json({
      message: 'Login successful',
      token,
      user: safeUser
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  register,
  login
};
