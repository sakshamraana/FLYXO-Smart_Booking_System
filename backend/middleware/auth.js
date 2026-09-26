const { verifyToken } = require('../utils/jwt');

const authMiddleware = (req) => {
  if (!req) return null;
  const headers = req.headers || (req.raw && req.raw.headers) || {};
  const authHeader = headers.authorization || headers.Authorization || '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded) {
      return decoded;
    }
  }
  return null;
};

module.exports = authMiddleware;
