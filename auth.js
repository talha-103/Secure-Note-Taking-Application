const { randomBytes, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');
const jwt = require('jsonwebtoken');
const { User } = require('./models');

const derive = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt, 64);
  return salt + ':' + key.toString('hex');
}

async function verifyPassword(password, hash) {
  const [salt, hex] = hash.split(':');
  return timingSafeEqual(await derive(password, salt, 64), Buffer.from(hex, 'hex'));
}

function issueToken(user) {
  return jwt.sign({}, process.env.JWT_SECRET, {
    algorithm: 'HS256', subject: String(user._id), expiresIn: '1h'
  });
}

async function authenticate(req, res, next) {
  const match = /^Bearer (\S+)$/i.exec(req.get('authorization') || '');
  let subject;
  try {
    if (match) subject = jwt.verify(match[1], process.env.JWT_SECRET, {
      algorithms: ['HS256']
    }).sub;
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
  if (!subject || !(req.user = await User.findById(subject))) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
}

module.exports = { hashPassword, verifyPassword, issueToken, authenticate, adminOnly };
