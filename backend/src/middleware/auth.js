'use strict';
const AppError = require('../utils/AppError');
const { verifyToken } = require('../services/authService');

// Requires "Authorization: Bearer <jwt>" and sets req.user = { id, role }.
function authenticate(req, _res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, 'Authentication required'));
  }
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return next(new AppError(401, 'Invalid or expired token'));
  }
}

// Allows only the listed roles. Must run after authenticate.
function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, 'You do not have permission to do this'));
    }
    return next();
  };
}

module.exports = { authenticate, requireRole };
