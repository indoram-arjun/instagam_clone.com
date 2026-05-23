const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET || 'change_this_secret_key';

function getToken(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.split(' ')[1];
}

function authenticate(req, res, next) {
  const token = getToken(req);

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function optionalAuth(req, res, next) {
  const token = getToken(req);

  if (!token) {
    return next();
  }

  try {
    req.user = jwt.verify(token, jwtSecret);
  } catch (error) {
    req.user = null;
  }

  return next();
}

module.exports = {
  authenticate,
  optionalAuth,
  jwtSecret
};
